# test_api.py
import requests

BASE_URL = "https://nomadsync.ramharikrishnan.dev"

# Test user creation
resp = requests.post(f"{BASE_URL}/api/users", json={
    "username": "testuser",
    "email": "test@example.com"
})

print("Status Code:", resp.status_code)
print("Response JSON:")
print(resp.json())