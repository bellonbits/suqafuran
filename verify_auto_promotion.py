import requests
import time
import json

BASE_URL = "http://localhost:8000/api/v1"

def get_admin_token():
    # Placeholder for getting admin token
    # In a real environment, we'd login
    return "admin_token" # Replace with actual or use a mock if possible

def test_auto_promotion():
    # 1. Create a promotion request
    # Plan 3 is Diamond ($5)
    listing_id = 1 
    plan_id = 3
    phone = "252615551234"
    
    print(f"--- 1. Creating Promotion Request for Listing {listing_id} ---")
    resp = requests.post(
        f"{BASE_URL}/promotions/",
        json={"listing_id": listing_id, "plan_id": plan_id, "payment_phone": phone},
        headers={"Authorization": f"Bearer {get_admin_token()}"}
    )
    promo = resp.json()
    promo_id = promo['id']
    amount = promo['amount']
    print(f"Created Promo ID: {promo_id}, Amount: {amount}")

    # 2. Simulate Payment
    print(f"\n--- 2. Simulating Mobile Payment from {phone} ---")
    requests.post(
        f"{BASE_URL}/promotions/simulate-payment",
        json={"phone": phone, "amount": amount},
        headers={"Authorization": f"Bearer {get_admin_token()}"}
    )

    # 3. Check Payment
    print("\n--- 3. Checking Payment Detection ---")
    time.sleep(2) # Wait a bit for DB
    resp = requests.post(
        f"{BASE_URL}/promotions/{promo_id}/check-payment",
        headers={"Authorization": f"Bearer {get_admin_token()}"}
    )
    print(resp.json())

    # 4. Verify Listing Status
    print("\n--- 4. Verifying Listing Boost Status ---")
    resp = requests.get(f"{BASE_URL}/listings/{listing_id}")
    listing = resp.json()
    print(f"Listing Boost Level: {listing.get('boost_level')}")
    print(f"Boost Expires At: {listing.get('boost_expires_at')}")

if __name__ == "__main__":
    try:
        test_auto_promotion()
    except Exception as e:
        print(f"Error: {e}")
