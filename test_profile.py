
import requests
import sys

BASE_URL = "http://localhost:8888/api/v1"

def test_update_profile(email, password):
    # 1. Login to get token
    print(f"Logging in as {email}...")
    login_data = {
        "username": email,
        "password": password
    }
    response = requests.post(
        f"{BASE_URL}/login/access-token",
        data=login_data
    )
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return
    
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Get current user info
    print("Getting current user info...")
    response = requests.get(f"{BASE_URL}/users/me", headers=headers)
    user = response.json()
    print(f"Current Name: {user.get('full_name')}")
    print(f"Current Phone: {user.get('phone')}")
    
    # 3. Update profile
    print("Updating profile...")
    new_data = {
        "full_name": "Antigravity Test",
        "phone": "+254123456789"
    }
    response = requests.patch(
        f"{BASE_URL}/users/me",
        json=new_data,
        headers=headers
    )
    if response.status_code == 200:
        print("Update SUCCESSFUL!")
        updated_user = response.json()
        print(f"New Name: {updated_user.get('full_name')}")
        print(f"New Phone: {updated_user.get('phone')}")
    else:
        print(f"Update FAILED: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python test_profile.py <email> <password>")
    else:
        test_update_profile(sys.argv[1], sys.argv[2])
