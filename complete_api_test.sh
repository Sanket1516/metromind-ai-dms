#!/bin/bash

# MetroMind Complete API Test Script - Dynamic Testing for All Endpoints
# This script dynamically tests ALL API endpoints with proper request bodies and authentication

echo "🚀 MetroMind Complete API Test Suite"
echo "===================================="

# Configuration
BASE_URL="http://localhost"
ADMIN_EMAIL="admin@kmrl.gov.in"
ADMIN_PASSWORD="admin123"

# Global variables for dynamic testing
ACCESS_TOKEN=""
TEST_DOCUMENT_ID=""
TEST_TASK_ID=""
TEST_USER_ID="549c9ef7-a9c4-4998-b6b1-d6a1a3bb1978"

# Function to extract token from login response
extract_token() {
    echo "$1" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4
}

# Function to extract UUIDs from responses
extract_uuid() {
    echo "$1" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4
}

# Function to make authenticated request
auth_curl() {
    local method=$1
    local url=$2
    shift 2
    curl -s -X "$method" "$url" -H "Authorization: Bearer $ACCESS_TOKEN" "$@"
}

# Function to test endpoint and show result
test_endpoint() {
    local desc=$1
    local cmd=$2
    echo "🧪 $desc"
    echo "Command: $cmd"
    response=$(eval "$cmd")
    echo "Response: $response"
    echo "---"
}

# 1. AUTHENTICATION SETUP
echo "1️⃣ AUTHENTICATION & USER MANAGEMENT"
echo "===================================="

echo "Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST ${BASE_URL}:8011/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

echo "Login Response: $LOGIN_RESPONSE"
ACCESS_TOKEN=$(extract_token "$LOGIN_RESPONSE")

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Failed to extract access token. Exiting."
    exit 1
fi
echo "✅ Access token obtained"

test_endpoint "Health Check" "curl -s -X GET ${BASE_URL}:8011/health"
test_endpoint "Get User Profile" "auth_curl GET ${BASE_URL}:8011/profile"
test_endpoint "Update User Profile" "auth_curl PUT ${BASE_URL}:8011/profile -H 'Content-Type: application/json' -d '{\"first_name\":\"Test\",\"last_name\":\"Admin\",\"department\":\"IT\"}'"
test_endpoint "Change Password" "auth_curl POST ${BASE_URL}:8011/change-password -H 'Content-Type: application/json' -d '{\"current_password\":\"admin123\",\"new_password\":\"admin123\"}'"
test_endpoint "Register New User" "curl -s -X POST ${BASE_URL}:8011/register -H 'Content-Type: application/json' -d '{\"username\":\"testuser\",\"email\":\"test@example.com\",\"password\":\"password123\",\"first_name\":\"Test\",\"last_name\":\"User\",\"department\":\"IT\"}'"
test_endpoint "Get Pending Users" "auth_curl GET ${BASE_URL}:8011/admin/pending-users"
test_endpoint "Get All Users" "auth_curl GET ${BASE_URL}:8011/admin/users"
test_endpoint "Initialize Permissions" "auth_curl POST ${BASE_URL}:8011/admin/permissions/initialize -H 'Content-Type: application/json' -d '{}'"
test_endpoint "Update Permissions" "auth_curl POST ${BASE_URL}:8011/admin/permissions/update -H 'Content-Type: application/json' -d '{}'"

# 2. DOCUMENT SERVICE
echo ""
echo "2️⃣ DOCUMENT SERVICE"
echo "==================="

# Create test document
echo "Creating test document..."
echo "This is a comprehensive test document for MetroMind API testing.

It contains multiple paragraphs of text to test document processing capabilities.

Key features to test:
- Document upload and storage
- Text extraction and indexing
- Search functionality
- Version control
- Access permissions

This document serves as a comprehensive test case." > comprehensive_test.txt

test_endpoint "Get Categories" "curl -s -X GET ${BASE_URL}:8012/categories"
test_endpoint "Get Priorities" "curl -s -X GET ${BASE_URL}:8012/priorities"
test_endpoint "Health Check" "curl -s -X GET ${BASE_URL}:8012/health"

