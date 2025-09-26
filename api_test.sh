#!/bin/bash

# MetroMind API Test Script
# This script tests various API endpoints using curl commands

echo "Testing MetroMind API Endpoints"
echo "================================="

echo "Testing auth_service (port 8011)"
echo "---------------------------------"
curl -X GET http://localhost:8011/admin/pending-users
echo
curl -X POST http://localhost:8011/admin/approve-user -H "Content-Type: application/json" -d '{}'
echo
curl -X POST http://localhost:8011/admin/permissions/initialize -H "Content-Type: application/json" -d '{}'
echo
curl -X POST http://localhost:8011/admin/permissions/update -H "Content-Type: application/json" -d '{}'
echo
curl -X GET http://localhost:8011/admin/users
echo
curl -X POST http://localhost:8011/change-password -H "Content-Type: application/json" -d '{}'
echo
curl -X GET http://localhost:8011/health
echo
curl -X POST http://localhost:8011/login -H "Content-Type: application/json" -d '{"email":"admin@kmrl.gov.in","password":"admin123"}'
echo
curl -X POST http://localhost:8011/logout
echo
curl -X GET http://localhost:8011/profile
echo
curl -X PUT http://localhost:8011/profile -H "Content-Type: application/json" -d '{}'
echo
curl -X POST http://localhost:8011/register -H "Content-Type: application/json" -d '{}'
echo

echo "Testing document_service (port 8012)"
echo "-------------------------------------"
curl -X GET http://localhost:8012/categories
echo
curl -X GET http://localhost:8012/documents
echo
curl -X GET http://localhost:8012/documents/shared
echo
curl -X GET http://localhost:8012/health
echo
curl -X GET http://localhost:8012/priorities
echo
curl -X POST http://localhost:8012/search -H "Content-Type: application/json" -d '{}'
echo
curl -X GET http://localhost:8012/stats
echo
curl -X POST http://localhost:8012/upload -H "Content-Type: multipart/form-data" -F "file=@yourfile.pdf"
echo

echo "Testing ocr_service (port 8013)"
echo "--------------------------------"
curl -X GET http://localhost:8013/capabilities
echo
curl -X POST http://localhost:8013/extract-text -H "Content-Type: application/json" -d '{}'
echo
curl -X GET http://localhost:8013/health
echo
curl -X GET http://localhost:8013/languages
echo
curl -X POST http://localhost:8013/process-document -H "Content-Type: application/json" -d '{}'
echo

echo "Testing ai_ml_service (port 8014)"
echo "----------------------------------"
curl -X POST http://localhost:8014/analyze-document -H "Content-Type: application/json" -d '{}'
echo
curl -X POST http://localhost:8014/analyze-text -H "Content-Type: application/json" -d '{}'
echo
curl -X POST http://localhost:8014/generate-embeddings -H "Content-Type: application/json" -d '{}'
echo
curl -X GET http://localhost:8014/health
echo
curl -X GET http://localhost:8014/models
echo

echo "Testing search_service (port 8015)"
echo "-----------------------------------"
curl -X GET http://localhost:8015/
echo
curl -X GET http://localhost:8015/health
echo
curl -X POST http://localhost:8015/index-document -H "Content-Type: application/json" -d '{}'
echo
curl -X GET http://localhost:8015/index/stats
echo
curl -X POST http://localhost:8015/search -H "Content-Type: application/json" -d '{}'
echo

echo "Testing notification_service (port 8016)"
echo "-----------------------------------------"
curl -X POST http://localhost:8016/alerts/system -H "Content-Type: application/json" -d '{}'
echo
curl -X POST http://localhost:8016/broadcast -H "Content-Type: application/json" -d '{}'
echo
curl -X GET http://localhost:8016/health
echo
curl -X POST http://localhost:8016/notifications -H "Content-Type: application/json" -d '{}'
echo

echo "Testing integration_service (port 8017)"
echo "----------------------------------------"
curl -X GET http://localhost:8017/
echo
curl -X GET http://localhost:8017/health
echo
curl -X GET http://localhost:8017/integrations
echo
curl -X POST http://localhost:8017/integrations -H "Content-Type: application/json" -d '{}'
echo
curl -X GET http://localhost:8017/integrations/google-drive/auth-url
echo
curl -X POST http://localhost:8017/integrations/google-drive/exchange-code -H "Content-Type: application/json" -d '{}'
echo
curl -X POST http://localhost:8017/setup-automation -H "Content-Type: application/json" -d '{}'
echo
curl -X GET http://localhost:8017/webhooks/whatsapp
echo
curl -X POST http://localhost:8017/webhooks/whatsapp -H "Content-Type: application/json" -d '{}'
echo

