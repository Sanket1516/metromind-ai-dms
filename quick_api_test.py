#!/usr/bin/env python3
"""
Quick API Test Script - Fixed Authentication
"""

import requests
import json

def test_auth_with_correct_format():
    """Test authentication with correct email format"""
    print("🔐 Testing Authentication with Correct Format")
    print("=" * 50)
    
    # Correct login data format
    login_data = {
        "email": "admin@kmrl.com",
        "password": "admin123"
    }
    
    try:
        response = requests.post(
            "http://localhost:8010/auth/login", 
            json=login_data,
            timeout=5
        )
        
        print(f"📊 Status Code: {response.status_code}")
        print(f"📋 Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            return response.json().get("access_token")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    
    return None

def test_documents_with_auth(token=None):
    """Test document endpoints with authentication"""
    print("\n📄 Testing Document Endpoints")
    print("=" * 50)
    
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    try:
        # Test document listing
        response = requests.get(
            "http://localhost:8010/documents",
            headers=headers,
            timeout=5
        )
        
        print(f"📊 Documents Status: {response.status_code}")
        print(f"📋 Response: {json.dumps(response.json(), indent=2)}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

def test_search_endpoint():
    """Test search with correct method"""
    print("\n🔍 Testing Search Endpoint")
    print("=" * 50)
    
    search_data = {"query": "test", "limit": 10}
    
    try:
        # Try GET method first
        response = requests.get(
            "http://localhost:8010/search",
            params=search_data,
            timeout=5
        )
        
        print(f"📊 Search GET Status: {response.status_code}")
        if response.status_code != 200:
            print(f"📋 Response: {response.text}")
        
        # Try POST method
        response = requests.post(
            "http://localhost:8010/search",
            json=search_data,
            timeout=5
        )
        
        print(f"📊 Search POST Status: {response.status_code}")
        print(f"📋 Response: {json.dumps(response.json(), indent=2) if response.status_code == 200 else response.text}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    print("🚀 QUICK API TEST - CORRECTED ENDPOINTS")
    print("=" * 60)
    
    # Test authentication
    token = test_auth_with_correct_format()
    
    # Test documents with token
    test_documents_with_auth(token)
    
    # Test search
    test_search_endpoint()

if __name__ == "__main__":
    main()