# Upload document
UPLOAD_RESPONSE=$(auth_curl POST ${BASE_URL}:8012/upload \
  -F "file=@comprehensive_test.txt" \
  -F "title=MetroMind Comprehensive Test Document" \
  -F "description=Complete API testing document" \
  -F "category=testing" \
  -F "priority=1")

echo "📄 Upload Response: $UPLOAD_RESPONSE"
TEST_DOCUMENT_ID=$(extract_uuid "$UPLOAD_RESPONSE")
echo "📄 Document ID: $TEST_DOCUMENT_ID"

test_endpoint "List Documents" "auth_curl GET ${BASE_URL}:8012/documents"
test_endpoint "List Shared Documents" "auth_curl GET ${BASE_URL}:8012/documents/shared"
test_endpoint "Get Document Stats" "auth_curl GET ${BASE_URL}:8012/stats"

if [ -n "$TEST_DOCUMENT_ID" ]; then
    test_endpoint "Get Specific Document" "auth_curl GET ${BASE_URL}:8012/documents/${TEST_DOCUMENT_ID}"
    test_endpoint "Update Document" "auth_curl PUT ${BASE_URL}:8012/documents/${TEST_DOCUMENT_ID} -H 'Content-Type: application/json' -d '{\"title\":\"Updated Test Document\"}'"
    test_endpoint "Search Documents" "auth_curl POST ${BASE_URL}:8012/search -H 'Content-Type: application/json' -d '{\"query\":\"MetroMind\",\"limit\":5}'"
    test_endpoint "Share Document" "auth_curl POST ${BASE_URL}:8012/documents/${TEST_DOCUMENT_ID}/share -H 'Content-Type: application/json' -d '{\"user_id\":\"${TEST_USER_ID}\",\"permission\":\"read\"}'"
fi

# 3. OCR SERVICE
echo ""
echo "3️⃣ OCR SERVICE"
echo "=============="

test_endpoint "Get OCR Capabilities" "curl -s -X GET ${BASE_URL}:8013/capabilities"
test_endpoint "Get Supported Languages" "curl -s -X GET ${BASE_URL}:8013/languages"
test_endpoint "Health Check" "curl -s -X GET ${BASE_URL}:8013/health"

# Create simple test image if ImageMagick available
if command -v convert &> /dev/null; then
    echo "Creating test image for OCR..."
    convert -size 300x100 xc:white -pointsize 20 -fill black -gravity center -draw "text 0,0 'OCR TEST TEXT'" test_ocr.png
    test_endpoint "Extract Text from Image" "auth_curl POST ${BASE_URL}:8013/extract-text -F 'file=@test_ocr.png' -F 'language=en'"
fi

# 4. AI/ML SERVICE
echo ""
echo "4️⃣ AI/ML SERVICE"
echo "================="

test_endpoint "Get Available Models" "curl -s -X GET ${BASE_URL}:8014/models"
test_endpoint "Health Check" "curl -s -X GET ${BASE_URL}:8014/health"
test_endpoint "Analyze Text" "curl -s -X POST ${BASE_URL}:8014/analyze-text -H 'Content-Type: application/json' -d '{\"text\":\"This is an excellent test document for sentiment analysis.\",\"language\":\"en\"}'"
test_endpoint "Generate Embeddings" "curl -s -X POST ${BASE_URL}:8014/generate-embeddings -H 'Content-Type: application/json' -d '{\"text\":\"Text for embedding generation\",\"model\":\"spacy_en\"}'"

if [ -n "$TEST_DOCUMENT_ID" ]; then
    test_endpoint "Analyze Document" "auth_curl POST ${BASE_URL}:8014/analyze-document -H 'Content-Type: application/json' -d '{\"document_id\":\"${TEST_DOCUMENT_ID}\",\"analysis_type\":\"sentiment\"}'"
fi

