#!/usr/bin/env python3
"""
Check which services are actually running and responding
"""

import requests

services = {
    "API Gateway": 8010,
    "Auth Service": 8011,
    "Document Service": 8012,
    "OCR Service": 8013,
    "AI/ML Service": 8014,
    "Search Service": 8015,
    "Notification Service": 8016,
    "Integration Service": 8017,
    "Analytics Service": 8018,
    "Task Service": 8019,
    "Email Service": 8020,
    "Chatbot Service": 8021
}

print("🔍 CHECKING SERVICE STATUS")
print("=" * 50)

for service_name, port in services.items():
    try:
        response = requests.get(f"http://localhost:{port}/health", timeout=2)
        status = "✅ Healthy" if response.status_code == 200 else f"⚠️ Status {response.status_code}"
        print(f"{service_name:20} (:{port}): {status}")
    except requests.exceptions.ConnectionError:
        print(f"{service_name:20} (:{port}): ❌ Not responding")
    except Exception as e:
        print(f"{service_name:20} (:{port}): ❌ Error: {e}")

# Test document endpoint specifically
print(f"\n📄 Testing document endpoint directly...")
try:
    response = requests.get("http://localhost:8012/documents", timeout=5)
    print(f"Document service /documents: {response.status_code}")
    if response.status_code == 401:
        print("   Authentication required (expected)")
    elif response.status_code == 200:
        print(f"   Success: {response.text[:100]}...")
    else:
        print(f"   Response: {response.text[:100]}...")
except Exception as e:
    print(f"   Error: {e}")