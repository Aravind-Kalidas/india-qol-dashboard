import sqlite3
import os
import sys
import json
import random
from datetime import datetime

# Add backend directory to sys.path to ensure database import resolves correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import get_db_connection, init_db

# Set random seed for reproducibility in mock trends
random.seed(42)

# Raw state reference data (28 States + 8 UTs)
STATES_DATA = [
    # 28 States
    {"name": "Andhra Pradesh", "type": "State", "code": "IN-AP", "capital": "Amaravati", "lat": 16.506, "lon": 80.648, "tier": "Medium"},
    {"name": "Arunachal Pradesh", "type": "State", "code": "IN-AR", "capital": "Itanagar", "lat": 27.100, "lon": 93.620, "tier": "Northeast"},
    {"name": "Assam", "type": "State", "code": "IN-AS", "capital": "Dispur", "lat": 26.143, "lon": 91.789, "tier": "Northeast"},
    {"name": "Bihar", "type": "State", "code": "IN-BR", "capital": "Patna", "lat": 25.594, "lon": 85.138, "tier": "Developing"},
    {"name": "Chhattisgarh", "type": "State", "code": "IN-CT", "capital": "Raipur", "lat": 21.251, "lon": 81.630, "tier": "Developing"},
    {"name": "Goa", "type": "State", "code": "IN-GA", "capital": "Panaji", "lat": 15.491, "lon": 73.828, "tier": "High"},
    {"name": "Gujarat", "type": "State", "code": "IN-GJ", "capital": "Gandhinagar", "lat": 23.215, "lon": 72.637, "tier": "Medium"},
    {"name": "Haryana", "type": "State", "code": "IN-HR", "capital": "Chandigarh", "lat": 30.733, "lon": 76.779, "tier": "Medium"},
    {"name": "Himachal Pradesh", "type": "State", "code": "IN-HP", "capital": "Shimla", "lat": 31.104, "lon": 77.173, "tier": "High"},
    {"name": "Jharkhand", "type": "State", "code": "IN-JH", "capital": "Ranchi", "lat": 23.344, "lon": 85.309, "tier": "Developing"},
    {"name": "Karnataka", "type": "State", "code": "IN-KA", "capital": "Bengaluru", "lat": 12.971, "lon": 77.594, "tier": "Medium"},
    {"name": "Kerala", "type": "State", "code": "IN-KL", "capital": "Thiruvananthapuram", "lat": 8.524, "lon": 76.936, "tier": "High"},
    {"name": "Madhya Pradesh", "type": "State", "code": "IN-MP", "capital": "Bhopal", "lat": 23.259, "lon": 77.413, "tier": "Developing"},
    {"name": "Maharashtra", "type": "State", "code": "IN-MH", "capital": "Mumbai", "lat": 19.076, "lon": 72.877, "tier": "Medium"},
    {"name": "Manipur", "type": "State", "code": "IN-MN", "capital": "Imphal", "lat": 24.817, "lon": 93.937, "tier": "Northeast"},
    {"name": "Meghalaya", "type": "State", "code": "IN-ML", "capital": "Shillong", "lat": 25.578, "lon": 91.883, "tier": "Northeast"},
    {"name": "Mizoram", "type": "State", "code": "IN-MZ", "capital": "Aizawl", "lat": 23.730, "lon": 92.717, "tier": "Northeast"},
    {"name": "Nagaland", "type": "State", "code": "IN-NL", "capital": "Kohima", "lat": 25.675, "lon": 94.108, "tier": "Northeast"},
    {"name": "Odisha", "type": "State", "code": "IN-OR", "capital": "Bhubaneswar", "lat": 20.304, "lon": 85.818, "tier": "Developing"},
    {"name": "Punjab", "type": "State", "code": "IN-PB", "capital": "Chandigarh", "lat": 30.733, "lon": 76.779, "tier": "Medium"},
    {"name": "Rajasthan", "type": "State", "code": "IN-RJ", "capital": "Jaipur", "lat": 26.912, "lon": 75.787, "tier": "Developing"},
    {"name": "Sikkim", "type": "State", "code": "IN-SK", "capital": "Gangtok", "lat": 27.331, "lon": 88.614, "tier": "High"},
    {"name": "Tamil Nadu", "type": "State", "code": "IN-TN", "capital": "Chennai", "lat": 13.082, "lon": 80.270, "tier": "High"},
    {"name": "Telangana", "type": "State", "code": "IN-TG", "capital": "Hyderabad", "lat": 17.385, "lon": 78.487, "tier": "Medium"},
    {"name": "Tripura", "type": "State", "code": "IN-TR", "capital": "Agartala", "lat": 23.831, "lon": 91.287, "tier": "Northeast"},
    {"name": "Uttar Pradesh", "type": "State", "code": "IN-UP", "capital": "Lucknow", "lat": 26.846, "lon": 80.946, "tier": "Developing"},
    {"name": "Uttarakhand", "type": "State", "code": "IN-UT", "capital": "Dehradun", "lat": 30.316, "lon": 78.032, "tier": "Medium"},
    {"name": "West Bengal", "type": "State", "code": "IN-WB", "capital": "Kolkata", "lat": 22.572, "lon": 88.364, "tier": "Medium"},
    
    # 8 UTs
    {"name": "Andaman and Nicobar Islands", "type": "UT", "code": "IN-AN", "capital": "Port Blair", "lat": 11.623, "lon": 92.726, "tier": "UT"},
    {"name": "Chandigarh", "type": "UT", "code": "IN-CH", "capital": "Chandigarh", "lat": 30.733, "lon": 76.779, "tier": "UT_High"},
    {"name": "Dadra and Nagar Haveli and Daman and Diu", "type": "UT", "code": "IN-DH", "capital": "Daman", "lat": 20.397, "lon": 72.832, "tier": "UT"},
    {"name": "Delhi", "type": "UT", "code": "IN-DL", "capital": "Delhi", "lat": 28.613, "lon": 77.209, "tier": "Delhi"},
    {"name": "Jammu and Kashmir", "type": "UT", "code": "IN-JK", "capital": "Srinagar", "lat": 34.083, "lon": 74.797, "tier": "UT"},
    {"name": "Ladakh", "type": "UT", "code": "IN-LA", "capital": "Leh", "lat": 34.152, "lon": 77.577, "tier": "UT"},
    {"name": "Lakshadweep", "type": "UT", "code": "IN-LD", "capital": "Kavaratti", "lat": 10.567, "lon": 72.642, "tier": "UT"},
    {"name": "Puducherry", "type": "UT", "code": "IN-PY", "capital": "Puducherry", "lat": 11.941, "lon": 79.808, "tier": "UT_High"}
]

