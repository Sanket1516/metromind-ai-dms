#!/usr/bin/env python3
"""
Script to fix database schema issues
"""

from database import db_manager
from sqlalchemy import text

def fix_database():
    print("Fixing database schema...")
    
    # Drop and recreate integrations table
    with db_manager.engine.connect() as conn:
        try:
            conn.execute(text('DROP TABLE IF EXISTS integrations CASCADE'))
            conn.commit()
            print("Dropped integrations table")
        except Exception as e:
            print(f"Error dropping table: {e}")
    
    # Recreate all tables
    try:
        db_manager.create_tables()
        print("Recreated all tables successfully")
    except Exception as e:
        print(f"Error creating tables: {e}")

if __name__ == "__main__":
    fix_database()