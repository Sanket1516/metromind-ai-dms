"""
MetroMind Document Workflow Service
Document approval chains, versioning, review processes
"""

import os
import sys
from pathlib import Path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import Column, String, DateTime, Text, JSON, Integer, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import asyncio
import json
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any
import logging
from enum import Enum
from pydantic import BaseModel
import aiofiles

from database import get_db, Base, engine, User, Document, DocumentVersion
from config import service_config
from utils.logging_utils import setup_service_logger

# Setup logging
logger = setup_service_logger("workflow_service")

app = FastAPI(
    title="MetroMind Document Workflow Service",
    description="Document approval chains, versioning, and review processes",
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

# Enums
class WorkflowStatus(str, Enum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    PUBLISHED = "published"
    ARCHIVED = "archived"

class WorkflowStepType(str, Enum):
    REVIEW = "review"
    APPROVAL = "approval"
    SIGNATURE = "signature"
    NOTIFICATION = "notification"
    CUSTOM = "custom"

class ReviewDecision(str, Enum):
    APPROVE = "approve"
    REJECT = "reject"
    REQUEST_CHANGES = "request_changes"

class DocumentVersionType(str, Enum):
    MAJOR = "major"
    MINOR = "minor"
    PATCH = "patch"

# Database Models
class WorkflowTemplate(Base):
    __tablename__ = "workflow_templates"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text)
    category = Column(String)  # e.g., "HR", "Finance", "Legal"
    is_active = Column(Boolean, default=True)
    created_by = Column(String)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Workflow configuration
    steps = Column(JSON)  # List of workflow steps
    settings = Column(JSON)  # Additional settings
    
    # Relationships
    workflows = relationship("DocumentWorkflow", back_populates="template")

class DocumentWorkflow(Base):
    __tablename__ = "document_workflows"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, nullable=False, index=True)
    template_id = Column(String, ForeignKey("workflow_templates.id"))
    
    # Current state
    status = Column(String, default=WorkflowStatus.DRAFT)
    current_step = Column(Integer, default=0)
    started_by = Column(String)
    started_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    completed_at = Column(DateTime(timezone=True))
    
    # Workflow data
    workflow_metadata = Column(JSON)
    
    # Relationships
    template = relationship("WorkflowTemplate", back_populates="workflows")
    steps = relationship("WorkflowStep", back_populates="workflow", cascade="all, delete-orphan")
    reviews = relationship("DocumentReview", back_populates="workflow", cascade="all, delete-orphan")