# Base values configurations per tier for realistic seeding
TIER_PROFILES = {
    "High": {
        "life_index": 78.0, "literacy": 90.0, "water_qual": 88.0, "equality": 75.0,
        "crime_women": 25.0, "crime_minor": 4.0, "imr": 12.0, "stunting": 22.0,
        "gsdp": 320000.0, "unemp": 5.0, "cooking": 88.0, "internet": 72.0, "scarcity": 25.0,
        "gov_schools": 52.0, "ptr": 16.0, "school_infra": 92.0,
        "forest": 24.5, "sanitation": 88.0, "renewable": 32.0, "birth_rate": 14.0
    },
    "Medium": {
        "life_index": 70.0, "literacy": 78.0, "water_qual": 76.0, "equality": 62.0,
        "crime_women": 55.0, "crime_minor": 18.0, "imr": 24.0, "stunting": 30.0,
        "gsdp": 210000.0, "unemp": 6.2, "cooking": 75.0, "internet": 58.0, "scarcity": 48.0,
        "gov_schools": 64.0, "ptr": 22.0, "school_infra": 78.0,
        "forest": 16.2, "sanitation": 75.0, "renewable": 24.0, "birth_rate": 18.0
    },
    "Developing": {
        "life_index": 62.0, "literacy": 68.0, "water_qual": 60.0, "equality": 50.0,
        "crime_women": 85.0, "crime_minor": 32.0, "imr": 36.0, "stunting": 39.0,
        "gsdp": 105000.0, "unemp": 8.5, "cooking": 54.0, "internet": 44.0, "scarcity": 68.0,
        "gov_schools": 82.0, "ptr": 29.0, "school_infra": 60.0,
        "forest": 9.8, "sanitation": 58.0, "renewable": 12.0, "birth_rate": 22.0
    },
    "Northeast": {
        "life_index": 72.0, "literacy": 82.0, "water_qual": 70.0, "equality": 78.0,
        "crime_women": 30.0, "crime_minor": 2.5, "imr": 18.0, "stunting": 24.0,
        "gsdp": 140000.0, "unemp": 7.0, "cooking": 68.0, "internet": 50.0, "scarcity": 30.0,
        "gov_schools": 78.0, "ptr": 18.0, "school_infra": 70.0,
        "forest": 68.5, "sanitation": 72.0, "renewable": 16.0, "birth_rate": 16.0
    },
    "UT": {
        "life_index": 71.0, "literacy": 84.0, "water_qual": 80.0, "equality": 65.0,
        "gsdp": 220000.0, "unemp": 7.5, "cooking": 82.0, "internet": 65.0, "scarcity": 40.0,
        "gov_schools": 55.0, "ptr": 19.0, "school_infra": 84.0,
        "forest": 14.8, "sanitation": 78.0, "renewable": 10.0, "birth_rate": 15.0, "imr": 16.0, "stunting": 25.0, "crime_women": 45.0, "crime_minor": 8.0
    },
    "UT_High": {
        "life_index": 76.0, "literacy": 88.0, "water_qual": 90.0, "equality": 70.0,
        "crime_women": 35.0, "crime_minor": 5.0, "imr": 10.0, "stunting": 18.0,
        "gsdp": 380000.0, "unemp": 6.8, "cooking": 92.0, "internet": 82.0, "scarcity": 32.0,
        "gov_schools": 42.0, "ptr": 15.0, "school_infra": 94.0,
        "forest": 18.5, "sanitation": 90.0, "renewable": 20.0, "birth_rate": 13.0
    },
    "Delhi": {
        "life_index": 74.0, "literacy": 86.2, "water_qual": 82.0, "equality": 60.0,
        "crime_women": 140.0, "crime_minor": 15.0, "imr": 12.0, "stunting": 22.0,
        "gsdp": 440000.0, "unemp": 8.0, "cooking": 95.0, "internet": 88.0, "scarcity": 72.0,
        "gov_schools": 38.0, "ptr": 24.0, "school_infra": 96.0,
        "forest": 13.5, "sanitation": 85.0, "renewable": 8.0, "birth_rate": 14.5
    }
}

