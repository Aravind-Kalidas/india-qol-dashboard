import os
import sys
import sqlite3
import asyncio
from datetime import datetime
import requests
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

# Add backend directory to sys.path to ensure database import resolves correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import get_db_connection, init_db

app = FastAPI(title="India Quality-of-Life Dashboard API")

# Setup paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")

# Ensure frontend directory exists
os.makedirs(FRONTEND_DIR, exist_ok=True)

# Mount static files folder
app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

# Helper: Fetch AQI for a single state (parallel thread execution)
def fetch_state_aqi(state_id, name, lat, lon):
    url = f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&current=us_aqi,pm2_5,pm10"
    try:
        response = requests.get(url, timeout=4)
        if response.status_code == 200:
            data = response.json()
            current = data.get("current", {})
            return {
                "state_id": state_id,
                "aqi": int(current.get("us_aqi", 0)),
                "pm2_5": float(current.get("pm2_5", 0.0)),
                "pm10": float(current.get("pm10", 0.0)),
                "status": "active",
                "error": None
            }
        else:
            return {
                "state_id": state_id,
                "error": f"API returned status {response.status_code}"
            }
    except Exception as e:
        return {
            "state_id": state_id,
            "error": str(e)
        }

# Background worker to refresh AQI cache
async def refresh_all_aqi_cache():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, latitude, longitude FROM states;")
    states = cursor.fetchall()
    conn.close()
    
    loop = asyncio.get_running_loop()
    tasks = []
    for state in states:
        task = loop.run_in_executor(
            None, 
            fetch_state_aqi, 
            state["id"], 
            state["name"], 
            state["latitude"], 
            state["longitude"]
        )
        tasks.append(task)
        
    results = await asyncio.gather(*tasks)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    now_iso = datetime.now().isoformat()
    
    updated_count = 0
    fallback_count = 0
    
    for res in results:
        state_id = res["state_id"]
        if res.get("error") is None:
            cursor.execute("""
            INSERT INTO dynamic_aqi_cache (state_id, aqi, pm2_5, pm10, last_updated, status)
            VALUES (?, ?, ?, ?, ?, 'active')
            ON CONFLICT(state_id) DO UPDATE SET
                aqi=excluded.aqi,
                pm2_5=excluded.pm2_5,
                pm10=excluded.pm10,
                last_updated=excluded.last_updated,
                status='active';
            """, (state_id, res["aqi"], res["pm2_5"], res["pm10"], now_iso))
            updated_count += 1
        else:
            print(f"AQI Fetch failed for state_id {state_id}: {res['error']}. Falling back to cached data.")
            cursor.execute("""
            UPDATE dynamic_aqi_cache 
            SET status = 'stale_fallback', last_updated = ?
            WHERE state_id = ?;
            """, (now_iso, state_id))
            fallback_count += 1
            
    cursor.execute("""
    INSERT INTO dataset_metadata (metric_key, source_name, publication_year, last_refresh_time, next_release_expected)
    VALUES ('aqi', 'Open-Meteo Air Quality API', 2026, ?, 'Hourly Live')
    ON CONFLICT(metric_key) DO UPDATE SET
        last_refresh_time=excluded.last_refresh_time;
    """, (now_iso,))
    
    conn.commit()
    conn.close()
    print(f"AQI refresh completed. Updated: {updated_count}, Fallbacks: {fallback_count}")
    return updated_count, fallback_count

# Startup Event: init db, auto-seed if empty, and run initial AQI fetch
@app.on_event("startup")
async def startup_event():
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM states;")
    count = cursor.fetchone()[0]
    conn.close()
    if count == 0:
        from seed import seed_database
        seed_database()
    asyncio.create_task(refresh_all_aqi_cache())

@app.get("/")
def read_root():
    """Serves the main dashboard HTML page."""
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Server is running, but index.html was not found in frontend directory."}

@app.get("/api/states")
def get_states():
    """Returns a list of all states and Union Territories."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, type, code, capital, latitude, longitude FROM states ORDER BY name;")
    states = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return states

@app.get("/api/metadata")
def get_metadata():
    """Returns dataset metadata, sources, and publication dates."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT metric_key, source_name, publication_year, last_refresh_time, next_release_expected FROM dataset_metadata;")
    meta = {row["metric_key"]: dict(row) for row in cursor.fetchall()}
    conn.close()
    return meta