class WorkflowStep(Base):
    __tablename__ = "workflow_steps"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workflow_id = Column(String, ForeignKey("document_workflows.id"))
    step_number = Column(Integer, nullable=False)
    
    # Step configuration
    step_type = Column(String, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    assigned_to = Column(String)  # User ID or role
    assigned_role = Column(String)
    due_date = Column(DateTime(timezone=True))
    
    # Step state
    status = Column(String, default="pending")  # pending, in_progress, completed, skipped
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    completed_by = Column(String)
    
    # Step data
    settings = Column(JSON)
    result = Column(JSON)
    
    # Relationships
    workflow = relationship("DocumentWorkflow", back_populates="steps")

class DocumentReview(Base):
    __tablename__ = "document_reviews"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workflow_id = Column(String, ForeignKey("document_workflows.id"))
    document_id = Column(String, nullable=False)
    step_id = Column(String, ForeignKey("workflow_steps.id"))
    
    # Review details
    reviewer_id = Column(String, nullable=False)
    decision = Column(String)  # approve, reject, request_changes
    comments = Column(Text)
    reviewed_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    # Review data
    review_metadata = Column(JSON)
    
    # Relationships
    workflow = relationship("DocumentWorkflow", back_populates="reviews")
    step = relationship("WorkflowStep")

"""Use DocumentVersion from database models to avoid duplicate mapper definition"""

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic Models
class WorkflowTemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    steps: List[Dict[str, Any]]
    settings: Optional[Dict[str, Any]] = None

class WorkflowTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None
    steps: Optional[List[Dict[str, Any]]] = None
    settings: Optional[Dict[str, Any]] = None

class DocumentWorkflowCreate(BaseModel):
    document_id: str
    template_id: str
    started_by: str
    workflow_metadata: Optional[Dict[str, Any]] = None

class DocumentReviewCreate(BaseModel):
    decision: ReviewDecision
    comments: Optional[str] = None
    review_metadata: Optional[Dict[str, Any]] = None

class DocumentVersionCreate(BaseModel):
    document_id: str
    version_type: DocumentVersionType = DocumentVersionType.MINOR
    description: Optional[str] = None
    change_log: Optional[str] = None
    file_path: Optional[str] = None

# Helper Functions
async def create_workflow_steps(workflow_id: str, template_steps: List[Dict], db: Session):
    """Create workflow steps from template"""
    for i, step_config in enumerate(template_steps):
        step = WorkflowStep(
            workflow_id=workflow_id,
            step_number=i + 1,
            step_type=step_config.get("type", WorkflowStepType.REVIEW),
            name=step_config.get("name", f"Step {i + 1}"),
            description=step_config.get("description"),
            assigned_to=step_config.get("assigned_to"),
            assigned_role=step_config.get("assigned_role"),
            settings=step_config.get("settings", {})
        )
        
        # Set due date if specified
        if "due_days" in step_config:
            step.due_date = datetime.now(timezone.utc) + timedelta(days=step_config["due_days"])
        
        db.add(step)

async def advance_workflow(workflow_id: str, db: Session):
    """Advance workflow to next step"""
    workflow = db.query(DocumentWorkflow).filter(DocumentWorkflow.id == workflow_id).first()
    if not workflow:
        return False
    
    # Get current step
    current_step = db.query(WorkflowStep).filter(
        WorkflowStep.workflow_id == workflow_id,
        WorkflowStep.step_number == workflow.current_step + 1
    ).first()
    
    if current_step:
        # Mark current step as completed
        current_step.status = "completed"
        current_step.completed_at = datetime.now(timezone.utc)
        
        # Move to next step
        workflow.current_step += 1
        
        # Check if workflow is complete
        total_steps = db.query(WorkflowStep).filter(WorkflowStep.workflow_id == workflow_id).count()
        if workflow.current_step >= total_steps:
            workflow.status = WorkflowStatus.APPROVED
            workflow.completed_at = datetime.now(timezone.utc)
        
        db.commit()
        return True
    
    return False

async def generate_version_number(document_id: str, version_type: DocumentVersionType, db: Session) -> str:
    """Generate next version number"""
    # Get latest version
    latest_version = db.query(DocumentVersion).filter(
        DocumentVersion.document_id == document_id
    ).order_by(DocumentVersion.created_at.desc()).first()
    
    if not latest_version:
        return "1.0.0"
    
    # Parse current version
    try:
        parts = latest_version.version_number.split(".")
        major, minor, patch = int(parts[0]), int(parts[1]), int(parts[2])
    except:
        return "1.0.0"
    
    # Increment based on version type
    if version_type == DocumentVersionType.MAJOR:
        major += 1
        minor = 0
        patch = 0
    elif version_type == DocumentVersionType.MINOR:
        minor += 1
        patch = 0
    else:  # PATCH
        patch += 1
    
    return f"{major}.{minor}.{patch}"

# API Endpoints
@app.post("/templates")
async def create_workflow_template(
    template_data: WorkflowTemplateCreate,
    created_by: str,
    db: Session = Depends(get_db)
):
    """Create a new workflow template"""
    try:
        template = WorkflowTemplate(
            name=template_data.name,
            description=template_data.description,
            category=template_data.category,
            created_by=created_by,
            steps=template_data.steps,
            settings=template_data.settings or {}
        )
        
        db.add(template)
        db.commit()
        db.refresh(template)
        
        logger.info(f"Workflow template created: {template.id}")
        return {"success": True, "template_id": template.id, "template": template}
        
    except Exception as e:
        logger.error(f"Error creating workflow template: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create workflow template")

@app.get("/templates")
async def get_workflow_templates(
    category: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Get workflow templates"""
    try:
        query = db.query(WorkflowTemplate)
        
        if category:
            query = query.filter(WorkflowTemplate.category == category)
        if is_active is not None:
            query = query.filter(WorkflowTemplate.is_active == is_active)
        
        templates = query.order_by(WorkflowTemplate.created_at.desc()).all()
        # Serialize ORM objects
        serialized = [
            {
                "id": t.id,
                "name": t.name,
                "description": t.description,
                "category": t.category,
                "is_active": t.is_active,
                "created_by": t.created_by,
                "created_at": t.created_at,
                "updated_at": t.updated_at,
                "steps": t.steps or [],
                "settings": t.settings or {},
            }
            for t in templates
        ]
        
        return {"templates": serialized}
        
    except Exception as e:
        logger.error(f"Error getting workflow templates: {e}")
        raise HTTPException(status_code=500, detail="Failed to get workflow templates")

@app.put("/templates/{template_id}")
async def update_workflow_template(
    template_id: str,
    template_data: WorkflowTemplateUpdate,
    db: Session = Depends(get_db)
):
    """Update a workflow template"""
    try:
        template = db.query(WorkflowTemplate).filter(WorkflowTemplate.id == template_id).first()
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        # Update fields
        if template_data.name is not None:
            template.name = template_data.name
        if template_data.description is not None:
            template.description = template_data.description
        if template_data.category is not None:
            template.category = template_data.category
        if template_data.is_active is not None:
            template.is_active = template_data.is_active
        if template_data.steps is not None:
            template.steps = template_data.steps
        if template_data.settings is not None:
            template.settings = template_data.settings
        
        template.updated_at = datetime.now(timezone.utc)
        db.commit()
        
        return {"success": True, "message": "Template updated"}
        
    except Exception as e:
        logger.error(f"Error updating workflow template: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update workflow template")

@app.post("/workflows")
async def start_document_workflow(
    workflow_data: DocumentWorkflowCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Start a new document workflow"""
    try:
        # Get template
        template = db.query(WorkflowTemplate).filter(WorkflowTemplate.id == workflow_data.template_id).first()
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        # Create workflow
        workflow = DocumentWorkflow(
            document_id=workflow_data.document_id,
            template_id=workflow_data.template_id,
            started_by=workflow_data.started_by,
            status=WorkflowStatus.PENDING_REVIEW,
            workflow_metadata=workflow_data.workflow_metadata or {}
        )
        
        db.add(workflow)
        db.flush()  # Get the ID
        
        # Create workflow steps
        await create_workflow_steps(workflow.id, template.steps, db)
        
        db.commit()
        db.refresh(workflow)
        
        # Send notifications
        background_tasks.add_task(send_workflow_notifications, workflow.id)
        
        logger.info(f"Document workflow started: {workflow.id}")
        return {"success": True, "workflow_id": workflow.id, "workflow": workflow}
        
    except Exception as e:
        logger.error(f"Error starting document workflow: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to start workflow")

@app.get("/workflows/{workflow_id}")
async def get_workflow(workflow_id: str, db: Session = Depends(get_db)):
    """Get workflow details"""
    try:
        workflow = db.query(DocumentWorkflow).filter(DocumentWorkflow.id == workflow_id).first()
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        # Get related data
        steps = db.query(WorkflowStep).filter(WorkflowStep.workflow_id == workflow_id).order_by(WorkflowStep.step_number).all()
        reviews = db.query(DocumentReview).filter(DocumentReview.workflow_id == workflow_id).order_by(DocumentReview.reviewed_at.desc()).all()
        
        return {
            "workflow": workflow,
            "steps": steps,
            "reviews": reviews
        }
        
    except Exception as e:
        logger.error(f"Error getting workflow: {e}")
        raise HTTPException(status_code=500, detail="Failed to get workflow")

@app.get("/workflows")
async def get_workflows(
    document_id: Optional[str] = None,
    status: Optional[WorkflowStatus] = None,
    assigned_to: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get workflows with filtering"""
    try:
        query = db.query(DocumentWorkflow)
        
        if document_id:
            query = query.filter(DocumentWorkflow.document_id == document_id)
        if status:
            query = query.filter(DocumentWorkflow.status == status)
        
        # Filter by assigned user (check workflow steps)
        if assigned_to:
            workflow_ids = db.query(WorkflowStep.workflow_id).filter(
                WorkflowStep.assigned_to == assigned_to,
                WorkflowStep.status.in_(["pending", "in_progress"])
            ).subquery()
            query = query.filter(DocumentWorkflow.id.in_(workflow_ids))
        
        total = query.count()
        workflows = query.order_by(DocumentWorkflow.started_at.desc()).offset(offset).limit(limit).all()
        
        return {
            "workflows": workflows,
            "total": total,
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        logger.error(f"Error getting workflows: {e}")
        raise HTTPException(status_code=500, detail="Failed to get workflows")

@app.post("/workflows/{workflow_id}/review")
async def submit_review(
    workflow_id: str,
    step_id: str,
    reviewer_id: str,
    review_data: DocumentReviewCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Submit a review for a workflow step"""
    try:
        # Get workflow and step
        workflow = db.query(DocumentWorkflow).filter(DocumentWorkflow.id == workflow_id).first()
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        step = db.query(WorkflowStep).filter(WorkflowStep.id == step_id).first()
        if not step:
            raise HTTPException(status_code=404, detail="Step not found")
        
        # Create review
        review = DocumentReview(
            workflow_id=workflow_id,
            document_id=workflow.document_id,
            step_id=step_id,
            reviewer_id=reviewer_id,
            decision=review_data.decision,
            comments=review_data.comments,
            review_metadata=review_data.review_metadata or {}
        )
        
        db.add(review)
        
        # Update step status based on decision
        if review_data.decision == ReviewDecision.APPROVE:
            step.status = "completed"
            step.completed_by = reviewer_id
            step.completed_at = datetime.now(timezone.utc)
            
            # Advance workflow
            await advance_workflow(workflow_id, db)
            
        elif review_data.decision == ReviewDecision.REJECT:
            workflow.status = WorkflowStatus.REJECTED
            workflow.completed_at = datetime.now(timezone.utc)
            
        elif review_data.decision == ReviewDecision.REQUEST_CHANGES:
            workflow.status = WorkflowStatus.DRAFT
            # Reset to first step
            workflow.current_step = 0
        
        db.commit()
        
        # Send notifications
        background_tasks.add_task(send_review_notifications, review.id)
        
        logger.info(f"Review submitted: {review.id}")
        return {"success": True, "review_id": review.id, "review": review}
        
    except Exception as e:
        logger.error(f"Error submitting review: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to submit review")

@app.post("/documents/{document_id}/versions")
async def create_document_version(
    document_id: str,
    created_by: str,
    version_data: DocumentVersionCreate,
    db: Session = Depends(get_db)
):
    """Create a new document version"""
    try:
        # Generate version number
        version_number = await generate_version_number(document_id, version_data.version_type, db)
        
        # Mark all previous versions as not current
        db.query(DocumentVersion).filter(
            DocumentVersion.document_id == document_id,
            DocumentVersion.is_current == True
        ).update({"is_current": False})
        
        # Create new version
        version = DocumentVersion(
            document_id=document_id,
            version_number=version_number,
            version_type=version_data.version_type,
            created_by=created_by,
            description=version_data.description,
            change_log=version_data.change_log,
            file_path=version_data.file_path,
            is_current=True
        )
        
        db.add(version)
        db.commit()
        db.refresh(version)
        
        logger.info(f"Document version created: {version.id}")
        return {"success": True, "version_id": version.id, "version": version}
        
    except Exception as e:
        logger.error(f"Error creating document version: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create document version")

@app.get("/documents/{document_id}/versions")
async def get_document_versions(document_id: str, db: Session = Depends(get_db)):
    """Get all versions of a document"""
    try:
        versions = db.query(DocumentVersion).filter(
            DocumentVersion.document_id == document_id
        ).order_by(DocumentVersion.created_at.desc()).all()
        
        return {"versions": versions}
        
    except Exception as e:
        logger.error(f"Error getting document versions: {e}")
        raise HTTPException(status_code=500, detail="Failed to get document versions")

@app.put("/documents/{document_id}/versions/{version_id}/publish")
async def publish_document_version(
    document_id: str,
    version_id: str,
    published_by: str,
    db: Session = Depends(get_db)
):
    """Publish a document version"""
    try:
        version = db.query(DocumentVersion).filter(
            DocumentVersion.id == version_id,
            DocumentVersion.document_id == document_id
        ).first()
        
        if not version:
            raise HTTPException(status_code=404, detail="Version not found")
        
        # Mark as published
        version.is_published = True
        
        # Update metadata
        if not version.version_metadata:
            version.version_metadata = {}
        version.version_metadata["published_by"] = published_by
        version.version_metadata["published_at"] = datetime.now(timezone.utc).isoformat()
        
        db.commit()
        
        return {"success": True, "message": "Version published"}
        
    except Exception as e:
        logger.error(f"Error publishing document version: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to publish version")

async def send_workflow_notifications(workflow_id: str):
    """Send notifications when workflow starts"""
    # This would integrate with notification service
    logger.info(f"Workflow notifications sent for: {workflow_id}")

async def send_review_notifications(review_id: str):
    """Send notifications when review is submitted"""
    # This would integrate with notification service
    logger.info(f"Review notifications sent for: {review_id}")

@app.get("/health")
async def health_check():
    """Service health check"""
    return {
        "status": "healthy",
        "service": "Document Workflow Service",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/")
async def root():
    """Service root endpoint"""
    return {
        "service": "MetroMind Document Workflow Service",
        "version": "1.0.0",
        "features": [
            "Workflow templates",
            "Document approval chains",
            "Review processes",
            "Document versioning",
            "Step-by-step workflows",
            "Automated notifications",
            "Publishing controls"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    
    workflow_port = service_config.model_downloader_port + 4  # Port 8023
    logger.info(f"Starting Document Workflow service on port {workflow_port}")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=workflow_port,
        log_level="info"
    )