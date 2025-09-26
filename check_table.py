#!/usr/bin/env python3
"""
Check if integrations table exists and what columns it has
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine
from sqlalchemy import text

def check_table():
    """Check if integrations table exists and its structure"""
    try:
        print("Checking integrations table...")
        
        with engine.connect() as conn:
            # Check if table exists
            result = conn.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'integrations'
                )
            """))
            exists = result.fetchone()[0]
            
            if exists:
                print("✓ integrations table exists")
                
                # Check columns
                result = conn.execute(text("""
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns 
                    WHERE table_name = 'integrations' 
                    ORDER BY ordinal_position
                """))
                columns = result.fetchall()
                
                print("Columns:")
                for col in columns:
                    print(f"  - {col[0]}: {col[1]} ({'NULL' if col[2] == 'YES' else 'NOT NULL'})")
                
                # Specifically check for status column
                status_exists = any(col[0] == 'status' for col in columns)
                if status_exists:
                    print("✓ status column exists")
                else:
                    print("✗ status column MISSING")
                    
            else:
                print("✗ integrations table does NOT exist")
                
    except Exception as e:
        print(f"✗ Error checking table: {e}")

if __name__ == "__main__":
    check_table()