@app.get("/api/overview")
def get_overview(year: int = 2024, month: int = None, day: int = None):
    """Returns national summaries and state-by-state records for the selected year (2021-2025)."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if month is not None and day is not None:
        # Query state data + static metrics (for selected year) + dynamic AQI history (month/day)
        cursor.execute("""
            SELECT 
                s.id, s.name, s.type, s.code, s.capital, s.latitude, s.longitude,
                sm.year, sm.life_index, 
                sm.literacy_rate, sm.literacy_rate_male, sm.literacy_rate_female,
                sm.water_quality_score, sm.equality_index, 
                sm.crime_against_women, sm.crime_against_minorities,
                sm.infant_mortality_rate, sm.infant_mortality_rate_rural, sm.infant_mortality_rate_urban,
                sm.child_stunting_rate, sm.per_capita_gsdp, 
                sm.unemployment_rate, sm.unemployment_rate_rural, sm.unemployment_rate_urban,
                sm.clean_cooking_fuel, 
                sm.internet_penetration, sm.internet_penetration_rural, sm.internet_penetration_urban,
                sm.water_scarcity_index, sm.gov_schools_percentage, 
                sm.pupil_teacher_ratio, sm.school_infrastructure_score,
                sm.forest_cover_percentage, sm.sanitation_score, sm.renewable_energy_share, sm.birth_rate_index,
                dh.aqi, dh.pm2_5, dh.pm10, 'Historical' as aqi_last_updated, 'active' as aqi_status
            FROM states s
            JOIN static_metrics sm ON s.id = sm.state_id
            LEFT JOIN daily_aqi_history dh ON s.id = dh.state_id AND dh.month = ? AND dh.day = ?
            WHERE sm.year = ?
            ORDER BY s.name;
        """, (month, day, year))
    else:
        # Query state data + static metrics (for selected year) + dynamic AQI live cache
        cursor.execute("""
            SELECT 
                s.id, s.name, s.type, s.code, s.capital, s.latitude, s.longitude,
                sm.year, sm.life_index, 
                sm.literacy_rate, sm.literacy_rate_male, sm.literacy_rate_female,
                sm.water_quality_score, sm.equality_index, 
                sm.crime_against_women, sm.crime_against_minorities,
                sm.infant_mortality_rate, sm.infant_mortality_rate_rural, sm.infant_mortality_rate_urban,
                sm.child_stunting_rate, sm.per_capita_gsdp, 
                sm.unemployment_rate, sm.unemployment_rate_rural, sm.unemployment_rate_urban,
                sm.clean_cooking_fuel, 
                sm.internet_penetration, sm.internet_penetration_rural, sm.internet_penetration_urban,
                sm.water_scarcity_index, sm.gov_schools_percentage, 
                sm.pupil_teacher_ratio, sm.school_infrastructure_score,
                sm.forest_cover_percentage, sm.sanitation_score, sm.renewable_energy_share, sm.birth_rate_index,
                ac.aqi, ac.pm2_5, ac.pm10, ac.last_updated as aqi_last_updated, ac.status as aqi_status
            FROM states s
            JOIN static_metrics sm ON s.id = sm.state_id
            LEFT JOIN dynamic_aqi_cache ac ON s.id = ac.state_id
            WHERE sm.year = ?
            ORDER BY s.name;
        """, (year,))
        
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    if not rows:
        raise HTTPException(status_code=404, detail=f"No data found for year {year} in database.")
        
    metric_keys = [
        "life_index", "literacy_rate", "literacy_rate_male", "literacy_rate_female",
        "water_quality_score", "equality_index", "crime_against_women", "crime_against_minorities",
        "infant_mortality_rate", "infant_mortality_rate_rural", "infant_mortality_rate_urban",
        "child_stunting_rate", "per_capita_gsdp", "unemployment_rate", "unemployment_rate_rural", 
        "unemployment_rate_urban", "clean_cooking_fuel", "internet_penetration", 
        "internet_penetration_rural", "internet_penetration_urban", "water_scarcity_index", 
        "gov_schools_percentage", "pupil_teacher_ratio", "school_infrastructure_score",
        "forest_cover_percentage", "sanitation_score", "renewable_energy_share", "birth_rate_index",
        "aqi", "pm2_5", "pm10"
    ]
    
    averages = {}
    for key in metric_keys:
        vals = [r[key] for r in rows if r.get(key) is not None]
        averages[key] = sum(vals) / len(vals) if vals else 0.0
        
    return {
        "year": year,
        "averages": averages,
        "states": rows
    }


@app.get("/api/state/{state_id}")
def get_state_detail(state_id: int):
    """Returns detailed historical metrics (2021-2024) for a specific state/UT."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get state profile
    cursor.execute("SELECT id, name, type, code, capital, latitude, longitude FROM states WHERE id = ?;", (state_id,))
    state_row = cursor.fetchone()
    if not state_row:
        conn.close()
        raise HTTPException(status_code=404, detail="State not found.")
        
    state_profile = dict(state_row)
    
    # Get historical static metrics
    cursor.execute("""
        SELECT * FROM static_metrics 
        WHERE state_id = ? 
        ORDER BY year ASC;
    """, (state_id,))
    history = [dict(row) for row in cursor.fetchall()]
    
    # Get current AQI Cache
    cursor.execute("""
        SELECT aqi, pm2_5, pm10, last_updated, status 
        FROM dynamic_aqi_cache 
        WHERE state_id = ?;
    """, (state_id,))
    aqi_row = cursor.fetchone()
    aqi_data = dict(aqi_row) if aqi_row else None
    
    conn.close()
    
    return {
        "profile": state_profile,
        "history": history,
        "aqi": aqi_data
    }

@app.get("/api/insight/{state_id}/{metric_key}")
def get_state_metric_insight(state_id: int, metric_key: str):
    """Returns the interesting fact and current news for a state and metric combination."""
    conn = get_db_connection()
    cursor = conn.cursor()
    if state_id == 0:
        cursor.execute("""
            SELECT general_fact as fact, general_news as news FROM dataset_metadata 
            WHERE metric_key = ?;
        """, (metric_key,))
    else:
        cursor.execute("""
            SELECT fact, news FROM state_metric_insights 
            WHERE state_id = ? AND metric_key = ?;
        """, (state_id, metric_key))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Insight not found.")
    return dict(row)

@app.post("/api/refresh-aqi")
async def trigger_aqi_refresh(background_tasks: BackgroundTasks):
    """Manually triggers an asynchronous cache refresh in the background."""
    background_tasks.add_task(refresh_all_aqi_cache)
    return {"message": "AQI cache refresh triggered in background."}
