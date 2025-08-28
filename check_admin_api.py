import requests
import json

def check_admin_api():
    """Check the actual structure of admin API responses"""
    headers = {"X-API-Key": "dev-admin-key"}
    
    print("🔍 Admin Metrics API Response Structure:")
    try:
        response = requests.get("http://127.0.0.1:8000/api/admin/metrics", headers=headers)
        if response.status_code == 200:
            data = response.json()
            print("Metrics keys:", list(data.keys()))
        else:
            print(f"Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    print("\n🔍 Admin Submissions API Response Structure:")
    try:
        response = requests.get("http://127.0.0.1:8000/api/admin/submissions", headers=headers)
        if response.status_code == 200:
            data = response.json()
            if data:
                print("Sample submission fields:", list(data[0].keys()))
                print("Sample submission:", json.dumps(data[0], indent=2))
            else:
                print("No submissions found")
        else:
            print(f"Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_admin_api()