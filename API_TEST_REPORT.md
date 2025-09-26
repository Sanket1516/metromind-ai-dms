# API Test Report

## api_gateway
- Summary: 3 OK, 0 Unauthorized, 0 Server errors, 15 Skipped, 19 total
- 200 in 2081.4ms — GET `/`
- SKIP GET `/chat/{path}` — destructive/streaming endpoint
- SKIP POST `/chat/{path}` — destructive/streaming endpoint
- SKIP DELETE `/email/{path}` — destructive/streaming endpoint
- SKIP GET `/email/{path}` — destructive/streaming endpoint
- SKIP POST `/email/{path}` — destructive/streaming endpoint
- SKIP PUT `/email/{path}` — destructive/streaming endpoint
- 200 in 2022.6ms — GET `/health`
- 404 in 2427.8ms — GET `/metrics`
- 200 in 2050.8ms — GET `/services`
- SKIP DELETE `/tasks/{path}` — destructive/streaming endpoint
- SKIP GET `/tasks/{path}` — destructive/streaming endpoint
- SKIP POST `/tasks/{path}` — destructive/streaming endpoint
- SKIP PUT `/tasks/{path}` — destructive/streaming endpoint
- SKIP DELETE `/{path}` — destructive/streaming endpoint
- SKIP GET `/{path}` — destructive/streaming endpoint
- SKIP PATCH `/{path}` — destructive/streaming endpoint
- SKIP POST `/{path}` — destructive/streaming endpoint
- SKIP PUT `/{path}` — destructive/streaming endpoint

## auth_service
- Summary: 6 OK, 1 Unauthorized, 1 Server errors, 1 Skipped, 13 total
- 422 in 2101.2ms — POST `/admin/approve-user`
- 200 in 2124.1ms — GET `/admin/pending-users`
- 500 in 2190.0ms — POST `/admin/permissions/initialize` (Server error 500)
- 422 in 2047.7ms — POST `/admin/permissions/update`
- SKIP GET `/admin/permissions/{role}` — destructive/streaming endpoint
- 200 in 2053.9ms — GET `/admin/users`
- 422 in 2049.0ms — POST `/change-password`
- 200 in 6091.9ms — GET `/health`
- 401 in 2051.3ms — POST `/login` (Unauthorized 401)
- 200 in 6124.9ms — POST `/logout`
- 200 in 2062.8ms — GET `/profile`
- 200 in 2060.9ms — PUT `/profile`
- 422 in 2047.3ms — POST `/register`

## document_service
- Summary: 3 OK, 0 Unauthorized, 4 Server errors, 8 Skipped, 16 total
- 200 in 2047.5ms — GET `/categories`
- 500 in 2166.8ms — GET `/documents` (Server error 500)
- 500 in 2099.6ms — GET `/documents/shared` (Server error 500)
- SKIP DELETE `/documents/{document_id}` — destructive/streaming endpoint
- SKIP GET `/documents/{document_id}` — destructive/streaming endpoint
- SKIP PUT `/documents/{document_id}` — destructive/streaming endpoint
- SKIP GET `/documents/{document_id}/download` — destructive/streaming endpoint
- SKIP POST `/documents/{document_id}/share` — destructive/streaming endpoint
- SKIP DELETE `/documents/{document_id}/share/{share_id}` — destructive/streaming endpoint
- SKIP GET `/documents/{document_id}/versions` — destructive/streaming endpoint
- SKIP GET `/documents/{document_id}/versions/{version_number}/download` — destructive/streaming endpoint
- 200 in 2063.5ms — GET `/health`
- 200 in 2037.9ms — GET `/priorities`
- 500 in 2064.2ms — POST `/search` (Server error 500)
- 500 in 2081.7ms — GET `/stats` (Server error 500)
- 422 in 2037.7ms — POST `/upload`

## ocr_service
- Summary: 2 OK, 0 Unauthorized, 1 Server errors, 0 Skipped, 5 total
- 500 in 2209.7ms — GET `/capabilities` (Server error 500)
- 422 in 2041.1ms — POST `/extract-text`
- 200 in 2038.4ms — GET `/health`
- 200 in 2049.3ms — GET `/languages`
- 422 in 2118.9ms — POST `/process-document`

## ai_ml_service
- Summary: 2 OK, 0 Unauthorized, 0 Server errors, 0 Skipped, 5 total
- 422 in 2551.1ms — POST `/analyze-document`
- 422 in 2052.4ms — POST `/analyze-text`
- 422 in 2028.4ms — POST `/generate-embeddings`
- 200 in 2043.8ms — GET `/health`
- 200 in 2039.6ms — GET `/models`

