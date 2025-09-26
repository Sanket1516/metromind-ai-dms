#!/usr/bin/env python3
"""
Debug authentication issue by checking database directly
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_db, User
from sqlalchemy.orm import Session
import bcrypt

def debug_user_authentication():
    """Debug user authentication by checking password hashes"""
    print("🔍 DEBUGGING USER AUTHENTICATION")
    print("=" * 50)
    
    db = next(get_db())
    try:
        # Get admin user
        admin_user = db.query(User).filter(User.email == "admin@kmrl.gov.in").first()
        
        if not admin_user:
            print("❌ Admin user not found!")
            return
            
        print(f"✅ Found admin user: {admin_user.email}")
        print(f"   Username: {admin_user.username}")
        print(f"   Status: {admin_user.status.value}")
        print(f"   Role: {admin_user.role.value}")
        print(f"   Password hash exists: {'Yes' if admin_user.password_hash else 'No'}")
        
        if admin_user.password_hash:
            print(f"   Password hash: {admin_user.password_hash[:50]}...")
            
            # Test password verification
            test_passwords = ["Metro@123", "admin123", "password", ""]
            
            print("\n🔐 Testing password verification:")
            for password in test_passwords:
                try:
                    is_valid = admin_user.verify_password(password)
                    print(f"   '{password}': {'✅ VALID' if is_valid else '❌ Invalid'}")
                except Exception as e:
                    print(f"   '{password}': ❌ Error - {e}")
        
        # Try to reset password for testing
        print("\n🔧 Resetting password to 'admin123' for testing...")
        admin_user.set_password("admin123")
        db.commit()
        
        # Verify new password
        is_valid = admin_user.verify_password("admin123")
        print(f"   New password verification: {'✅ SUCCESS' if is_valid else '❌ FAILED'}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    debug_user_authentication()