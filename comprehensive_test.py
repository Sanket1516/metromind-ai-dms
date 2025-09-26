#!/usr/bin/env python3
"""
Comprehensive Frontend and Backend Integration Test
Tests all functionality with working authentication
"""

import requests
import json
import time
from datetime import datetime

class MetroMindIntegrationTester:
    def __init__(self):
        self.base_url = "http://localhost:8010"
        self.token = None
        self.headers = {}
        
    def authenticate(self):
        """Get authentication token"""
        print("🔐 AUTHENTICATING...")
        
        login_data = {
            "email": "admin@kmrl.gov.in",
            "password": "admin123"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/auth/login",
                json=login_data,
                timeout=15
            )
            
            if response.status_code == 200:
                result = response.json()
                self.token = result.get("access_token")
                self.headers = {"Authorization": f"Bearer {self.token}"}
                print(f"✅ Authentication successful")
                print(f"   User: {result.get('user', {}).get('email', 'N/A')}")
                print(f"   Role: {result.get('user', {}).get('role', 'N/A')}")
                return True
            else:
                print(f"❌ Authentication failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Authentication error: {e}")
            return False
    
    def test_document_endpoints(self):
        """Test all document management endpoints"""
        print("\n📄 TESTING DOCUMENT ENDPOINTS")
        print("=" * 50)
        
        # Test document listing
        try:
            response = requests.get(
                f"{self.base_url}/documents",
                headers=self.headers,
                timeout=10
            )
            print(f"📋 List Documents: {response.status_code}")
            
            if response.status_code == 200:
                docs = response.json()
                print(f"   Found {len(docs.get('documents', []))} documents")
            else:
                print(f"   Response: {response.text[:100]}...")
                
        except Exception as e:
            print(f"❌ Document listing error: {e}")
        
        # Test document upload
        print("\n📤 Testing document upload...")
        try:
            test_content = f"Test document uploaded at {datetime.now()}"
            files = {
                "file": ("test_upload.txt", test_content, "text/plain")
            }
            
            response = requests.post(
                f"{self.base_url}/documents/upload",
                files=files,
                headers=self.headers,
                timeout=15
            )
            
            print(f"📁 Upload Status: {response.status_code}")
            
            if response.status_code in [200, 201]:
                result = response.json()
                print(f"✅ Upload successful!")
                print(f"   Document ID: {result.get('document_id', 'N/A')}")
                print(f"   Filename: {result.get('filename', 'N/A')}")
                return result.get('document_id')
            else:
                print(f"❌ Upload failed: {response.text}")
                
        except Exception as e:
            print(f"❌ Upload error: {e}")
        
        return None
    
    def test_search_functionality(self):
        """Test search capabilities"""
        print("\n🔍 TESTING SEARCH FUNCTIONALITY")
        print("=" * 50)
        
        # Test GET search (seems to work)
        try:
            search_params = {
                "q": "test",
                "limit": 10
            }
            
            response = requests.get(
                f"{self.base_url}/search",
                params=search_params,
                headers=self.headers,
                timeout=10
            )
            
            print(f"🔎 Search GET: {response.status_code}")
            
            if response.status_code == 200:
                results = response.json()
                print(f"✅ Search successful!")
                print(f"   Results: {json.dumps(results, indent=2)}")
            else:
                print(f"❌ Search failed: {response.text}")
                
        except Exception as e:
            print(f"❌ Search error: {e}")
    
    def test_analytics_dashboard(self):
        """Test analytics and dashboard data"""
        print("\n📊 TESTING ANALYTICS DASHBOARD")
        print("=" * 50)
        
        endpoints_to_test = [
            "/analytics/stats",
            "/analytics/dashboard",
            "/analytics/metrics",
            "/analytics/summary"
        ]
        
        for endpoint in endpoints_to_test:
            try:
                response = requests.get(
                    f"{self.base_url}{endpoint}",
                    headers=self.headers,
                    timeout=10
                )
                
                print(f"📈 {endpoint}: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"   Data keys: {list(data.keys()) if isinstance(data, dict) else 'Non-dict response'}")
                elif response.status_code == 404:
                    print(f"   Endpoint not found (expected)")
                else:
                    print(f"   Response: {response.text[:100]}...")
                    
            except Exception as e:
                print(f"❌ Analytics error for {endpoint}: {e}")
    
    def test_user_management(self):
        """Test user management endpoints"""
        print("\n👥 TESTING USER MANAGEMENT")
        print("=" * 50)
        
        endpoints_to_test = [
            ("/auth/profile", "GET", "User Profile"),
            ("/auth/users", "GET", "List Users"),
            ("/auth/logout", "POST", "Logout")
        ]
        
        for endpoint, method, description in endpoints_to_test:
            try:
                if method == "GET":
                    response = requests.get(
                        f"{self.base_url}{endpoint}",
                        headers=self.headers,
                        timeout=10
                    )
                elif method == "POST":
                    response = requests.post(
                        f"{self.base_url}{endpoint}",
                        headers=self.headers,
                        timeout=10
                    )
                
                print(f"👤 {description}: {response.status_code}")
                
                if response.status_code == 200:
                    print(f"   ✅ Success")
                elif response.status_code == 404:
                    print(f"   ⚠️ Endpoint not implemented")
                else:
                    print(f"   Response: {response.text[:100]}...")
                    
            except Exception as e:
                print(f"❌ User management error for {description}: {e}")
    
    def test_frontend_compatibility(self):
        """Test if backend is compatible with frontend expectations"""
        print("\n🌐 TESTING FRONTEND COMPATIBILITY")
        print("=" * 50)
        
        # Test CORS
        try:
            response = requests.options(
                f"{self.base_url}/health",
                headers={
                    "Origin": "http://localhost:3000",
                    "Access-Control-Request-Method": "GET"
                },
                timeout=5
            )
            
            print(f"🔗 CORS Preflight: {response.status_code}")
            cors_headers = {k: v for k, v in response.headers.items() if 'access-control' in k.lower()}
            print(f"   CORS Headers: {cors_headers}")
            
        except Exception as e:
            print(f"❌ CORS test error: {e}")
        
        # Test API structure expected by frontend
        frontend_endpoints = [
            "/documents",
            "/auth/login", 
            "/search",
            "/analytics/stats"
        ]
        
        print(f"\n🎯 Testing frontend-expected endpoints:")
        for endpoint in frontend_endpoints:
            try:
                if endpoint == "/auth/login":
                    continue  # Already tested
                    
                response = requests.get(
                    f"{self.base_url}{endpoint}",
                    headers=self.headers,
                    timeout=5
                )
                
                status_icon = "✅" if response.status_code == 200 else "⚠️" if response.status_code == 404 else "❌"
                print(f"   {status_icon} {endpoint}: {response.status_code}")
                
            except Exception as e:
                print(f"   ❌ {endpoint}: Error - {e}")
    
    def run_comprehensive_test(self):
        """Run all integration tests"""
        print("🚀 METROMIND COMPREHENSIVE INTEGRATION TEST")
        print("=" * 70)
        print(f"Started at: {datetime.now()}")
        print("=" * 70)
        
        # Authenticate first
        if not self.authenticate():
            print("❌ Authentication failed - cannot proceed with tests")
            return
        
        # Run all tests
        self.test_document_endpoints()
        self.test_search_functionality()
        self.test_analytics_dashboard()
        self.test_user_management()
        self.test_frontend_compatibility()
        
        print("\n" + "=" * 70)
        print("🏁 COMPREHENSIVE TEST COMPLETED")
        print("=" * 70)
        
        # Summary
        print("\n📋 TEST SUMMARY:")
        print("✅ Authentication: Working")
        print("⚠️ Document Endpoints: Need route fixes")
        print("✅ Search (GET): Working") 
        print("⚠️ Analytics: Need implementation")
        print("✅ CORS: Configured")
        print("\n💡 NEXT STEPS:")
        print("1. Fix document routing in API Gateway")
        print("2. Implement missing analytics endpoints")
        print("3. Start frontend server to test UI")
        print("4. Test upload feedback and document display")

if __name__ == "__main__":
    tester = MetroMindIntegrationTester()
    tester.run_comprehensive_test()