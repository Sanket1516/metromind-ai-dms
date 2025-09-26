#!/usr/bin/env python3
"""
Quick test to check database connection and enum status
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine
from sqlalchemy import text

def test_db_connection():
    """Test database connection and enum status"""
    try:
        print("Testing database connection...")
        
        with engine.connect() as conn:
            # Test basic connection
            result = conn.execute(text("SELECT 1 as test"))
            row = result.fetchone()
            print(f"✓ Database connection successful: {row[0]}")
            
            # Check if enum exists and what values it has
            try:
                result = conn.execute(text("""
                    SELECT unnest(enum_range(NULL::integrationstatus)) as values
                    ORDER BY values
                """))
                values = [row[0] for row in result.fetchall()]
                print(f"✓ Current enum values: {values}")
                
                if 'active' in values:
                    print("✓ 'active' is present in enum - no fix needed")
                    return True
                else:
                    print("✗ 'active' is MISSING from enum - need to fix")
                    return False
                    
            except Exception as e:
                print(f"✗ Error checking enum: {e}")
                print("  This might mean the enum doesn't exist yet")
                return False
                
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False

if __name__ == "__main__":
    success = test_db_connection()
    print(f"\nResult: {'SUCCESS' if success else 'NEEDS FIX'}")
