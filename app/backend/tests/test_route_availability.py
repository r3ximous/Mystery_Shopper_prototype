#!/usr/bin/env python3
"""
Check registered routes
"""

import sys
import os

# Add the project root directory to path (go up 3 levels from tests/)
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
sys.path.insert(0, project_root)

# Change working directory to project root so static files can be found
original_cwd = os.getcwd()
os.chdir(project_root)

try:
    from app.frontend.app_frontend_server import frontend
finally:
    # Restore original working directory
    os.chdir(original_cwd)

def list_routes():
    print("🔍 Registered Frontend Routes:")
    print("=" * 40)
    
    for route in frontend.routes:
        methods = getattr(route, 'methods', ['GET'])
        path = getattr(route, 'path', 'unknown')
        name = getattr(route, 'name', 'unnamed')
        print(f"{str(methods):15} {path:25} -> {name}")

if __name__ == "__main__":
    list_routes()