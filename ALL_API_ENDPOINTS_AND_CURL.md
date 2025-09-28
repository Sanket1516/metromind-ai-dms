# MetroMind API Endpoints and Example curl Commands

---

## Service: MetroMind API Gateway (Port 8010)

### `/` (GET)
**Description:** API Gateway root endpoint

```sh
curl -X GET "http://localhost:8010/" -H "accept: application/json"
```

### `/health` (GET)
**Description:** Gateway health check

```sh
curl -X GET "http://localhost:8010/health" -H "accept: application/json"
```

### `/services` (GET)
**Description:** List all available services

```sh
curl -X GET "http://localhost:8010/services" -H "accept: application/json"
```

### `/{path}` (GET, POST, PUT, PATCH, DELETE)
**Description:** Catch-all route to proxy requests to appropriate services

Replace `{path}` with the actual path you want to proxy.

```sh
curl -X GET "http://localhost:8010/some/path" -H "accept: application/json"
curl -X POST "http://localhost:8010/some/path" -H "accept: application/json" -d '{ }'
curl -X PUT "http://localhost:8010/some/path" -H "accept: application/json" -d '{ }'
curl -X PATCH "http://localhost:8010/some/path" -H "accept: application/json" -d '{ }'
curl -X DELETE "http://localhost:8010/some/path" -H "accept: application/json"
```

### `/metrics` (GET)
**Description:** Prometheus-style metrics

```sh
curl -X GET "http://localhost:8010/metrics" -H "accept: application/json"
```

---

## Service: MetroMind Authentication Service (Port 8011)

### `/register` (POST)
**Description:** Register new user - requires admin approval

```sh
curl -X POST "http://localhost:8011/register" -H "accept: application/json" -H "Content-Type: application/json" -d '{
  "username": "testuser",
  "email": "testuser@example.com",
  "password": "password123",
  "first_name": "Test",
  "last_name": "User",
  "department": "IT",
  "phone": "1234567890"
}'
```

### `/login` (POST)
**Description:** User login

```sh
curl -X POST "http://localhost:8011/login" -H "accept: application/json" -H "Content-Type: application/json" -d '{
  "email": "testuser@example.com",
  "password": "password123",
  "remember_me": false
}'
```

### `/admin/permissions/initialize` (POST)
**Description:** Initialize default role permissions

```sh
curl -X POST "http://localhost:8011/admin/permissions/initialize" -H "accept: application/json" -H "Authorization: Bearer <TOKEN>"
```

### `/admin/permissions/{role}` (GET)
**Description:** Get permissions for a specific role

Replace `{role}` with one of: admin, manager, supervisor, employee, auditor, station_controller, finance_manager, maintenance_head

```sh
curl -X GET "http://localhost:8011/admin/permissions/admin" -H "accept: application/json" -H "Authorization: Bearer <TOKEN>"
```

### `/admin/permissions/update` (POST)
**Description:** Update permissions for a role

```sh
curl -X POST "http://localhost:8011/admin/permissions/update" -H "accept: application/json" -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d '{
  "role": "employee",
  "permissions": ["read_document", "update_document"]
}'
```

### `/logout` (POST)
**Description:** User logout

```sh
curl -X POST "http://localhost:8011/logout" -H "accept: application/json" -H "Authorization: Bearer <TOKEN>"
```

### `/profile` (GET, PUT)
**Description:** Get or update user profile

```sh
curl -X GET "http://localhost:8011/profile" -H "accept: application/json" -H "Authorization: Bearer <TOKEN>"
curl -X PUT "http://localhost:8011/profile" -H "accept: application/json" -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d '{
  "first_name": "Test",
  "last_name": "User",
  "department": "IT",
  "phone": "1234567890"
}'
```

### `/change-password` (POST)
**Description:** Change user password

```sh
curl -X POST "http://localhost:8011/change-password" -H "accept: application/json" -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d '{
  "current_password": "oldpass",
  "new_password": "newpass"
}'
```

### `/admin/pending-users` (GET)
**Description:** Get users pending approval

```sh
curl -X GET "http://localhost:8011/admin/pending-users" -H "accept: application/json" -H "Authorization: Bearer <TOKEN>"
```

### `/admin/approve-user` (POST)
**Description:** Approve or reject user registration

```sh
curl -X POST "http://localhost:8011/admin/approve-user" -H "accept: application/json" -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d '{
  "user_id": "user_id_here",
  "approved": true,
  "role": "employee",
  "notes": "Approved by admin"
}'
```

### `/admin/users` (GET)
**Description:** Get all users with filtering

```sh
curl -X GET "http://localhost:8011/admin/users?skip=0&limit=100" -H "accept: application/json" -H "Authorization: Bearer <TOKEN>"
```

### `/health` (GET)
**Description:** Health check endpoint

```sh
curl -X GET "http://localhost:8011/health" -H "accept: application/json"
```

---

## Service: MetroMind Document Service (Port 8012)

### `/upload` (POST)
**Description:** Upload and process document

```sh
curl -X POST "http://localhost:8012/upload" -H "accept: application/json" -H "Authorization: Bearer <TOKEN>" -F "file=@/path/to/file.pdf" -F "title=Sample Document" -F "description=Test upload" -F "category=safety" -F "priority=1" -F "tags=important,confidential"
```

### `/documents` (GET)
**Description:** List documents with optional filtering

```sh
curl -X GET "http://localhost:8012/documents?skip=0&limit=100&category=safety&status=processed&search=manual" -H "accept: application/json" -H "Authorization: Bearer <TOKEN>"
```

### `/documents/shared` (GET)
**Description:** List documents shared by and with the current user

```sh
curl -X GET "http://localhost:8012/documents/shared" -H "accept: application/json" -H "Authorization: Bearer <TOKEN>"
```

