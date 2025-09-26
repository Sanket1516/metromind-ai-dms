"""
MetroMind Advanced Reporting Service
Custom reports, data visualization, analytics dashboards, and business intelligence
"""

import os
import sys
from pathlib import Path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import Column, String, DateTime, Text, JSON, Integer, Boolean, Float, func, and_, or_
from sqlalchemy.ext.declarative import declarative_base
import asyncio
import json
import uuid
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.graph_objects as go
import plotly.express as px
from plotly.utils import PlotlyJSONEncoder
import io
import base64
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any, Union
import logging
from enum import Enum
from pydantic import BaseModel
import schedule
import time
import threading

from database import get_db, Base, engine, User, Document, Task
from config import service_config, app_config
from utils.logging_utils import setup_service_logger

# Setup logging
logger = setup_service_logger("reporting_service")

app = FastAPI(
    title="MetroMind Advanced Reporting Service",
    description="Custom reports, analytics dashboards, and business intelligence",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure matplotlib for headless operation
plt.switch_backend('Agg')
sns.set_style("whitegrid")

# Enums
class ReportType(str, Enum):
    DOCUMENT_ANALYTICS = "document_analytics"
    USER_ACTIVITY = "user_activity"
    TASK_PERFORMANCE = "task_performance"
    SYSTEM_USAGE = "system_usage"
    SECURITY_REPORT = "security_report"
    INTEGRATION_METRICS = "integration_metrics"
    CUSTOM = "custom"

class ReportFormat(str, Enum):
    PDF = "pdf"
    EXCEL = "excel"
    CSV = "csv"
    JSON = "json"
    HTML = "html"

class VisualizationType(str, Enum):
    BAR_CHART = "bar_chart"
    LINE_CHART = "line_chart"
    PIE_CHART = "pie_chart"
    SCATTER_PLOT = "scatter_plot"
    HEATMAP = "heatmap"
    TABLE = "table"
    HISTOGRAM = "histogram"
    BOX_PLOT = "box_plot"

class ReportFrequency(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"

class ReportStatus(str, Enum):
    SCHEDULED = "scheduled"
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

# Database Models
class ReportTemplate(Base):
    __tablename__ = "report_templates"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text)
    report_type = Column(String, nullable=False)
    
    # Template configuration
    query_definition = Column(JSON)  # SQL query or data source definition
    visualization_config = Column(JSON)  # Chart/visualization settings
    layout_config = Column(JSON)  # Report layout and formatting
    parameters = Column(JSON)  # Configurable parameters
    
    # Metadata
    created_by = Column(String)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    is_public = Column(Boolean, default=False)
    
    # Settings
    auto_refresh_enabled = Column(Boolean, default=False)
    cache_duration_minutes = Column(Integer, default=60)

class ReportSchedule(Base):
    __tablename__ = "report_schedules"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    template_id = Column(String, nullable=False)
    name = Column(String, nullable=False)
    
    # Schedule configuration
    frequency = Column(String, nullable=False)
    schedule_time = Column(String)  # Cron-like schedule
    timezone = Column(String, default="UTC")
    
    # Recipients
    recipients = Column(JSON)  # List of email addresses
    notification_enabled = Column(Boolean, default=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    last_run = Column(DateTime(timezone=True))
    next_run = Column(DateTime(timezone=True))
    
    # Metadata
    created_by = Column(String)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class ReportExecution(Base):
    __tablename__ = "report_executions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    template_id = Column(String, nullable=False)
    schedule_id = Column(String)  # Optional, for scheduled reports
    
    # Execution details
    status = Column(String, default=ReportStatus.SCHEDULED)
    started_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    completed_at = Column(DateTime(timezone=True))
    
    # Report details
    report_format = Column(String)
    file_path = Column(String)
    file_size = Column(Integer)
    
    # Parameters used
    parameters = Column(JSON)
    
    # Results
    record_count = Column(Integer)
    error_message = Column(Text)
    
    # Metadata
    generated_by = Column(String)
    report_metadata = Column(JSON)

class Dashboard(Base):
    __tablename__ = "dashboards"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text)
    
    # Dashboard configuration
    layout = Column(JSON)  # Grid layout configuration
    widgets = Column(JSON)  # List of widgets/charts
    filters = Column(JSON)  # Global dashboard filters
    
    # Access control
    owner_id = Column(String, nullable=False)
    is_public = Column(Boolean, default=False)
    shared_with = Column(JSON)  # List of user IDs with access
    
    # Metadata
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic Models
class ReportTemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    report_type: ReportType
    query_definition: Dict[str, Any]
    visualization_config: Optional[Dict[str, Any]] = None
    layout_config: Optional[Dict[str, Any]] = None
    parameters: Optional[Dict[str, Any]] = None
    is_public: bool = False
    auto_refresh_enabled: bool = False
    cache_duration_minutes: int = 60

class ReportScheduleCreate(BaseModel):
    template_id: str
    name: str
    frequency: ReportFrequency
    schedule_time: Optional[str] = None
    timezone: str = "UTC"
    recipients: List[str]
    notification_enabled: bool = True

class ReportGenerateRequest(BaseModel):
    template_id: str
    format: ReportFormat = ReportFormat.PDF
    parameters: Optional[Dict[str, Any]] = None

class DashboardCreate(BaseModel):
    name: str
    description: Optional[str] = None
    layout: Dict[str, Any]
    widgets: List[Dict[str, Any]]
    filters: Optional[Dict[str, Any]] = None
    is_public: bool = False
    shared_with: Optional[List[str]] = None

# Report Generator Classes
class DataAnalyzer:
    """Utility class for data analysis and metrics calculation"""
    
    @staticmethod
    def get_document_analytics(db: Session, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get document analytics"""
        # Document counts
        total_documents = db.query(Document).count()
        documents_in_period = db.query(Document).filter(
            Document.created_at.between(start_date, end_date)
        ).count()
        
        # Document by type
        doc_by_type = db.query(
            Document.file_type, 
            func.count(Document.id).label('count')
        ).group_by(Document.file_type).all()
        
        # Document by size ranges
        size_ranges = [
            ("< 1MB", 0, 1024*1024),
            ("1-10MB", 1024*1024, 10*1024*1024),
            ("10-100MB", 10*1024*1024, 100*1024*1024),
            ("> 100MB", 100*1024*1024, float('inf'))
        ]
        
        doc_by_size = []
        for label, min_size, max_size in size_ranges:
            count = db.query(Document).filter(
                and_(Document.file_size >= min_size, Document.file_size < max_size)
            ).count()
            doc_by_size.append({"range": label, "count": count})
        
        # Documents by user
        doc_by_user = db.query(
            Document.uploaded_by,
            func.count(Document.id).label('count')
        ).group_by(Document.uploaded_by).order_by(func.count(Document.id).desc()).limit(10).all()
        
        return {
            "total_documents": total_documents,
            "documents_in_period": documents_in_period,
            "documents_by_type": [{"type": item[0], "count": item[1]} for item in doc_by_type],
            "documents_by_size": doc_by_size,
            "top_uploaders": [{"user_id": item[0], "count": item[1]} for item in doc_by_user]
        }
    
    @staticmethod
    def get_user_activity_analytics(db: Session, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get user activity analytics"""
        # Active users in period
        active_users = db.query(User).filter(
            User.last_login.between(start_date, end_date)
        ).count()
        
        # Total users
        total_users = db.query(User).count()
        
        # New users in period
        new_users = db.query(User).filter(
            User.created_at.between(start_date, end_date)
        ).count()
        
        # User activity by day
        daily_activity = []
        current_date = start_date.date()
        end_date_only = end_date.date()
        
        while current_date <= end_date_only:
            day_start = datetime.combine(current_date, datetime.min.time()).replace(tzinfo=timezone.utc)
            day_end = day_start + timedelta(days=1)
            
            active_count = db.query(User).filter(
                User.last_login.between(day_start, day_end)
            ).count()
            
            daily_activity.append({
                "date": current_date.isoformat(),
                "active_users": active_count
            })
            
            current_date += timedelta(days=1)
        
        return {
            "total_users": total_users,
            "active_users": active_users,
            "new_users": new_users,
            "activity_rate": round((active_users / total_users * 100), 2) if total_users > 0 else 0,
            "daily_activity": daily_activity
        }
    
    @staticmethod
    def get_task_performance_analytics(db: Session, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get task performance analytics"""
        # Total tasks
        total_tasks = db.query(Task).count()
        
        # Tasks in period
        tasks_in_period = db.query(Task).filter(
            Task.created_at.between(start_date, end_date)
        ).count()
        
        # Task completion rates
        completed_tasks = db.query(Task).filter(
            and_(
                Task.created_at.between(start_date, end_date),
                Task.status == "completed"
            )
        ).count()
        
        completion_rate = round((completed_tasks / tasks_in_period * 100), 2) if tasks_in_period > 0 else 0
        
        # Tasks by status
        task_by_status = db.query(
            Task.status,
            func.count(Task.id).label('count')
        ).filter(
            Task.created_at.between(start_date, end_date)
        ).group_by(Task.status).all()
        
        # Tasks by priority
        task_by_priority = db.query(
            Task.priority,
            func.count(Task.id).label('count')
        ).filter(
            Task.created_at.between(start_date, end_date)
        ).group_by(Task.priority).all()
        
        return {
            "total_tasks": total_tasks,
            "tasks_in_period": tasks_in_period,
            "completed_tasks": completed_tasks,
            "completion_rate": completion_rate,
            "tasks_by_status": [{"status": item[0], "count": item[1]} for item in task_by_status],
            "tasks_by_priority": [{"priority": item[0], "count": item[1]} for item in task_by_priority]
        }

class ChartGenerator:
    """Utility class for generating charts and visualizations"""
    
    @staticmethod
    def create_bar_chart(data: List[Dict], x_field: str, y_field: str, title: str) -> str:
        """Create bar chart using Plotly"""
        fig = px.bar(
            data,
            x=x_field,
            y=y_field,
            title=title
        )
        
        fig.update_layout(
            showlegend=False,
            margin=dict(l=0, r=0, t=40, b=0)
        )
        
        return json.dumps(fig, cls=PlotlyJSONEncoder)
    
    @staticmethod
    def create_pie_chart(data: List[Dict], values_field: str, names_field: str, title: str) -> str:
        """Create pie chart using Plotly"""
        fig = px.pie(
            data,
            values=values_field,
            names=names_field,
            title=title
        )
        
        fig.update_layout(
            showlegend=True,
            margin=dict(l=0, r=0, t=40, b=0)
        )
        
        return json.dumps(fig, cls=PlotlyJSONEncoder)
    
    @staticmethod
    def create_line_chart(data: List[Dict], x_field: str, y_field: str, title: str) -> str:
        """Create line chart using Plotly"""
        fig = px.line(
            data,
            x=x_field,
            y=y_field,
            title=title
        )
        
        fig.update_layout(
            showlegend=False,
            margin=dict(l=0, r=0, t=40, b=0)
        )
        
        return json.dumps(fig, cls=PlotlyJSONEncoder)
    
    @staticmethod
    def create_heatmap(data: np.ndarray, title: str, x_labels: List[str], y_labels: List[str]) -> str:
        """Create heatmap using Plotly"""
        fig = go.Figure(data=go.Heatmap(
            z=data,
            x=x_labels,
            y=y_labels,
            colorscale='Viridis'
        ))
        
        fig.update_layout(
            title=title,
            margin=dict(l=0, r=0, t=40, b=0)
        )
        
        return json.dumps(fig, cls=PlotlyJSONEncoder)

# Report Generation Functions
async def generate_document_analytics_report(db: Session, parameters: Dict[str, Any]) -> Dict[str, Any]:
    """Generate document analytics report"""
    # Get date range from parameters
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=parameters.get("days", 30))
    
    # Get analytics data
    analytics = DataAnalyzer.get_document_analytics(db, start_date, end_date)
    
    # Generate visualizations
    charts = []
    
    # Document type chart
    if analytics["documents_by_type"]:
        chart_data = ChartGenerator.create_pie_chart(
            analytics["documents_by_type"],
            "count",
            "type",
            "Documents by Type"
        )
        charts.append({
            "type": "pie_chart",
            "title": "Documents by Type",
            "data": chart_data
        })
    
    # Document size chart
    if analytics["documents_by_size"]:
        chart_data = ChartGenerator.create_bar_chart(
            analytics["documents_by_size"],
            "range",
            "count",
            "Documents by Size"
        )
        charts.append({
            "type": "bar_chart",
            "title": "Documents by Size",
            "data": chart_data
        })
    
    return {
        "title": "Document Analytics Report",
        "period": f"{start_date.date()} to {end_date.date()}",
        "summary": {
            "total_documents": analytics["total_documents"],
            "documents_in_period": analytics["documents_in_period"],
            "growth_rate": "N/A"  # Could calculate with historical data
        },
        "charts": charts,
        "raw_data": analytics
    }

async def generate_user_activity_report(db: Session, parameters: Dict[str, Any]) -> Dict[str, Any]:
    """Generate user activity report"""
    # Get date range from parameters
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=parameters.get("days", 30))
    
    # Get analytics data
    analytics = DataAnalyzer.get_user_activity_analytics(db, start_date, end_date)
    
    # Generate visualizations
    charts = []
    
    # Daily activity chart
    if analytics["daily_activity"]:
        chart_data = ChartGenerator.create_line_chart(
            analytics["daily_activity"],
            "date",
            "active_users",
            "Daily Active Users"
        )
        charts.append({
            "type": "line_chart",
            "title": "Daily Active Users",
            "data": chart_data
        })
    
    return {
        "title": "User Activity Report",
        "period": f"{start_date.date()} to {end_date.date()}",
        "summary": {
            "total_users": analytics["total_users"],
            "active_users": analytics["active_users"],
            "new_users": analytics["new_users"],
            "activity_rate": analytics["activity_rate"]
        },
        "charts": charts,
        "raw_data": analytics
    }

async def generate_task_performance_report(db: Session, parameters: Dict[str, Any]) -> Dict[str, Any]:
    """Generate task performance report"""
    # Get date range from parameters
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=parameters.get("days", 30))
    
    # Get analytics data
    analytics = DataAnalyzer.get_task_performance_analytics(db, start_date, end_date)
    
    # Generate visualizations
    charts = []
    
    # Task status chart
    if analytics["tasks_by_status"]:
        chart_data = ChartGenerator.create_pie_chart(
            analytics["tasks_by_status"],
            "count",
            "status",
            "Tasks by Status"
        )
        charts.append({
            "type": "pie_chart",
            "title": "Tasks by Status",
            "data": chart_data
        })
    
    # Task priority chart
    if analytics["tasks_by_priority"]:
        chart_data = ChartGenerator.create_bar_chart(
            analytics["tasks_by_priority"],
            "priority",
            "count",
            "Tasks by Priority"
        )
        charts.append({
            "type": "bar_chart",
            "title": "Tasks by Priority",
            "data": chart_data
        })
    
    return {
        "title": "Task Performance Report",
        "period": f"{start_date.date()} to {end_date.date()}",
        "summary": {
            "total_tasks": analytics["total_tasks"],
            "tasks_in_period": analytics["tasks_in_period"],
            "completed_tasks": analytics["completed_tasks"],
            "completion_rate": analytics["completion_rate"]
        },
        "charts": charts,
        "raw_data": analytics
    }

# API Endpoints
@app.post("/templates")
async def create_report_template(
    template_data: ReportTemplateCreate,
    created_by: str,
    db: Session = Depends(get_db)
):
    """Create a new report template"""
    try:
        template = ReportTemplate(
            name=template_data.name,
            description=template_data.description,
            report_type=template_data.report_type,
            query_definition=template_data.query_definition,
            visualization_config=template_data.visualization_config or {},
            layout_config=template_data.layout_config or {},
            parameters=template_data.parameters or {},
            created_by=created_by,
            is_public=template_data.is_public,
            auto_refresh_enabled=template_data.auto_refresh_enabled,
            cache_duration_minutes=template_data.cache_duration_minutes
        )
        
        db.add(template)
        db.commit()
        db.refresh(template)
        
        logger.info(f"Report template created: {template.id}")
        return {"success": True, "template_id": template.id, "template": template}
        
    except Exception as e:
        logger.error(f"Error creating report template: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create report template")

@app.get("/templates")
async def get_report_templates(
    report_type: Optional[ReportType] = None,
    is_public: Optional[bool] = None,
    created_by: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get report templates"""
    try:
        query = db.query(ReportTemplate).filter(ReportTemplate.is_active == True)
        
        if report_type:
            query = query.filter(ReportTemplate.report_type == report_type)
        if is_public is not None:
            query = query.filter(ReportTemplate.is_public == is_public)
        if created_by:
            query = query.filter(ReportTemplate.created_by == created_by)
        
        templates = query.order_by(ReportTemplate.created_at.desc()).all()
        
        return {"templates": templates}
        
    except Exception as e:
        logger.error(f"Error getting report templates: {e}")
        raise HTTPException(status_code=500, detail="Failed to get report templates")

@app.post("/generate")
async def generate_report(
    report_request: ReportGenerateRequest,
    generated_by: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Generate a report"""
    try:
        # Get template
        template = db.query(ReportTemplate).filter(ReportTemplate.id == report_request.template_id).first()
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        # Create execution record
        execution = ReportExecution(
            template_id=report_request.template_id,
            status=ReportStatus.GENERATING,
            report_format=report_request.format,
            parameters=report_request.parameters or {},
            generated_by=generated_by
        )
        
        db.add(execution)
        db.commit()
        db.refresh(execution)
        
        # Generate report in background
        background_tasks.add_task(execute_report_generation, execution.id, template.report_type, report_request.parameters or {})
        
        return {"success": True, "execution_id": execution.id, "message": "Report generation started"}
        
    except Exception as e:
        logger.error(f"Error starting report generation: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to start report generation")

async def execute_report_generation(execution_id: str, report_type: str, parameters: Dict[str, Any]):
    """Execute report generation in background"""
    db = next(get_db())
    
    try:
        execution = db.query(ReportExecution).filter(ReportExecution.id == execution_id).first()
        if not execution:
            return
        
        # Generate report based on type
        if report_type == ReportType.DOCUMENT_ANALYTICS:
            report_data = await generate_document_analytics_report(db, parameters)
        elif report_type == ReportType.USER_ACTIVITY:
            report_data = await generate_user_activity_report(db, parameters)
        elif report_type == ReportType.TASK_PERFORMANCE:
            report_data = await generate_task_performance_report(db, parameters)
        else:
            raise Exception(f"Unsupported report type: {report_type}")
        
        # Save report data
        report_dir = Path(app_config.data_directory) / "reports"
        report_dir.mkdir(exist_ok=True)
        
        report_filename = f"report_{execution_id}.json"
        report_path = report_dir / report_filename
        
        with open(report_path, 'w') as f:
            json.dump(report_data, f, indent=2, default=str)
        
        # Update execution
        execution.status = ReportStatus.COMPLETED
        execution.completed_at = datetime.now(timezone.utc)
        execution.file_path = str(report_path)
        execution.file_size = report_path.stat().st_size
        execution.record_count = len(report_data.get("raw_data", {}))
        
        db.commit()
        
        logger.info(f"Report generation completed: {execution_id}")
        
    except Exception as e:
        logger.error(f"Report generation failed: {e}")
        
        execution.status = ReportStatus.FAILED
        execution.completed_at = datetime.now(timezone.utc)
        execution.error_message = str(e)
        db.commit()
    
    finally:
        db.close()

@app.get("/executions/{execution_id}")
async def get_report_execution(execution_id: str, db: Session = Depends(get_db)):
    """Get report execution details"""
    try:
        execution = db.query(ReportExecution).filter(ReportExecution.id == execution_id).first()
        if not execution:
            raise HTTPException(status_code=404, detail="Execution not found")
        
        # If completed, load report data
        report_data = None
        if execution.status == ReportStatus.COMPLETED and execution.file_path:
            try:
                with open(execution.file_path, 'r') as f:
                    report_data = json.load(f)
            except Exception as e:
                logger.error(f"Error loading report data: {e}")
        
        return {
            "execution": execution,
            "report_data": report_data
        }
        
    except Exception as e:
        logger.error(f"Error getting report execution: {e}")
        raise HTTPException(status_code=500, detail="Failed to get report execution")

@app.get("/executions")
async def get_report_executions(
    template_id: Optional[str] = None,
    status: Optional[ReportStatus] = None,
    generated_by: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get report executions"""
    try:
        query = db.query(ReportExecution)
        
        if template_id:
            query = query.filter(ReportExecution.template_id == template_id)
        if status:
            query = query.filter(ReportExecution.status == status)
        if generated_by:
            query = query.filter(ReportExecution.generated_by == generated_by)
        
        executions = query.order_by(ReportExecution.started_at.desc()).limit(limit).all()
        
        return {"executions": executions}
        
    except Exception as e:
        logger.error(f"Error getting report executions: {e}")
        raise HTTPException(status_code=500, detail="Failed to get report executions")

@app.post("/dashboards")
async def create_dashboard(
    dashboard_data: DashboardCreate,
    owner_id: str,
    db: Session = Depends(get_db)
):
    """Create a new dashboard"""
    try:
        dashboard = Dashboard(
            name=dashboard_data.name,
            description=dashboard_data.description,
            layout=dashboard_data.layout,
            widgets=dashboard_data.widgets,
            filters=dashboard_data.filters or {},
            owner_id=owner_id,
            is_public=dashboard_data.is_public,
            shared_with=dashboard_data.shared_with or []
        )
        
        db.add(dashboard)
        db.commit()
        db.refresh(dashboard)
        
        logger.info(f"Dashboard created: {dashboard.id}")
        return {"success": True, "dashboard_id": dashboard.id, "dashboard": dashboard}
        
    except Exception as e:
        logger.error(f"Error creating dashboard: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create dashboard")

@app.get("/dashboards")
async def get_dashboards(
    owner_id: Optional[str] = None,
    is_public: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Get dashboards"""
    try:
        query = db.query(Dashboard)
        
        if owner_id:
            query = query.filter(Dashboard.owner_id == owner_id)
        if is_public is not None:
            query = query.filter(Dashboard.is_public == is_public)
        
        dashboards = query.order_by(Dashboard.created_at.desc()).all()
        
        return {"dashboards": dashboards}
        
    except Exception as e:
        logger.error(f"Error getting dashboards: {e}")
        raise HTTPException(status_code=500, detail="Failed to get dashboards")

@app.get("/analytics/quick-stats")
async def get_quick_analytics_stats(db: Session = Depends(get_db)):
    """Get quick analytics statistics"""
    try:
        # Get recent data (last 30 days)
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=30)
        
        # Document stats
        total_docs = db.query(Document).count()
        recent_docs = db.query(Document).filter(
            Document.created_at >= start_date
        ).count()
        
        # User stats
        total_users = db.query(User).count()
        active_users = db.query(User).filter(
            User.last_login >= start_date
        ).count()
        
        # Task stats
        total_tasks = db.query(Task).count()
        completed_tasks = db.query(Task).filter(
            and_(Task.created_at >= start_date, Task.status == "completed")
        ).count()
        
        return {
            "document_stats": {
                "total": total_docs,
                "recent": recent_docs
            },
            "user_stats": {
                "total": total_users,
                "active": active_users
            },
            "task_stats": {
                "total": total_tasks,
                "completed_recent": completed_tasks
            },
            "period": "Last 30 days"
        }
        
    except Exception as e:
        logger.error(f"Error getting quick stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get quick stats")

@app.get("/health")
async def health_check():
    """Service health check"""
    return {
        "status": "healthy",
        "service": "Advanced Reporting Service",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/")
async def root():
    """Service root endpoint"""
    return {
        "service": "MetroMind Advanced Reporting Service",
        "version": "1.0.0",
        "features": [
            "Custom report templates",
            "Automated report generation",
            "Data visualization",
            "Interactive dashboards",
            "Scheduled reports",
            "Multiple export formats",
            "Business intelligence",
            "Real-time analytics",
            "Chart generation",
            "Report sharing"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    
    reporting_port = service_config.model_downloader_port + 7  # Port 8026
    logger.info(f"Starting Advanced Reporting service on port {reporting_port}")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=reporting_port,
        log_level="info"
    )