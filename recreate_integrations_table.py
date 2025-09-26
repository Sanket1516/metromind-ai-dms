#!/usr/bin/env python3
"""
Script to recreate integrations table with proper enum values
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, Base, IntegrationStatus
from sqlalchemy import text

def recreate_integrations_table():
    """Recreate integrations table with proper enum"""
    try:
        # Drop and recreate the integration status enum type
        with engine.connect() as conn:
            # Drop the old enum if it exists
            try:
                conn.execute(text("DROP TYPE IF EXISTS integrationstatus CASCADE"))
                conn.commit()
                print("Dropped old integrationstatus enum")
            except Exception as e:
                print(f"Note: {e}")
            
            # Create the new enum with correct values
            conn.execute(text("""
                CREATE TYPE integrationstatus AS ENUM (
                    'active', 'inactive', 'error', 'testing', 'pending_approval'
                )
            """))
            conn.commit()
            print("Created new integrationstatus enum")
            
            # Drop integrations table if it exists
            try:
                conn.execute(text("DROP TABLE IF EXISTS integrations CASCADE"))
                conn.commit()
                print("Dropped integrations table")
            except Exception as e:
                print(f"Note: {e}")
        
        # Recreate all tables
        Base.metadata.create_all(bind=engine, checkfirst=True)
        print("Recreated all tables with proper enum")
        
        print("✅ Integration enum status fixed successfully")
        
    except Exception as e:
        print(f"❌ Error recreating integrations table: {e}")
        return False
    
    return True

if __name__ == "__main__":
    recreate_integrations_table()