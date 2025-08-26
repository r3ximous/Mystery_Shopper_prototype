"""
Mystery Shop Application Launcher

This script provides a simple way to start the Mystery Shop web application.
It handles port conflicts, provides better error messages, and offers different run modes.

Usage:
    python run_app.py                    # Start with default settings
    python run_app.py --port 3000        # Start on a different port
    python run_app.py --dev               # Start in development mode with reload
    python run_app.py --host 0.0.0.0     # Allow external connections

Build executable with:
    pyinstaller --onefile --add-data "app/frontend/templates;app/frontend/templates" --add-data "app/frontend/static;app/frontend/static" --name mysteryshop run_app.py
"""
import argparse
import socket
import sys
import webbrowser
from pathlib import Path

# Fix Windows console encoding issues
if sys.platform == "win32":
    import locale
    try:
        # Try to set UTF-8 encoding
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except (AttributeError, OSError):
        # Fallback for older Python versions or restricted environments
        pass
try:
    import uvicorn
except ImportError:
    print("ERROR: uvicorn is not installed.")
    print("Please install it with: pip install uvicorn")
    sys.exit(1)


def check_port_available(host: str, port: int) -> bool:
    """Check if a port is available for binding."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind((host, port))
            return True
    except socket.error:
        return False


def find_available_port(host: str, start_port: int = 8000, max_attempts: int = 10) -> int:
    """Find the next available port starting from start_port."""
    for port in range(start_port, start_port + max_attempts):
        if check_port_available(host, port):
            return port
    raise RuntimeError(f"Could not find an available port in range {start_port}-{start_port + max_attempts}")


def validate_app_structure():
    """Validate that required application files exist."""
    required_paths = [
        "app/frontend/app_frontend_server.py",
        "app/backend/main.py",
        "app/frontend/templates",
        "app/frontend/static"
    ]
    
    missing_paths = []
    for path in required_paths:
        if not Path(path).exists():
            missing_paths.append(path)
    
    if missing_paths:
        print("ERROR: Missing required application files/directories:")
        for path in missing_paths:
            print(f"   - {path}")
        print("\nMake sure you're running this script from the project root directory.")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Start the Mystery Shop web application")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind to (default: 8000)")
    parser.add_argument("--dev", action="store_true", help="Enable development mode with auto-reload")
    parser.add_argument("--no-browser", action="store_true", help="Don't automatically open browser")
    parser.add_argument("--auto-port", action="store_true", help="Automatically find available port if default is busy")
    
    args = parser.parse_args()
    
    # Validate application structure
    validate_app_structure()
    
    # Handle port conflicts
    if not check_port_available(args.host, args.port):
        if args.auto_port:
            try:
                original_port = args.port
                args.port = find_available_port(args.host, args.port)
                print(f"WARNING: Port {original_port} is busy, using port {args.port} instead")
            except RuntimeError as e:
                print(f"ERROR: {e}")
                sys.exit(1)
        else:
            print(f"ERROR: Port {args.port} is already in use.")
            print(f"   - Use --port to specify a different port")
            print(f"   - Use --auto-port to automatically find an available port")
            print(f"   - Stop any existing servers running on port {args.port}")
            sys.exit(1)
    
    # Prepare server URL
    server_url = f"http://{args.host}:{args.port}"
    if args.host == "0.0.0.0":
        local_url = f"http://localhost:{args.port}"
    else:
        local_url = server_url
    
    print("* Starting Mystery Shop Web Application")
    print(f"   - Server: {server_url}")
    if args.host == "0.0.0.0":
        print(f"   - Local:  {local_url}")
    print(f"   - Mode:   {'Development (auto-reload)' if args.dev else 'Production'}")
    print()
    print("How to stop the server:")
    print("   - Press Ctrl+C in this terminal")
    print("   - Run: python stop_servers.py")
    print("   - Double-click: stop_servers.bat")
    print()
    
    # Open browser
    if not args.no_browser and args.host in ["127.0.0.1", "localhost"]:
        try:
            webbrowser.open(local_url)
            print(f"Opening {local_url} in your browser...")
        except Exception:
            print(f"TIP: Open {local_url} in your browser to view the application")
    else:
        print(f"TIP: Open {local_url} in your browser to view the application")
    
    # Start the server
    try:
        uvicorn.run(
            "app.frontend.app_frontend_server:frontend",
            host=args.host,
            port=args.port,
            reload=args.dev,
            log_level="info" if args.dev else "warning"
        )
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print(f"ERROR starting server: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
