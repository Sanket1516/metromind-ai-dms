#!/bin/bash

# MetroMind API Test Script - Improved with Authentication
# This script tests various API endpoints using curl commands with proper authentication flow

echo "Testing MetroMind API Endpoints"
echo "================================="

# Function to extract token from login response
extract_token() {
    echo "$1" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4
}

# Function to make authenticated request
auth_curl() {
    local method=$1
    local url=$2
    shift 2
    curl -X "$method" "$url" -H "Authorization: Bearer $ACCESS_TOKEN" "$@"
}

echo "1. Authentication Flow"
echo "======================"

echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8011/login -H "Content-Type: application/json" -d '{"email":"admin@kmrl.gov.in","password":"admin123"}')
echo "$LOGIN_RESPONSE"

# Extract access token
ACCESS_TOKEN=$(extract_token "$LOGIN_RESPONSE")
if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Failed to extract access token. Exiting."
    exit 1
fi
echo "✅ Extracted access token: ${ACCESS_TOKEN:0:20}..."

echo
echo "Testing logout..."
auth_curl POST http://localhost:8011/logout
echo

echo "2. Admin Endpoints"
echo "=================="

echo "Getting pending users..."
auth_curl GET http://localhost:8011/admin/pending-users
echo

echo "Getting all users..."
auth_curl GET http://localhost:8011/admin/users
echo

echo "3. Document Service Endpoints"
echo "============================="

echo "Getting document categories..."
curl -X GET http://localhost:8012/categories
echo

echo "Getting document priorities..."
curl -X GET http://localhost:8012/priorities
echo

echo "Getting documents (authenticated)..."
auth_curl GET http://localhost:8012/documents
echo

echo "Searching documents..."
auth_curl POST http://localhost:8012/search -H "Content-Type: application/json" -d '{"query":"test","limit":5}'
echo

# Create a test file for upload
echo "Creating test file for upload..."
echo "This is a test document for upload testing." > test_document.txt

echo "Uploading document..."
auth_curl POST http://localhost:8012/upload -F "file=@test_document.txt" -F "title=Test Document" -F "description=Test upload"
echo

echo "4. Task Service Endpoints"
echo "=========================="

echo "Getting task categories..."
auth_curl GET http://localhost:8020/tasks/categories
echo

echo "Getting my tasks..."
auth_curl GET http://localhost:8020/tasks/my-tasks
echo

echo "Creating a task..."
auth_curl POST http://localhost:8020/tasks -H "Content-Type: application/json" -d '{"title":"Test Task","description":"This is a test task","priority":"medium","category":"general"}'
echo

echo "5. Analytics & Monitoring"
echo "========================="

echo "Getting dashboard data..."
curl -X GET http://localhost:8018/dashboard
echo

echo "Getting audit dashboard stats..."
curl -X GET http://localhost:8022/dashboard/stats
echo

echo "Testing completed successfully!"
echo "==============================="

# Cleanup
rm -f test_document.txt