### `/documents/{document_id}` (GET, PUT, DELETE)
**Description:** Get, update, or delete a document by ID

Replace `{document_id}` with the actual document ID.

```sh
curl -X GET "http://localhost:8012/documents/123" -H "accept: application/json" -H "Authorization: Bearer <TOKEN>"
curl -X PUT "http://localhost:8012/documents/123" -H "accept: application/json" -H "Authorization: Bearer <TOKEN>" -F "document_update={\"title\":\"Updated Title\",\"description\":\"Updated desc\",\"category\":\"safety\",\"priority\":1,\"tags\":[\"tag1\",\"tag2\"]}" -F "new_file=@/path/to/newfile.pdf" -F "changes_description=Updated file"
curl -X DELETE "http://localhost:8012/documents/123" -H "accept: application/json" -H "Authorization: Bearer <TOKEN>"
```

### `/documents/{document_id}/download` (GET)
**Description:** Download document file

```sh
curl -X GET "http://localhost:8012/documents/123/download" -H "accept: application/json" -H "Authorization: Bearer <TOKEN>" -o downloaded_file.pdf
```

### `/documents/{document_id}/versions` (GET)
**Description:** Get list of document versions

```sh
curl -X GET "http://localhost:8012/documents/123/versions" -H "accept: application/json" -H "Authorization: Bearer <TOKEN>"
```

### `/documents/{document_id}/versions/{version_number}/download` (GET)
**Description:** Download specific version of a document

Replace `{version_number}` with the version number.

```sh
curl -X GET "http://localhost:8012/documents/123/versions/2/download" -H "accept: application/json" -H "Authorization: Bearer <TOKEN>" -o downloaded_file_v2.pdf
```

### `/documents/{document_id}/share` (POST)
**Description:** Share a document with a user or department

```sh
curl -X POST "http://localhost:8012/documents/123/share" -H "accept: application/json" -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d '{
  "shared_with_user": "user_id",
  "shared_with_department": "IT",
  "can_edit": true,
  "expires_at": "2025-12-31T23:59:59"
}'
```

### `/documents/{document_id}/share/{share_id}` (DELETE)
**Description:** Remove document share

```sh
curl -X DELETE "http://localhost:8012/documents/123/share/456" -H "accept: application/json" -H "Authorization: Bearer <TOKEN>"
```

### `/search` (POST)
**Description:** Search documents with sharing filters

```sh
curl -X POST "http://localhost:8012/search" -H "accept: application/json" -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d '{
  "query": "manual",
  "category": "safety",
  "priority": 1,
  "status": "processed",
  "uploaded_by": "user_id",
  "date_from": "2025-01-01T00:00:00",
  "date_to": "2025-12-31T23:59:59",
  "limit": 10,
  "offset": 0,
  "include_shared": true,
  "shared_by_me": false,
  "shared_with_me": true,
  "shared_with_department": false
}'
```

### `/categories` (GET)
**Description:** Get available document categories

```sh
curl -X GET "http://localhost:8012/categories" -H "accept: application/json"
```

### `/priorities` (GET)
**Description:** Get available document priorities

```sh
curl -X GET "http://localhost:8012/priorities" -H "accept: application/json"
```

### `/stats` (GET)
**Description:** Get document statistics

```sh
curl -X GET "http://localhost:8012/stats" -H "accept: application/json" -H "Authorization: Bearer <TOKEN>"
```

### `/health` (GET)
**Description:** Health check endpoint

```sh
curl -X GET "http://localhost:8012/health" -H "accept: application/json"
```

---

## Service: MetroMind OCR Service (Port 8013)

### `/extract-text` (POST)
**Description:** Extract text from uploaded image

```sh
curl -X POST "http://localhost:8013/extract-text" -H "accept: application/json" -F "file=@/path/to/image.png" -F "languages=en,ml" -F "preprocess=true" -F "confidence_threshold=0.5" -F "output_format=text" -F "method=hybrid"
```

### `/process-document` (POST)
**Description:** Process OCR for a specific document in the database

```sh
curl -X POST "http://localhost:8013/process-document" -H "accept: application/json" -H "Content-Type: application/json" -d '{
  "document_id": "doc_id_here",
  "languages": ["en", "ml"],
  "preprocess": true,
  "pages": [1,2,3]
}'
```

### `/languages` (GET)
**Description:** Get list of supported languages

```sh
curl -X GET "http://localhost:8013/languages" -H "accept: application/json"
```

### `/capabilities` (GET)
**Description:** Get OCR service capabilities

```sh
curl -X GET "http://localhost:8013/capabilities" -H "accept: application/json"
```

### `/health` (GET)
**Description:** Health check endpoint

```sh
curl -X GET "http://localhost:8013/health" -H "accept: application/json"
```

---

## Service: MetroMind AI/ML Service (Port 8014)

### `/analyze-document` (POST)
**Description:** Analyze a document from the database

```sh
curl -X POST "http://localhost:8014/analyze-document" -H "accept: application/json" -H "Content-Type: application/json" -d '{
  "document_id": "doc_id_here",
  "text": "Optional text override",
  "analyze_sentiment": true,
  "extract_entities": true,
  "generate_summary": true,
  "detect_language": true,
  "classify_category": true,
  "determine_priority": true
}'
```

### `/analyze-text` (POST)
**Description:** Analyze arbitrary text

```sh
curl -X POST "http://localhost:8014/analyze-text" -H "accept: application/json" -H "Content-Type: application/json" -d '{
  "text": "This is a sample text for analysis.",
  "analyze_sentiment": true,
  "extract_entities": true,
  "generate_summary": true,
  "detect_language": true,
  "classify_category": true,
  "determine_priority": true
}'
```

### `/generate-embeddings` (POST)
**Description:** Generate text embeddings

