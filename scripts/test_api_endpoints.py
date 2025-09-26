import re
import sys
import json
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

import requests

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from config import get_service_urls  # type: ignore


TIMEOUT = 8
REPORT_PATH = ROOT / "API_TEST_REPORT.md"
RAW_JSON = ROOT / "data" / "api_test_results.json"


def parse_api_endpoints(md_path: Path) -> Dict[str, List[Dict[str, str]]]:
    content = md_path.read_text(encoding="utf-8")
    services: Dict[str, List[Dict[str, str]]] = {}
    current: Optional[str] = None
    for line in content.splitlines():
        line = line.strip()
        if line.startswith("## "):
            # Format: ## name (http://localhost:port)
            m = re.match(r"##\s+([^\(]+)\s*\(([^\)]+)\)", line)
            if m:
                current = m.group(1).strip()
                services.setdefault(current, [])
            else:
                current = None
        elif line.startswith("- ") and current:
            # Example: - GET: `/path` — summary [tags: a, b]
            m = re.match(r"-\s+([A-Z]+):\s+`([^`]+)`", line)
            if m:
                method = m.group(1)
                path = m.group(2)
                services[current].append({"method": method, "path": path})
    return services


def get_jwt_token(auth_base: str) -> Optional[str]:
    # Try login with known admin credentials
    candidates = [
        ("admin@kmrl.gov.in", "admin123"),
        ("admin@kmrl.gov.in", "MetroAdmin@2024"),
        ("admin@kmrl.gov.in", "Admin123"),
        ("admin@kmrl.com", "admin123"),
        ("admin@metromind.local", "admin123"),
    ]
    for username, password in candidates:
        try:
            r = requests.post(
                f"{auth_base}/login",
                json={"email": username, "password": password},
                timeout=TIMEOUT,
            )
            if r.status_code == 200:
                data = r.json()
                token = data.get("access_token") or data.get("token")
                if token:
                    return token
        except requests.RequestException:
            continue
    return None


def default_payload_for(path: str) -> Dict[str, Any]:
    # Minimal payload heuristics for common endpoints
    if any(k in path for k in ["login", "token"]):
        return {"email": "user@example.com", "password": "password"}
    if "search" in path:
        return {"query": "test"}
    if "upload" in path or "document" in path:
        return {"title": "Test", "content": "Hello"}
    return {}


def should_skip(method: str, path: str) -> bool:
    # Skip obvious destructive or long-running endpoints
    destructive = ["delete", "purge", "reindex", "reset", "shutdown", "kill"]
    if method in {"DELETE"}:
        return True
    if any(d in path.lower() for d in destructive):
        return True
    # Skip websocket and stream endpoints
    if any(s in path.lower() for s in ["ws", "websocket", "stream", "events"]):
        return True
    # Skip routes requiring real resource IDs
    if "{" in path and "}" in path:
        return True
    return False


def test_endpoint(base: str, method: str, path: str, token: Optional[str]) -> Tuple[int, float, Optional[str]]:
    import time
    url = f"{base}{path}"
    headers = {"Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = None
    files = None
    json_body: Optional[Dict[str, Any]] = None

    if method in {"POST", "PUT", "PATCH"}:
        json_body = default_payload_for(path)

    start = time.perf_counter()
    try:
        r = requests.request(
            method,
            url,
            headers=headers,
            json=json_body,
            timeout=TIMEOUT,
        )
        elapsed = (time.perf_counter() - start) * 1000.0
        status = r.status_code
        # Treat 2xx and 401/403 as informative (auth required)
        if status >= 500:
            err = f"Server error {status}"
        elif status in (401, 403):
            err = f"Unauthorized {status}"
        else:
            err = None
        return status, elapsed, err
    except requests.RequestException as e:
        elapsed = (time.perf_counter() - start) * 1000.0
        return 0, elapsed, str(e)


def main() -> int:
    md_file = ROOT / "api_endpoints.md"
    if not md_file.exists():
        print("api_endpoints.md not found. Run scripts/generate_api_endpoints.py first.")
        return 2

    services = parse_api_endpoints(md_file)
    bases = get_service_urls()
    results: Dict[str, Any] = {}

    auth_base = bases.get("auth_service")
    token = get_jwt_token(auth_base) if auth_base else None

    for name, endpoints in services.items():
        base_key = name
        base = bases.get(base_key)
        if not base:
            continue
        service_res: List[Dict[str, Any]] = []
        for ep in endpoints:
            method, path = ep["method"], ep["path"]
            if should_skip(method, path):
                service_res.append({
                    "method": method,
                    "path": path,
                    "status": "skipped",
                    "reason": "destructive/streaming endpoint",
                })
                continue
            status, elapsed, err = test_endpoint(base, method, path, token)
            service_res.append({
                "method": method,
                "path": path,
                "http_status": status,
                "latency_ms": round(elapsed, 1),
                "error": err,
            })
        results[name] = service_res

    # Write JSON
    RAW_JSON.parent.mkdir(parents=True, exist_ok=True)
    RAW_JSON.write_text(json.dumps(results, indent=2), encoding="utf-8")

    # Write MD summary
    lines: List[str] = []
    lines.append("# API Test Report")
    lines.append("")
    for name, service_res in results.items():
        lines.append(f"## {name}")
        ok = sum(1 for r in service_res if isinstance(r.get("http_status"), int) and 200 <= r["http_status"] < 300)
        unauth = sum(1 for r in service_res if r.get("http_status") in (401, 403))
        errors = sum(1 for r in service_res if isinstance(r.get("http_status"), int) and r["http_status"] >= 500)
        skipped = sum(1 for r in service_res if r.get("status") == "skipped")
        total = len(service_res)
        lines.append(f"- Summary: {ok} OK, {unauth} Unauthorized, {errors} Server errors, {skipped} Skipped, {total} total")
        for r in service_res:
            if r.get("status") == "skipped":
                lines.append(f"- SKIP {r['method']} `{r['path']}` — {r['reason']}")
                continue
            status = r.get("http_status")
            lat = r.get("latency_ms")
            err = r.get("error")
            extra = f" ({err})" if err else ""
            lines.append(f"- {status} in {lat}ms — {r['method']} `{r['path']}`{extra}")
        lines.append("")

    REPORT_PATH.write_text("\n".join(lines).strip() + "\n", encoding="utf-8")
    print(f"Wrote {REPORT_PATH} and {RAW_JSON}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