# Metadata descriptions
METADATA_DEFS = [
    {"metric_key": "life_index", "source_name": "NITI Aayog SDG India Index", "pub_year": 2024, "next_expected": "Q4 2026"},
    {"metric_key": "literacy_rate", "source_name": "National Sample Survey (NSS)", "pub_year": 2023, "next_expected": "Q3 2027"},
    {"metric_key": "water_quality_score", "source_name": "Jal Jeevan Mission Dashboard", "pub_year": 2024, "next_expected": "Q1 2027"},
    {"metric_key": "equality_index", "source_name": "NITI Aayog SDG Gender Score", "pub_year": 2024, "next_expected": "Q4 2026"},
    {"metric_key": "crime_against_women", "source_name": "National Crime Records Bureau (NCRB)", "pub_year": 2023, "next_expected": "Q4 2026"},
    {"metric_key": "crime_against_minorities", "source_name": "National Crime Records Bureau (NCRB)", "pub_year": 2023, "next_expected": "Q4 2026"},
    {"metric_key": "infant_mortality_rate", "source_name": "Sample Registration System Bulletin", "pub_year": 2023, "next_expected": "Q2 2027"},
    {"metric_key": "child_stunting_rate", "source_name": "National Family Health Survey (NFHS-5)", "pub_year": 2022, "next_expected": "Q1 2028"},
    {"metric_key": "per_capita_gsdp", "source_name": "MOSPI Government of India", "pub_year": 2024, "next_expected": "Q2 2027"},
    {"metric_key": "unemployment_rate", "source_name": "Periodic Labour Force Survey (PLFS)", "pub_year": 2024, "next_expected": "Q3 2026"},
    {"metric_key": "clean_cooking_fuel", "source_name": "National Family Health Survey (NFHS-5)", "pub_year": 2022, "next_expected": "Q1 2028"},
    {"metric_key": "internet_penetration", "source_name": "Telecom Regulatory Authority of India", "pub_year": 2024, "next_expected": "Q2 2027"},
    {"metric_key": "water_scarcity_index", "source_name": "NITI Aayog Composite Water Index", "pub_year": 2023, "next_expected": "Q4 2027"},
    {"metric_key": "gov_schools_percentage", "source_name": "UDISE+ Ministry of Education", "pub_year": 2023, "next_expected": "Q3 2026"},
    {"metric_key": "pupil_teacher_ratio", "source_name": "UDISE+ Ministry of Education", "pub_year": 2023, "next_expected": "Q3 2026"},
    {"metric_key": "school_infrastructure_score", "source_name": "UDISE+ Ministry of Education", "pub_year": 2023, "next_expected": "Q3 2026"},
    {"metric_key": "forest_cover_percentage", "source_name": "Forest Survey of India (FSI)", "pub_year": 2023, "next_expected": "Q3 2026"},
    {"metric_key": "sanitation_score", "source_name": "MoHUA Swachh Survekshan", "pub_year": 2024, "next_expected": "Q4 2026"},
    {"metric_key": "renewable_energy_share", "source_name": "Ministry of New & Renewable Energy", "pub_year": 2024, "next_expected": "Q2 2027"},
    {"metric_key": "birth_rate_index", "source_name": "SRS Statistical Report", "pub_year": 2024, "next_expected": "Q3 2026"},
    {"metric_key": "aqi", "source_name": "Open-Meteo Air Quality API", "pub_year": 2026, "next_expected": "Hourly Live"}
]

