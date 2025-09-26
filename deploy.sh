#!/bin/bash

# MetroMind Production Deployment Script
# Comprehensive deployment automation for all services

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="metromind"
ENVIRONMENT=${1:-production}
VERSION=${2:-latest}
DOCKER_REGISTRY=${DOCKER_REGISTRY:-"localhost:5000"}
NAMESPACE=${NAMESPACE:-"metromind"}

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verify prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check required tools
    local tools=("docker" "docker-compose" "kubectl" "helm")
    for tool in "${tools[@]}"; do
        if ! command -v $tool &> /dev/null; then
            error "$tool is not installed or not in PATH"
            exit 1
        fi
    done
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running"
        exit 1
    fi
    
    # Check Kubernetes context
    if ! kubectl cluster-info &> /dev/null; then
        warning "Kubernetes cluster not accessible. Skipping K8s deployment."
        SKIP_K8S=true
    fi
    
    success "Prerequisites check completed"
}

# Build all services
build_services() {
    log "Building MetroMind services..."
    
    # Backend services
    log "Building backend services..."
    docker build -t ${DOCKER_REGISTRY}/${PROJECT_NAME}-backend:${VERSION} \
        -f docker/Dockerfile.backend .
    
    # Frontend
    log "Building frontend..."
    cd frontend
    npm ci --only=production
    npm run build
    cd ..
    docker build -t ${DOCKER_REGISTRY}/${PROJECT_NAME}-frontend:${VERSION} \
        -f docker/Dockerfile.frontend .
    
    # Browser extension
    log "Building browser extension..."
    cd browser-extension
    npm ci --only=production
    npm run build
    cd ..
    
    # Redis (custom configuration)
    docker build -t ${DOCKER_REGISTRY}/${PROJECT_NAME}-redis:${VERSION} \
        -f docker/Dockerfile.redis .
    
    # PostgreSQL (custom configuration)
    docker build -t ${DOCKER_REGISTRY}/${PROJECT_NAME}-postgres:${VERSION} \
        -f docker/Dockerfile.postgres .
    
    success "All services built successfully"
}

# Run tests
run_tests() {
    log "Running comprehensive test suite..."
    
    # Backend tests
    log "Running backend tests..."
    python -m pytest tests/backend/ -v --cov --cov-report=html
    
    # Frontend tests
    log "Running frontend tests..."
    cd frontend
    npm test -- --coverage --watchAll=false
    cd ..
    
    # Extension tests
    log "Running browser extension tests..."
    cd tests
    npm test extension/
    cd ..
    
    # E2E tests
    log "Running end-to-end tests..."
    cd tests
    npm test e2e/
    cd ..
    
    success "All tests passed"
}

# Security scanning
security_scan() {
    log "Running security scans..."
    
    # Container security scanning
    if command -v trivy &> /dev/null; then
        log "Scanning container images for vulnerabilities..."
        trivy image ${DOCKER_REGISTRY}/${PROJECT_NAME}-backend:${VERSION}
        trivy image ${DOCKER_REGISTRY}/${PROJECT_NAME}-frontend:${VERSION}
    else
        warning "Trivy not found. Skipping container security scan."
    fi
    
    # Python dependency scanning
    if command -v safety &> /dev/null; then
        log "Scanning Python dependencies..."
        safety check -r requirements.txt
    else
        warning "Safety not found. Skipping Python dependency scan."
    fi
    
    # Node.js dependency scanning
    log "Scanning Node.js dependencies..."
    cd frontend
    npm audit --audit-level=high
    cd ..
    
    success "Security scans completed"
}

# Push images to registry
push_images() {
    log "Pushing images to registry..."
    
    # Login to registry if credentials provided
    if [ ! -z "$DOCKER_USERNAME" ] && [ ! -z "$DOCKER_PASSWORD" ]; then
        echo "$DOCKER_PASSWORD" | docker login $DOCKER_REGISTRY -u "$DOCKER_USERNAME" --password-stdin
    fi
    
    # Push all images
    docker push ${DOCKER_REGISTRY}/${PROJECT_NAME}-backend:${VERSION}
    docker push ${DOCKER_REGISTRY}/${PROJECT_NAME}-frontend:${VERSION}
    docker push ${DOCKER_REGISTRY}/${PROJECT_NAME}-redis:${VERSION}
    docker push ${DOCKER_REGISTRY}/${PROJECT_NAME}-postgres:${VERSION}
    
    success "Images pushed to registry"
}

