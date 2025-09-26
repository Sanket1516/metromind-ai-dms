#!/usr/bin/env python3
"""
Fix the integration status enum issue
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fix_integration_status_enum():
    """Fix the PostgreSQL enum type for integration status"""
    try:
        logger.info("Connecting to database...")
        
        with engine.connect() as conn:
            # Check current enum values
            try:
                result = conn.execute(text("""
                    SELECT unnest(enum_range(NULL::integrationstatus)) as values
                """))
                current_values = [row[0] for row in result.fetchall()]
                logger.info(f"Current enum values: {current_values}")
                
                if 'active' not in current_values:
                    logger.info("'active' not found in enum, recreating...")
                    
                    # Drop the old enum and recreate it
                    conn.execute(text("DROP TYPE IF EXISTS integrationstatus CASCADE"))
                    conn.commit()
                    logger.info("Dropped old enum")
                    
                    # Create new enum with correct values
                    conn.execute(text("""
                        CREATE TYPE integrationstatus AS ENUM (
                            'active', 'inactive', 'error', 'testing', 'pending_approval'
                        )
                    """))
                    conn.commit()
                    logger.info("Created new enum with 'active' value")
                    
                else:
                    logger.info("Enum already contains 'active', no changes needed")
                    
            except Exception as e:
                logger.warning(f"Error checking enum (might not exist yet): {e}")
                # Try to create the enum
                try:
                    conn.execute(text("""
                        CREATE TYPE integrationstatus AS ENUM (
                            'active', 'inactive', 'error', 'testing', 'pending_approval'
                        )
                    """))
                    conn.commit()
                    logger.info("Created new enum type")
                except Exception as create_e:
                    logger.error(f"Failed to create enum: {create_e}")
                    return False
            
            # Verify the enum was created correctly
            result = conn.execute(text("""
                SELECT unnest(enum_range(NULL::integrationstatus)) as values
            """))
            final_values = [row[0] for row in result.fetchall()]
            logger.info(f"Final enum values: {final_values}")
            
            if 'active' in final_values:
                logger.info("✅ SUCCESS: Enum now contains 'active'")
                return True
            else:
                logger.error("❌ FAILED: Enum still doesn't contain 'active'")
                return False
                
    except Exception as e:
        logger.error(f"❌ Error fixing enum: {e}")
        return False

if __name__ == "__main__":
    success = fix_integration_status_enum()
    if success:
        print("✅ Integration status enum fixed successfully")
    else:
        print("❌ Failed to fix integration status enum")
        sys.exit(1)
