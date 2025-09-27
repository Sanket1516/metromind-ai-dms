"""
MetroMind Task Management Service
Comprehensive task management with TODO, assignment, tracking, and workflow features
"""

import os
import sys
from pathlib import Path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from fastapi import FastAPI, HTTPException, Depends, Query, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc, func
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum
import logging
import uuid

from database import get_db, Task, User, Document, UserRole, Priority
from config import service_config
from utils.logging_utils import setup_service_logger

# Setup logging
logger = setup_service_logger("task_service")

app = FastAPI(
    title="MetroMind Task Management Service",
    description="Comprehensive task management with TODO lists, assignments, and workflow tracking",
    version="1.0.0"
)

security = HTTPBearer()

# Helper to validate UUID
def _is_valid_uuid(val: str) -> bool:
    try:
        uuid.UUID(str(val))
        return True
    except Exception:
        return False

# Task Status Enum
class TaskStatus(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    ON_HOLD = "ON_HOLD"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class TaskType(str, Enum):
    TODO = "TODO"
    BUG = "BUG"
    FEATURE = "FEATURE"
    MAINTENANCE = "MAINTENANCE"
    REVIEW = "REVIEW"
    APPROVAL = "APPROVAL"
    DOCUMENT_PROCESS = "DOCUMENT_PROCESS"
    INTEGRATION_SETUP = "INTEGRATION_SETUP"
    COMPLIANCE = "COMPLIANCE"
    TRAINING = "TRAINING"

# Pydantic Models
class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    document_id: Optional[str] = None
    assigned_to: str
    # NOTE: Priority is an enum in DB with numeric values (1..4). We accept it as Priority.
    priority: Priority = Priority.MEDIUM
    status: TaskStatus = TaskStatus.PENDING
    category: Optional[str] = None
    task_type: TaskType = TaskType.TODO
    tags: List[str] = []
    due_date: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    task_metadata: Dict[str, Any] = {}
    attachments: List[str] = []

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[Priority] = None
    status: Optional[TaskStatus] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    due_date: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    progress_percentage: Optional[int] = None
    task_metadata: Optional[Dict[str, Any]] = None
    attachments: Optional[List[str]] = None

class TaskComment(BaseModel):
    comment: str
    attachments: List[str] = []

class TaskResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    document_id: Optional[str]
    assigned_to: str
    assigned_by: Optional[str]
    priority: Priority
    status: str
    category: Optional[str]
    task_type: str
    tags: List[str]
    due_date: Optional[datetime]
    completed_at: Optional[datetime]
    estimated_hours: Optional[float]
    actual_hours: Optional[float]
    progress_percentage: int
    created_at: datetime
    updated_at: datetime
    task_metadata: Dict[str, Any]
    attachments: List[str]
    comments: List[Dict[str, Any]]
    
    # User details
    assigned_to_name: Optional[str]
    assigned_by_name: Optional[str]
    document_title: Optional[str]

class TaskStats(BaseModel):
    total_tasks: int
    pending_tasks: int
    in_progress_tasks: int
    completed_tasks: int
    overdue_tasks: int
    high_priority_tasks: int
    my_tasks: int
    assigned_by_me: int

class TaskFilter(BaseModel):
    status: Optional[List[TaskStatus]] = None
    priority: Optional[List[Priority]] = None
    assigned_to: Optional[str] = None
    assigned_by: Optional[str] = None
    category: Optional[str] = None
    task_type: Optional[List[TaskType]] = None
    due_before: Optional[datetime] = None
    due_after: Optional[datetime] = None
    created_after: Optional[datetime] = None
    tags: Optional[List[str]] = None
    search: Optional[str] = None

# Authentication helper
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Extract user ID from JWT token"""
    try:
        # For now, return a mock user ID - in production, decode JWT
        return "admin-user-id"
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

# Task Management Endpoints
@app.post("/tasks", response_model=TaskResponse)
async def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Create a new task"""
    try:
        # Validate assigned user exists
        assigned_user = db.query(User).filter(User.id == task_data.assigned_to).first()
        if not assigned_user:
            raise HTTPException(status_code=400, detail="Assigned user not found")
        
        # Validate document if provided
        if task_data.document_id:
            document = db.query(Document).filter(Document.id == task_data.document_id).first()
            if not document:
                raise HTTPException(status_code=400, detail="Document not found")
        
        # Create task
        task = Task(
            id=uuid.uuid4(),
            title=task_data.title,
            description=task_data.description,
            document_id=task_data.document_id,
            assigned_to=task_data.assigned_to,
            # Only set assigned_by if current_user is a valid UUID
            assigned_by=current_user if _is_valid_uuid(current_user) else None,
            priority=task_data.priority,
            status=task_data.status.value,
            category=task_data.category,
            tags=task_data.tags,
            due_date=task_data.due_date,
            estimated_hours=task_data.estimated_hours,
            task_metadata={
                "task_type": task_data.task_type.value,
                **task_data.task_metadata
            },
            attachments=task_data.attachments,
            comments=[]
        )
        
        db.add(task)
        db.commit()
        db.refresh(task)
        
        logger.info(f"Task created: {task.id} - {task.title}")
        
        return _format_task_response(task, db)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating task: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tasks", response_model=List[TaskResponse])
async def list_tasks(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: Optional[List[TaskStatus]] = Query(None),
    priority: Optional[List[Priority]] = Query(None),
    assigned_to: Optional[str] = Query(None),
    assigned_by: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    task_type: Optional[List[TaskType]] = Query(None),
    due_before: Optional[datetime] = Query(None),
    due_after: Optional[datetime] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """List tasks with filtering and pagination"""
    try:
        query = db.query(Task)
        
        # Apply filters
        if status:
            query = query.filter(Task.status.in_([s.value for s in status]))
        
        if priority:
            query = query.filter(Task.priority.in_(priority))
        
        if assigned_to:
            query = query.filter(Task.assigned_to == assigned_to)
        
        if assigned_by:
            query = query.filter(Task.assigned_by == assigned_by)
        
        if category:
            query = query.filter(Task.category == category)
        
        if task_type:
            task_type_values = [tt.value for tt in task_type]
            query = query.filter(Task.task_metadata['task_type'].astext.in_(task_type_values))
        
        if due_before:
            query = query.filter(Task.due_date <= due_before)
        
        if due_after:
            query = query.filter(Task.due_date >= due_after)
        
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                or_(
                    Task.title.ilike(search_filter),
                    Task.description.ilike(search_filter),
                    Task.category.ilike(search_filter)
                )
            )
        
        # Apply sorting
        if sort_order.lower() == "desc":
            query = query.order_by(desc(getattr(Task, sort_by, Task.created_at)))
        else:
            query = query.order_by(asc(getattr(Task, sort_by, Task.created_at)))
        
        # Apply pagination
        tasks = query.offset(skip).limit(limit).all()
        
        return [_format_task_response(task, db) for task in tasks]
        
    except Exception as e:
        logger.error(f"Error listing tasks: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Get task by ID"""
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        return _format_task_response(task, db)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting task {task_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Update task"""
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Update fields
        update_data = task_data.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            if field == "status" and value:
                task.status = value.value if hasattr(value, 'value') else value
                if value in [TaskStatus.COMPLETED, "COMPLETED"]:
                    task.completed_at = datetime.now(timezone.utc)
                    task.progress_percentage = 100
            elif field == "task_metadata" and value:
                # Merge metadata
                current_metadata = task.task_metadata or {}
                current_metadata.update(value)
                task.task_metadata = current_metadata
            elif hasattr(task, field):
                setattr(task, field, value)
        
        task.updated_at = datetime.now(timezone.utc)
        
        db.commit()
        db.refresh(task)
        
        logger.info(f"Task updated: {task.id}")
        
        return _format_task_response(task, db)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating task {task_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tasks/{task_id}/comments")
async def add_task_comment(
    task_id: str,
    comment_data: TaskComment,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Add comment to task"""
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Get user info for comment (only if current_user is a valid UUID)
        user = db.query(User).filter(User.id == current_user).first() if _is_valid_uuid(current_user) else None
        user_name = f"{user.first_name} {user.last_name}" if user else "Unknown User"
        
        comment = {
            "id": str(uuid.uuid4()),
            "user_id": current_user,
            "user_name": user_name,
            "comment": comment_data.comment,
            "attachments": comment_data.attachments,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Add comment to task
        current_comments = task.comments or []
        current_comments.append(comment)
        task.comments = current_comments
        task.updated_at = datetime.now(timezone.utc)
        
        db.commit()
        
        logger.info(f"Comment added to task {task_id}")
        
        return {"success": True, "comment_id": comment["id"]}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error adding comment to task {task_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/tasks/{task_id}")
async def delete_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Delete task"""
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Check permissions - only admin or task creator can delete
        user = db.query(User).filter(User.id == current_user).first() if _is_valid_uuid(current_user) else None
        if user and user.role != UserRole.ADMIN and task.assigned_by != current_user:
            raise HTTPException(status_code=403, detail="Not authorized to delete this task")
        
        db.delete(task)
        db.commit()
        
        logger.info(f"Task deleted: {task_id}")
        
        return {"success": True, "message": "Task deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting task {task_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tasks/stats", response_model=TaskStats)
async def get_task_stats(
    user_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Get task statistics"""
    try:
        target_user = user_id or current_user
        
        # Total tasks
        total_tasks = db.query(Task).count()
        
        # Status-based stats
        pending_tasks = db.query(Task).filter(Task.status == TaskStatus.PENDING.value).count()
        in_progress_tasks = db.query(Task).filter(Task.status == TaskStatus.IN_PROGRESS.value).count()
        completed_tasks = db.query(Task).filter(Task.status == TaskStatus.COMPLETED.value).count()
        
        # Overdue tasks
        overdue_tasks = db.query(Task).filter(
            and_(
                Task.due_date < datetime.now(timezone.utc),
                Task.status.notin_([TaskStatus.COMPLETED.value, TaskStatus.CANCELLED.value])
            )
        ).count()
        
        # High priority tasks
        high_priority_tasks = db.query(Task).filter(
            and_(
                Task.priority == Priority.HIGH,
                Task.status.notin_([TaskStatus.COMPLETED.value, TaskStatus.CANCELLED.value])
            )
        ).count()
        
        # User-specific stats
        my_tasks = db.query(Task).filter(Task.assigned_to == target_user).count()
        assigned_by_me = db.query(Task).filter(Task.assigned_by == target_user).count()
        
        return TaskStats(
            total_tasks=total_tasks,
            pending_tasks=pending_tasks,
            in_progress_tasks=in_progress_tasks,
            completed_tasks=completed_tasks,
            overdue_tasks=overdue_tasks,
            high_priority_tasks=high_priority_tasks,
            my_tasks=my_tasks,
            assigned_by_me=assigned_by_me
        )
        
    except Exception as e:
        logger.error(f"Error getting task stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tasks/my-tasks", response_model=List[TaskResponse])
async def get_my_tasks(
    status: Optional[List[TaskStatus]] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Get tasks assigned to current user"""
    try:
        query = db.query(Task).filter(Task.assigned_to == current_user)
        
        if status:
            query = query.filter(Task.status.in_([s.value for s in status]))
        
        query = query.order_by(desc(Task.created_at))
        tasks = query.limit(limit).all()
        
        return [_format_task_response(task, db) for task in tasks]
        
    except Exception as e:
        logger.error(f"Error getting my tasks: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tasks/categories")
async def get_task_categories(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Get all task categories"""
    try:
        categories = db.query(Task.category).distinct().filter(Task.category.isnot(None)).all()
        return [cat[0] for cat in categories if cat[0]]
        
    except Exception as e:
        logger.error(f"Error getting task categories: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def _format_task_response(task: Task, db: Session) -> TaskResponse:
    """Format task for response"""
    try:
        # Get user details
        assigned_user = db.query(User).filter(User.id == task.assigned_to).first()
        assigned_by_user = db.query(User).filter(User.id == task.assigned_by).first() if task.assigned_by else None
        
        # Get document details
        document = None
        if task.document_id:
            document = db.query(Document).filter(Document.id == task.document_id).first()
        
        return TaskResponse(
            id=str(task.id),
            title=task.title,
            description=task.description,
            document_id=str(task.document_id) if task.document_id else None,
            assigned_to=str(task.assigned_to),
            assigned_by=str(task.assigned_by) if task.assigned_by else None,
            priority=task.priority,
            status=task.status,
            category=task.category,
            task_type=task.task_metadata.get("task_type", TaskType.TODO.value) if task.task_metadata else TaskType.TODO.value,
            tags=task.tags or [],
            due_date=task.due_date,
            completed_at=task.completed_at,
            estimated_hours=task.estimated_hours,
            actual_hours=task.actual_hours,
            progress_percentage=task.progress_percentage or 0,
            created_at=task.created_at,
            updated_at=task.updated_at,
            task_metadata=task.task_metadata or {},
            attachments=task.attachments or [],
            comments=task.comments or [],
            assigned_to_name=f"{assigned_user.first_name} {assigned_user.last_name}" if assigned_user else None,
            assigned_by_name=f"{assigned_by_user.first_name} {assigned_by_user.last_name}" if assigned_by_user else None,
            document_title=document.title if document else None
        )
        
    except Exception as e:
        logger.error(f"Error formatting task response: {e}")
        raise

# Health check
@app.get("/health")
async def health_check():
    """Service health check"""
    return {
        "status": "healthy",
        "service": "Task Management Service",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/")
async def root():
    """Service root endpoint"""
    return {
        "service": "MetroMind Task Management Service",
        "version": "1.0.0",
        "features": [
            "Task CRUD operations",
            "Task assignment and tracking",
            "TODO list management",
            "Task comments and attachments",
            "Task statistics and reporting",
            "Advanced filtering and search"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    
    logger.info(f"Starting Task Management service on port {service_config.model_downloader_port + 1}")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=service_config.model_downloader_port + 1,  # Use port 8020
        log_level="info"
    )