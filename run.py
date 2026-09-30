import os
import sys
import subprocess
import webbrowser
import time

def install_dependencies():
    """Checks if required packages are installed, and installs them if missing."""
    required_packages = ["fastapi", "uvicorn", "requests"]
    missing_packages = []
    
    for pkg in required_packages:
        try:
            __import__(pkg)
        except ImportError:
            missing_packages.append(pkg)
            
    if missing_packages:
        print(f"Required packages missing: {missing_packages}. Installing them now...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install"] + missing_packages)
            print("Dependencies installed successfully!")
        except Exception as e:
            print(f"Error installing dependencies: {e}")
            print("Please run: pip install fastapi uvicorn requests")
            sys.exit(1)
    else:
        print("All dependencies are satisfied.")

def seed_database_if_needed():
    """Checks if the database is seeded. If not, runs backend/seed.py."""
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend", "data", "dashboard.db")
    geojson_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend", "india_states.geojson")
    
    db_exists = os.path.exists(db_path)
    geojson_exists = os.path.exists(geojson_path)
    
    if not db_exists or not geojson_exists:
        print("Initial run detected or data files missing. Running seed database script...")
        try:
            seed_script = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend", "seed.py")
            # We must run it using the current python executable
            result = subprocess.run([sys.executable, seed_script], check=True, capture_output=True, text=True)
            print(result.stdout)
            print("Database seeding completed.")
        except Exception as e:
            print(f"Failed to automatically seed database: {e}")
            if hasattr(e, 'stderr') and e.stderr:
                print(e.stderr)
            sys.exit(1)
    else:
        print("Database and GeoJSON cache already present.")

def start_server():
    """Launches the Uvicorn FastAPI server and opens the browser."""
    print("Launching FastAPI Web Server...")
    
    # Add root folder to sys.path so backend is importable
    root_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.append(root_dir)
    
    # Open the browser in a separate thread after a small delay
    import threading
    def open_browser():
        time.sleep(2)  # Wait for server startup
        url = "http://127.0.0.1:8000"
        print(f"Opening browser to {url}...")
        webbrowser.open(url)
        
    browser_thread = threading.Thread(target=open_browser)
    browser_thread.daemon = True
    browser_thread.start()
    
    import uvicorn
    # Start uvicorn server (blocking call)
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True, reload_dirs=[os.path.join(root_dir, "backend")])

if __name__ == "__main__":
    print("=================================================================")
    print("   India Socio-Economic & Quality-of-Life Dashboard Launcher     ")
    print("=================================================================")
    install_dependencies()
    seed_database_if_needed()
    start_server()
