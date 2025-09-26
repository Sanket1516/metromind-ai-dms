#!/usr/bin/env python3
"""
Test authentication with correct credentials
"""

import requests
import json

def test_correct_auth():
    print("🔐 Testing with correct admin email")
    
    login_data = {
        "email": "admin@kmrl.gov.in", 
        "password": "admin123"
    }
    
    try:
        response = requests.post("http://localhost:8010/auth/login", json=login_data, timeout=5)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Authentication successful!")
            token = result.get("access_token", "")
            print(f"Token: {token[:50]}...")
            
            # Test document endpoint with auth
            headers = {"Authorization": f"Bearer {token}"}
            doc_response = requests.get("http://localhost:8010/documents", headers=headers, timeout=5)
            print(f"\n📄 Document endpoint status: {doc_response.status_code}")
            print(f"Document response: {doc_response.text[:200]}...")
            
            # Test upload with auth
            files = {"file": ("test.txt", "Test content", "text/plain")}
            upload_response = requests.post("http://localhost:8010/documents/upload", files=files, headers=headers, timeout=10)
            print(f"\n📤 Upload status: {upload_response.status_code}")
            print(f"Upload response: {upload_response.text[:200]}...")
            
            return token
        else:
            print(f"❌ Auth failed: {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")
    
    return None

if __name__ == "__main__":
    test_correct_auth()