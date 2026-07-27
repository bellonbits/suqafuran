import requests

try:
    print("Requesting... http://127.0.0.1:8000/api/v1/listings/144")
    r = requests.get('http://127.0.0.1:8000/api/v1/listings/144')
    print(f"Status Code: {r.status_code}")
    print(f"Response: {r.text}")
except Exception as e:
    print(f"Error: {e}")
