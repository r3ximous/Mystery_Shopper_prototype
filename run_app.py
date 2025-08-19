"""Launcher script for building an executable with PyInstaller.
Run with: python run_app.py
Build with: pyinstaller --onefile --add-data "app/frontend/templates;app/frontend/templates" --add-data "app/frontend/static;app/frontend/static" --name mysteryshop run_app.py
"""
import uvicorn

def main():
    uvicorn.run("app.frontend.app_frontend_server:frontend", host="127.0.0.1", port=8000, reload=False)

if __name__ == "__main__":
    main()