echo "Testing analytics_service (port 8018)"
echo "--------------------------------------"
curl -X GET http://localhost:8018/
echo
curl -X GET http://localhost:8018/dashboard
echo
curl -X GET http://localhost:8018/health
echo
curl -X GET http://localhost:8018/search/analytics
echo

echo "Testing model_downloader (port 8019)"
echo "-------------------------------------"
curl -X GET http://localhost:8019/
echo
curl -X POST http://localhost:8019/cleanup
echo
curl -X GET http://localhost:8019/health
echo
curl -X GET http://localhost:8019/models
echo
curl -X POST http://localhost:8019/models/download-all -H "Content-Type: application/json" -d '{}'
echo
curl -X GET http://localhost:8019/storage
echo

echo "Testing task_service (port 8020)"
echo "---------------------------------"
curl -X GET http://localhost:8020/
echo
curl -X GET http://localhost:8020/health
echo
curl -X GET http://localhost:8020/tasks
echo
curl -X POST http://localhost:8020/tasks -H "Content-Type: application/json" -d '{}'
echo
curl -X GET http://localhost:8020/tasks/categories
echo
curl -X GET http://localhost:8020/tasks/my-tasks
echo
curl -X GET http://localhost:8020/tasks/stats
echo

echo "Testing realtime_service (port 8021)"
echo "-------------------------------------"
curl -X GET http://localhost:8021/
echo
curl -X POST http://localhost:8021/broadcast/system -H "Content-Type: application/json" -d '{}'
echo
curl -X GET http://localhost:8021/health
echo
curl -X GET http://localhost:8021/online-users
echo
curl -X GET http://localhost:8021/stats
echo

echo "Testing audit_service (port 8022)"
echo "----------------------------------"
curl -X GET http://localhost:8022/
echo
curl -X POST http://localhost:8022/audit/log -H "Content-Type: application/json" -d '{}'
echo
curl -X GET http://localhost:8022/audit/logs
echo
curl -X GET http://localhost:8022/dashboard/stats
echo
curl -X GET http://localhost:8022/health
echo
curl -X GET http://localhost:8022/metrics
echo
curl -X POST http://localhost:8022/metrics/log -H "Content-Type: application/json" -d '{}'
echo
curl -X POST http://localhost:8022/performance/log -H "Content-Type: application/json" -d '{}'
echo
curl -X POST http://localhost:8022/security/alert -H "Content-Type: application/json" -d '{}'
echo
curl -X GET http://localhost:8022/security/alerts
echo

echo "Testing workflow_service (port 8023)"
echo "-------------------------------------"
curl -X GET http://localhost:8023/
echo
curl -X GET http://localhost:8023/health
echo
curl -X GET http://localhost:8023/templates
echo
curl -X POST http://localhost:8023/templates -H "Content-Type: application/json" -d '{}'
echo

echo "Testing backup_service (port 8024)"
echo "-----------------------------------"
curl -X GET http://localhost:8024/
echo
curl -X GET http://localhost:8024/backup-executions
echo
curl -X GET http://localhost:8024/backup-jobs
echo
curl -X POST http://localhost:8024/backup-jobs -H "Content-Type: application/json" -d '{}'
echo
curl -X GET http://localhost:8024/dashboard/stats
echo
curl -X GET http://localhost:8024/health
echo
curl -X POST http://localhost:8024/recovery-jobs -H "Content-Type: application/json" -d '{}'
echo

echo "Testing security_service (port 8025)"
echo "-------------------------------------"
curl -X GET http://localhost:8025/
echo
curl -X GET http://localhost:8025/dashboard/stats
echo
curl -X GET http://localhost:8025/health
echo

echo "Testing reporting_service (port 8026)"
echo "--------------------------------------"
curl -X GET http://localhost:8026/
echo
curl -X GET http://localhost:8026/analytics/quick-stats
echo
curl -X GET http://localhost:8026/dashboards
echo
curl -X POST http://localhost:8026/dashboards -H "Content-Type: application/json" -d '{}'
echo
curl -X GET http://localhost:8026/executions
echo
curl -X POST http://localhost:8026/generate -H "Content-Type: application/json" -d '{}'
echo
curl -X GET http://localhost:8026/health
echo
curl -X GET http://localhost:8026/templates
echo
curl -X POST http://localhost:8026/templates -H "Content-Type: application/json" -d '{}'
echo

echo "API testing completed."