# Highly specific curated state-metric facts and news items
SPECIFIC_INSIGHTS = [
    {
        "state_name": "Kerala",
        "metric_key": "literacy_rate",
        "fact": "Kerala has maintained the highest literacy rate in India since the 1991 census, achieving near-universal primary education via grassroots libraries and social reform movements.",
        "news": "Kerala Literacy Mission launches 'Aksharalokam' project to distribute digital reading libraries to senior citizens in rural villages."
    },
    {
        "state_name": "Delhi",
        "metric_key": "aqi",
        "fact": "Delhi's geography, landlocked terrain, winter temperature inversions, and agricultural crop burning in adjacent states compound to create intense seasonal smog.",
        "news": "Delhi Department of Environment installs advanced air purification towers and initiates dust suppression tankers around major construction corridors."
    },
    {
        "state_name": "Goa",
        "metric_key": "per_capita_gsdp",
        "fact": "Goa ranks first in India for Per Capita GSDP, driven by structural tourism, mineral processing, and a high-yielding pharmaceutical manufacturing hub.",
        "news": "Goa Tourism Board introduces guidelines favoring low-impact eco-stays to promote sustainable growth and preserve coastal wetlands."
    },
    {
        "state_name": "Sikkim",
        "metric_key": "water_quality_score",
        "fact": "Sikkim was the first state in India to declare 100% organic farming, which has significantly decreased chemical pesticide and fertilizer runoff into freshwater streams.",
        "news": "Sikkim Jal Jeevan Mission reports completing safe drinking water pipelines to 99% of high-altitude mountain habitations."
    },
    {
        "state_name": "Gujarat",
        "metric_key": "renewable_energy_share",
        "fact": "Gujarat hosts the world's largest hybrid renewable energy park in Khavda (spanning 72,000 hectares), aiming for 30 GW of clean energy generation capacity.",
        "news": "Gujarat Power Corporation commissions a massive floating solar array to optimize reservoir water conservation and increase green grid feeds."
    },
    {
        "state_name": "Bihar",
        "metric_key": "literacy_rate",
        "fact": "Bihar is historically the seat of ancient universities like Nalanda. While it faced literacy challenges post-independence, its literacy growth rate has risen fast in recent decades.",
        "news": "Bihar Cabinet approves the recruitments of over 1.2 lakh teachers and sanctioning school library building funds in rural districts."
    },
    {
        "state_name": "Maharashtra",
        "metric_key": "per_capita_gsdp",
        "fact": "Maharashtra is India's largest state economy, contributing over 15% to the national GDP. Mumbai is widely considered the financial capital of the country.",
        "news": "Maharashtra Cabinet clears new Industrial Policy offering capital subsidies for green technology and semiconductor manufacturing fab units."
    }
]