## search_service
- Summary: 4 OK, 0 Unauthorized, 0 Server errors, 2 Skipped, 7 total
- 200 in 2137.1ms — GET `/`
- 200 in 2040.4ms — GET `/health`
- 422 in 2045.9ms — POST `/index-document`
- 200 in 2036.2ms — GET `/index/stats`
- SKIP DELETE `/index/{document_id}` — destructive/streaming endpoint
- SKIP POST `/reindex` — destructive/streaming endpoint
- 200 in 2333.3ms — POST `/search`

## notification_service
- Summary: 2 OK, 0 Unauthorized, 0 Server errors, 4 Skipped, 9 total
- 200 in 2057.4ms — GET `/`
- 422 in 2038.0ms — POST `/alerts/system`
- 422 in 2059.6ms — POST `/broadcast`
- 200 in 2055.5ms — GET `/health`
- 422 in 2058.9ms — POST `/notifications`
- SKIP PUT `/notifications/{notification_id}/read` — destructive/streaming endpoint
- SKIP GET `/notifications/{user_id}` — destructive/streaming endpoint
- SKIP PUT `/notifications/{user_id}/read-all` — destructive/streaming endpoint
- SKIP GET `/ws/stats` — destructive/streaming endpoint

## integration_service
- Summary: 5 OK, 0 Unauthorized, 1 Server errors, 5 Skipped, 14 total
- 200 in 2059.6ms — GET `/`
- 200 in 2037.4ms — GET `/health`
- 200 in 2095.6ms — GET `/integrations`
- 422 in 2064.3ms — POST `/integrations`
- 500 in 2066.9ms — GET `/integrations/google-drive/auth-url` (Server error 500)
- 422 in 2039.8ms — POST `/integrations/google-drive/exchange-code`
- SKIP DELETE `/integrations/{integration_id}` — destructive/streaming endpoint
- SKIP GET `/integrations/{integration_id}` — destructive/streaming endpoint
- SKIP PUT `/integrations/{integration_id}` — destructive/streaming endpoint
- SKIP POST `/integrations/{integration_id}/sync` — destructive/streaming endpoint
- SKIP POST `/integrations/{integration_id}/test` — destructive/streaming endpoint
- 200 in 2069.0ms — POST `/setup-automation`
- 422 in 2044.4ms — GET `/webhooks/whatsapp`
- 200 in 2049.6ms — POST `/webhooks/whatsapp`

## analytics_service
- Summary: 4 OK, 0 Unauthorized, 0 Server errors, 4 Skipped, 8 total
- 200 in 2073.4ms — GET `/`
- 200 in 2355.9ms — GET `/dashboard`
- SKIP POST `/events` — destructive/streaming endpoint
- 200 in 2044.4ms — GET `/health`
- SKIP GET `/metrics/{metric_type}` — destructive/streaming endpoint
- SKIP GET `/reports/{report_type}` — destructive/streaming endpoint
- 200 in 2053.2ms — GET `/search/analytics`
- SKIP GET `/users/{user_id}/activity` — destructive/streaming endpoint

## model_downloader
- Summary: 5 OK, 0 Unauthorized, 1 Server errors, 5 Skipped, 11 total
- 200 in 2058.2ms — GET `/`
- 200 in 2070.8ms — POST `/cleanup`
- 200 in 2041.6ms — GET `/health`
- 200 in 2069.7ms — GET `/models`
- 200 in 2045.6ms — POST `/models/download-all`
- SKIP DELETE `/models/{model_name}` — destructive/streaming endpoint
- SKIP GET `/models/{model_name}` — destructive/streaming endpoint
- SKIP POST `/models/{model_name}/download` — destructive/streaming endpoint
- SKIP GET `/models/{model_name}/download-status` — destructive/streaming endpoint
- SKIP POST `/models/{model_name}/use` — destructive/streaming endpoint
- 500 in 2059.5ms — GET `/storage` (Server error 500)

## task_service
- Summary: 3 OK, 0 Unauthorized, 3 Server errors, 4 Skipped, 11 total
- 200 in 2085.6ms — GET `/`
- 200 in 2065.0ms — GET `/health`
- 200 in 2166.8ms — GET `/tasks`
- 422 in 2083.5ms — POST `/tasks`
- 500 in 2068.0ms — GET `/tasks/categories` (Server error 500)
- 500 in 2035.9ms — GET `/tasks/my-tasks` (Server error 500)
- 500 in 2055.5ms — GET `/tasks/stats` (Server error 500)
- SKIP DELETE `/tasks/{task_id}` — destructive/streaming endpoint
- SKIP GET `/tasks/{task_id}` — destructive/streaming endpoint
- SKIP PUT `/tasks/{task_id}` — destructive/streaming endpoint
- SKIP POST `/tasks/{task_id}/comments` — destructive/streaming endpoint

