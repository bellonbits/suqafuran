import requests

def test_cors():
    url = "https://res.cloudinary.com/dyyo8cnqc/raw/upload/v1780128441/suqafuran/397dd114854546e3a773421ee87b6769"
    try:
        r = requests.head(url, headers={"Origin": "http://localhost:5173"}, allow_redirects=True, timeout=5)
        print("CORS test:")
        print(f"  Access-Control-Allow-Origin: {r.headers.get('Access-Control-Allow-Origin')}")
        print(f"  Access-Control-Allow-Methods: {r.headers.get('Access-Control-Allow-Methods')}")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    test_cors()
