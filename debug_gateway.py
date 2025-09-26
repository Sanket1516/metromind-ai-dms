#!/usr/bin/env python3
"""
Debug API Gateway routing issue
"""

import requests
import json

def test_service_discovery():
    """Test if API Gateway can find the documents service"""
    print("🔍 DEBUGGING API GATEWAY ROUTING")
    print("=" * 50)
    
    # 1. Check service registry
    print("1. Checking service registry...")
    try:
        response = requests.get("http://localhost:8010/services", timeout=5)
        if response.status_code == 200:
            services = response.json().get("services", {})
            doc_service = services.get("documents", {})
            print(f"   Documents service found: {bool(doc_service)}")
            print(f"   Status: {doc_service.get('status', 'unknown')}")
            print(f"   Instances: {doc_service.get('instances', [])}")
            print(f"   Healthy instances: {doc_service.get('healthy_instances', [])}")
        else:
            print(f"   Failed to get services: {response.status_code}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # 2. Check health endpoint
    print("\n2. Checking gateway health...")
    try:
        response = requests.get("http://localhost:8010/health", timeout=5)
        if response.status_code == 200:
            health = response.json()
            services_status = health.get("services", {})
            print(f"   Documents service health: {services_status.get('documents', 'unknown')}")
        else:
            print(f"   Health check failed: {response.status_code}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # 3. Test direct document service
    print("\n3. Testing document service directly...")
    try:
        response = requests.get("http://localhost:8012/health", timeout=5)
        print(f"   Document service health: {response.status_code}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # 4. Test routing with simple path
    print("\n4. Testing API Gateway routing...")
    
    # Get auth token
    login_data = {"email": "admin@kmrl.gov.in", "password": "admin123"}
    auth_response = requests.post("http://localhost:8010/auth/login", json=login_data, timeout=10)
    
    if auth_response.status_code == 200:
        token = auth_response.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test different document paths
        paths_to_test = [
            "/documents",
            "/documents/",  
            "documents",
            "/documents/upload"
        ]
        
        for path in paths_to_test:
            try:
                response = requests.get(f"http://localhost:8010{path}", headers=headers, timeout=5)
                print(f"   {path:20}: {response.status_code} - {response.text[:50]}...")
            except Exception as e:
                print(f"   {path:20}: Error - {e}")
    else:
        print("   Could not get auth token for testing")

if __name__ == "__main__":
    test_service_discovery()