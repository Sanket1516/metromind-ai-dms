#!/usr/bin/env python3
"""
Database User Setup Script
Create test users and check existing users
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_db, User, UserRole, UserStatus
from sqlalchemy.orm import Session
import uuid
from datetime import datetime, timezone

def check_existing_users():
    """Check what users exist in the database"""
    print("👥 CHECKING EXISTING USERS")
    print("=" * 40)
    
    db = next(get_db())
    try:
        users = db.query(User).all()
        
        if not users:
            print("❌ No users found in database")
            return False
            
        print(f"✅ Found {len(users)} users:")
        for user in users:
            print(f"  📧 {user.email} - {user.role.value} ({user.status.value})")
            
        return True
        
    except Exception as e:
        print(f"❌ Error checking users: {e}")
        return False
    finally:
        db.close()

def create_test_user():
    """Create a test user for API testing"""
    print("\n👤 CREATING TEST USER")
    print("=" * 40)
    
    db = next(get_db())
    try:
        # Check if admin user exists
        existing_user = db.query(User).filter(User.email == "admin@kmrl.com").first()
        if existing_user:
            print("✅ Admin user already exists")
            print(f"   Email: {existing_user.email}")
            print(f"   Status: {existing_user.status.value}")
            return True
        
        # Create new admin user
        admin_user = User(
            id=str(uuid.uuid4()),
            username="admin",
            email="admin@kmrl.com",
            full_name="System Administrator",
            department="IT",
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE,
            created_at=datetime.now(timezone.utc)
        )
        
        # Set password (this should hash it)
        admin_user.set_password("admin123")
        
        db.add(admin_user)
        db.commit()
        
        print("✅ Test admin user created successfully")
        print(f"   Email: admin@kmrl.com")
        print(f"   Password: admin123")
        print(f"   Role: {admin_user.role.value}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating user: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def test_user_authentication():
    """Test if we can authenticate with created user"""
    print("\n🔐 TESTING USER AUTHENTICATION")
    print("=" * 40)
    
    import requests
    
    login_data = {
        "email": "admin@kmrl.com",
        "password": "admin123"
    }
    
    try:
        response = requests.post(
            "http://localhost:8010/auth/login",
            json=login_data,
            timeout=5
        )
        
        print(f"📊 Login Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Authentication successful!")
            print(f"   Token: {result.get('access_token', 'N/A')[:50]}...")
            print(f"   User: {result.get('user', {}).get('email', 'N/A')}")
            return result.get('access_token')
        else:
            print(f"❌ Authentication failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Authentication test error: {e}")
    
    return None

def main():
    print("🚀 DATABASE USER SETUP")
    print("=" * 50)
    
    # Check existing users
    users_exist = check_existing_users()
    
    # Create test user if needed
    if not users_exist:
        create_test_user()
    
    # Test authentication
    token = test_user_authentication()
    
    if token:
        print("\n🎉 SUCCESS: User setup and authentication working!")
    else:
        print("\n⚠️ WARNING: Authentication issues detected")

if __name__ == "__main__":
    main()