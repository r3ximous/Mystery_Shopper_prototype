#!/usr/bin/env python3
import requests

try:
    # Test basic connectivity
    response = requests.get("http://127.0.0.1:8000/")
    print(f"Root endpoint status: {response.status_code}")
    
    # Test questions endpoint 
    response = requests.get("http://127.0.0.1:8000/api/questions")
    print(f"Questions endpoint status: {response.status_code}")
    if response.status_code == 200:
        print(f"Questions data: {response.json()}")
    
except Exception as e:
    print(f"Connection error: {e}")
