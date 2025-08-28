#!/usr/bin/env python3
"""
Check registered routes
"""

from app.frontend.app_frontend_server import frontend

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