# Standard template fallback insights depending on metric key type
FALLBACK_INSIGHTS_TEMPLATES = {
    "life_index": {
        "fact": "The Quality of Life index for {state} aggregates metrics like clean housing, lifespan, and safety to measure daily standard of living.",
        "news": "{state} introduces a state-level Urban Quality Development fund targeting sanitations, public parks, and neighborhood paving."
    },
    "literacy_rate": {
        "fact": "Literacy in {state} reflects the historic investment in state education programs, girls' school transport, and rural learning centers.",
        "news": "{state} Department of Education launches a new mobile tutoring app to support primary school students in marginalized blocks."
    },
    "water_quality_score": {
        "fact": "Water Quality scores measure clean water access. States with mountainous runoff or high reservoir investments score higher.",
        "news": "{state} begins installing community-level water filtration plants to address local groundwater mineral contaminants."
    },
    "equality_index": {
        "fact": "The Equality / Gender Parity Index measures wage equality, school enrollment ratios, and representation in municipal councils.",
        "news": "{state} institutes new scholarships for female engineering students to increase women representation in technical fields."
    },
    "crime_against_women": {
        "fact": "This rate (per 100k) is highly influenced by state policing standards; higher rates can often reflect higher reporting confidence.",
        "news": "{state} Police department establishes specialized 24/7 fast-track units and emergency response centers to register complaints."
    },
    "crime_against_minorities": {
        "fact": "Social safety and civil rights indicators measure the filing rate of cases under the SC/ST Prevention of Atrocities Act.",
        "news": "{state} Judicial Commission establishes dedicated fast-track courts to resolve civil rights and social safety complaints."
    },
    "infant_mortality_rate": {
        "fact": "IMR is a sensitive health proxy. Rural maternity clinics and neonatal training have driven major reductions nationwide.",
        "news": "{state} expands institutional delivery cash incentives to encourage pregnant women to utilize certified hospitals."
    },
    "child_stunting_rate": {
        "fact": "Stunting under 5 years is a measure of chronic malnutrition. Mid-day meals and Anganwadi programs are key interventions.",
        "news": "{state} launches a nutritional supplement program targeting pregnant mothers and infants in high-risk tribal blocks."
    },
    "per_capita_gsdp": {
        "fact": "Per Capita GSDP measures individual output. Industrialized coastal states and IT hubs exhibit significantly higher averages.",
        "news": "{state} signs investment pacts with IT and manufacturing firms to build industrial corridors and generate jobs."
    },
    "unemployment_rate": {
        "fact": "Unemployment is measured via PLFS surveys, capturing both agricultural seasonal workers and educated youths seeking work.",
        "news": "{state} launches a skill development program and paid internship program to enhance employability for local graduates."
    },
    "clean_cooking_fuel": {
        "fact": "Access to clean fuel (LPG connections) reduces indoor air pollution, a major driver of respiratory illness among women.",
        "news": "{state} subsidizes additional cylinders for low-income households to encourage clean cooking transitions."
    },
    "internet_penetration": {
        "fact": "Internet penetration measures both mobile broadband and optical fiber access, bridging the rural-urban digital divide.",
        "news": "{state} begins expanding state-backed fiber optic cables to remote panchayats to enable e-governance."
    },
    "water_scarcity_index": {
        "fact": "Water Scarcity measures the seasonal stress on reservoirs and groundwater, highly influenced by irrigation and monsoon rains.",
        "news": "{state} mandates rainwater harvesting in all new commercial building projects to recharge depleting urban aquifers."
    },
    "gov_schools_percentage": {
        "fact": "This metric tracks the proportion of schools run directly by the government compared to private and aided institutions.",
        "news": "{state} launches a program to upgrade infrastructure in state schools, converting classrooms into smart rooms."
    },
    "pupil_teacher_ratio": {
        "fact": "PTR measures classroom density. National education policies target a ratio below 30:1 in primary schools.",
        "news": "{state} issues fresh recruitment orders for primary school teachers to reduce crowding in rural classrooms."
    },
    "school_infrastructure_score": {
        "fact": "Tracks the percentage of schools equipped with basic electricity, drinking water, and separate functional toilets.",
        "news": "{state} allocates emergency funds to ensure every rural government school has running water and electricity."
    },
    "forest_cover_percentage": {
        "fact": "Forest Cover measures conservation efforts and biodiversity, with mountainous and tribal belt states showing high densities.",
        "news": "{state} starts a community afforestation drive, planting native species on degraded forest lands."
    },
    "sanitation_score": {
        "fact": "The sanitation score aggregates solid waste processing, public toilet availability, and open-defecation-free certifications.",
        "news": "{state} municipal corporations launch a comprehensive waste segregation drive at source across urban wards."
    },
    "renewable_energy_share": {
        "fact": "Renewables measure the percentage of wind, solar, and hydro power feeds in the state's total energy capacity.",
        "news": "{state} signs a memorandum of understanding to build a 500 MW solar park on non-arable government land."
    },
    "birth_rate_index": {
        "fact": "The birth rate in {state} reflects regional demographic shifts and family healthcare developments over recent years.",
        "news": "Health department representatives in {state} roll out family counseling initiatives to track demographic distribution."
    },
    "aqi": {
        "fact": "Air Quality is measured live. Stagnant winter winds, crop burning, and heavy vehicles drive temporary spikes.",
        "news": "{state} increases fines for industrial emissions and sets new limits for diesel generator usage during smog alert periods."
    }
}