```sh
curl -X POST "http://localhost:8014/generate-embeddings" -H "accept: application/json" -H "Content-Type: application/json" -d '{
  "text": "Text to embed",
  "model_name": "all-MiniLM-L6-v2"
}'
```

### `/models` (GET)
**Description:** Get list of available AI/ML models

```sh
curl -X GET "http://localhost:8014/models" -H "accept: application/json"
```

### `/health` (GET)
**Description:** Health check endpoint

```sh
curl -X GET "http://localhost:8014/health" -H "accept: application/json"
```

---

## Service: MetroMind Vector Search Service (Port 8015)

### `/search` (POST)
**Description:** Search documents using vector similarity

```sh
curl -X POST "http://localhost:8015/search" -H "accept: application/json" -H "Content-Type: application/json" -d '{
  "query": "search text",
  "user_id": 123,
  "limit": 10,
  "threshold": 0.7,
  "filters": {},
  "search_type": "semantic"
}'
```

### `/index-document` (POST)
**Description:** Add document to search index

```sh
curl -X POST "http://localhost:8015/index-document" -H "accept: application/json" -H "Content-Type: application/json" -d '{
  "document_id": "doc_id_here",
  "force_reindex": false
}'
```

### `/index/{document_id}` (DELETE)
**Description:** Remove document from search index

Replace `{document_id}` with the actual document ID.

```sh
curl -X DELETE "http://localhost:8015/index/123" -H "accept: application/json"
```

### `/index/stats` (GET)
**Description:** Get search index statistics

```sh
curl -X GET "http://localhost:8015/index/stats" -H "accept: application/json"
```

### `/reindex` (POST)
**Description:** Reindex all documents

```sh
curl -X POST "http://localhost:8015/reindex" -H "accept: application/json"
```

### `/` (GET)
**Description:** Service root endpoint

```sh
curl -X GET "http://localhost:8015/" -H "accept: application/json"
```

### `/health` (GET)
**Description:** Service health check

```sh
curl -X GET "http://localhost:8015/health" -H "accept: application/json"
```

---

## Service: MetroMind Notification Service (Port 8016)

### `/notifications` (POST)
**Description:** Create and send a notification

```sh
curl -X POST "http://localhost:8016/notifications" -H "accept: application/json" -H "Content-Type: application/json" -d '{
  "user_id": "user_id_here",
  "title": "Notification Title",
  "message": "Notification message body",
  "notification_type": "system_alert",
  "priority": "medium",
  "channels": ["in_app"],
  "metadata": {},
  "scheduled_time": null,
  "expires_at": null
}'
```

### `/notifications/{user_id}` (GET)
**Description:** Get notifications for a user

Replace `{user_id}` with the actual user ID.

```sh
curl -X GET "http://localhost:8016/notifications/user123?limit=50&offset=0&unread_only=false" -H "accept: application/json"
```

### `/notifications/{notification_id}/read` (PUT)
**Description:** Mark notification as read

Replace `{notification_id}` with the actual notification ID.

```sh
curl -X PUT "http://localhost:8016/notifications/456/read" -H "accept: application/json"
```

### `/notifications/{user_id}/read-all` (PUT)
**Description:** Mark all notifications as read for a user

Replace `{user_id}` with the actual user ID.

```sh
curl -X PUT "http://localhost:8016/notifications/user123/read-all" -H "accept: application/json"
```

### `/broadcast` (POST)
**Description:** Broadcast notification to all connected users

```sh
curl -X POST "http://localhost:8016/broadcast?title=System+Alert&message=This+is+a+test+alert&notification_type=system_alert&priority=high" -H "accept: application/json" -H "Content-Type: application/json" -d '["websocket"]'
```

### `/ws/stats` (GET)
**Description:** Get WebSocket connection statistics

```sh
curl -X GET "http://localhost:8016/ws/stats" -H "accept: application/json"
```

### `/alerts/system` (POST)
**Description:** Send system alert to specific user roles

```sh
curl -X POST "http://localhost:8016/alerts/system?title=System+Alert&message=This+is+a+test+alert&priority=high" -H "accept: application/json" -H "Content-Type: application/json" -d '["admin"]'
```

### `/` (GET)
**Description:** Service root endpoint

```sh
curl -X GET "http://localhost:8016/" -H "accept: application/json"
```

### `/health` (GET)
**Description:** Service health check

```sh
curl -X GET "http://localhost:8016/health" -H "accept: application/json"
```

---

## Service: MetroMind Integration Service (Port 8017)

### `/integrations/google-drive/auth-url` (GET)
**Description:** Get Google Drive OAuth2 authorization URL

```sh
curl -X GET "http://localhost:8017/integrations/google-drive/auth-url" -H "accept: application/json"
```

### `/integrations/google-drive/exchange-code` (POST)
**Description:** Exchange authorization code for tokens

```sh
curl -X POST "http://localhost:8017/integrations/google-drive/exchange-code" -H "accept: application/json" -H "Content-Type: application/json" -d '{
  "code": "auth_code_here"
}'
```

### `/setup-automation` (POST)
**Description:** Set up default automation integrations

```sh
curl -X POST "http://localhost:8017/setup-automation" -H "accept: application/json" -H "Content-Type: application/json" -d '{
  "email_config": {},
  "whatsapp_config": {}
}'
```

### `/integrations` (POST, GET)
**Description:** Create or list integrations

```sh
curl -X POST "http://localhost:8017/integrations" -H "accept: application/json" -H "Content-Type: application/json" -d '{
  "user_id": "user_id_here",
  "integration_type": "google_drive",
  "config": {},
  "is_global": false
}'
curl -X GET "http://localhost:8017/integrations?user_id=user_id_here&integration_type=google_drive&status=active" -H "accept: application/json"
```

