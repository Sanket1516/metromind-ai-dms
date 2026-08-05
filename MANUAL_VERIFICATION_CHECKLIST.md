# Manual Verification Checklist

Use this after the startup and port alignment fixes to verify the system end to end.

## Before You Start

- Confirm PostgreSQL and Redis are running if you are using local services.
- Confirm the backend dependencies are installed.
- Confirm the frontend dependencies are installed.
- Make sure no old MetroMind processes are still holding ports 3000, 8010 through 8028, 5432, or 6379.

## Startup Checks

- Start the backend with `python start_services.py`.
- Verify each service starts without missing-file errors.
- Confirm the task service starts on port 8020.
- Confirm the model downloader starts on port 8019.
- Confirm the API gateway starts on port 8010.
- Start the frontend and confirm it listens on port 3000.

## Health Checks

- Open `http://localhost:8010/health` and confirm the gateway responds.
- Open `http://localhost:8011/health` and confirm auth is healthy.
- Open `http://localhost:8012/health` and confirm document service is healthy.
- Open `http://localhost:8013/health` and confirm OCR is healthy.
- Open `http://localhost:8014/health` and confirm AI/ML is healthy.
- Open `http://localhost:8015/health` and confirm search is healthy.
- Open `http://localhost:8016/health` and confirm notifications is healthy.
- Open `http://localhost:8017/health` and confirm integration is healthy.
- Open `http://localhost:8018/health` and confirm analytics is healthy.
- Open `http://localhost:8019/health` and confirm model downloader is healthy.
- Open `http://localhost:8020/health` and confirm task management is healthy.
- Open `http://localhost:8021/health` and confirm realtime is healthy.
- Open `http://localhost:8022/health` and confirm audit is healthy.
- Open `http://localhost:8023/health` and confirm workflow is healthy.
- Open `http://localhost:8024/health` and confirm backup is healthy.
- Open `http://localhost:8025/health` and confirm security is healthy.
- Open `http://localhost:8026/health` and confirm reporting is healthy.
- Open `http://localhost:8027/health` and confirm integration management is healthy.
- Open `http://localhost:8028/health` and confirm chatbot is healthy.

## Frontend Checks

- Open `http://localhost:3000` and confirm the app loads.
- Confirm browser console has no fatal errors on load.
- Confirm the frontend can reach the API gateway at port 8010.
- Try one normal navigation flow in the UI.

## Functional Smoke Tests

- Log in with a known test account.
- Upload a document and confirm it appears in the document list.
- Open a document details page and confirm metadata renders.
- Search for a known document or keyword.
- Open the task page and confirm tasks load.
- Open the chatbot and send a simple question.
- If email integration is enabled, send a test email and confirm it is detected.

## Docker Checks

- Run `docker compose up --build` if you are validating the container stack.
- Confirm Postgres and Redis become healthy.
- Confirm backend and frontend containers stay running.
- Confirm the exposed ports match the local startup ports.

## Stop Check

- Stop the system cleanly with Ctrl+C or your normal shutdown flow.
- Confirm no MetroMind processes are left behind.