# Deploy using Docker Compose
deploy_docker_compose() {
    log "Deploying using Docker Compose..."
    
    # Create environment file
    cat > .env.${ENVIRONMENT} << EOF
# MetroMind ${ENVIRONMENT} Configuration
ENVIRONMENT=${ENVIRONMENT}
VERSION=${VERSION}
DOCKER_REGISTRY=${DOCKER_REGISTRY}
PROJECT_NAME=${PROJECT_NAME}

# Database Configuration
POSTGRES_DB=metromind_${ENVIRONMENT}
POSTGRES_USER=metromind
POSTGRES_PASSWORD=$(openssl rand -hex 16)

# Redis Configuration
REDIS_PASSWORD=$(openssl rand -hex 16)

# JWT Configuration
JWT_SECRET_KEY=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)

# API Configuration
API_HOST=0.0.0.0
API_PORT=8010

# Frontend Configuration
REACT_APP_API_URL=http://localhost:8010
REACT_APP_VERSION=${VERSION}

# Email Configuration
SMTP_HOST=${SMTP_HOST:-smtp.gmail.com}
SMTP_PORT=${SMTP_PORT:-587}
SMTP_USERNAME=${SMTP_USERNAME}
SMTP_PASSWORD=${SMTP_PASSWORD}

# File Storage
UPLOAD_DIR=/app/data/uploads
MAX_FILE_SIZE=100MB

# Performance Monitoring
ENABLE_METRICS=true
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
EOF

    # Deploy with Docker Compose
    docker-compose -f docker-compose.${ENVIRONMENT}.yml --env-file .env.${ENVIRONMENT} up -d
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    sleep 30
    
    # Health check
    check_service_health
    
    success "Docker Compose deployment completed"
}

# Deploy to Kubernetes
deploy_kubernetes() {
    if [ "$SKIP_K8S" = true ]; then
        warning "Skipping Kubernetes deployment"
        return
    fi
    
    log "Deploying to Kubernetes..."
    
    # Create namespace
    kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    
    # Deploy using Helm
    if [ -d "helm/metromind" ]; then
        helm upgrade --install metromind helm/metromind \
            --namespace $NAMESPACE \
            --set image.tag=$VERSION \
            --set image.registry=$DOCKER_REGISTRY \
            --set environment=$ENVIRONMENT \
            --wait --timeout=10m
    else
        # Use kubectl for direct deployment
        envsubst < k8s/deployment.yaml | kubectl apply -f -
        envsubst < k8s/service.yaml | kubectl apply -f -
        envsubst < k8s/ingress.yaml | kubectl apply -f -
    fi
    
    # Wait for deployment
    kubectl rollout status deployment/metromind-backend -n $NAMESPACE --timeout=600s
    kubectl rollout status deployment/metromind-frontend -n $NAMESPACE --timeout=600s
    
    success "Kubernetes deployment completed"
}

# Health check for all services
check_service_health() {
    log "Performing health checks..."
    
    local max_attempts=30
    local attempt=1
    
    # Check backend health
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:8010/health | grep -q "healthy"; then
            success "Backend service is healthy"
            break
        fi
        
        log "Attempt $attempt: Backend not ready, waiting..."
        sleep 10
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        error "Backend service health check failed"
        return 1
    fi
    
    # Check frontend
    if curl -s http://localhost:3000 | grep -q "MetroMind"; then
        success "Frontend service is healthy"
    else
        warning "Frontend service may not be fully ready"
    fi
    
    # Check database connectivity
    if docker-compose exec -T postgres pg_isready -U metromind; then
        success "Database is healthy"
    else
        error "Database health check failed"
        return 1
    fi
    
    # Check Redis
    if docker-compose exec -T redis redis-cli ping | grep -q "PONG"; then
        success "Redis is healthy"
    else
        error "Redis health check failed"
        return 1
    fi
}

