import json
import sys
from pathlib import Path
from typing import Dict, Any, List, Tuple

import requests

# Ensure we can import project config when run from scripts/
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from config import get_service_urls  # type: ignore


TIMEOUT = 5


def fetch_json(url: str) -> Tuple[int, Any]:
    try:
        r = requests.get(url, timeout=TIMEOUT)
        ct = r.headers.get("content-type", "")
        if "application/json" in ct or r.text.strip().startswith("{"):
            try:
                return r.status_code, r.json()
            except Exception:
                return r.status_code, None
        return r.status_code, None
    except requests.RequestException:
        return 0, None


def service_health(base_url: str) -> bool:
    code, data = fetch_json(f"{base_url}/health")
    if code == 200 and isinstance(data, dict):
        status = str(data.get("status", "")).lower()
        return status in ("ok", "healthy", "pass") or data.get("ok") is True
    # Some services may not have /health but still serve openapi
    code, _ = fetch_json(f"{base_url}/openapi.json")
    return code == 200


def extract_endpoints(openapi: Dict[str, Any]) -> List[Dict[str, Any]]:
    results: List[Dict[str, Any]] = []
    if not isinstance(openapi, dict):
        return results
    paths = openapi.get("paths", {}) or {}
    for path, methods in paths.items():
        if not isinstance(methods, dict):
            continue
        for method, meta in methods.items():
            if method.upper() not in {"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"}:
                continue
            summary = (meta or {}).get("summary") or (meta or {}).get("description")
            tags = (meta or {}).get("tags") or []
            results.append({
                "method": method.upper(),
                "path": path,
                "summary": summary or "",
                "tags": tags,
            })
    # Sort by path then method
    results.sort(key=lambda x: (x["path"], x["method"]))
    return results


def generate_markdown(collected: Dict[str, Dict[str, Any]]) -> str:
    lines: List[str] = []
    lines.append("# MetroMind API Endpoints")
    lines.append("")
    lines.append("This file is auto-generated from each service's OpenAPI spec.")
    lines.append("")
    for name, info in collected.items():
        base_url = info.get("base_url", "")
        healthy = info.get("healthy", False)
        error = info.get("error")
        endpoints = info.get("endpoints", [])
        lines.append(f"## {name} ({base_url})")
        lines.append(f"- Status: {'healthy' if healthy else 'unavailable'}")
        if error:
            lines.append(f"- Note: {error}")
        lines.append("")
        if endpoints:
            for ep in endpoints:
                tag_str = f" [tags: {', '.join(ep['tags'])}]" if ep.get("tags") else ""
                summary = f" — {ep['summary']}" if ep.get("summary") else ""
                lines.append(f"- {ep['method']}: `{ep['path']}`{summary}{tag_str}")
        else:
            lines.append("- No endpoints discovered or OpenAPI not available.")
        lines.append("")
    return "\n".join(lines).strip() + "\n"


def main() -> int:
    services = get_service_urls()
    # Skip non-API entries
    skip = {"web_frontend"}
    collected: Dict[str, Dict[str, Any]] = {}
    for name, base in services.items():
        if name in skip:
            continue
        info: Dict[str, Any] = {"base_url": base}
        healthy = service_health(base)
        info["healthy"] = healthy
        if healthy:
            code, spec = fetch_json(f"{base}/openapi.json")
            if code == 200 and isinstance(spec, dict):
                info["endpoints"] = extract_endpoints(spec)
            else:
                info["error"] = f"openapi.json unavailable (HTTP {code})"
                info["endpoints"] = []
        else:
            info["error"] = "Service not reachable or /health failed"
            info["endpoints"] = []
        collected[name] = info

    md = generate_markdown(collected)
    out_path = ROOT / "api_endpoints.md"
    out_path.write_text(md, encoding="utf-8")
    print(f"Wrote {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
