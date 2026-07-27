import os
from dotenv import load_dotenv
from groq import Groq

# Load environment variables from backend/.env
load_dotenv("backend/.env")

api_key = os.getenv("GROQ_API_KEY")
model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

print(f"API Key: {api_key[:10]}...{api_key[-5:] if api_key else ''}")
print(f"Model: {model}")

try:
    client = Groq(api_key=api_key)
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "user", "content": "Hello! Respond with 'Groq is working' and nothing else."}
        ]
    )
    print("Success! Response:")
    print(response.choices[0].message.content)
except Exception as e:
    print(f"Error occurred: {e}")
