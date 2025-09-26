#!/bin/bash

# MetroMind Backend Health Check Script
# Comprehensive health monitoring for all backend services

set -e

# Configuration
API_URL="http://localhost:8010"
TIMEOUT=10
MAX_RETRIES=3

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Health check function
check_endpoint() {
    local endpoint=$1
    local expected_status=${2:-200}
    local retry_count=0
    
    while [ $retry_count -lt $MAX_RETRIES ]; do
        if curl -s -f --max-time $TIMEOUT "${API_URL}${endpoint}" > /dev/null 2>&1; then
            echo -e "${GREEN}✓${NC} ${endpoint} is healthy"
            return 0
        fi
        
        retry_count=$((retry_count + 1))
        if [ $retry_count -lt $MAX_RETRIES ]; then
            echo -e "${YELLOW}⚠${NC} ${endpoint} check failed, retrying... ($retry_count/$MAX_RETRIES)"
            sleep 2
        fi
    done
    
    echo -e "${RED}✗${NC} ${endpoint} is unhealthy"
    return 1
}

# Database connectivity check
check_database() {
    python3 -c "
import sys
import os
sys.path.append('/app')

try:
    from database import DatabaseManager
    
    db_manager = DatabaseManager()
    session = db_manager.get_session()
    
    # Simple query to test connectivity
    result = session.execute('SELECT 1').fetchone()
    session.close()
    
    if result:
        print('✓ Database connection healthy')
        sys.exit(0)
    else:
        print('✗ Database connection failed')
        sys.exit(1)
        
except Exception as e:
    print(f'✗ Database error: {e}')
    sys.exit(1)
"
    return $?
}

# Redis connectivity check
check_redis() {
    python3 -c "
import sys
import redis
import os

try:
    redis_client = redis.Redis(
        host=os.getenv('REDIS_HOST', 'localhost'),
        port=int(os.getenv('REDIS_PORT', 6379)),
        password=os.getenv('REDIS_PASSWORD'),
        socket_timeout=5,
        socket_connect_timeout=5
    )
    
    # Test Redis connection
    result = redis_client.ping()
    
    if result:
        print('✓ Redis connection healthy')
        sys.exit(0)
    else:
        print('✗ Redis connection failed')
        sys.exit(1)
        
except Exception as e:
    print(f'✗ Redis error: {e}')
    sys.exit(1)
"
    return $?
}

# Service-specific health checks
check_services() {
    local failed=0
    
    # Core API health
    if ! check_endpoint "/health"; then
        failed=1
    fi
    
    # Authentication service
    if ! check_endpoint "/auth/health"; then
        failed=1
    fi
    
    # Document service
    if ! check_endpoint "/documents/health"; then
        failed=1
    fi
    
    # Task service
    if ! check_endpoint "/tasks/health"; then
        failed=1
    fi
    
    # Search service
    if ! check_endpoint "/search/health"; then
        failed=1
    fi
    
    # Analytics service
    if ! check_endpoint "/analytics/health"; then
        failed=1
    fi
    
    return $failed
}

# Memory usage check
check_memory() {
    python3 -c "
import psutil
import sys

try:
    memory = psutil.virtual_memory()
    memory_percent = memory.percent
    
    if memory_percent < 90:
        print(f'✓ Memory usage: {memory_percent:.1f}%')
        sys.exit(0)
    else:
        print(f'⚠ High memory usage: {memory_percent:.1f}%')
        sys.exit(1)
        
except Exception as e:
    print(f'✗ Memory check error: {e}')
    sys.exit(1)
"
    return $?
}

# Disk space check
check_disk() {
    python3 -c "
import psutil
import sys

try:
    # Check main disk usage
    disk = psutil.disk_usage('/')
    disk_percent = (disk.used / disk.total) * 100
    
    # Check upload directory if exists
    upload_dir = '/app/data/uploads'
    if os.path.exists(upload_dir):
        upload_disk = psutil.disk_usage(upload_dir)
        upload_percent = (upload_disk.used / upload_disk.total) * 100
    else:
        upload_percent = 0
    
    max_usage = max(disk_percent, upload_percent)
    
    if max_usage < 85:
        print(f'✓ Disk usage: {max_usage:.1f}%')
        sys.exit(0)
    else:
        print(f'⚠ High disk usage: {max_usage:.1f}%')
        sys.exit(1)
        
except Exception as e:
    print(f'✗ Disk check error: {e}')
    sys.exit(1)
"
    return $?
}

# Main health check function
main() {
    echo "🏥 MetroMind Backend Health Check"
    echo "=================================="
    
    local overall_health=0
    
    # API endpoints check
    echo "📡 Checking API endpoints..."
    if ! check_services; then
        overall_health=1
    fi
    
    # Database connectivity
    echo "🗄️  Checking database connectivity..."
    if ! check_database; then
        overall_health=1
    fi
    
    # Redis connectivity
    echo "🔄 Checking Redis connectivity..."
    if ! check_redis; then
        overall_health=1
    fi
    
    # System resources
    echo "💾 Checking system resources..."
    if ! check_memory; then
        overall_health=1
    fi
    
    if ! check_disk; then
        overall_health=1
    fi
    
    echo "=================================="
    
    if [ $overall_health -eq 0 ]; then
        echo -e "${GREEN}✅ All health checks passed${NC}"
        exit 0
    else
        echo -e "${RED}❌ Some health checks failed${NC}"
        exit 1
    fi
}

# Execute main function
main "$@"