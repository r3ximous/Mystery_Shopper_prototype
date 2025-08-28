#!/usr/bin/env python3
"""
Test Available Routes - Check what routes are available on the server
"""

import requests

def test_available_routes():
    """Test what routes are available"""
    base_url = "http://127.0.0.1:8000"
    headers = {"X-API-Key": "dev-admin-key"}
    
    print("🔍 Testing Available Routes")
    print("=" * 40)
    
    routes_to_test = [
        "/",
        "/admin",
        "/api",
        "/api/admin/metrics",
        "/api/admin/submissions",
        "/admin/metrics",
        "/admin/submissions", 
        "/api/submit-survey",
        "/api/survey/submit",
        "/submit",
        "/survey/submit"
    ]
    
    for route in routes_to_test:
        try:
            response = requests.get(f"{base_url}{route}", headers=headers, timeout=5)
            print(f"GET  {route:25}: {response.status_code}")
        except Exception as e:
            print(f"GET  {route:25}: ERROR - {e}")
    
    print(f"\n🔍 Testing POST Routes:")
    
    test_data = {"test": "data"}
    
    for route in ["/api/submit-survey", "/api/survey/submit", "/submit", "/survey/submit"]:
        try:
            response = requests.post(f"{base_url}{route}", json=test_data, headers=headers, timeout=5)
            print(f"POST {route:25}: {response.status_code}")
        except Exception as e:
            print(f"POST {route:25}: ERROR - {e}")

if __name__ == "__main__":
    test_available_routes()