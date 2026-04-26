import requests
import json
import time

BASE_URL = "http://localhost:5001/api/ai"

def test_ai_service():
    print("🚀 Starting AI Service Test...")
    
    # 1. Test Health Check
    try:
        health = requests.get("http://localhost:5001/health")
        print(f"✅ Health Check: {health.json()}")
    except Exception as e:
        print(f"❌ Service not running: {e}")
        return

    # 2. Test ATS Scan Task (Gemini - Default)
    payload = {
        "task": "ATS_SCAN",
        "data": {
            "resumeText": "Experienced Software Engineer with 5 years in Node.js and React.",
            "jobDescription": "Looking for a Senior Backend Developer with expertise in Node.js and microservices."
        }
    }
    
    print("\n--- Testing ATS_SCAN (Gemini) ---")
    try:
        response = requests.post(f"{BASE_URL}/generate", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Result: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"❌ ATS_SCAN failed: {e}")

    # 3. Test Resume Audit (Manual Provider: Groq)
    # Note: Requires GROQ_API_KEY to be valid
    payload_groq = {
        "task": "RESUME_AUDIT",
        "data": {
            "resume": { "experience": [{"company": "Tech Corp", "role": "Junior Dev"}] },
            "jobDescription": "Need a Senior Dev with lead experience."
        },
        "provider": "groq"
    }

    print("\n--- Testing RESUME_AUDIT (Groq) ---")
    try:
        response = requests.post(f"{BASE_URL}/generate", json=payload_groq)
        print(f"Status: {response.status_code}")
        if response.status_code == 500:
            print("💡 Note: This might fail if GROQ_API_KEY is not set correctly in .env")
        print(f"Result: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"❌ Groq test failed: {e}")

if __name__ == "__main__":
    # Wait a moment for the server to start
    print("⏳ Waiting for server to initialize...")
    time.sleep(5)
    test_ai_service()
