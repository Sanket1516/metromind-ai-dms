import requests
import json

service_ports = {
    "api_gateway": 8010,
    "auth_service": 8011,
    "document_service": 8012,
    "ocr_service": 8013,
    "ai_ml_service": 8014,
    "search_service": 8015,
    "notification_service": 8016,
    "integration_service": 8017,
    "analytics_service": 8018,
    "model_downloader": 8019,
    "task_service": 8020,
    "realtime_service": 8021,
    "audit_service": 8022,
    "workflow_service": 8023,
    "backup_service": 8024,
    "security_service": 8025,
    "reporting_service": 8026,
    "integration_management": 8027,
}

api_endpoints = {}

for service_name, port in service_ports.items():
    try:
        url = f"http://localhost:{port}/openapi.json"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            openapi_spec = response.json()
            api_endpoints[service_name] = {
                "port": port,
                "endpoints": []
            }
            for path, methods in openapi_spec.get("paths", {}).items():
                for method, details in methods.items():
                    api_endpoints[service_name]["endpoints"].append({
                        "path": path,
                        "method": method.upper(),
                        "summary": details.get("summary", "No summary"),
                    })
            print(f"Successfully fetched docs for {service_name} on port {port}")
        else:
            print(f"Failed to fetch docs for {service_name} on port {port}. Status code: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"Could not connect to {service_name} on port {port}. Error: {e}")

with open("api_endpoints.md", "w") as f:
    f.write("# MetroMind API Endpoints\n\n")
    for service_name, data in api_endpoints.items():
        f.write(f"## {service_name.replace('_', ' ').title()} (Port: {data['port']})\n\n")
        if data["endpoints"]:
            f.write("| Method | Path | Summary |\n")
            f.write("|--------|------|---------|\n")
            for endpoint in data["endpoints"]:
                f.write(f"| {endpoint['method']} | `{endpoint['path']}` | {endpoint['summary']} |\n")
        else:
            f.write("No endpoints found.\n")
        f.write("\n")

print("\napi_endpoints.md file created successfully.")