# Database migration
run_migrations() {
    log "Running database migrations..."
    
    # Wait for database to be ready
    log "Waiting for database..."
    sleep 10
    
    # Run Alembic migrations
    docker-compose exec backend python -m alembic upgrade head
    
    # Create sample data if not exists
    docker-compose exec backend python -c "
from database import DatabaseManager
from sqlalchemy.exc import IntegrityError

db_manager = DatabaseManager()
session = db_manager.get_session()

try:
    # Check if admin user exists
    from database import User
    admin_user = session.query(User).filter_by(username='admin').first()
    
    if not admin_user:
        db_manager.create_admin_user()
        print('Admin user created')
    else:
        print('Admin user already exists')
        
except Exception as e:
    print(f'Error setting up database: {e}')
finally:
    session.close()
"
    
    success "Database migrations completed"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring stack..."
    
    # Deploy Prometheus
    docker-compose -f docker-compose.monitoring.yml up -d prometheus
    
    # Deploy Grafana
    docker-compose -f docker-compose.monitoring.yml up -d grafana
    
    # Wait for services
    sleep 20
    
    # Import Grafana dashboards
    if [ -d "monitoring/grafana/dashboards" ]; then
        log "Importing Grafana dashboards..."
        for dashboard in monitoring/grafana/dashboards/*.json; do
            curl -X POST \
                -H "Content-Type: application/json" \
                -d @"$dashboard" \
                http://admin:admin@localhost:3001/api/dashboards/db
        done
    fi
    
    success "Monitoring stack deployed"
}

# Cleanup old deployments
cleanup() {
    log "Cleaning up old deployments..."
    
    # Remove old Docker images
    docker image prune -f
    
    # Remove old containers
    docker container prune -f
    
    # Clean build artifacts
    rm -rf frontend/build
    rm -rf frontend/node_modules/.cache
    
    success "Cleanup completed"
}

# Rollback function
rollback() {
    local previous_version=${1:-"previous"}
    warning "Rolling back to version: $previous_version"
    
    # Rollback Docker Compose
    if [ -f "docker-compose.${ENVIRONMENT}.yml" ]; then
        VERSION=$previous_version docker-compose -f docker-compose.${ENVIRONMENT}.yml up -d
    fi
    
    # Rollback Kubernetes
    if [ "$SKIP_K8S" != true ]; then
        kubectl rollout undo deployment/metromind-backend -n $NAMESPACE
        kubectl rollout undo deployment/metromind-frontend -n $NAMESPACE
    fi
    
    success "Rollback completed"
}

# Main deployment function
main() {
    log "Starting MetroMind deployment for environment: $ENVIRONMENT"
    log "Version: $VERSION"
    
    case "${1:-deploy}" in
        "test")
            check_prerequisites
            run_tests
            ;;
        "build")
            check_prerequisites
            build_services
            ;;
        "security")
            security_scan
            ;;
        "deploy")
            check_prerequisites
            build_services
            run_tests
            security_scan
            push_images
            deploy_docker_compose
            run_migrations
            deploy_kubernetes
            setup_monitoring
            check_service_health
            cleanup
            ;;
        "rollback")
            rollback $2
            ;;
        "health")
            check_service_health
            ;;
        *)
            echo "Usage: $0 {test|build|security|deploy|rollback|health} [environment] [version]"
            echo "  test     - Run test suite only"
            echo "  build    - Build services only"
            echo "  security - Run security scans only"
            echo "  deploy   - Full deployment (default)"
            echo "  rollback - Rollback to previous version"
            echo "  health   - Check service health"
            exit 1
            ;;
    esac
    
    success "MetroMind deployment completed successfully!"
    log "Access the application at:"
    log "  Frontend: http://localhost:3000"
    log "  Backend API: http://localhost:8010"
    log "  Grafana: http://localhost:3001 (admin/admin)"
    log "  Prometheus: http://localhost:9090"
}

# Execute main function with all arguments
main "$@"