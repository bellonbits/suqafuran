import requests
import json
import time

BASE_URL = "http://localhost:8000/api/v1"
USER_EMAIL = "verified@example.com"
USER_PASSWORD = "password"

def login():
    resp = requests.post(f"{BASE_URL}/login/access-token", data={"username": USER_EMAIL, "password": USER_PASSWORD})
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        exit(1)
    return resp.json()["access_token"]

def get_promotion_plans(token):
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/promotions/plans", headers=headers)
    return resp.json()

def create_promotion_order(token, listing_id, plan_id, phone):
    headers = {"Authorization": f"Bearer {token}"}
    data = {"listing_id": listing_id, "plan_id": plan_id, "payment_phone": phone}
    resp = requests.post(f"{BASE_URL}/promotions/", headers=headers, json=data)
    if resp.status_code != 200:
        print(f"Create promo failed: {resp.text}")
        return None
    return resp.json()

def simulate_payment(token, phone, amount):
    headers = {"Authorization": f"Bearer {token}"}
    data = {"phone": phone, "amount": amount, "reference": f"AUTO-TEST-{int(time.time())}"}
    resp = requests.post(f"{BASE_URL}/mobile-money/simulate", headers=headers, json=data)
    if resp.status_code != 200:
        print(f"Simulate payment failed: {resp.text}")
        return None
    return resp.json()

def check_listing_boost(listing_id):
    resp = requests.get(f"{BASE_URL}/listings/{listing_id}")
    return resp.json()

def main():
    print("Logging in...")
    token = login()
    
    # 1. Get Listing (Assume listing 1 exists)
    listing_id = 1
    
    # 2. Get Plans
    plans = get_promotion_plans(token)
    if not plans:
        print("No plans found. Please seed plans first.")
        return
        
    gold_plan = next((p for p in plans if "gold" in p["name"].lower() or p["price_usd"] > 5), plans[0])
    print(f"Selected Plan: {gold_plan['name']} (${gold_plan['price_usd']})")
    
    # 3. Create Promotion Order
    payment_phone = "252615555555"
    print(f"Creating Promotion Order for Listing {listing_id}...")
    order = create_promotion_order(token, listing_id, gold_plan['id'], payment_phone)
    if not order:
        return
    print(f"Order Created: ID {order['id']}, Status: {order['status']}")
    
    # 4. Simulate Payment
    print("Simulating Payment...")
    payment_resp = simulate_payment(token, payment_phone, gold_plan['price_usd'])
    print(f"Payment Simulated: {payment_resp}")
    
    # 5. Check Result
    print("Checking Listing Status...")
    time.sleep(2) # Give DB a moment
    listing = check_listing_boost(listing_id)
    print(f"Listing Boost Level: {listing.get('boost_level')}")
    print(f"Listing Status: {listing.get('status')}")
    
    if listing.get('boost_level') > 0:
        print("SUCCESS: Listing is boosted!")
    else:
        print("FAILURE: Listing not boosted.")

if __name__ == "__main__":
    main()
