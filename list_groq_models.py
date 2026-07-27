import os
import json
import urllib.request

# Load env variables if python-dotenv is available, otherwise assume it's set in the shell or we can read from file manually
# But actually we can just read backend/.env manually

env_file = "backend/.env"
api_key = None
if os.path.exists(env_file):
    with open(env_file, "r") as f:
        for line in f:
            if line.startswith("GROQ_API_KEY="):
                api_key = line.strip().split("=", 1)[1].strip('"').strip("'")
                break

if not api_key:
    api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    print("API Key not found")
    exit(1)

req = urllib.request.Request("https://api.groq.com/openai/v1/models", headers={"Authorization": f"Bearer {api_key}"})
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        for model in data.get("data", []):
            if "vision" in model["id"].lower() or "llava" in model["id"].lower():
                print(model["id"])
except Exception as e:
    print(f"Failed: {e}")
