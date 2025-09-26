# MetroMind API Endpoints

This file is auto-generated from each service's OpenAPI spec.

## api_gateway (http://localhost:8010)
- Status: healthy

- GET: `/` — Root
- GET: `/chat/{path}` — Proxy Chatbot
- POST: `/chat/{path}` — Proxy Chatbot
- DELETE: `/email/{path}` — Proxy Email
- GET: `/email/{path}` — Proxy Email
- POST: `/email/{path}` — Proxy Email
- PUT: `/email/{path}` — Proxy Email
- GET: `/health` — Health Check
- GET: `/metrics` — Metrics
- GET: `/services` — List Services
- DELETE: `/tasks/{path}` — Proxy Tasks
- GET: `/tasks/{path}` — Proxy Tasks
- POST: `/tasks/{path}` — Proxy Tasks
- PUT: `/tasks/{path}` — Proxy Tasks
- DELETE: `/{path}` — Catch All
- GET: `/{path}` — Catch All
- PATCH: `/{path}` — Catch All
- POST: `/{path}` — Catch All
- PUT: `/{path}` — Catch All

## auth_service (http://localhost:8011)
- Status: healthy

- POST: `/admin/approve-user` — Approve User
- GET: `/admin/pending-users` — Get Pending Users
- POST: `/admin/permissions/initialize` — Init Role Permissions
- POST: `/admin/permissions/update` — Update Role Permissions
- GET: `/admin/permissions/{role}` — Get Role Permissions Endpoint
- GET: `/admin/users` — Get All Users
- POST: `/change-password` — Change Password
- GET: `/health` — Health Check
- POST: `/login` — Login User
- POST: `/logout` — Logout User
- GET: `/profile` — Get User Profile
- PUT: `/profile` — Update User Profile
- POST: `/register` — Register User

## document_service (http://localhost:8012)
- Status: healthy

- GET: `/categories` — Get Document Categories
- GET: `/documents` — List Documents
- GET: `/documents/shared` — List Shared Documents
- DELETE: `/documents/{document_id}` — Delete Document
- GET: `/documents/{document_id}` — Get Document
- PUT: `/documents/{document_id}` — Update Document
- GET: `/documents/{document_id}/download` — Download Document
- POST: `/documents/{document_id}/share` — Share Document
- DELETE: `/documents/{document_id}/share/{share_id}` — Remove Document Share
- GET: `/documents/{document_id}/versions` — Get Document Versions
- GET: `/documents/{document_id}/versions/{version_number}/download` — Download Document Version
- GET: `/health` — Health Check
- GET: `/priorities` — Get Document Priorities
- POST: `/search` — Search Documents
- GET: `/stats` — Get Document Stats
- POST: `/upload` — Upload Document

## ocr_service (http://localhost:8013)
- Status: healthy

- GET: `/capabilities` — Get Ocr Capabilities
- POST: `/extract-text` — Extract Text From Image
- GET: `/health` — Health Check
- GET: `/languages` — Get Supported Languages
- POST: `/process-document` — Process Document Ocr

## ai_ml_service (http://localhost:8014)
- Status: healthy

- POST: `/analyze-document` — Analyze Document
- POST: `/analyze-text` — Analyze Text
- POST: `/generate-embeddings` — Generate Embeddings Endpoint
- GET: `/health` — Health Check
- GET: `/models` — Get Available Models

## search_service (http://localhost:8015)
- Status: healthy

- GET: `/` — Root
- GET: `/health` — Health Check
- POST: `/index-document` — Index Document
- GET: `/index/stats` — Get Index Stats
- DELETE: `/index/{document_id}` — Remove From Index
- POST: `/reindex` — Reindex All
- POST: `/search` — Search Documents

## notification_service (http://localhost:8016)
- Status: healthy

- GET: `/` — Root
- POST: `/alerts/system` — Send System Alert
- POST: `/broadcast` — Broadcast Notification
- GET: `/health` — Health Check
- POST: `/notifications` — Create Notification
- PUT: `/notifications/{notification_id}/read` — Mark Notification Read
- GET: `/notifications/{user_id}` — Get User Notifications
- PUT: `/notifications/{user_id}/read-all` — Mark All Notifications Read
- GET: `/ws/stats` — Get Websocket Stats

## integration_service (http://localhost:8017)
- Status: healthy

- GET: `/` — Root
- GET: `/health` — Health Check
- GET: `/integrations` — List Integrations
- POST: `/integrations` — Create Integration
- GET: `/integrations/google-drive/auth-url` — Get Google Drive Auth Url
- POST: `/integrations/google-drive/exchange-code` — Exchange Google Drive Code
- DELETE: `/integrations/{integration_id}` — Delete Integration
- GET: `/integrations/{integration_id}` — Get Integration
- PUT: `/integrations/{integration_id}` — Update Integration
- POST: `/integrations/{integration_id}/sync` — Sync Integration
- POST: `/integrations/{integration_id}/test` — Test Integration
- POST: `/setup-automation` — Setup Automation
- GET: `/webhooks/whatsapp` — Whatsapp Webhook Verify
- POST: `/webhooks/whatsapp` — Whatsapp Webhook

## analytics_service (http://localhost:8018)
- Status: healthy

