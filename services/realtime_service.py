"""
MetroMind Real-time Communication Service
WebSocket-based real-time updates, notifications, and collaboration features
"""

import os
import sys
from pathlib import Path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import asyncio
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Set, Optional, Any
import logging
from enum import Enum
import redis
from pydantic import BaseModel

from database import get_db, User, Document, Task, Integration
from config import service_config, db_config
from utils.logging_utils import setup_service_logger

# Setup logging
logger = setup_service_logger("realtime_service")

app = FastAPI(
    title="MetroMind Real-time Communication Service",
    description="WebSocket-based real-time updates and notifications",
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

# Redis for pub/sub and session management
try:
    redis_client = redis.Redis(
        host=db_config.redis_host,
        port=db_config.redis_port,
        password=db_config.redis_password,
        decode_responses=True
    )
    redis_client.ping()
    logger.info("Connected to Redis")
except Exception as e:
    logger.error(f"Failed to connect to Redis: {e}")
    redis_client = None

# Event Types
class EventType(str, Enum):
    # Document events
    DOCUMENT_UPLOADED = "document_uploaded"
    DOCUMENT_UPDATED = "document_updated"
    DOCUMENT_SHARED = "document_shared"
    DOCUMENT_DELETED = "document_deleted"
    DOCUMENT_PROCESSING = "document_processing"
    DOCUMENT_PROCESSED = "document_processed"
    
    # Task events
    TASK_CREATED = "task_created"
    TASK_UPDATED = "task_updated"
    TASK_ASSIGNED = "task_assigned"
    TASK_COMPLETED = "task_completed"
    TASK_COMMENT_ADDED = "task_comment_added"
    
    # Integration events
    INTEGRATION_SYNC_STARTED = "integration_sync_started"
    INTEGRATION_SYNC_COMPLETED = "integration_sync_completed"
    INTEGRATION_ERROR = "integration_error"
    
    # User events
    USER_ONLINE = "user_online"
    USER_OFFLINE = "user_offline"
    USER_TYPING = "user_typing"
    
    # System events
    SYSTEM_ALERT = "system_alert"
    SYSTEM_MAINTENANCE = "system_maintenance"
    
    # Collaboration events
    DOCUMENT_VIEWED = "document_viewed"
    DOCUMENT_EDITED = "document_edited"
    CURSOR_MOVED = "cursor_moved"

# Pydantic Models
class WebSocketMessage(BaseModel):
    type: EventType
    data: Dict[str, Any]
    timestamp: datetime
    user_id: Optional[str] = None
    room: Optional[str] = None
    target_users: Optional[List[str]] = None

class ConnectionInfo(BaseModel):
    user_id: str
    username: str
    rooms: Set[str] = set()
    last_activity: datetime
    metadata: Dict[str, Any] = {}

# Connection Manager
class ConnectionManager:
    def __init__(self):
        # Active connections: {connection_id: (websocket, connection_info)}
        self.active_connections: Dict[str, tuple[WebSocket, ConnectionInfo]] = {}
        # Room subscriptions: {room_id: set of connection_ids}
        self.room_subscriptions: Dict[str, Set[str]] = {}
        # User connections: {user_id: set of connection_ids}
        self.user_connections: Dict[str, Set[str]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str, username: str) -> str:
        """Accept a new WebSocket connection"""
        await websocket.accept()
        
        connection_id = str(uuid.uuid4())
        connection_info = ConnectionInfo(
            user_id=user_id,
            username=username,
            last_activity=datetime.now(timezone.utc)
        )
        
        self.active_connections[connection_id] = (websocket, connection_info)
        
        # Track user connections
        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        self.user_connections[user_id].add(connection_id)
        
        # Broadcast user online status
        await self.broadcast_to_all({
            "type": EventType.USER_ONLINE,
            "data": {
                "user_id": user_id,
                "username": username,
                "connection_count": len(self.user_connections[user_id])
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        logger.info(f"User {username} ({user_id}) connected: {connection_id}")
        return connection_id
    
    def disconnect(self, connection_id: str):
        """Remove a WebSocket connection"""
        if connection_id in self.active_connections:
            websocket, connection_info = self.active_connections[connection_id]
            user_id = connection_info.user_id
            username = connection_info.username
            
            # Remove from rooms
            for room_id in connection_info.rooms:
                if room_id in self.room_subscriptions:
                    self.room_subscriptions[room_id].discard(connection_id)
                    if not self.room_subscriptions[room_id]:
                        del self.room_subscriptions[room_id]
            
            # Remove from user connections
            if user_id in self.user_connections:
                self.user_connections[user_id].discard(connection_id)
                if not self.user_connections[user_id]:
                    del self.user_connections[user_id]
                    # Broadcast user offline if no more connections
                    asyncio.create_task(self.broadcast_to_all({
                        "type": EventType.USER_OFFLINE,
                        "data": {
                            "user_id": user_id,
                            "username": username
                        },
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }))
            
            del self.active_connections[connection_id]
            logger.info(f"User {username} ({user_id}) disconnected: {connection_id}")
    
    async def join_room(self, connection_id: str, room_id: str):
        """Add connection to a room"""
        if connection_id in self.active_connections:
            websocket, connection_info = self.active_connections[connection_id]
            connection_info.rooms.add(room_id)
            
            if room_id not in self.room_subscriptions:
                self.room_subscriptions[room_id] = set()
            self.room_subscriptions[room_id].add(connection_id)
            
            logger.info(f"Connection {connection_id} joined room {room_id}")
    
    async def leave_room(self, connection_id: str, room_id: str):
        """Remove connection from a room"""
        if connection_id in self.active_connections:
            websocket, connection_info = self.active_connections[connection_id]
            connection_info.rooms.discard(room_id)
            
            if room_id in self.room_subscriptions:
                self.room_subscriptions[room_id].discard(connection_id)
                if not self.room_subscriptions[room_id]:
                    del self.room_subscriptions[room_id]
            
            logger.info(f"Connection {connection_id} left room {room_id}")
    
    async def send_personal_message(self, message: dict, connection_id: str):
        """Send message to specific connection"""
        if connection_id in self.active_connections:
            websocket, _ = self.active_connections[connection_id]
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error sending message to {connection_id}: {e}")
                self.disconnect(connection_id)
    
    async def send_to_user(self, message: dict, user_id: str):
        """Send message to all connections of a user"""
        if user_id in self.user_connections:
            for connection_id in self.user_connections[user_id].copy():
                await self.send_personal_message(message, connection_id)
    
    async def broadcast_to_room(self, message: dict, room_id: str):
        """Broadcast message to all connections in a room"""
        if room_id in self.room_subscriptions:
            for connection_id in self.room_subscriptions[room_id].copy():
                await self.send_personal_message(message, connection_id)
    
    async def broadcast_to_all(self, message: dict):
        """Broadcast message to all active connections"""
        for connection_id in list(self.active_connections.keys()):
            await self.send_personal_message(message, connection_id)
    
    def get_online_users(self) -> List[dict]:
        """Get list of online users"""
        online_users = []
        for user_id, connection_ids in self.user_connections.items():
            if connection_ids:  # User has active connections
                # Get user info from first connection
                first_connection_id = next(iter(connection_ids))
                if first_connection_id in self.active_connections:
                    _, connection_info = self.active_connections[first_connection_id]
                    online_users.append({
                        "user_id": user_id,
                        "username": connection_info.username,
                        "connection_count": len(connection_ids),
                        "last_activity": connection_info.last_activity.isoformat()
                    })
        return online_users
    
    def get_room_users(self, room_id: str) -> List[dict]:
        """Get users in a specific room"""
        room_users = []
        if room_id in self.room_subscriptions:
            user_ids = set()
            for connection_id in self.room_subscriptions[room_id]:
                if connection_id in self.active_connections:
                    _, connection_info = self.active_connections[connection_id]
                    if connection_info.user_id not in user_ids:
                        user_ids.add(connection_info.user_id)
                        room_users.append({
                            "user_id": connection_info.user_id,
                            "username": connection_info.username,
                            "last_activity": connection_info.last_activity.isoformat()
                        })
        return room_users

# Global connection manager
manager = ConnectionManager()

# WebSocket endpoint
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: str,
    token: Optional[str] = None
):
    """Main WebSocket endpoint for real-time communication"""
    try:
        # TODO: Validate token and get user info
        # For now, use mock user data
        username = f"User_{user_id}"
        
        connection_id = await manager.connect(websocket, user_id, username)
        
        try:
            while True:
                # Receive message from client
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Update last activity
                if connection_id in manager.active_connections:
                    _, connection_info = manager.active_connections[connection_id]
                    connection_info.last_activity = datetime.now(timezone.utc)
                
                # Handle different message types
                await handle_websocket_message(connection_id, message)
                
        except WebSocketDisconnect:
            manager.disconnect(connection_id)
        except Exception as e:
            logger.error(f"WebSocket error for {connection_id}: {e}")
            manager.disconnect(connection_id)
    
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
        await websocket.close()

async def handle_websocket_message(connection_id: str, message: dict):
    """Handle incoming WebSocket messages"""
    try:
        message_type = message.get("type")
        data = message.get("data", {})
        
        if message_type == "join_room":
            room_id = data.get("room_id")
            if room_id:
                await manager.join_room(connection_id, room_id)
        
        elif message_type == "leave_room":
            room_id = data.get("room_id")
            if room_id:
                await manager.leave_room(connection_id, room_id)
        
        elif message_type == "ping":
            # Respond with pong
            await manager.send_personal_message({
                "type": "pong",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }, connection_id)
        
        elif message_type == "typing":
            # Broadcast typing indicator to room
            room_id = data.get("room_id")
            if room_id and connection_id in manager.active_connections:
                _, connection_info = manager.active_connections[connection_id]
                await manager.broadcast_to_room({
                    "type": EventType.USER_TYPING,
                    "data": {
                        "user_id": connection_info.user_id,
                        "username": connection_info.username,
                        "room_id": room_id,
                        "is_typing": data.get("is_typing", False)
                    },
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }, room_id)
        
        elif message_type == "cursor_move":
            # Broadcast cursor position to room (for collaborative editing)
            room_id = data.get("room_id")
            if room_id and connection_id in manager.active_connections:
                _, connection_info = manager.active_connections[connection_id]
                await manager.broadcast_to_room({
                    "type": EventType.CURSOR_MOVED,
                    "data": {
                        "user_id": connection_info.user_id,
                        "username": connection_info.username,
                        "room_id": room_id,
                        "position": data.get("position", {}),
                        "selection": data.get("selection", {})
                    },
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }, room_id)
        
        else:
            logger.warning(f"Unknown message type: {message_type}")
    
    except Exception as e:
        logger.error(f"Error handling WebSocket message: {e}")

# Event Broadcasting Functions
async def broadcast_document_event(event_type: EventType, document_id: str, user_id: str, data: dict):
    """Broadcast document-related events"""
    message = {
        "type": event_type,
        "data": {
            "document_id": document_id,
            "user_id": user_id,
            **data
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    # Broadcast to document room
    room_id = f"document_{document_id}"
    await manager.broadcast_to_room(message, room_id)
    
    # Store in Redis for offline users
    if redis_client:
        await store_event_for_offline_users(message, document_id)

async def broadcast_task_event(event_type: EventType, task_id: str, user_id: str, data: dict):
    """Broadcast task-related events"""
    message = {
        "type": event_type,
        "data": {
            "task_id": task_id,
            "user_id": user_id,
            **data
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    # Broadcast to task room
    room_id = f"task_{task_id}"
    await manager.broadcast_to_room(message, room_id)
    
    # Send to assigned user specifically
    if "assigned_to" in data:
        await manager.send_to_user(message, data["assigned_to"])

async def broadcast_system_event(event_type: EventType, data: dict, target_users: Optional[List[str]] = None):
    """Broadcast system-wide events"""
    message = {
        "type": event_type,
        "data": data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    if target_users:
        for user_id in target_users:
            await manager.send_to_user(message, user_id)
    else:
        await manager.broadcast_to_all(message)

async def store_event_for_offline_users(message: dict, entity_id: str):
    """Store events in Redis for offline users"""
    try:
        if redis_client:
            # Store in a sorted set with timestamp as score
            key = f"offline_events:{entity_id}"
            redis_client.zadd(key, {json.dumps(message): message["timestamp"]})
            # Keep only last 100 events
            redis_client.zremrangebyrank(key, 0, -101)
            # Set expiry
            redis_client.expire(key, 86400)  # 24 hours
    except Exception as e:
        logger.error(f"Error storing offline event: {e}")

# REST API Endpoints
@app.get("/online-users")
async def get_online_users():
    """Get list of currently online users"""
    return {
        "online_users": manager.get_online_users(),
        "total_count": len(manager.user_connections)
    }

@app.get("/room/{room_id}/users")
async def get_room_users(room_id: str):
    """Get users in a specific room"""
    return {
        "room_id": room_id,
        "users": manager.get_room_users(room_id),
        "user_count": len(manager.get_room_users(room_id))
    }

@app.post("/broadcast/system")
async def broadcast_system_message(
    event_type: EventType,
    data: dict,
    target_users: Optional[List[str]] = None
):
    """Broadcast system message"""
    await broadcast_system_event(event_type, data, target_users)
    return {"success": True, "message": "Event broadcasted"}

@app.post("/broadcast/document/{document_id}")
async def broadcast_document_message(
    document_id: str,
    event_type: EventType,
    user_id: str,
    data: dict
):
    """Broadcast document-related message"""
    await broadcast_document_event(event_type, document_id, user_id, data)
    return {"success": True, "message": "Document event broadcasted"}

@app.post("/broadcast/task/{task_id}")
async def broadcast_task_message(
    task_id: str,
    event_type: EventType,
    user_id: str,
    data: dict
):
    """Broadcast task-related message"""
    await broadcast_task_event(event_type, task_id, user_id, data)
    return {"success": True, "message": "Task event broadcasted"}

@app.get("/stats")
async def get_realtime_stats():
    """Get real-time service statistics"""
    return {
        "active_connections": len(manager.active_connections),
        "online_users": len(manager.user_connections),
        "active_rooms": len(manager.room_subscriptions),
        "total_room_subscriptions": sum(len(subs) for subs in manager.room_subscriptions.values()),
        "uptime": "N/A",  # TODO: Calculate uptime
        "redis_connected": redis_client is not None
    }

@app.get("/health")
async def health_check():
    """Service health check"""
    try:
        redis_status = "connected" if redis_client and redis_client.ping() else "disconnected"
    except:
        redis_status = "error"
    
    return {
        "status": "healthy",
        "service": "Real-time Communication Service",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "active_connections": len(manager.active_connections),
        "redis_status": redis_status
    }

@app.get("/")
async def root():
    """Service root endpoint"""
    return {
        "service": "MetroMind Real-time Communication Service",
        "version": "1.0.0",
        "websocket_endpoint": "/ws/{user_id}",
        "features": [
            "Real-time WebSocket communication",
            "Room-based messaging",
            "User presence tracking",
            "Document collaboration",
            "Task notifications",
            "System broadcasts",
            "Offline event storage",
            "Typing indicators",
            "Cursor tracking"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    
    realtime_port = service_config.model_downloader_port + 2  # Port 8021
    logger.info(f"Starting Real-time Communication service on port {realtime_port}")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=realtime_port,
        log_level="info"
    )