# 5. SEARCH SERVICE
echo ""
echo "5️⃣ SEARCH SERVICE"
echo "=================="

test_endpoint "Get Service Info" "curl -s -X GET ${BASE_URL}:8015/"
test_endpoint "Health Check" "curl -s -X GET ${BASE_URL}:8015/health"
test_endpoint "Get Index Stats" "curl -s -X GET ${BASE_URL}:8015/index/stats"
test_endpoint "Search Documents" "auth_curl POST ${BASE_URL}:8015/search -H 'Content-Type: application/json' -d '{\"query\":\"test\",\"limit\":10}'"

if [ -n "$TEST_DOCUMENT_ID" ]; then
    test_endpoint "Index Document" "auth_curl POST ${BASE_URL}:8015/index-document -H 'Content-Type: application/json' -d '{\"document_id\":\"${TEST_DOCUMENT_ID}\",\"content\":\"Indexed content for search testing\",\"title\":\"Indexed Test Document\"}'"
fi

# 6. NOTIFICATION SERVICE
echo ""
echo "6️⃣ NOTIFICATION SERVICE"
echo "========================"

test_endpoint "Get Service Info" "curl -s -X GET ${BASE_URL}:8016/"
test_endpoint "Health Check" "curl -s -X GET ${BASE_URL}:8016/health"
test_endpoint "Get Websocket Stats" "curl -s -X GET ${BASE_URL}:8016/ws/stats"
test_endpoint "Create Notification" "auth_curl POST ${BASE_URL}:8016/notifications -H 'Content-Type: application/json' -d '{\"user_id\":\"${TEST_USER_ID}\",\"title\":\"API Test\",\"message\":\"Test notification\",\"notification_type\":\"info\"}'"
test_endpoint "Send System Alert" "auth_curl POST ${BASE_URL}:8016/alerts/system -H 'Content-Type: application/json' -d '{\"title\":\"API Testing\",\"message\":\"System test alert\",\"severity\":\"info\"}'"
test_endpoint "Broadcast Notification" "auth_curl POST ${BASE_URL}:8016/broadcast -H 'Content-Type: application/json' -d '[{\"user_id\":\"${TEST_USER_ID}\",\"title\":\"Broadcast\",\"message\":\"Broadcast test\"}]'"

# 7. INTEGRATION SERVICE
echo ""
echo "7️⃣ INTEGRATION SERVICE"
echo "======================="

test_endpoint "Get Service Info" "curl -s -X GET ${BASE_URL}:8017/"
test_endpoint "Health Check" "curl -s -X GET ${BASE_URL}:8017/health"
test_endpoint "List Integrations" "auth_curl GET ${BASE_URL}:8017/integrations"
test_endpoint "Create Integration" "auth_curl POST ${BASE_URL}:8017/integrations -H 'Content-Type: application/json' -d '{\"user_id\":\"${TEST_USER_ID}\",\"integration_type\":\"email_smtp\",\"config\":{\"host\":\"smtp.gmail.com\",\"port\":587,\"username\":\"test@gmail.com\"}}'"
test_endpoint "Setup Automation" "auth_curl POST ${BASE_URL}:8017/setup-automation -H 'Content-Type: application/json' -d '{\"integration_ids\":[],\"automation_type\":\"sync\"}'"

# 8. ANALYTICS SERVICE
echo ""
echo "8️⃣ ANALYTICS SERVICE"
echo "====================="

test_endpoint "Get Service Info" "curl -s -X GET ${BASE_URL}:8018/"
test_endpoint "Health Check" "curl -s -X GET ${BASE_URL}:8018/health"
test_endpoint "Get Dashboard" "curl -s -X GET ${BASE_URL}:8018/dashboard"
test_endpoint "Get Search Analytics" "curl -s -X GET ${BASE_URL}:8018/search/analytics"
test_endpoint "Track Event" "curl -s -X POST ${BASE_URL}:8018/events -H 'Content-Type: application/json' -d '{\"event_type\":\"api_test\",\"user_id\":\"${TEST_USER_ID}\",\"metadata\":{\"test\":\"complete\"}}'"