- GET: `/` — Root
- GET: `/dashboard` — Get Dashboard
- POST: `/events` — Track Event
- GET: `/health` — Health Check
- GET: `/metrics/{metric_type}` — Get Specific Metrics
- GET: `/reports/{report_type}` — Generate Report
- GET: `/search/analytics` — Get Search Analytics
- GET: `/users/{user_id}/activity` — Get User Activity

## model_downloader (http://localhost:8019)
- Status: healthy

- GET: `/` — Root
- POST: `/cleanup` — Cleanup Models
- GET: `/health` — Health Check
- GET: `/models` — List Models
- POST: `/models/download-all` — Download All Models
- DELETE: `/models/{model_name}` — Remove Model
- GET: `/models/{model_name}` — Get Model Info
- POST: `/models/{model_name}/download` — Download Model
- GET: `/models/{model_name}/download-status` — Get Download Status
- POST: `/models/{model_name}/use` — Get Model For Use
- GET: `/storage` — Get Storage Info

## task_service (http://localhost:8020)
- Status: healthy

- GET: `/` — Root
- GET: `/health` — Health Check
- GET: `/tasks` — List Tasks
- POST: `/tasks` — Create Task
- GET: `/tasks/categories` — Get Task Categories
- GET: `/tasks/my-tasks` — Get My Tasks
- GET: `/tasks/stats` — Get Task Stats
- DELETE: `/tasks/{task_id}` — Delete Task
- GET: `/tasks/{task_id}` — Get Task
- PUT: `/tasks/{task_id}` — Update Task
- POST: `/tasks/{task_id}/comments` — Add Task Comment

## realtime_service (http://localhost:8021)
- Status: healthy

- GET: `/` — Root
- POST: `/broadcast/document/{document_id}` — Broadcast Document Message
- POST: `/broadcast/system` — Broadcast System Message
- POST: `/broadcast/task/{task_id}` — Broadcast Task Message
- GET: `/health` — Health Check
- GET: `/online-users` — Get Online Users
- GET: `/room/{room_id}/users` — Get Room Users
- GET: `/stats` — Get Realtime Stats

## audit_service (http://localhost:8022)
- Status: healthy

- GET: `/` — Root
- POST: `/audit/log` — Create Audit Log
- GET: `/audit/logs` — Get Audit Logs
- GET: `/dashboard/stats` — Get Dashboard Stats
- GET: `/health` — Health Check
- GET: `/metrics` — Get Metrics
- POST: `/metrics/log` — Log Metric
- POST: `/performance/log` — Log Performance
- POST: `/security/alert` — Create Security Alert
- GET: `/security/alerts` — Get Security Alerts
- PUT: `/security/alerts/{alert_id}/resolve` — Resolve Security Alert

## workflow_service (http://localhost:8023)
- Status: healthy

- GET: `/` — Root
- GET: `/documents/{document_id}/versions` — Get Document Versions
- POST: `/documents/{document_id}/versions` — Create Document Version
- PUT: `/documents/{document_id}/versions/{version_id}/publish` — Publish Document Version
- GET: `/health` — Health Check
- GET: `/templates` — Get Workflow Templates
- POST: `/templates` — Create Workflow Template
- PUT: `/templates/{template_id}` — Update Workflow Template
- GET: `/workflows` — Get Workflows
- POST: `/workflows` — Start Document Workflow
- GET: `/workflows/{workflow_id}` — Get Workflow
- POST: `/workflows/{workflow_id}/review` — Submit Review

## backup_service (http://localhost:8024)
- Status: healthy

- GET: `/` — Root
- GET: `/backup-executions` — Get Backup Executions
- GET: `/backup-jobs` — Get Backup Jobs
- POST: `/backup-jobs` — Create Backup Job
- PUT: `/backup-jobs/{job_id}` — Update Backup Job
- POST: `/backup-jobs/{job_id}/execute` — Execute Backup Job Manual
- GET: `/dashboard/stats` — Get Backup Stats
- GET: `/health` — Health Check
- POST: `/recovery-jobs` — Create Recovery Job

## security_service (http://localhost:8025)
- Status: healthy

- GET: `/` — Root
- POST: `/2fa/disable/{user_id}` — Disable Two Factor Auth
- POST: `/2fa/enable/{user_id}` — Enable Two Factor Auth
- POST: `/2fa/setup/{user_id}` — Setup Two Factor Auth
- POST: `/2fa/verify/{user_id}` — Verify Two Factor Token
- GET: `/dashboard/stats` — Get Security Dashboard Stats
- GET: `/events/{user_id}` — Get Security Events
- GET: `/health` — Health Check
- POST: `/password/change/{user_id}` — Change Password
- DELETE: `/sessions/{session_id}` — Revoke Session
- GET: `/sessions/{user_id}` — Get User Sessions
- POST: `/sessions/{user_id}` — Create User Session

## reporting_service (http://localhost:8026)
- Status: healthy

- GET: `/` — Root
- GET: `/analytics/quick-stats` — Get Quick Analytics Stats
- GET: `/dashboards` — Get Dashboards
- POST: `/dashboards` — Create Dashboard
- GET: `/executions` — Get Report Executions
- GET: `/executions/{execution_id}` — Get Report Execution
- POST: `/generate` — Generate Report
- GET: `/health` — Health Check
- GET: `/templates` — Get Report Templates
- POST: `/templates` — Create Report Template
