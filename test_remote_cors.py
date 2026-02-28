import requests
import json

def test_cors(url, origin):
    print(f"\nTesting CORS for Origin: {origin}")
    print(f"Target URL: {url}")
    
    headers = {
        'Origin': origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Mobile Safari/537.36'
    }
    
    try:
        # Simulate preflight OPTIONS request
        response = requests.options(url, headers=headers, timeout=10)
        
        print(f"Response Status: {response.status_code}")
        
        allow_origin = response.headers.get('Access-Control-Allow-Origin')
        allow_methods = response.headers.get('Access-Control-Allow-Methods')
        
        if allow_origin == origin or allow_origin == '*':
            print(f"✅ SUCCESS: Origin '{origin}' is allowed!")
        else:
            print(f"❌ FAILED: Origin '{origin}' is NOT allowed.")
            print(f"Allowed Origin Header: {allow_origin}")
            
        if allow_methods:
            print(f"Allowed Methods: {allow_methods}")
            
    except Exception as e:
        print(f"❌ ERROR: Could not reach server: {e}")

if __name__ == "__main__":
    target_api = "http://143.198.30.249:8888/api/v1/auth/signup"
    
    # Test common mobile origins
    test_cors(target_api, "http://localhost")
    test_cors(target_api, "capacitor://localhost")
    
    print("\n" + "="*50)
    print("INSTRUCTIONS:")
    print("If you see ❌ FAILED above, you MUST update 'backend/app/core/config.py'")
    print("on your REMOTE SERVER and restart the FastAPI process.")
    print("="*50)