### `/integrations/{integration_id}` (GET, PUT, DELETE)
**Description:** Get, update, or delete a specific integration

Replace `{integration_id}` with the actual integration ID.

```sh
curl -X GET "http://localhost:8017/integrations/123" -H "accept: application/json"
curl -X PUT "http://localhost:8017/integrations/123" -H "accept: application/json" -H "Content-Type: application/json" -d '{
  "config": {}
}'
curl -X DELETE "http://localhost:8017/integrations/123" -H "accept: application/json"
```

### `/integrations/{integration_id}/test` (POST)
**Description:** Test an integration connection

```sh
curl -X POST "http://localhost:8017/integrations/123/test" -H "accept: application/json"
```

### `/integrations/{integration_id}/sync` (POST)
**Description:** Trigger integration synchronization

```sh
curl -X POST "http://localhost:8017/integrations/123/sync" -H "accept: application/json" -H "Content-Type: application/json" -d '{
  "integration_id": 123,
  "force_full_sync": false
}'
```

### `/webhooks/whatsapp` (POST, GET)
**Description:** Handle WhatsApp webhook events or verify webhook

```sh
curl -X POST "http://localhost:8017/webhooks/whatsapp" -H "accept: application/json" -H "Content-Type: application/json" -d '{ }'
curl -X GET "http://localhost:8017/webhooks/whatsapp?hub_mode=subscribe&hub_verify_token=token&hub_challenge=challenge" -H "accept: application/json"
```

### `/` (GET)
**Description:** Service root endpoint

```sh
curl -X GET "http://localhost:8017/" -H "accept: application/json"
```

### `/health` (GET)
**Description:** Service health check

```sh
curl -X GET "http://localhost:8017/health" -H "accept: application/json"
```

---

## Service: MetroMind Analytics Service (Port 8018)

### `/dashboard` (GET)
**Description:** Get comprehensive dashboard data

```sh
curl -X GET "http://localhost:8018/dashboard?date_range=30&user_id=user_id_here&include_charts=true" -H "accept: application/json"
```

### `/metrics/{metric_type}` (GET)
**Description:** Get specific metric data

Replace `{metric_type}` with one of: document_upload, document_view, document_download, search_query, user_login, user_registration, ai_analysis, integration_sync, notification_sent, system_error

```sh
curl -X GET "http://localhost:8018/metrics/document_upload?start_date=2025-01-01T00:00:00&end_date=2025-12-31T23:59:59&user_id=user_id_here&group_by=day" -H "accept: application/json"
```

### `/reports/{report_type}` (GET)
**Description:** Generate comprehensive reports

Replace `{report_type}` with one of: daily, weekly, monthly, quarterly, yearly, custom

```sh
curl -X GET "http://localhost:8018/reports/daily?format=json&start_date=2025-01-01T00:00:00&end_date=2025-12-31T23:59:59&include_charts=true" -H "accept: application/json"
```

### `/events` (POST)
**Description:** Track custom analytics event

```sh
curl -X POST "http://localhost:8018/events?user_id=user_id_here&event_type=login" -H "accept: application/json" -H "Content-Type: application/json" -d '{ }'
```

### `/users/{user_id}/activity` (GET)
**Description:** Get detailed user activity

Replace `{user_id}` with the actual user ID.

```sh
curl -X GET "http://localhost:8018/users/user123/activity?days=30" -H "accept: application/json"
```

### `/search/analytics` (GET)
**Description:** Get search analytics and insights

```sh
curl -X GET "http://localhost:8018/search/analytics?days=30" -H "accept: application/json"
```

### `/` (GET)
**Description:** Service root endpoint

```sh
curl -X GET "http://localhost:8018/" -H "accept: application/json"
```

### `/health` (GET)
**Description:** Service health check

```sh
curl -X GET "http://localhost:8018/health" -H "accept: application/json"
```

---

## Service: MetroMind Model Downloader (Port 8019)

### `/models` (GET)
**Description:** List all models and their status

```sh
curl -X GET "http://localhost:8019/models" -H "accept: application/json"
```

### `/models/{model_name}` (GET, DELETE)
**Description:** Get information about or remove a specific model

Replace `{model_name}` with the actual model name.

```sh
curl -X GET "http://localhost:8019/models/bert-base-uncased" -H "accept: application/json"
curl -X DELETE "http://localhost:8019/models/bert-base-uncased" -H "accept: application/json"
```

### `/models/{model_name}/download` (POST)
**Description:** Download a specific model

```sh
curl -X POST "http://localhost:8019/models/bert-base-uncased/download?force_download=false" -H "accept: application/json"
```

### `/models/{model_name}/download-status` (GET)
**Description:** Get download status for a model

```sh
curl -X GET "http://localhost:8019/models/bert-base-uncased/download-status" -H "accept: application/json"
```

### `/models/download-all` (POST)
**Description:** Download all configured models

```sh
curl -X POST "http://localhost:8019/models/download-all" -H "accept: application/json"
```

### `/models/{model_name}/use` (POST)
**Description:** Get model path for use, downloading if necessary

```sh
curl -X POST "http://localhost:8019/models/bert-base-uncased/use" -H "accept: application/json"
```

### `/storage` (GET)
**Description:** Get storage information

```sh
curl -X GET "http://localhost:8019/storage" -H "accept: application/json"
```

### `/cleanup` (POST)
**Description:** Manually trigger model cleanup

```sh
curl -X POST "http://localhost:8019/cleanup" -H "accept: application/json"
```

### `/` (GET)
**Description:** Service root endpoint

```sh
curl -X GET "http://localhost:8019/" -H "accept: application/json"
```

### `/health` (GET)
**Description:** Service health check

```sh
curl -X GET "http://localhost:8019/health" -H "accept: application/json"
```

---

