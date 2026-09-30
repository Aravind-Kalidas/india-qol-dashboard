import sqlite3
import os

DB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
DB_PATH = os.path.join(DB_DIR, "dashboard.db")

def get_db_connection():
    """Opens a connection to the SQLite database and configures it."""
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")  # Enable Write-Ahead Log for concurrent reads/writes
    return conn

def init_db():
    """Initializes the database schema if tables do not exist."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Create States table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS states (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('State', 'UT')),
        code TEXT UNIQUE NOT NULL,
        capital TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL
    );
    """)
    
    # 2. Create Static Metrics table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS static_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        state_id INTEGER NOT NULL,
        year INTEGER NOT NULL,
        life_index REAL NOT NULL,
        literacy_rate REAL NOT NULL,
        literacy_rate_male REAL NOT NULL,
        literacy_rate_female REAL NOT NULL,
        water_quality_score REAL NOT NULL,
        equality_index REAL NOT NULL,
        crime_against_women REAL NOT NULL,
        crime_against_minorities REAL NOT NULL,
        infant_mortality_rate REAL NOT NULL,
        infant_mortality_rate_rural REAL NOT NULL,
        infant_mortality_rate_urban REAL NOT NULL,
        child_stunting_rate REAL NOT NULL,
        per_capita_gsdp REAL NOT NULL,
        unemployment_rate REAL NOT NULL,
        unemployment_rate_rural REAL NOT NULL,
        unemployment_rate_urban REAL NOT NULL,
        clean_cooking_fuel REAL NOT NULL,
        internet_penetration REAL NOT NULL,
        internet_penetration_rural REAL NOT NULL,
        internet_penetration_urban REAL NOT NULL,
        water_scarcity_index REAL NOT NULL,
        gov_schools_percentage REAL NOT NULL,
        pupil_teacher_ratio REAL NOT NULL,
        school_infrastructure_score REAL NOT NULL,
        forest_cover_percentage REAL NOT NULL,
        sanitation_score REAL NOT NULL,
        renewable_energy_share REAL NOT NULL,
        birth_rate_index REAL NOT NULL,
        FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE,
        UNIQUE(state_id, year)
    );
    """)
    
    # 3. Create Dynamic AQI Cache table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS dynamic_aqi_cache (
        state_id INTEGER PRIMARY KEY,
        aqi INTEGER NOT NULL,
        pm2_5 REAL NOT NULL,
        pm10 REAL NOT NULL,
        last_updated TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('active', 'stale_fallback')),
        FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE
    );
    """)
    
    # 4. Create Dataset Metadata table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS dataset_metadata (
        metric_key TEXT PRIMARY KEY,
        source_name TEXT NOT NULL,
        publication_year INTEGER NOT NULL,
        last_refresh_time TEXT NOT NULL,
        next_release_expected TEXT NOT NULL,
        general_fact TEXT,
        general_news TEXT
    );
    """)
    
    # 5. Create State Metric Insights table (Did You Know / In The News)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS state_metric_insights (
        state_id INTEGER NOT NULL,
        metric_key TEXT NOT NULL,
        fact TEXT NOT NULL,
        news TEXT NOT NULL,
        PRIMARY KEY (state_id, metric_key),
        FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE
    );
    """)

    # 6. Create Daily AQI History table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS daily_aqi_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        state_id INTEGER NOT NULL,
        month INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
        day INTEGER NOT NULL CHECK(day BETWEEN 1 AND 31),
        aqi INTEGER NOT NULL,
        pm2_5 REAL NOT NULL,
        pm10 REAL NOT NULL,
        FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE,
        UNIQUE(state_id, month, day)
    );
    """)
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print(f"Database initialized successfully at: {DB_PATH}")
