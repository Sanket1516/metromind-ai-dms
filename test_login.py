#!/usr/bin/env python3
"""
Test login with admin credentials
"""

import httpx
import json

def test_login():
    """Test login with admin credentials"""
    login_url = "http://localhost:8010/auth/login"  # API Gateway URL

    # Default admin credentials from database.py
    credentials = {
        "username": "admin",
        "password": "MetroAdmin@2024"
    }

    try:
        print("Testing login with admin credentials...")
        print(f"URL: {login_url}")
        print(f"Credentials: {credentials}")

        with httpx.Client() as client:
            response = client.post(
                login_url,
                json=credentials,
                headers={"Content-Type": "application/json"},
                timeout=10
            )

            print(f"Status Code: {response.status_code}")

            if response.status_code == 200:
                print("✅ Login successful!")
                data = response.json()
                print("Response:", json.dumps(data, indent=2))

                # Check if we got a token
                if "access_token" in data:
                    print(f"✓ Got access token: {data['access_token'][:50]}...")
                    return data
                else:
                    print("⚠️  Login successful but no access token in response")
                    return data
            else:
                print("❌ Login failed!")
                print("Response:", response.text)
                return None

    except Exception as e:
        print(f"❌ Error testing login: {e}")
        return None

if __name__ == "__main__":
    result = test_login()