## Service: MetroMind Task Management Service (Port 8020)

### `/tasks` (POST, GET)
**Description:** Create a new task or list tasks

```sh
curl -X POST "http://localhost:8020/tasks" -H "accept: application/json" -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d '{
  "title": "Complete API Testing",
  "description": "Comprehensive test of all MetroMind endpoints",
  "assigned_to": "user_id",
  "priority": 1,
  "status": "pending",
  "category": "testing",
  "task_type": "todo",
  "tags": ["api", "test"],
  "due_date": "2025-12-31T00:00:00",
  "estimated_hours": 2.5,
  "task_metadata": {},
  "attachments": []
}'
curl -X GET "http://localhost:8020/tasks?skip=0&limit=100&status=pending&priority=1&assigned_to=user_id&category=testing" -H "accept: application/json" -H "Authorization: Bearer <TOKEN>"
```

### `/tasks/categories` (GET)
**Description:** Get all task categories

```sh
curl -X GET "http://localhost:8020/tasks/categories" -H "accept: application/json" -H "Authorization: Bearer <TOKEN>"
```

### `/tasks/{task_id}` (GET, PUT, DELETE)
**Description:** Get, update, or delete a task by ID

Replace `{task_id}` with the actual task ID.

```sh
curl -X GET "http://localhost:8020/tasks/123" -H "accept: application/json" -H "Authorization: Bearer <TOKEN>"
curl -X PUT "http://localhost:8020/tasks/123" -H "accept: application/json" -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d '{
  "title": "Updated Title",
  "description": "Updated description",
  "priority": 2,
  "status": "in_progress",
  "category": "testing",
  "tags": ["api", "update"],
  "due_date": "2025-12-31T00:00:00",
  "estimated_hours": 3.0,
  "actual_hours": 1.5,
  "progress_percentage": 50,
  "task_metadata": {},
  "attachments": []
}'
curl -X DELETE "http://localhost:8020/tasks/123" -H "accept: application/json" -H "Authorization: Bearer <TOKEN>"
```

### `/tasks/{task_id}/comments` (POST)
**Description:** Add comment to task

```sh
curl -X POST "http://localhost:8020/tasks/123/comments" -H "accept: application/json" -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d '{
  "comment": "This is a comment.",
  "attachments": []
}'
```

### `/tasks/stats` (GET)
**Description:** Get task statistics

```sh
curl -X GET "http://localhost:8020/tasks/stats?user_id=user_id" -H "accept: application/json" -H "Authorization: Bearer <TOKEN>"
```

### `/tasks/my-tasks` (GET)
**Description:** Get tasks assigned to current user

```sh
curl -X GET "http://localhost:8020/tasks/my-tasks?status=pending&limit=50" -H "accept: application/json" -H "Authorization: Bearer <TOKEN>"
```

### `/health` (GET)
**Description:** Service health check

```sh
curl -X GET "http://localhost:8020/health" -H "accept: application/json"
```

### `/` (GET)
**Description:** Service root endpoint

```sh
curl -X GET "http://localhost:8020/" -H "accept: application/json"
```

---

## Service: MetroMind Real-time Communication Service (Port 8021)

### `/online-users` (GET)
**Description:** Get list of currently online users

```sh
curl -X GET "http://localhost:8021/online-users" -H "accept: application/json"
```

### `/room/{room_id}/users` (GET)
**Description:** Get users in a specific room

Replace `{room_id}` with the actual room ID.

```sh
curl -X GET "http://localhost:8021/room/room123/users" -H "accept: application/json"
```

### `/broadcast/system` (POST)
**Description:** Broadcast system message

```sh
curl -X POST "http://localhost:8021/broadcast/system?event_type=system_alert" -H "accept: application/json" -H "Content-Type: application/json" -d '{
  "data": {"message": "System maintenance at midnight"},
  "target_users": ["user1", "user2"]
}'
```

### `/broadcast/document/{document_id}` (POST)
**Description:** Broadcast document-related message

Replace `{document_id}` with the actual document ID.

```sh
curl -X POST "http://localhost:8021/broadcast/document/doc123?event_type=document_uploaded&user_id=user1" -H "accept: application/json" -H "Content-Type: application/json" -d '{ }'
```

### `/broadcast/task/{task_id}` (POST)
**Description:** Broadcast task-related message

Replace `{task_id}` with the actual task ID.

```sh
curl -X POST "http://localhost:8021/broadcast/task/123?event_type=task_created&user_id=user1" -H "accept: application/json" -H "Content-Type: application/json" -d '{ }'
```

### `/stats` (GET)
**Description:** Get real-time service statistics

```sh
curl -X GET "http://localhost:8021/stats" -H "accept: application/json"
```

### `/health` (GET)
**Description:** Service health check

```sh
curl -X GET "http://localhost:8021/health" -H "accept: application/json"
```

### `/` (GET)
**Description:** Service root endpoint

```sh
curl -X GET "http://localhost:8021/" -H "accept: application/json"
```

---

## Service: MetroMind Audit & Monitoring Service (Port 8022)

### `/audit/log` (POST)
**Description:** Create a new audit log entry

```sh
curl -X POST "http://localhost:8022/audit/log" -H "accept: application/json" -H "Content-Type: application/json" -d '{
  "user_id": "user_id",
  "username": "testuser",
  "action_type": "login_success",
  "resource_type": "system",
  "resource_id": "test",
  "details": {"source": "api_test_script"},
  "ip_address": "127.0.0.1",
  "user_agent": "curl/7.68.0",
  "session_id": "sess123",
  "success": true,
  "error_message": null
}'
```

### `/audit/logs` (GET)
**Description:** Get audit logs with filtering