def seed_database():
    """Populates the database with states, 20 metrics for 2021-2024, insights, and metadata."""
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Seed states
    print("Seeding States...")
    state_ids = {}
    for state in STATES_DATA:
        cursor.execute("""
        INSERT INTO states (name, type, code, capital, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(name) DO UPDATE SET
            latitude=excluded.latitude,
            longitude=excluded.longitude,
            code=excluded.code;
        """, (state["name"], state["type"], state["code"], state["capital"], state["lat"], state["lon"]))
        
        cursor.execute("SELECT id FROM states WHERE name=?", (state["name"],))
        state_ids[state["name"]] = cursor.fetchone()[0]

    # 2. Seed static metrics (2021 to 2025)
    print("Seeding Static Metrics (2021-2025)...")
    for year in [2021, 2022, 2023, 2024, 2025]:
        year_progress = (year - 2021) / 4.0
        
        for state in STATES_DATA:
            state_id = state_ids[state["name"]]
            profile = TIER_PROFILES[state["tier"]].copy()
            
            # Apply state-specific base GSDP overrides for realistic relative rankings
            if state["name"] == "Karnataka":
                profile["gsdp"] = 310000.0
            elif state["name"] == "Andhra Pradesh":
                profile["gsdp"] = 215000.0
            elif state["name"] == "Telangana":
                profile["gsdp"] = 320000.0
            elif state["name"] == "Kerala":
                profile["gsdp"] = 260000.0
            elif state["name"] == "Tamil Nadu":
                profile["gsdp"] = 290000.0
            elif state["name"] == "Maharashtra":
                profile["gsdp"] = 280000.0
            elif state["name"] == "Gujarat":
                profile["gsdp"] = 300000.0
            elif state["name"] == "Haryana":
                profile["gsdp"] = 300000.0
            elif state["name"] == "Bihar":
                profile["gsdp"] = 60000.0
            elif state["name"] == "Uttar Pradesh":
                profile["gsdp"] = 90000.0
            
            # Apply individual state random variation (+/- 5%) and temporal progress
            gdp_growth_rate = 1.07 + (random.uniform(-0.02, 0.03))
            gsdp = profile["gsdp"] * (gdp_growth_rate ** (year - 2021))
            
            lit_growth = year_progress * random.uniform(1.0, 2.8)
            literacy = min(99.0, profile["literacy"] + lit_growth)
            gap = random.uniform(8.0, 15.0) - (year_progress * 1.5)
            lit_male = min(99.9, literacy + gap/2)
            lit_female = max(35.0, literacy - gap/2)
            
            life_idx = min(95.0, profile["life_index"] + year_progress * random.uniform(0.5, 1.5))
            water_q = min(100.0, profile["water_qual"] + year_progress * random.uniform(2.0, 5.0))
            equality = min(99.0, profile["equality"] + year_progress * random.uniform(1.0, 3.0))
            
            crime_w = max(2.0, profile["crime_women"] + random.uniform(-5.0, 5.0))
            crime_m = max(0.5, profile["crime_minor"] + random.uniform(-1.5, 1.5))
            
            imr_decline = year_progress * random.uniform(1.0, 4.0)
            imr = max(2.0, profile["imr"] - imr_decline)
            imr_gap = random.uniform(6.0, 12.0)
            imr_rural = imr + imr_gap/2
            imr_urban = max(1.5, imr - imr_gap/2)
            
            stunting = max(5.0, profile["stunting"] - (year_progress * random.uniform(1.5, 3.5)))
            
            unemp = max(1.5, profile["unemp"] + random.uniform(-1.2, 1.2))
            unemp_gap = random.uniform(-1.0, 3.0)
            unemp_rural = max(1.0, unemp - unemp_gap/2)
            unemp_urban = max(1.0, unemp + unemp_gap/2)
            
            cooking = min(100.0, profile["cooking"] + year_progress * random.uniform(3.0, 6.0))
            
            internet = min(98.0, profile["internet"] + year_progress * random.uniform(5.0, 8.0))
            net_gap = random.uniform(15.0, 25.0) - (year_progress * 3.0)
            net_urban = min(99.5, internet + net_gap/2)
            net_rural = max(10.0, internet - net_gap/2)
            
            scarcity = max(5.0, min(100.0, profile["scarcity"] + random.uniform(-3.0, 3.0)))
            
            gov_sch = profile["gov_schools"] + random.uniform(-1.0, 1.0)
            ptr = max(10.0, profile["ptr"] - (year_progress * random.uniform(0.5, 1.5)))
            infra = min(100.0, profile["school_infra"] + year_progress * random.uniform(2.5, 5.5))
            
            forest = max(1.0, min(95.0, profile["forest"] + random.uniform(-0.5, 0.5)))
            sanitation = min(100.0, profile["sanitation"] + year_progress * random.uniform(3.0, 5.0))
            renewable = min(95.0, profile["renewable"] + year_progress * random.uniform(4.0, 7.0))
            birth_rate = max(8.0, profile["birth_rate"] - (year_progress * random.uniform(0.4, 1.2)) + random.uniform(-0.4, 0.4))
            
            cursor.execute("""
            INSERT INTO static_metrics (
                state_id, year, life_index, literacy_rate, literacy_rate_male, literacy_rate_female,
                water_quality_score, equality_index, crime_against_women, crime_against_minorities,
                infant_mortality_rate, infant_mortality_rate_rural, infant_mortality_rate_urban,
                child_stunting_rate, per_capita_gsdp, unemployment_rate, unemployment_rate_rural, unemployment_rate_urban,
                clean_cooking_fuel, internet_penetration, internet_penetration_rural, internet_penetration_urban,
                water_scarcity_index, gov_schools_percentage, pupil_teacher_ratio, school_infrastructure_score,
                forest_cover_percentage, sanitation_score, renewable_energy_share, birth_rate_index
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(state_id, year) DO UPDATE SET
                life_index=excluded.life_index,
                literacy_rate=excluded.literacy_rate,
                literacy_rate_male=excluded.literacy_rate_male,
                literacy_rate_female=excluded.literacy_rate_female,
                water_quality_score=excluded.water_quality_score,
                equality_index=excluded.equality_index,
                crime_against_women=excluded.crime_against_women,
                crime_against_minorities=excluded.crime_against_minorities,
                infant_mortality_rate=excluded.infant_mortality_rate,
                infant_mortality_rate_rural=excluded.infant_mortality_rate_rural,
                infant_mortality_rate_urban=excluded.infant_mortality_rate_urban,
                child_stunting_rate=excluded.child_stunting_rate,
                per_capita_gsdp=excluded.per_capita_gsdp,
                unemployment_rate=excluded.unemployment_rate,
                unemployment_rate_rural=excluded.unemployment_rate_rural,
                unemployment_rate_urban=excluded.unemployment_rate_urban,
                clean_cooking_fuel=excluded.clean_cooking_fuel,
                internet_penetration=excluded.internet_penetration,
                internet_penetration_rural=excluded.internet_penetration_rural,
                internet_penetration_urban=excluded.internet_penetration_urban,
                water_scarcity_index=excluded.water_scarcity_index,
                gov_schools_percentage=excluded.gov_schools_percentage,
                pupil_teacher_ratio=excluded.pupil_teacher_ratio,
                school_infrastructure_score=excluded.school_infrastructure_score,
                forest_cover_percentage=excluded.forest_cover_percentage,
                sanitation_score=excluded.sanitation_score,
                renewable_energy_share=excluded.renewable_energy_share,
                birth_rate_index=excluded.birth_rate_index;
            """, (
                state_id, year, life_idx, literacy, lit_male, lit_female,
                water_q, equality, crime_w, crime_m,
                imr, imr_rural, imr_urban,
                stunting, gsdp, unemp, unemp_rural, unemp_urban,
                cooking, internet, net_rural, net_urban,
                scarcity, gov_sch, ptr, infra,
                forest, sanitation, renewable, birth_rate
            ))

    # 3. Seed Metadata & National General Insights
    print("Seeding Dataset Metadata & General Insights...")
    now_iso = datetime.now().isoformat()
    for meta in METADATA_DEFS:
        key = meta["metric_key"]
        tmpl = FALLBACK_INSIGHTS_TEMPLATES.get(key, {
            "fact": "This tracks state progress in India for the given indicator, reflecting policy efforts.",
            "news": "Local department representatives in India announce strategic framework updates to address target goals."
        })
        fact_str = tmpl["fact"].format(state="India")
        news_str = tmpl["news"].format(state="India")
        
        cursor.execute("""
        INSERT INTO dataset_metadata (metric_key, source_name, publication_year, last_refresh_time, next_release_expected, general_fact, general_news)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(metric_key) DO UPDATE SET
            source_name=excluded.source_name,
            publication_year=excluded.publication_year,
            last_refresh_time=excluded.last_refresh_time,
            next_release_expected=excluded.next_release_expected,
            general_fact=excluded.general_fact,
            general_news=excluded.general_news;
        """, (key, meta["source_name"], meta["pub_year"], now_iso, meta["next_expected"], fact_str, news_str))

    # 4. Seed Insights & News Table (State-Specific)
    print("Seeding State Metric Insights...")
    for ins in SPECIFIC_INSIGHTS:
        state_id = state_ids.get(ins["state_name"])
        if state_id:
            cursor.execute("""
            INSERT INTO state_metric_insights (state_id, metric_key, fact, news)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(state_id, metric_key) DO UPDATE SET
                fact=excluded.fact,
                news=excluded.news;
            """, (state_id, ins["metric_key"], ins["fact"], ins["news"]))

    # Generate fallback state insights for all remaining combinations to ensure 100% resolution
    all_metric_keys = [meta["metric_key"] for meta in METADATA_DEFS]
    for state in STATES_DATA:
        state_id = state_ids[state["name"]]
        for key in all_metric_keys:
            cursor.execute("SELECT 1 FROM state_metric_insights WHERE state_id=? AND metric_key=?", (state_id, key))
            if cursor.fetchone() is None:
                tmpl = FALLBACK_INSIGHTS_TEMPLATES.get(key, {
                    "fact": "This tracks state progress in {state} for the given indicator, reflecting policy efforts.",
                    "news": "Local department representatives in {state} announce strategic framework updates to address target goals."
                })
                fact_str = tmpl["fact"].format(state=state["name"])
                news_str = tmpl["news"].format(state=state["name"])
                cursor.execute("""
                INSERT INTO state_metric_insights (state_id, metric_key, fact, news)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(state_id, metric_key) DO NOTHING;
                """, (state_id, key, fact_str, news_str))

    # 5. Initialize dummy AQI cache values (will be updated live)
    print("Seeding Initial AQI Cache (as fallback)...")
    for state in STATES_DATA:
        state_id = state_ids[state["name"]]
        base_aqi = 150 if state["name"] == "Delhi" else (45 if state["tier"] == "High" else random.randint(55, 95))
        cursor.execute("""
        INSERT INTO dynamic_aqi_cache (state_id, aqi, pm2_5, pm10, last_updated, status)
        VALUES (?, ?, ?, ?, ?, 'stale_fallback')
        ON CONFLICT(state_id) DO NOTHING;
        """, (state_id, base_aqi, base_aqi * 0.15, base_aqi * 0.4, now_iso))

    # 6. Seed Daily AQI History (12 Months x days_in_month daily records per state)
    print("Seeding Daily AQI History Table...")
    DAYS_IN_MONTH = {
        1: 31, 2: 29, 3: 31, 4: 30, 5: 31, 6: 30,
        7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31
    }
    for state in STATES_DATA:
        state_id = state_ids[state["name"]]
        base_aqi = 150 if state["name"] == "Delhi" else (45 if state["tier"] == "High" else random.randint(55, 95))
        for month in range(1, 13):
            if month in [11, 12, 1, 2]:
                season_mult = random.uniform(1.4, 2.0)
            elif month in [6, 7, 8, 9]:
                season_mult = random.uniform(0.4, 0.7)
            else:
                season_mult = random.uniform(0.8, 1.2)
            
            for day in range(1, DAYS_IN_MONTH[month] + 1):
                daily_var = random.uniform(0.85, 1.15)
                aqi_val = max(10, min(500, int(base_aqi * season_mult * daily_var)))
                pm2_5_val = float(aqi_val * random.uniform(0.12, 0.18))
                pm10_val = float(aqi_val * random.uniform(0.35, 0.45))
                cursor.execute("""
                INSERT INTO daily_aqi_history (state_id, month, day, aqi, pm2_5, pm10)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(state_id, month, day) DO UPDATE SET
                    aqi=excluded.aqi,
                    pm2_5=excluded.pm2_5,
                    pm10=excluded.pm10;
                """, (state_id, month, day, aqi_val, pm2_5_val, pm10_val))

    conn.commit()
    conn.close()
    print("Database seeding completed successfully.")

    # 6. Download GeoJSON
    print("Downloading India States GeoJSON file...")
    frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")
    os.makedirs(frontend_dir, exist_ok=True)
    geojson_path = os.path.join(frontend_dir, "india_states.geojson")
    
    geojson_url = "https://raw.githubusercontent.com/nswamy14/geoJson/master/india.states.geo.json"
    try:
        import requests
        r = requests.get(geojson_url, timeout=15)
        if r.status_code == 200:
            with open(geojson_path, "w", encoding="utf-8") as f:
                f.write(r.text)
            print(f"GeoJSON saved successfully to: {geojson_path}")
        else:
            print(f"Failed to fetch GeoJSON. HTTP status: {r.status_code}")
    except Exception as e:
        print(f"Error fetching GeoJSON: {e}")

if __name__ == "__main__":
    seed_database()
