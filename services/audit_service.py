"""
MetroMind Audit & Monitoring Service
Comprehensive audit logging, system monitoring, and performance tracking
"""

import os
import sys
from pathlib import Path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from fastapi import FastAPI, Depends, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import Column, String, DateTime, Text, JSON, Integer, Float, Boolean
from sqlalchemy.ext.declarative import declarative_base
import asyncio
import json
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any
import logging
import psutil
import requests
from enum import Enum
from pydantic import BaseModel
import aiofiles
from contextlib import asynccontextmanager

from database import get_db, Base, engine
from config import service_config, db_config
from utils.logging_utils import setup_service_logger

# Setup logging
logger = setup_service_logger("audit_service")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    # Startup
    asyncio.create_task(periodic_metric_collection())
    logger.info("Audit & Monitoring service started")
    yield
    # Shutdown (if needed)
    logger.info("Audit & Monitoring service shutdown")

app = FastAPI(
    title="MetroMind Audit & Monitoring Service",
    description="Comprehensive audit logging and system monitoring",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enums
class AuditActionType(str, Enum):
    # Authentication
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILED = "login_failed"
    LOGOUT = "logout"
    PASSWORD_CHANGED = "password_changed"
    
    # Documents
    DOCUMENT_UPLOADED = "document_uploaded"
    DOCUMENT_VIEWED = "document_viewed"
    DOCUMENT_DOWNLOADED = "document_downloaded"
    DOCUMENT_SHARED = "document_shared"
    DOCUMENT_DELETED = "document_deleted"
    DOCUMENT_UPDATED = "document_updated"
    
    # Tasks
    TASK_CREATED = "task_created"
    TASK_UPDATED = "task_updated"
    TASK_ASSIGNED = "task_assigned"
    TASK_COMPLETED = "task_completed"
    TASK_DELETED = "task_deleted"
    
    # System
    SYSTEM_STARTUP = "system_startup"
    SYSTEM_SHUTDOWN = "system_shutdown"
    CONFIG_CHANGED = "config_changed"
    BACKUP_CREATED = "backup_created"
    BACKUP_RESTORED = "backup_restored"
    
    # Security
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    PERMISSION_DENIED = "permission_denied"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    
    # Integrations
    INTEGRATION_CONNECTED = "integration_connected"
    INTEGRATION_SYNC = "integration_sync"
    INTEGRATION_ERROR = "integration_error"

class AlertSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class SystemMetricType(str, Enum):
    CPU_USAGE = "cpu_usage"
    MEMORY_USAGE = "memory_usage"
    DISK_USAGE = "disk_usage"
    NETWORK_USAGE = "network_usage"
    SERVICE_RESPONSE_TIME = "service_response_time"
    DATABASE_CONNECTIONS = "database_connections"
    ACTIVE_USERS = "active_users"
    REQUEST_COUNT = "request_count"
    ERROR_RATE = "error_rate"

# Database Models
class AuditEntry(Base):
    __tablename__ = "audit_entries"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    user_id = Column(String, index=True)
    username = Column(String)
    action_type = Column(String, index=True)
    resource_type = Column(String, index=True)
    resource_id = Column(String, index=True)
    details = Column(JSON)
    ip_address = Column(String)
    user_agent = Column(String)
    session_id = Column(String)
    success = Column(Boolean, default=True)
    error_message = Column(Text)

class SystemMetric(Base):
    __tablename__ = "system_metrics"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    metric_type = Column(String, index=True)
    metric_name = Column(String, index=True)
    value = Column(Float)
    unit = Column(String)
    service_name = Column(String, index=True)
    metric_metadata = Column(JSON)

class SecurityAlert(Base):
    __tablename__ = "security_alerts"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    severity = Column(String, index=True)
    alert_type = Column(String, index=True)
    title = Column(String)
    description = Column(Text)
    user_id = Column(String, index=True)
    ip_address = Column(String)
    resolved = Column(Boolean, default=False)
    resolved_by = Column(String)
    resolved_at = Column(DateTime(timezone=True))
    alert_metadata = Column(JSON)

class PerformanceLog(Base):
    __tablename__ = "performance_logs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    service_name = Column(String, index=True)
    endpoint = Column(String, index=True)
    method = Column(String)
    response_time = Column(Float)
    status_code = Column(Integer)
    user_id = Column(String)
    request_size = Column(Integer)
    response_size = Column(Integer)
    performance_metadata = Column(JSON)

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic Models
class AuditLogCreate(BaseModel):
    user_id: Optional[str] = None
    username: Optional[str] = None
    action_type: AuditActionType
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    session_id: Optional[str] = None
    success: bool = True
    error_message: Optional[str] = None

class SecurityAlertCreate(BaseModel):
    severity: AlertSeverity
    alert_type: str
    title: str
    description: str
    user_id: Optional[str] = None
    ip_address: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class SystemMetricCreate(BaseModel):
    metric_type: SystemMetricType
    metric_name: str
    value: float
    unit: str
    service_name: str
    metadata: Optional[Dict[str, Any]] = None

class PerformanceLogCreate(BaseModel):
    service_name: str
    endpoint: str
    method: str
    response_time: float
    status_code: int
    user_id: Optional[str] = None
    request_size: Optional[int] = None
    response_size: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None

class AuditQueryParams(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    user_id: Optional[str] = None
    action_type: Optional[str] = None
    resource_type: Optional[str] = None
    success: Optional[bool] = None
    limit: int = 100
    offset: int = 0

# Helper Functions
async def collect_system_metrics():
    """Collect system performance metrics"""
    try:
        # CPU usage
        cpu_percent = psutil.cpu_percent(interval=1)
        
        # Memory usage
        memory = psutil.virtual_memory()
        
        # Disk usage
        disk = psutil.disk_usage('/')
        
        # Network usage (simple implementation)
        network = psutil.net_io_counters()
        
        metrics = [
            {
                "metric_type": SystemMetricType.CPU_USAGE,
                "metric_name": "cpu_percent",
                "value": cpu_percent,
                "unit": "percent",
                "service_name": "system"
            },
            {
                "metric_type": SystemMetricType.MEMORY_USAGE,
                "metric_name": "memory_percent",
                "value": memory.percent,
                "unit": "percent",
                "service_name": "system",
                "metadata": {
                    "total": memory.total,
                    "available": memory.available,
                    "used": memory.used
                }
            },
            {
                "metric_type": SystemMetricType.DISK_USAGE,
                "metric_name": "disk_percent",
                "value": (disk.used / disk.total) * 100,
                "unit": "percent",
                "service_name": "system",
                "metadata": {
                    "total": disk.total,
                    "used": disk.used,
                    "free": disk.free
                }
            }
        ]
        
        return metrics
    except Exception as e:
        logger.error(f"Error collecting system metrics: {e}")
        return []

async def check_service_health():
    """Check health of all services"""
    services = [
        {"name": "auth_service", "url": f"http://localhost:{service_config.auth_service_port}/health"},
        {"name": "document_service", "url": f"http://localhost:{service_config.document_service_port}/health"},
        {"name": "task_service", "url": f"http://localhost:{service_config.task_service_port}/health"},
        {"name": "integration_service", "url": f"http://localhost:{service_config.integration_service_port}/health"},
        {"name": "realtime_service", "url": f"http://localhost:{service_config.realtime_service_port}/health"},
    ]
    
    health_metrics = []
    
    for service in services:
        try:
            start_time = datetime.now()
            response = requests.get(service["url"], timeout=5)
            response_time = (datetime.now() - start_time).total_seconds()
            
            health_metrics.append({
                "metric_type": SystemMetricType.SERVICE_RESPONSE_TIME,
                "metric_name": f"{service['name']}_response_time",
                "value": response_time,
                "unit": "seconds",
                "service_name": service["name"],
                "metadata": {
                    "status_code": response.status_code,
                    "healthy": response.status_code == 200
                }
            })
        except Exception as e:
            health_metrics.append({
                "metric_type": SystemMetricType.SERVICE_RESPONSE_TIME,
                "metric_name": f"{service['name']}_response_time",
                "value": -1,
                "unit": "seconds",
                "service_name": service["name"],
                "metadata": {
                    "error": str(e),
                    "healthy": False
                }
            })
    
    return health_metrics

# Background Tasks
async def periodic_metric_collection():
    """Collect metrics periodically"""
    while True:
        try:
            # Collect system metrics
            system_metrics = await collect_system_metrics()
            
            # Collect service health metrics
            health_metrics = await check_service_health()
            
            # Store metrics in database
            db = next(get_db())
            try:
                for metric_data in system_metrics + health_metrics:
                    metric = SystemMetric(**metric_data)
                    db.add(metric)
                db.commit()
            except Exception as e:
                logger.error(f"Error storing metrics: {e}")
                db.rollback()
            finally:
                db.close()
            
            # Wait 60 seconds before next collection
            await asyncio.sleep(60)
            
        except Exception as e:
            logger.error(f"Error in periodic metric collection: {e}")
            # Add a startup delay and a shorter retry delay on error
            if 'startup' in locals() and startup:
                await asyncio.sleep(15) # Initial delay on first run
                startup = False
            else:
                await asyncio.sleep(30)

# API Endpoints
@app.post("/audit/log")
async def create_audit_log(
    audit_data: AuditLogCreate,
    db: Session = Depends(get_db)
):
    """Create a new audit log entry"""
    try:
        audit_log = AuditEntry(
            timestamp=datetime.now(timezone.utc),
            user_id=audit_data.user_id,
            username=audit_data.username,
            action_type=audit_data.action_type,
            resource_type=audit_data.resource_type,
            resource_id=audit_data.resource_id,
            details=audit_data.details,
            ip_address=audit_data.ip_address,
            user_agent=audit_data.user_agent,
            session_id=audit_data.session_id,
            success=audit_data.success,
            error_message=audit_data.error_message
        )
        
        db.add(audit_log)
        db.commit()
        db.refresh(audit_log)
        
        logger.info(f"Audit log created: {audit_log.id}")
        return {"success": True, "audit_log_id": audit_log.id}
        
    except Exception as e:
        logger.error(f"Error creating audit log: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create audit log")

@app.get("/audit/logs")
async def get_audit_logs(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    user_id: Optional[str] = Query(None),
    action_type: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    success: Optional[bool] = Query(None),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Get audit logs with filtering"""
    try:
        query = db.query(AuditEntry)
        
        # Apply filters
        if start_date:
            query = query.filter(AuditEntry.timestamp >= start_date)
        if end_date:
            query = query.filter(AuditEntry.timestamp <= end_date)
        if user_id:
            query = query.filter(AuditEntry.user_id == user_id)
        if action_type:
            query = query.filter(AuditEntry.action_type == action_type)
        if resource_type:
            query = query.filter(AuditEntry.resource_type == resource_type)
        if success is not None:
            query = query.filter(AuditEntry.success == success)
        
        # Get total count
        total = query.count()
        
        # Apply pagination and ordering
        logs = query.order_by(AuditEntry.timestamp.desc()).offset(offset).limit(limit).all()
        
        return {
            "logs": logs,
            "total": total,
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        logger.error(f"Error getting audit logs: {e}")
        raise HTTPException(status_code=500, detail="Failed to get audit logs")

@app.post("/security/alert")
async def create_security_alert(
    alert_data: SecurityAlertCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Create a new security alert"""
    try:
        alert = SecurityAlert(
            timestamp=datetime.now(timezone.utc),
            severity=alert_data.severity,
            alert_type=alert_data.alert_type,
            title=alert_data.title,
            description=alert_data.description,
            user_id=alert_data.user_id,
            ip_address=alert_data.ip_address,
            metadata=alert_data.metadata
        )
        
        db.add(alert)
        db.commit()
        db.refresh(alert)
        
        # Send notification for high/critical alerts
        if alert_data.severity in [AlertSeverity.HIGH, AlertSeverity.CRITICAL]:
            background_tasks.add_task(send_alert_notification, alert.id)
        
        logger.warning(f"Security alert created: {alert.id} - {alert.title}")
        return {"success": True, "alert_id": alert.id}
        
    except Exception as e:
        logger.error(f"Error creating security alert: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create security alert")

@app.get("/security/alerts")
async def get_security_alerts(
    severity: Optional[AlertSeverity] = Query(None),
    resolved: Optional[bool] = Query(None),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Get security alerts with filtering"""
    try:
        query = db.query(SecurityAlert)
        
        if severity:
            query = query.filter(SecurityAlert.severity == severity)
        if resolved is not None:
            query = query.filter(SecurityAlert.resolved == resolved)
        
        total = query.count()
        alerts = query.order_by(SecurityAlert.timestamp.desc()).offset(offset).limit(limit).all()
        
        return {
            "alerts": alerts,
            "total": total,
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        logger.error(f"Error getting security alerts: {e}")
        raise HTTPException(status_code=500, detail="Failed to get security alerts")

@app.put("/security/alerts/{alert_id}/resolve")
async def resolve_security_alert(
    alert_id: str,
    resolved_by: str,
    db: Session = Depends(get_db)
):
    """Resolve a security alert"""
    try:
        alert = db.query(SecurityAlert).filter(SecurityAlert.id == alert_id).first()
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        alert.resolved = True
        alert.resolved_by = resolved_by
        alert.resolved_at = datetime.now(timezone.utc)
        
        db.commit()
        
        return {"success": True, "message": "Alert resolved"}
        
    except Exception as e:
        logger.error(f"Error resolving alert: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to resolve alert")

@app.post("/metrics/log")
async def log_metric(
    metric_data: SystemMetricCreate,
    db: Session = Depends(get_db)
):
    """Log a system metric"""
    try:
        metric = SystemMetric(
            timestamp=datetime.now(timezone.utc),
            metric_type=metric_data.metric_type,
            metric_name=metric_data.metric_name,
            value=metric_data.value,
            unit=metric_data.unit,
            service_name=metric_data.service_name,
            metadata=metric_data.metadata
        )
        
        db.add(metric)
        db.commit()
        
        return {"success": True, "message": "Metric logged"}
        
    except Exception as e:
        logger.error(f"Error logging metric: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to log metric")

@app.get("/metrics")
async def get_metrics(
    metric_type: Optional[SystemMetricType] = Query(None),
    service_name: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    limit: int = Query(1000, le=10000),
    db: Session = Depends(get_db)
):
    """Get system metrics with filtering"""
    try:
        query = db.query(SystemMetric)
        
        if metric_type:
            query = query.filter(SystemMetric.metric_type == metric_type)
        if service_name:
            query = query.filter(SystemMetric.service_name == service_name)
        if start_date:
            query = query.filter(SystemMetric.timestamp >= start_date)
        if end_date:
            query = query.filter(SystemMetric.timestamp <= end_date)
        
        metrics = query.order_by(SystemMetric.timestamp.desc()).limit(limit).all()
        
        return {
            "metrics": metrics,
            "count": len(metrics)
        }
        
    except Exception as e:
        logger.error(f"Error getting metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get metrics")

@app.post("/performance/log")
async def log_performance(
    perf_data: PerformanceLogCreate,
    db: Session = Depends(get_db)
):
    """Log performance data"""
    try:
        perf_log = PerformanceLog(
            timestamp=datetime.now(timezone.utc),
            service_name=perf_data.service_name,
            endpoint=perf_data.endpoint,
            method=perf_data.method,
            response_time=perf_data.response_time,
            status_code=perf_data.status_code,
            user_id=perf_data.user_id,
            request_size=perf_data.request_size,
            response_size=perf_data.response_size,
            metadata=perf_data.metadata
        )
        
        db.add(perf_log)
        db.commit()
        
        return {"success": True, "message": "Performance data logged"}
        
    except Exception as e:
        logger.error(f"Error logging performance data: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to log performance data")

@app.get("/dashboard/stats")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics"""
    try:
        # Get recent activity counts
        last_24h = datetime.now(timezone.utc) - timedelta(hours=24)
        
        audit_count_24h = db.query(AuditEntry).filter(AuditEntry.timestamp >= last_24h).count()
        security_alerts_unresolved = db.query(SecurityAlert).filter(SecurityAlert.resolved == False).count()
        
        # Get latest metrics
        latest_cpu = db.query(SystemMetric).filter(
            SystemMetric.metric_name == "cpu_percent"
        ).order_by(SystemMetric.timestamp.desc()).first()
        
        latest_memory = db.query(SystemMetric).filter(
            SystemMetric.metric_name == "memory_percent"
        ).order_by(SystemMetric.timestamp.desc()).first()
        
        # Service health
        service_health = {}
        health_metrics = db.query(SystemMetric).filter(
            SystemMetric.metric_type == SystemMetricType.SERVICE_RESPONSE_TIME
        ).order_by(SystemMetric.timestamp.desc()).limit(10).all()
        
        for metric in health_metrics:
            if metric.service_name not in service_health:
                service_health[metric.service_name] = {
                    "response_time": metric.value,
                    "healthy": (metric.metric_metadata or {}).get("healthy", False),
                    "last_check": metric.timestamp.isoformat()
                }
        
        return {
            "audit_logs_24h": audit_count_24h,
            "unresolved_alerts": security_alerts_unresolved,
            "current_cpu_usage": latest_cpu.value if latest_cpu else None,
            "current_memory_usage": latest_memory.value if latest_memory else None,
            "service_health": service_health,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get dashboard stats")

async def send_alert_notification(alert_id: str):
    """Send notification for security alert"""
    # This would integrate with email/SMS/Slack notifications
    # For now, just log the alert
    logger.critical(f"SECURITY ALERT: {alert_id} requires immediate attention")

@app.get("/health")
async def health_check():
    """Service health check"""
    return {
        "status": "healthy",
        "service": "Audit & Monitoring Service",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/")
async def root():
    """Service root endpoint"""
    return {
        "service": "MetroMind Audit & Monitoring Service",
        "version": "1.0.0",
        "features": [
            "Comprehensive audit logging",
            "System metrics collection",
            "Security alert management",
            "Performance monitoring",
            "Real-time dashboards",
            "Automated health checks",
            "Alert notifications"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    
    audit_port = service_config.model_downloader_port + 3  # Port 8022
    logger.info(f"Starting Audit & Monitoring service on port {audit_port}")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=audit_port,
        log_level="info"
    )