## realtime_service
- Summary: 4 OK, 0 Unauthorized, 0 Server errors, 3 Skipped, 8 total
- 200 in 2047.2ms — GET `/`
- SKIP POST `/broadcast/document/{document_id}` — destructive/streaming endpoint
- 422 in 2050.2ms — POST `/broadcast/system`
- SKIP POST `/broadcast/task/{task_id}` — destructive/streaming endpoint
- 200 in 2013.8ms — GET `/health`
- 200 in 2080.5ms — GET `/online-users`
- SKIP GET `/room/{room_id}/users` — destructive/streaming endpoint
- 200 in 2048.9ms — GET `/stats`

## audit_service
- Summary: 5 OK, 0 Unauthorized, 1 Server errors, 1 Skipped, 11 total
- 200 in 2138.5ms — GET `/`
- 422 in 2599.7ms — POST `/audit/log`
- 200 in 2117.4ms — GET `/audit/logs`
- 500 in 2244.7ms — GET `/dashboard/stats` (Server error 500)
- 200 in 2025.2ms — GET `/health`
- 200 in 2163.4ms — GET `/metrics`
- 422 in 2065.9ms — POST `/metrics/log`
- 422 in 2069.8ms — POST `/performance/log`
- 422 in 2034.1ms — POST `/security/alert`
- 200 in 2099.9ms — GET `/security/alerts`
- SKIP PUT `/security/alerts/{alert_id}/resolve` — destructive/streaming endpoint

## workflow_service
- Summary: 2 OK, 0 Unauthorized, 1 Server errors, 8 Skipped, 12 total
- 200 in 2243.1ms — GET `/`
- SKIP GET `/documents/{document_id}/versions` — destructive/streaming endpoint
- SKIP POST `/documents/{document_id}/versions` — destructive/streaming endpoint
- SKIP PUT `/documents/{document_id}/versions/{version_id}/publish` — destructive/streaming endpoint
- 200 in 2072.0ms — GET `/health`
- 500 in 2748.0ms — GET `/templates` (Server error 500)
- 422 in 2092.8ms — POST `/templates`
- SKIP PUT `/templates/{template_id}` — destructive/streaming endpoint
- SKIP GET `/workflows` — destructive/streaming endpoint
- SKIP POST `/workflows` — destructive/streaming endpoint
- SKIP GET `/workflows/{workflow_id}` — destructive/streaming endpoint
- SKIP POST `/workflows/{workflow_id}/review` — destructive/streaming endpoint

## backup_service
- Summary: 5 OK, 0 Unauthorized, 0 Server errors, 2 Skipped, 9 total
- 200 in 2105.5ms — GET `/`
- 200 in 2118.8ms — GET `/backup-executions`
- 200 in 2028.3ms — GET `/backup-jobs`
- 422 in 2049.4ms — POST `/backup-jobs`
- SKIP PUT `/backup-jobs/{job_id}` — destructive/streaming endpoint
- SKIP POST `/backup-jobs/{job_id}/execute` — destructive/streaming endpoint
- 200 in 2101.5ms — GET `/dashboard/stats`
- 200 in 2054.4ms — GET `/health`
- 422 in 2038.8ms — POST `/recovery-jobs`

## security_service
- Summary: 2 OK, 0 Unauthorized, 1 Server errors, 9 Skipped, 12 total
- 200 in 2474.0ms — GET `/`
- SKIP POST `/2fa/disable/{user_id}` — destructive/streaming endpoint
- SKIP POST `/2fa/enable/{user_id}` — destructive/streaming endpoint
- SKIP POST `/2fa/setup/{user_id}` — destructive/streaming endpoint
- SKIP POST `/2fa/verify/{user_id}` — destructive/streaming endpoint
- 500 in 2083.5ms — GET `/dashboard/stats` (Server error 500)
- SKIP GET `/events/{user_id}` — destructive/streaming endpoint
- 200 in 2022.5ms — GET `/health`
- SKIP POST `/password/change/{user_id}` — destructive/streaming endpoint
- SKIP DELETE `/sessions/{session_id}` — destructive/streaming endpoint
- SKIP GET `/sessions/{user_id}` — destructive/streaming endpoint
- SKIP POST `/sessions/{user_id}` — destructive/streaming endpoint

## reporting_service
- Summary: 6 OK, 0 Unauthorized, 0 Server errors, 1 Skipped, 10 total
- 200 in 2151.1ms — GET `/`
- 200 in 2256.7ms — GET `/analytics/quick-stats`
- 200 in 2036.2ms — GET `/dashboards`
- 422 in 2047.5ms — POST `/dashboards`
- 200 in 2051.5ms — GET `/executions`
- SKIP GET `/executions/{execution_id}` — destructive/streaming endpoint
- 422 in 2029.8ms — POST `/generate`
- 200 in 2036.3ms — GET `/health`
- 200 in 2059.8ms — GET `/templates`
- 422 in 2024.7ms — POST `/templates`