```sh
curl -X GET "http://localhost:8022/audit/logs?start_date=2025-01-01T00:00:00&end_date=2025-12-31T23:59:59&user_id=user_id&action_type=login_success&resource_type=system&success=true&limit=100&offset=0" -H "accept: application/json"
```

### `/security/alert` (POST)
**Description:** Create a new security alert

```sh
curl -X POST "http://localhost:8022/security/alert" -H "accept: application/json" -H "Content-Type: application/json" -d '{
  "severity": "high",
  "alert_type": "unauthorized_access",
  "title": "Unauthorized Access Attempt",
  "description": "Failed login detected",
  "user_id": "user_id",
  "ip_address": "127.0.0.1",
  "metadata": {}
}'
```

### `/security/alerts` (GET)
**Description:** Get security alerts with filtering

```sh
curl -X GET "http://localhost:8022/security/alerts?severity=high&resolved=false&limit=100&offset=0" -H "accept: application/json"
```

### `/security/alerts/{alert_id}/resolve` (PUT)
**Description:** Resolve a security alert

Replace `{alert_id}` with the actual alert ID.

```sh
curl -X PUT "http://localhost:8022/security/alerts/alert123/resolve?resolved_by=admin" -H "accept: application/json"
```

### `/metrics/log` (POST)
**Description:** Log a system metric

```sh
curl -X POST "http://localhost:8022/metrics/log" -H "accept: application/json" -H "Content-Type: application/json" -d '{
  "metric_type": "cpu_usage",
  "metric_name": "CPU Usage",
  "value": 75.5,
  "unit": "%",
  "service_name": "task_service",
  "metadata": {}
}'
```

### `/metrics` (GET)
**Description:** Get system metrics with filtering

```sh
curl -X GET "http://localhost:8022/metrics?metric_type=cpu_usage&service_name=task_service&start_date=2025-01-01T00:00:00&end_date=2025-12-31T23:59:59&limit=1000" -H "accept: application/json"
```

### `/performance/log` (POST)
**Description:** Log performance data

```sh
curl -X POST "http://localhost:8022/performance/log" -H "accept: application/json" -H "Content-Type: application/json" -d '{
  "service_name": "task_service",
  "endpoint": "/tasks",
  "method": "POST",
  "response_time": 120.5,
  "status_code": 200,
  "user_id": "user_id",
  "request_size": 512,
  "response_size": 1024,
  "metadata": {}
}'
```

### `/dashboard/stats` (GET)
**Description:** Get dashboard statistics

```sh
curl -X GET "http://localhost:8022/dashboard/stats" -H "accept: application/json"
```

### `/health` (GET)
**Description:** Service health check

```sh
curl -X GET "http://localhost:8022/health" -H "accept: application/json"
```

### `/` (GET)
**Description:** Service root endpoint

```sh
curl -X GET "http://localhost:8022/" -H "accept: application/json"
```

---

## Service: MetroMind Document Workflow Service (Port 8023)

### `/templates` (POST, GET)
**Description:** Create or get workflow templates

```sh
curl -X POST "http://localhost:8023/templates?created_by=user_id" -H "accept: application/json" -H "Content-Type: application/json" -d '{
  "name": "Approval Workflow",
  "description": "Document approval chain",
  "category": "legal",
  "steps": [{"step_name": "Review", "approver": "manager"}],
  "settings": {}
}'
curl -X GET "http://localhost:8023/templates?category=legal&is_active=true" -H "accept: application/json"
```

### `/templates/{template_id}` (PUT)
**Description:** Update a workflow template

Replace `{template_id}` with the actual template ID.

```sh
curl -X PUT "http://localhost:8023/templates/template123" -H "accept: application/json" -H "Content-Type: application/json" -d '{
  "name": "Updated Workflow",
  "description": "Updated description",
  "category": "legal",
  "is_active": true,
  "steps": [{"step_name": "Review", "approver": "manager"}],
  "settings": {}
}'
```

### `/workflows` (POST, GET)
**Description:** Start a new document workflow or get workflows

```sh
curl -X POST "http://localhost:8023/workflows" -H "accept: application/json" -H "Content-Type: application/json" -d '{
  "document_id": "doc123",
  "template_id": "template123",
  "started_by": "user_id",
  "workflow_metadata": {}
}'
curl -X GET "http://localhost:8023/workflows?document_id=doc123&status=pending_review&assigned_to=user_id&limit=100&offset=0" -H "accept: application/json"
```

### `/workflows/{workflow_id}` (GET)
**Description:** Get workflow details

Replace `{workflow_id}` with the actual workflow ID.

```sh
curl -X GET "http://localhost:8023/workflows/workflow123" -H "accept: application/json"
```

### `/workflows/{workflow_id}/review` (POST)
**Description:** Submit a review for a workflow step

```sh
curl -X POST "http://localhost:8023/workflows/workflow123/review?step_id=step1&reviewer_id=user_id" -H "accept: application/json" -H "Content-Type: application/json" -d '{
  "decision": "approve",
  "comments": "Looks good",
  "review_metadata": {}
}'
```

### `/documents/{document_id}/versions` (POST, GET)
**Description:** Create or get document versions

Replace `{document_id}` with the actual document ID.

```sh
curl -X POST "http://localhost:8023/documents/doc123/versions?created_by=user_id" -H "accept: application/json" -H "Content-Type: application/json" -d '{
  "document_id": "doc123",
  "version_type": "minor",
  "description": "Minor update",
  "change_log": "Fixed typos",
  "file_path": "/files/doc123_v2.pdf"
}'
curl -X GET "http://localhost:8023/documents/doc123/versions" -H "accept: application/json"
```

### `/documents/{document_id}/versions/{version_id}/publish` (PUT)
**Description:** Publish a document version

Replace `{document_id}` and `{version_id}` with actual IDs.