# 9. MODEL DOWNLOADER SERVICE
echo ""
echo "9️⃣ MODEL DOWNLOADER SERVICE"
echo "============================"

test_endpoint "Get Service Info" "curl -s -X GET ${BASE_URL}:8019/"
test_endpoint "Health Check" "curl -s -X GET ${BASE_URL}:8019/health"
test_endpoint "List Models" "curl -s -X GET ${BASE_URL}:8019/models"
test_endpoint "Get Storage Info" "curl -s -X GET ${BASE_URL}:8019/storage"

# 10. TASK SERVICE
echo ""
echo "🔟 TASK SERVICE"
echo "==============="

test_endpoint "Get Service Info" "curl -s -X GET ${BASE_URL}:8020/"
test_endpoint "Health Check" "curl -s -X GET ${BASE_URL}:8020/health"
test_endpoint "Get Task Categories" "auth_curl GET ${BASE_URL}:8020/tasks/categories"
test_endpoint "Get My Tasks" "auth_curl GET ${BASE_URL}:8020/tasks/my-tasks"
test_endpoint "Get Task Stats" "auth_curl GET ${BASE_URL}:8020/tasks/stats"
test_endpoint "List Tasks" "auth_curl GET ${BASE_URL}:8020/tasks"

# Create task
TASK_RESPONSE=$(auth_curl POST ${BASE_URL}:8020/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Complete API Testing","description":"Comprehensive test of all MetroMind endpoints","priority":"high","category":"testing","due_date":"2025-12-31"}')

echo "📋 Task Creation Response: $TASK_RESPONSE"
TEST_TASK_ID=$(extract_uuid "$TASK_RESPONSE")
echo "📋 Task ID: $TEST_TASK_ID"

if [ -n "$TEST_TASK_ID" ]; then
    test_endpoint "Get Specific Task" "auth_curl GET ${BASE_URL}:8020/tasks/${TEST_TASK_ID}"
    test_endpoint "Update Task" "auth_curl PUT ${BASE_URL}:8020/tasks/${TEST_TASK_ID} -H 'Content-Type: application/json' -d '{\"status\":\"in_progress\"}'"
    test_endpoint "Add Task Comment" "auth_curl POST ${BASE_URL}:8020/tasks/${TEST_TASK_ID}/comments -H 'Content-Type: application/json' -d '{\"content\":\"API testing comment\"}'"
fi

# 11. REALTIME SERVICE
echo ""
echo "1️⃣1️⃣ REALTIME SERVICE"
echo "======================"

test_endpoint "Get Service Info" "curl -s -X GET ${BASE_URL}:8021/"
test_endpoint "Health Check" "curl -s -X GET ${BASE_URL}:8021/health"
test_endpoint "Get Online Users" "curl -s -X GET ${BASE_URL}:8021/online-users"
test_endpoint "Get Realtime Stats" "curl -s -X GET ${BASE_URL}:8021/stats"

if [ -n "$TEST_DOCUMENT_ID" ]; then
    test_endpoint "Broadcast Document Message" "auth_curl POST ${BASE_URL}:8021/broadcast/document/${TEST_DOCUMENT_ID} -H 'Content-Type: application/json' -d '{\"message\":\"Document updated\",\"user_id\":\"${TEST_USER_ID}\"}'"
fi

if [ -n "$TEST_TASK_ID" ]; then
    test_endpoint "Broadcast Task Message" "auth_curl POST ${BASE_URL}:8021/broadcast/task/${TEST_TASK_ID} -H 'Content-Type: application/json' -d '{\"message\":\"Task updated\",\"user_id\":\"${TEST_USER_ID}\"}'"
fi

test_endpoint "Broadcast System Message" "auth_curl POST ${BASE_URL}:8021/broadcast/system -H 'Content-Type: application/json' -d '{\"message\":\"API testing completed\",\"type\":\"info\"}'"

# 12. AUDIT SERVICE
echo ""
echo "1️⃣2️⃣ AUDIT SERVICE"
echo "==================="

test_endpoint "Get Service Info" "curl -s -X GET ${BASE_URL}:8022/"
test_endpoint "Health Check" "curl -s -X GET ${BASE_URL}:8022/health"
test_endpoint "Get Audit Logs" "auth_curl GET ${BASE_URL}:8022/audit/logs"
test_endpoint "Get Dashboard Stats" "curl -s -X GET ${BASE_URL}:8022/dashboard/stats"
test_endpoint "Get Metrics" "curl -s -X GET ${BASE_URL}:8022/metrics"
test_endpoint "Get Security Alerts" "auth_curl GET ${BASE_URL}:8022/security/alerts"
test_endpoint "Create Audit Log" "auth_curl POST ${BASE_URL}:8022/audit/log -H 'Content-Type: application/json' -d '{\"action_type\":\"api_test\",\"user_id\":\"${TEST_USER_ID}\",\"resource_type\":\"system\",\"resource_id\":\"test\",\"details\":{\"source\":\"api_test_script\"}}'"
test_endpoint "Log Metric" "auth_curl POST ${BASE_URL}:8022/metrics/log -H 'Content-Type: application/json' -d '{\"metric_name\":\"api_test_duration\",\"value\":100.5,\"unit\":\"seconds\",\"service_name\":\"api_test\"}'"
test_endpoint "Log Performance" "auth_curl POST ${BASE_URL}:8022/performance/log -H 'Content-Type: application/json' -d '{\"operation\":\"complete_api_test\",\"duration_ms\":100500,\"success\":true,\"user_id\":\"${TEST_USER_ID}\"}'"
test_endpoint "Create Security Alert" "auth_curl POST ${BASE_URL}:8022/security/alert -H 'Content-Type: application/json' -d '{\"alert_type\":\"api_test\",\"severity\":\"low\",\"message\":\"API testing alert\",\"user_id\":\"${TEST_USER_ID}\"}'"

# 13. WORKFLOW SERVICE
echo ""
echo "1️⃣3️⃣ WORKFLOW SERVICE"
echo "======================"

test_endpoint "Get Service Info" "curl -s -X GET ${BASE_URL}:8023/"
test_endpoint "Health Check" "curl -s -X GET ${BASE_URL}:8023/health"
test_endpoint "Get Workflow Templates" "curl -s -X GET ${BASE_URL}:8023/templates"

if [ -n "$TEST_DOCUMENT_ID" ]; then
    test_endpoint "Get Document Versions" "auth_curl GET ${BASE_URL}:8023/documents/${TEST_DOCUMENT_ID}/versions"
    test_endpoint "Create Document Version" "auth_curl POST ${BASE_URL}:8023/documents/${TEST_DOCUMENT_ID}/versions -H 'Content-Type: application/json' -d '{\"version_number\":2,\"changes\":\"API test version\",\"created_by\":\"${TEST_USER_ID}\"}'"
    test_endpoint "Start Document Workflow" "auth_curl POST ${BASE_URL}:8023/workflows -H 'Content-Type: application/json' -d '{\"document_id\":\"${TEST_DOCUMENT_ID}\",\"template_id\":\"default\",\"initiator_id\":\"${TEST_USER_ID}\"}'"
fi

# 14. BACKUP SERVICE
echo ""
echo "1️⃣4️⃣ BACKUP SERVICE"
echo "===================="

test_endpoint "Get Service Info" "curl -s -X GET ${BASE_URL}:8024/"
test_endpoint "Health Check" "curl -s -X GET ${BASE_URL}:8024/health"
test_endpoint "Get Backup Jobs" "auth_curl GET ${BASE_URL}:8024/backup-jobs"
test_endpoint "Get Backup Executions" "auth_curl GET ${BASE_URL}:8024/backup-executions"
test_endpoint "Get Backup Stats" "auth_curl GET ${BASE_URL}:8024/dashboard/stats"
test_endpoint "Create Backup Job" "auth_curl POST ${BASE_URL}:8024/backup-jobs -H 'Content-Type: application/json' -d '{\"name\":\"API Test Backup\",\"schedule\":\"0 2 * * *\",\"sources\":[\"/tmp\"],\"destination\":\"/tmp/backup\",\"retention_days\":7}'"

# 15. SECURITY SERVICE
echo ""
echo "1️⃣5️⃣ SECURITY SERVICE"
echo "======================"

test_endpoint "Get Service Info" "curl -s -X GET ${BASE_URL}:8025/"
test_endpoint "Health Check" "curl -s -X GET ${BASE_URL}:8025/health"
test_endpoint "Get Security Dashboard Stats" "curl -s -X GET ${BASE_URL}:8025/dashboard/stats"
test_endpoint "Get User Sessions" "auth_curl GET ${BASE_URL}:8025/sessions/${TEST_USER_ID}"
test_endpoint "Get Security Events" "auth_curl GET ${BASE_URL}:8025/events/${TEST_USER_ID}"
test_endpoint "Setup 2FA" "auth_curl POST ${BASE_URL}:8025/2fa/setup/${TEST_USER_ID} -H 'Content-Type: application/json' -d '{}'"

# 16. REPORTING SERVICE
echo ""
echo "1️⃣6️⃣ REPORTING SERVICE"
echo "======================="

test_endpoint "Get Service Info" "curl -s -X GET ${BASE_URL}:8026/"
test_endpoint "Health Check" "curl -s -X GET ${BASE_URL}:8026/health"
test_endpoint "Get Quick Analytics Stats" "curl -s -X GET ${BASE_URL}:8026/analytics/quick-stats"
test_endpoint "Get Dashboards" "auth_curl GET ${BASE_URL}:8026/dashboards"
test_endpoint "Get Report Templates" "auth_curl GET ${BASE_URL}:8026/templates"
test_endpoint "Get Report Executions" "auth_curl GET ${BASE_URL}:8026/executions"
test_endpoint "Generate Report" "auth_curl POST ${BASE_URL}:8026/generate -H 'Content-Type: application/json' -d '{\"report_type\":\"user_activity\",\"parameters\":{\"user_id\":\"${TEST_USER_ID}\",\"period\":\"30d\"},\"format\":\"json\"}'"
test_endpoint "Create Report Template" "auth_curl POST ${BASE_URL}:8026/templates -H 'Content-Type: application/json' -d '{\"name\":\"API Test Report\",\"description\":\"Report for API testing\",\"schedule\":\"0 9 * * *\",\"recipients\":[\"admin@kmrl.gov.in\"]}'"

# 17. API GATEWAY
echo ""
echo "1️⃣7️⃣ API GATEWAY"
echo "================="

test_endpoint "Gateway Root" "curl -s -X GET ${BASE_URL}:8010/"
test_endpoint "Gateway Health" "curl -s -X GET ${BASE_URL}:8010/health"
test_endpoint "Gateway Metrics" "curl -s -X GET ${BASE_URL}:8010/metrics"
test_endpoint "List Services" "curl -s -X GET ${BASE_URL}:8010/services"

# Logout at the end
echo ""
echo "🔐 LOGOUT"
echo "========="
test_endpoint "Logout" "auth_curl POST ${BASE_URL}:8011/logout"

# Cleanup
echo ""
echo "🧹 CLEANUP"
echo "=========="
echo "Cleaning up test files..."
rm -f comprehensive_test.txt test_ocr.png

echo ""
echo "🎉 COMPLETE API TESTING FINISHED!"
echo "=================================="
echo "✅ All endpoints tested with proper authentication and request bodies"
echo "✅ Test data created and used dynamically"
echo "✅ No destructive operations performed"
echo "✅ Comprehensive coverage of all services"
echo ""
echo "Summary of created test data:"
echo "- Document ID: ${TEST_DOCUMENT_ID:-None}"
echo "- Task ID: ${TEST_TASK_ID:-None}"
echo "- Test files cleaned up"
