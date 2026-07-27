import os
import requests
from dotenv import load_dotenv

load_dotenv("backend/.env")

api_key = os.getenv("GROQ_API_KEY")
res = requests.get("https://api.groq.com/openai/v1/models", headers={"Authorization": f"Bearer {api_key}"})
models = res.json().get("data", [])
for m in models:
    if "vision" in m["id"].lower():
        print(m["id"])
