# Building a Single-File Executable (Windows)

This document explains how to package the Mystery Shopper prototype (FastAPI + templates) into a self-contained executable using PyInstaller. Result: `mysteryshop.exe` that starts the Uvicorn server.

## 1. Install Build Tool
Within your virtual environment:
```powershell
pip install pyinstaller
```

## 2. Create a Launcher Script
We'll add `run_app.py` to start the server (this isolates import side-effects and is friendly to PyInstaller).

```python
# run_app.py
import uvicorn

if __name__ == "__main__":
    uvicorn.run("app.frontend.app_frontend_server:frontend", host="127.0.0.1", port=8000)
```

(Already added if present; otherwise create it.)

## 3. Build Command
From repo root:
```powershell
pyinstaller --clean --onefile --add-data "app/frontend/templates;app/frontend/templates" --add-data "app/frontend/static;app/frontend/static" --name mysteryshop run_app.py
```
Explanation:
- `--onefile`: bundle into single exe
- `--add-data`: include templates & static assets (format is `SRC;DEST` on Windows)
- `--clean`: remove previous build cache

## 4. Run the Executable
After success your exe is at `dist\mysteryshop.exe`:
```powershell
./dist/mysteryshop.exe
```
Open http://127.0.0.1:8000 .

## 5. Troubleshooting
| Issue | Fix |
|-------|-----|
| Templates not loading | Ensure `--add-data` paths are correct (use backslashes or quotes). |
| ImportError bleach or others | Verify all dependencies installed before building. |
| Slow startup on first run | Onefile unpacks to temp folder; normal. |
| Firewall prompt | Windows may ask to allow network; allow for local access. |

## 6. Optional: Include Icon
Add `--icon path\to\icon.ico` to the pyinstaller command.

## 7. Optional: Different Host/Port
Edit `run_app.py` and change `host` or `port`. Rebuild.

## 8. Mac/Linux
Use same command but change add-data separator to `:`: `--add-data "app/frontend/templates:app/frontend/templates"`.

## 9. Verifying Assets Inside EXE
List contents after build (advanced):
```powershell
pyi-archive_viewer dist/mysteryshop.exe
```

## 10. Next Steps
- Add a splash console message with URL
- Build an installer (MSIX/Inno Setup)
- Produce a Docker image instead of exe for portable server runtime

---
Generated instructions for packaging. Modify as needed.
