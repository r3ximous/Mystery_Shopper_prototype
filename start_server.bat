@echo off
REM Simple Windows batch launcher for Mystery Shop

echo Starting Mystery Shop Web Application...
echo.

REM Check if virtual environment exists
if not exist ".venv\Scripts\python.exe" (
    echo Error: Virtual environment not found at .venv\Scripts\python.exe
    echo Please create a virtual environment first:
    echo   python -m venv .venv
    echo   .venv\Scripts\activate
    echo   pip install -r requirements.txt
    pause
    exit /b 1
)

REM Try to start the application
.venv\Scripts\python.exe run_app.py --auto-port

pause