```sh
curl -X PUT "http://localhost:8023/documents/doc123/versions/v2/publish?published_by=user_id" -H "accept: application/json"
```

### `/health` (GET)
**Description:** Service health check

```sh
curl -X GET "http://localhost:8023/health" -H "accept: application/json"
```

### `/` (GET)
**Description:** Service root endpoint

```sh
curl -X GET "http://localhost:8023/" -H "accept: application/json"
```

---

## Service: MetroMind Backup & Recovery Service (Port 8024)

### `/backup-jobs` (POST, GET)
**Description:** Create or get backup jobs

```sh
curl -X POST "http://localhost:8024/backup-jobs?created_by=user_id" -H "accept: application/json" -H "Content-Type: application/json" -d '{
  "name": "Nightly Backup",
  "backup_type": "full",
  "frequency": "daily",
  "scheduled_time": "2025-12-31T02:00:00",
  "include_database": true,
  "include_files": true,
  "include_logs": false,
  "retention_days": 30,
  "compression_enabled": true,
  "encryption_enabled": true,
  "settings": {}
}'
curl -X GET "http://localhost:8024/backup-jobs?is_active=true" -H "accept: application/json"
```

### `/backup-jobs/{job_id}` (PUT)
**Description:** Update a backup job

Replace `{job_id}` with the actual job ID.

```sh
curl -X PUT "http://localhost:8024/backup-jobs/job123" -H "accept: application/json" -H "Content-Type: application/json" -d '{
  "name": "Updated Backup Job",
  "frequency": "weekly",
  "scheduled_time": "2025-12-31T02:00:00",
  "include_database": true,
  "include_files": true,
  "include_logs": true,
  "retention_days": 60,
  "compression_enabled": true,
  "encryption_enabled": true,
  "is_active": true,
  "settings": {}
}'
```

### `/backup-jobs/{job_id}/execute` (POST)
**Description:** Execute a backup job manually

```sh
curl -X POST "http://localhost:8024/backup-jobs/job123/execute" -H "accept: application/json"
```

### `/backup-executions` (GET)
**Description:** Get backup executions

```sh
curl -X GET "http://localhost:8024/backup-executions?job_id=job123&status=completed&limit=100" -H "accept: application/json"
```

### `/recovery-jobs` (POST)
**Description:** Create a recovery job

```sh
curl -X POST "http://localhost:8024/recovery-jobs?requested_by=user_id" -H "accept: application/json" -H "Content-Type: application/json" -d '{
  "backup_execution_id": "exec123",
  "recovery_type": "full",
  "target_path": "/restore/",
  "selective_recovery": false,
  "selected_items": []
}'
```

### `/dashboard/stats` (GET)
**Description:** Get backup dashboard statistics

```sh
curl -X GET "http://localhost:8024/dashboard/stats" -H "accept: application/json"
```

### `/health` (GET)
**Description:** Service health check

```sh
curl -X GET "http://localhost:8024/health" -H "accept: application/json"
```

### `/` (GET)
**Description:** Service root endpoint

```sh
curl -X GET "http://localhost:8024/" -H "accept: application/json"
```

---

## Service: MetroMind Enhanced Security Service (Port 8025)

### `/2fa/setup/{user_id}` (POST)
**Description:** Setup 2FA for a user

Replace `{user_id}` with the actual user ID.

```sh
curl -X POST "http://localhost:8025/2fa/setup/user123" -H "accept: application/json"
```

### `/2fa/enable/{user_id}` (POST)
**Description:** Enable 2FA after verifying token

```sh
curl -X POST "http://localhost:8025/2fa/enable/user123" -H "accept: application/json" -H "Content-Type: application/json" -d '{
  "token": "123456",
  "backup_code": null
}'
```

### `/2fa/verify/{user_id}` (POST)
**Description:** Verify 2FA token

```sh
curl -X POST "http://localhost:8025/2fa/verify/user123" -H "accept: application/json" -H "Content-Type: application/json" -d '{
  "token": "123456",
  "backup_code": null
}'
```

### `/2fa/disable/{user_id}` (POST)
**Description:** Disable 2FA after verification

```sh
curl -X POST "http://localhost:8025/2fa/disable/user123" -H "accept: application/json" -H "Content-Type: application/json" -d '{
  "token": "123456",
  "backup_code": null
}'
```

### `/password/change/{user_id}` (POST)
**Description:** Change user password with policy enforcement

```sh
curl -X POST "http://localhost:8025/password/change/user123" -H "accept: application/json" -H "Content-Type: application/json" -d '{
  "current_password": "oldpass",
  "new_password": "newpass",
  "confirm_password": "newpass"
}'
```

### `/sessions/{user_id}` (POST, GET)
**Description:** Create or get user sessions

```sh
curl -X POST "http://localhost:8025/sessions/user123" -H "accept: application/json"
curl -X GET "http://localhost:8025/sessions/user123" -H "accept: application/json"
```

### `/sessions/{session_id}` (DELETE)
**Description:** Revoke a specific session

Replace `{session_id}` with the actual session ID.

```sh
curl -X DELETE "http://localhost:8025/sessions/sess123" -H "accept: application/json"
```

### `/events/{user_id}` (GET)
**Description:** Get security events for a user

```sh
curl -X GET "http://localhost:8025/events/user123?limit=100" -H "accept: application/json"
```

### `/dashboard/stats` (GET)
**Description:** Get security dashboard statistics

```sh
curl -X GET "http://localhost:8025/dashboard/stats" -H "accept: application/json"
```

### `/health` (GET)
**Description:** Service health check

```sh
curl -X GET "http://localhost:8025/health" -H "accept: application/json"
```

### `/` (GET)
**Description:** Service root endpoint

```sh
curl -X GET "http://localhost:8025/" -H "accept: application/json"
```

---

## Service: MetroMind Advanced Reporting Service (Port 8026)

