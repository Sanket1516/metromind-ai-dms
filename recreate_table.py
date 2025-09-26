#!/usr/bin/env python3
"""
Recreate the integrations table after enum fix
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import Base, engine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def recreate_integrations_table():
    """Recreate the integrations table with the fixed enum"""
    try:
        logger.info("Recreating integrations table...")
        
        # This will create all tables that don't exist, including integrations
        Base.metadata.create_all(bind=engine, checkfirst=True)
        
        logger.info("✅ Integrations table recreated successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error recreating integrations table: {e}")
        return False

if __name__ == "__main__":
    success = recreate_integrations_table()
    if success:
        print("✅ Table recreation completed")
    else:
        print("❌ Table recreation failed")
        sys.exit(1)
