#!/usr/bin/env python3
"""
MetroMind System Testing Script
Tests all backend services, API endpoints, and system functionality
"""

import requests
import json
import time
from typing import Dict, Any

class MetroMindTester:
    def __init__(self):
        self.base_url = "http://localhost:8010"
        self.test_results = {}
        
    def test_service_health(self) -> Dict[str, Any]:
        """Test API Gateway and service health"""
        print("=" * 50)
        print("🏥 TESTING SERVICE HEALTH")
        print("=" * 50)
        
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            print(f"✅ API Gateway Status: {response.status_code}")
            
            if response.status_code == 200:
                health_data = response.json()
                print(f"📊 Health Data: {json.dumps(health_data, indent=2)}")
                return {"status": "success", "data": health_data}
            else:
                print(f"❌ Health check failed with status: {response.status_code}")
                return {"status": "failed", "code": response.status_code}
                
        except requests.exceptions.ConnectionError:
            print("❌ API Gateway is not running on port 8010")
            return {"status": "not_running"}
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            return {"status": "error", "message": str(e)}
    
    def test_auth_service(self) -> Dict[str, Any]:
        """Test authentication endpoints"""
        print("\n" + "=" * 50)
        print("🔐 TESTING AUTHENTICATION SERVICE")
        print("=" * 50)
        
        # Test login endpoint
        try:
            login_data = {
                "username": "admin@kmrl.com",
                "password": "admin123"
            }
            
            response = requests.post(
                f"{self.base_url}/auth/login", 
                json=login_data,
                timeout=5
            )
            
            print(f"🔑 Login Test Status: {response.status_code}")
            
            if response.status_code in [200, 201]:
                auth_result = response.json()
                print(f"✅ Login successful: {json.dumps(auth_result, indent=2)}")
                return {"status": "success", "data": auth_result}
            elif response.status_code == 401:
                print("🚫 Invalid credentials (expected for test)")
                return {"status": "invalid_credentials"}
            else:
                print(f"❌ Login failed: {response.text}")
                return {"status": "failed", "response": response.text}
                
        except Exception as e:
            print(f"❌ Auth service error: {e}")
            return {"status": "error", "message": str(e)}
    
    def test_document_service(self) -> Dict[str, Any]:
        """Test document management endpoints"""
        print("\n" + "=" * 50)
        print("📄 TESTING DOCUMENT SERVICE")
        print("=" * 50)
        
        try:
            # Test document listing
            response = requests.get(f"{self.base_url}/documents/", timeout=5)
            print(f"📋 Document List Status: {response.status_code}")
            
            if response.status_code == 200:
                docs = response.json()
                print(f"✅ Found {len(docs.get('documents', []))} documents")
                print(f"📊 Document data: {json.dumps(docs, indent=2)}")
                return {"status": "success", "data": docs}
            else:
                print(f"❌ Document service failed: {response.text}")
                return {"status": "failed", "response": response.text}
                
        except Exception as e:
            print(f"❌ Document service error: {e}")
            return {"status": "error", "message": str(e)}
    
    def test_search_service(self) -> Dict[str, Any]:
        """Test search functionality"""
        print("\n" + "=" * 50)
        print("🔍 TESTING SEARCH SERVICE")
        print("=" * 50)
        
        try:
            search_data = {"query": "test document", "limit": 10}
            response = requests.post(
                f"{self.base_url}/search/",
                json=search_data,
                timeout=5
            )
            
            print(f"🔎 Search Status: {response.status_code}")
            
            if response.status_code == 200:
                results = response.json()
                print(f"✅ Search returned {len(results.get('results', []))} results")
                print(f"📊 Search data: {json.dumps(results, indent=2)}")
                return {"status": "success", "data": results}
            else:
                print(f"❌ Search failed: {response.text}")
                return {"status": "failed", "response": response.text}
                
        except Exception as e:
            print(f"❌ Search service error: {e}")
            return {"status": "error", "message": str(e)}
    
    def test_analytics_service(self) -> Dict[str, Any]:
        """Test analytics endpoints"""
        print("\n" + "=" * 50)
        print("📈 TESTING ANALYTICS SERVICE")
        print("=" * 50)
        
        try:
            response = requests.get(f"{self.base_url}/analytics/stats", timeout=5)
            print(f"📊 Analytics Status: {response.status_code}")
            
            if response.status_code == 200:
                stats = response.json()
                print(f"✅ Analytics data: {json.dumps(stats, indent=2)}")
                return {"status": "success", "data": stats}
            else:
                print(f"❌ Analytics failed: {response.text}")
                return {"status": "failed", "response": response.text}
                
        except Exception as e:
            print(f"❌ Analytics service error: {e}")
            return {"status": "error", "message": str(e)}
    
    def test_upload_functionality(self) -> Dict[str, Any]:
        """Test file upload functionality"""
        print("\n" + "=" * 50)
        print("📤 TESTING UPLOAD FUNCTIONALITY")
        print("=" * 50)
        
        try:
            # Create a test file
            test_content = "This is a test document for MetroMind upload functionality."
            files = {
                'file': ('test_document.txt', test_content, 'text/plain')
            }
            
            response = requests.post(
                f"{self.base_url}/documents/upload",
                files=files,
                timeout=10
            )
            
            print(f"📁 Upload Status: {response.status_code}")
            
            if response.status_code in [200, 201]:
                upload_result = response.json()
                print(f"✅ Upload successful: {json.dumps(upload_result, indent=2)}")
                return {"status": "success", "data": upload_result}
            else:
                print(f"❌ Upload failed: {response.text}")
                return {"status": "failed", "response": response.text}
                
        except Exception as e:
            print(f"❌ Upload error: {e}")
            return {"status": "error", "message": str(e)}
    
    def run_comprehensive_test(self):
        """Run all tests and generate report"""
        print("🚀 STARTING COMPREHENSIVE METROMIND SYSTEM TEST")
        print("=" * 70)
        
        # Test all services
        self.test_results["health"] = self.test_service_health()
        self.test_results["auth"] = self.test_auth_service()
        self.test_results["documents"] = self.test_document_service()
        self.test_results["search"] = self.test_search_service()
        self.test_results["analytics"] = self.test_analytics_service()
        self.test_results["upload"] = self.test_upload_functionality()
        
        # Generate summary report
        self.generate_test_report()
    
    def generate_test_report(self):
        """Generate comprehensive test report"""
        print("\n" + "=" * 70)
        print("📋 COMPREHENSIVE TEST REPORT")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results.values() 
                          if result.get("status") == "success")
        
        print(f"🎯 Overall Status: {passed_tests}/{total_tests} tests passed")
        print(f"📊 Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        print("\n📝 Detailed Results:")
        for service, result in self.test_results.items():
            status = result.get("status", "unknown")
            if status == "success":
                print(f"  ✅ {service.upper()}: WORKING")
            elif status == "not_running":
                print(f"  🔌 {service.upper()}: SERVICE NOT RUNNING")
            elif status == "invalid_credentials":
                print(f"  🔐 {service.upper()}: ENDPOINT WORKING (Auth Required)")
            else:
                print(f"  ❌ {service.upper()}: FAILED - {result.get('message', 'Unknown error')}")
        
        print("\n🔧 ISSUES IDENTIFIED:")
        issues = []
        
        for service, result in self.test_results.items():
            if result.get("status") not in ["success", "invalid_credentials"]:
                issues.append(f"- {service.upper()} service needs attention")
        
        if not issues:
            print("  🎉 No critical issues found!")
        else:
            for issue in issues:
                print(f"  ⚠️ {issue}")
        
        print("\n💡 RECOMMENDATIONS:")
        if self.test_results["health"].get("status") == "not_running":
            print("  1. Start the API Gateway: python services/api_gateway.py")
        if any(result.get("status") == "error" for result in self.test_results.values()):
            print("  2. Check service configurations and dependencies")
        if passed_tests == total_tests:
            print("  🚀 System is ready for frontend testing!")

if __name__ == "__main__":
    tester = MetroMindTester()
    tester.run_comprehensive_test()