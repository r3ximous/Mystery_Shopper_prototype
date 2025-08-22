@echo off
REM Windows batch script to stop Mystery Shop servers

echo Stopping Mystery Shop servers...
echo.

REM Kill processes on common ports
for /L %%p in (8000,1,8010) do (
    echo Checking port %%p...
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr :%%p') do (
        if not "%%i"=="" (
            echo Stopping process %%i on port %%p
            taskkill /PID %%i /F >nul 2>&1
        )
    )
)

echo.
echo Done! All Mystery Shop servers should be stopped.
echo.
pause
