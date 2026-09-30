# India Socio-Economic & Quality-of-Life Dashboard

A premium, interactive, dark-glassmorphism full-stack dashboard demonstrating India's key socio-economic, sustainability, and quality-of-life metrics. The platform integrates historical datasets, live weather/air-quality APIs, dual-state comparisons, and intelligent text-parsed insights.

## Features

- 🎨 **Futuristic Dark-Mode UI**: Built with responsive layouts, glassmorphic card tiles, and interactive sliders.
- 🗺️ **Interactive Geographic Map**: Styled Leaflet.js map with custom state hover highlighting, interactive tooltips, and zoom-aware centroid labels.
- 📊 **Dynamic Trend & Comparison Charts**: Chart.js integration with beautiful gradient fills, Outfit/Inter typography, and glassmorphic tooltips.
- ⚡ **FastAPI Backend & Caching**: SQLite database backend storing historical records, coupled with a parallel-threaded dynamic Open-Meteo AQI API cache and fallback worker.
- 💬 **Curated Insights Feed**: Auto-parsing of facts and news snippets to bold statistics and inject color-coded category badges.
- 🔄 **Dual-State Comparison**: Instantly compare any two states side-by-side with custom dual-axis charting.

---

## Folder Structure

```text
├── backend/
│   ├── data/                 # SQLite database folder (Gitignored)
│   ├── database.py           # Database tables and setup scripts
│   ├── main.py               # FastAPI application entrypoint and routes
│   └── seed.py               # Seeder script to populate initial dashboard metrics
├── frontend/
│   ├── app.js                # Core frontend client logic, charts, and map handling
│   ├── index.html            # Main markup file
│   ├── style.css             # Glassmorphism styling and custom animations
│   └── india_states.geojson  # Local boundary geometry cache
├── .gitignore
├── requirements.txt
└── run.py                    # Project launcher (Auto-installs packages and seeds database)
```

---

## Getting Started

### Local Setup & Launching

The project is designed to run automatically with a single launcher script.

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/your-repo-name.git
   cd your-repo-name
   ```

2. **Run the Dashboard**:
   Simply run the root `run.py` script. It will automatically check/install dependencies, seed the initial SQLite database, start the FastAPI server, and open your web browser:
   ```bash
   python run.py
   ```
   *The app will be available locally at `http://127.0.0.1:8000`.*

---

## Deployment on Render

This project is fully optimized for one-click deployment on [Render](https://render.com/).

1. **Create Web Service** on Render and link your GitHub repository.
2. **Environment settings**:
   - **Runtime**: `Python`
   - **Build Command**: `pip install -r requirements.txt && python backend/seed.py`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
3. Click **Deploy**.