### Endpoints and Example curl Commands

#### 1. `POST /templates` — Create Report Template
```
curl -X POST "http://localhost:8026/templates?created_by=YOUR_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Quarterly Report",
    "report_type": "document_analytics",
    "query_definition": {},
    "description": "Quarterly analytics report",
    "visualization_config": {},
    "layout_config": {},
    "parameters": {},
    "is_public": false,
    "auto_refresh_enabled": false,
    "cache_duration_minutes": 60
  }'
```

#### 2. `GET /templates` — Get Report Templates
```
curl -X GET "http://localhost:8026/templates?report_type=document_analytics&is_public=true&created_by=YOUR_USER_ID"
```

#### 3. `POST /generate` — Generate Report
```
curl -X POST "http://localhost:8026/generate?generated_by=YOUR_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": "TEMPLATE_ID",
    "format": "pdf",
    "parameters": {}
  }'
```

#### 4. `GET /executions/{execution_id}` — Get Report Execution
```
curl -X GET "http://localhost:8026/executions/EXECUTION_ID"
```

#### 5. `GET /executions` — Get Report Executions
```
curl -X GET "http://localhost:8026/executions?template_id=TEMPLATE_ID&status=completed&generated_by=YOUR_USER_ID&limit=10"
```

#### 6. `POST /dashboards` — Create Dashboard
```
curl -X POST "http://localhost:8026/dashboards?owner_id=YOUR_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Executive Dashboard",
    "description": "Key metrics dashboard",
    "layout": {},
    "widgets": [],
    "filters": {},
    "is_public": false,
    "shared_with": []
  }'
```

#### 7. `GET /dashboards` — Get Dashboards
```
curl -X GET "http://localhost:8026/dashboards?owner_id=YOUR_USER_ID&is_public=true"
```

#### 8. `GET /analytics/quick-stats` — Get Quick Analytics Stats
```
curl -X GET "http://localhost:8026/analytics/quick-stats"
```

#### 9. `GET /health` — Health Check
```
curl -X GET "http://localhost:8026/health"
```

#### 10. `GET /` — Root
```
curl -X GET "http://localhost:8026/"
```

---

## Service: MetroMind Integration Management Service (Port 8027)

### Endpoints and Example curl Commands

#### 1. `GET /templates` — List Integration Templates
```
curl -X GET "http://localhost:8027/templates"
```

#### 2. `GET /templates/{integration_type}` — Get Integration Template
```
curl -X GET "http://localhost:8027/templates/INTEGRATION_TYPE"
```

#### 3. `POST /integrations` — Create Integration
```
curl -X POST "http://localhost:8027/integrations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "My Integration",
    "type": "gmail",
    "description": "Integration with Gmail",
    "config": {},
    "credentials": {},
    "is_global": false,
    "auto_sync": true,
    "sync_interval_minutes": 30,
    "sync_enabled_collections": [],
    "sync_filters": {}
  }'
```

#### 4. `GET /integrations` — List Integrations
```
curl -X GET "http://localhost:8027/integrations?skip=0&limit=10&type=gmail&status=active&category=email&is_active=true&search=Gmail" -H "Authorization: Bearer YOUR_TOKEN"
```

#### 5. `GET /integrations/{integration_id}` — Get Integration
```
curl -X GET "http://localhost:8027/integrations/INTEGRATION_ID" -H "Authorization: Bearer YOUR_TOKEN"
```

#### 6. `PUT /integrations/{integration_id}` — Update Integration
```
curl -X PUT "http://localhost:8027/integrations/INTEGRATION_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Updated Integration",
    "description": "Updated description",
    "config": {},
    "credentials": {},
    "status": "active",
    "auto_sync": true,
    "sync_interval_minutes": 30,
    "sync_enabled_collections": [],
    "sync_filters": {},
    "is_active": true
  }'
```

#### 7. `DELETE /integrations/{integration_id}` — Delete Integration
```
curl -X DELETE "http://localhost:8027/integrations/INTEGRATION_ID" -H "Authorization: Bearer YOUR_TOKEN"
```

#### 8. `POST /integrations/{integration_id}/test` — Test Integration
```
curl -X POST "http://localhost:8027/integrations/INTEGRATION_ID/test" -H "Authorization: Bearer YOUR_TOKEN"
```

#### 9. `POST /integrations/{integration_id}/sync` — Trigger Sync
```
curl -X POST "http://localhost:8027/integrations/INTEGRATION_ID/sync?sync_type=manual" -H "Authorization: Bearer YOUR_TOKEN"
```

#### 10. `GET /integrations/{integration_id}/sync-logs` — Get Sync Logs
```
curl -X GET "http://localhost:8027/integrations/INTEGRATION_ID/sync-logs?limit=10" -H "Authorization: Bearer YOUR_TOKEN"
```

#### 11. `GET /categories` — Get Integration Categories
```
curl -X GET "http://localhost:8027/categories" -H "Authorization: Bearer YOUR_TOKEN"
```

#### 12. `GET /health` — Health Check
```
curl -X GET "http://localhost:8027/health"
```

#### 13. `GET /` — Root
```
curl -X GET "http://localhost:8027/"
```

---

## Service: MetroMind RAG Chatbot Service (Port 8028)

### Endpoints and Example curl Commands

#### 1. `POST /chat` — Chat
```
curl -X POST "http://localhost:8028/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the status of project X?",
    "user_id": "YOUR_USER_ID",
    "session_id": "SESSION_ID"
  }'
```

#### 2. `GET /chat/suggestions` — Get Suggestions
```
curl -X GET "http://localhost:8028/chat/suggestions?user_id=YOUR_USER_ID"
```

#### 3. `GET /health` — Health Check
```
curl -X GET "http://localhost:8028/health"
```

---
