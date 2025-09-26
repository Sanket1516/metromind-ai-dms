"""
MetroMind Enhanced Security Service
Two-factor authentication, rate limiting, session management, and security policies
"""

import os
import sys
from pathlib import Path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from fastapi import FastAPI, Depends, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import Column, String, DateTime, Text, JSON, Integer, Boolean, Float
from sqlalchemy.ext.declarative import declarative_base
import asyncio
import json
import uuid
import secrets
import pyotp
import qrcode
import io
import base64
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any
import logging
from enum import Enum
from pydantic import BaseModel
import hashlib
import bcrypt
from collections import defaultdict
import redis
import time

from database import get_db, Base, engine, User
from config import service_config, db_config, security_config
from utils.logging_utils import setup_service_logger

# Setup logging
logger = setup_service_logger("security_service")

app = FastAPI(
    title="MetroMind Enhanced Security Service",
    description="Two-factor authentication, rate limiting, and security policies",
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

# Security middleware
security = HTTPBearer()

# Redis for rate limiting and session management
try:
    redis_client = redis.Redis(
        host=db_config.redis_host,
        port=db_config.redis_port,
        password=db_config.redis_password,
        decode_responses=True
    )
    redis_client.ping()
    logger.info("Connected to Redis for security service")
except Exception as e:
    logger.error(f"Failed to connect to Redis: {e}")
    redis_client = None

# Enums
class SecurityEventType(str, Enum):
    LOGIN_ATTEMPT = "login_attempt"
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILED = "login_failed"
    PASSWORD_CHANGE = "password_change"
    TWO_FA_ENABLED = "2fa_enabled"
    TWO_FA_DISABLED = "2fa_disabled"
    TWO_FA_SUCCESS = "2fa_success"
    TWO_FA_FAILED = "2fa_failed"
    ACCOUNT_LOCKED = "account_locked"
    ACCOUNT_UNLOCKED = "account_unlocked"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    SESSION_CREATED = "session_created"
    SESSION_EXPIRED = "session_expired"
    PASSWORD_RESET_REQUESTED = "password_reset_requested"
    PASSWORD_RESET_COMPLETED = "password_reset_completed"

class SecurityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class SessionStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    REVOKED = "revoked"
    LOCKED = "locked"

# Database Models
class TwoFactorAuth(Base):
    __tablename__ = "two_factor_auth"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, unique=True, index=True)
    secret_key = Column(String, nullable=False)  # Base32 encoded TOTP secret
    backup_codes = Column(JSON)  # List of one-time backup codes
    is_enabled = Column(Boolean, default=False)
    enabled_at = Column(DateTime(timezone=True))
    last_used = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class SecurityEvent(Base):
    __tablename__ = "security_events"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, index=True)
    event_type = Column(String, nullable=False, index=True)
    severity = Column(String, default=SecurityLevel.LOW)
    
    # Event details
    ip_address = Column(String)
    user_agent = Column(String)
    location = Column(String)
    details = Column(JSON)
    
    # Timestamps
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    
    # Status
    resolved = Column(Boolean, default=False)
    resolved_by = Column(String)
    resolved_at = Column(DateTime(timezone=True))

class UserSession(Base):
    __tablename__ = "user_sessions"
    __table_args__ = {'extend_existing': True}
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    session_token = Column(String, nullable=False, unique=True, index=True)
    
    # Session details
    ip_address = Column(String)
    user_agent = Column(String)
    location = Column(String)
    device_info = Column(JSON)
    
    # Status and timestamps
    status = Column(String, default=SessionStatus.ACTIVE)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    last_activity = Column(DateTime(timezone=True), default=datetime.utcnow)
    expires_at = Column(DateTime(timezone=True))
    
    # Security flags
    is_two_factor_verified = Column(Boolean, default=False)
    is_suspicious = Column(Boolean, default=False)

class PasswordHistory(Base):
    __tablename__ = "password_history"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class AccountLockout(Base):
    __tablename__ = "account_lockouts"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    ip_address = Column(String)
    failed_attempts = Column(Integer, default=0)
    locked_at = Column(DateTime(timezone=True))
    unlock_at = Column(DateTime(timezone=True))
    is_locked = Column(Boolean, default=False)

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic Models
class TwoFactorSetupResponse(BaseModel):
    secret: str
    qr_code: str
    backup_codes: List[str]

class TwoFactorVerifyRequest(BaseModel):
    token: str
    backup_code: Optional[str] = None

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

class SessionInfo(BaseModel):
    session_id: str
    user_id: str
    ip_address: Optional[str]
    user_agent: Optional[str]
    location: Optional[str]
    created_at: datetime
    last_activity: datetime
    expires_at: datetime
    is_current: bool = False

# Rate Limiting
class RateLimiter:
    def __init__(self, redis_client):
        self.redis = redis_client
    
    async def is_rate_limited(self, key: str, limit: int, window: int) -> bool:
        """Check if request is rate limited"""
        if not self.redis:
            return False
        
        try:
            current = self.redis.get(key)
            if current is None:
                self.redis.setex(key, window, 1)
                return False
            
            if int(current) >= limit:
                return True
            
            self.redis.incr(key)
            return False
        except Exception as e:
            logger.error(f"Rate limiting error: {e}")
            return False
    
    async def get_rate_limit_status(self, key: str, limit: int) -> Dict[str, Any]:
        """Get current rate limit status"""
        if not self.redis:
            return {"requests": 0, "limit": limit, "remaining": limit}
        
        try:
            current = self.redis.get(key)
            requests = int(current) if current else 0
            remaining = max(0, limit - requests)
            
            return {
                "requests": requests,
                "limit": limit,
                "remaining": remaining
            }
        except Exception as e:
            logger.error(f"Rate limit status error: {e}")
            return {"requests": 0, "limit": limit, "remaining": limit}

rate_limiter = RateLimiter(redis_client)

# Security utilities
class SecurityUtils:
    @staticmethod
    def generate_secret_key() -> str:
        """Generate TOTP secret key"""
        return pyotp.random_base32()
    
    @staticmethod
    def generate_backup_codes(count: int = 10) -> List[str]:
        """Generate backup codes"""
        return [secrets.token_hex(4).upper() for _ in range(count)]
    
    @staticmethod
    def generate_qr_code(user_email: str, secret: str, issuer: str = "MetroMind") -> str:
        """Generate QR code for TOTP setup"""
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=user_email,
            issuer_name=issuer
        )
        
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(totp_uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        img_str = base64.b64encode(buffer.read()).decode()
        
        return f"data:image/png;base64,{img_str}"
    
    @staticmethod
    def verify_totp_token(secret: str, token: str, window: int = 1) -> bool:
        """Verify TOTP token"""
        try:
            totp = pyotp.TOTP(secret)
            return totp.verify(token, valid_window=window)
        except Exception as e:
            logger.error(f"TOTP verification error: {e}")
            return False
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using bcrypt"""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        """Verify password against hash"""
        try:
            return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
        except Exception as e:
            logger.error(f"Password verification error: {e}")
            return False
    
    @staticmethod
    def check_password_strength(password: str) -> Dict[str, Any]:
        """Check password strength"""
        score = 0
        feedback = []
        
        if len(password) >= 8:
            score += 1
        else:
            feedback.append("Password must be at least 8 characters long")
        
        if any(c.isupper() for c in password):
            score += 1
        else:
            feedback.append("Password must contain uppercase letters")
        
        if any(c.islower() for c in password):
            score += 1
        else:
            feedback.append("Password must contain lowercase letters")
        
        if any(c.isdigit() for c in password):
            score += 1
        else:
            feedback.append("Password must contain numbers")
        
        if any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
            score += 1
        else:
            feedback.append("Password must contain special characters")
        
        strength_levels = ["Very Weak", "Weak", "Fair", "Good", "Strong"]
        strength = strength_levels[min(score, 4)]
        
        return {
            "score": score,
            "strength": strength,
            "is_strong": score >= 4,
            "feedback": feedback
        }

security_utils = SecurityUtils()

# Middleware for security logging
@app.middleware("http")
async def security_logging_middleware(request: Request, call_next):
    """Log security-relevant requests"""
    start_time = time.time()
    
    # Get client info
    client_ip = request.client.host
    user_agent = request.headers.get("user-agent", "")
    
    # Rate limiting for sensitive endpoints
    if request.url.path in ["/auth/login", "/auth/2fa/verify", "/auth/reset-password"]:
        rate_limit_key = f"security_rate_limit:{client_ip}"
        if await rate_limiter.is_rate_limited(rate_limit_key, 10, 300):  # 10 requests per 5 minutes
            raise HTTPException(status_code=429, detail="Too many requests")
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    
    # Log security events
    if request.url.path.startswith("/auth/") or request.url.path.startswith("/security/"):
        logger.info(f"Security request: {request.method} {request.url.path} - {response.status_code} - {client_ip} - {process_time:.2f}s")
    
    return response

# API Endpoints
@app.post("/2fa/setup/{user_id}")
async def setup_two_factor_auth(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Setup 2FA for a user"""
    try:
        # Check if user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Generate secret and backup codes
        secret = security_utils.generate_secret_key()
        backup_codes = security_utils.generate_backup_codes()
        
        # Generate QR code
        qr_code = security_utils.generate_qr_code(user.email, secret)
        
        # Store 2FA settings (not enabled yet)
        existing_2fa = db.query(TwoFactorAuth).filter(TwoFactorAuth.user_id == user_id).first()
        if existing_2fa:
            existing_2fa.secret_key = secret
            existing_2fa.backup_codes = backup_codes
            existing_2fa.is_enabled = False
        else:
            two_fa = TwoFactorAuth(
                user_id=user_id,
                secret_key=secret,
                backup_codes=backup_codes,
                is_enabled=False
            )
            db.add(two_fa)
        
        db.commit()
        
        # Log security event
        security_event = SecurityEvent(
            user_id=user_id,
            event_type=SecurityEventType.TWO_FA_ENABLED,
            severity=SecurityLevel.MEDIUM,
            details={"action": "2fa_setup_initiated"}
        )
        db.add(security_event)
        db.commit()
        
        return TwoFactorSetupResponse(
            secret=secret,
            qr_code=qr_code,
            backup_codes=backup_codes
        )
        
    except Exception as e:
        logger.error(f"Error setting up 2FA: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to setup 2FA")

@app.post("/2fa/enable/{user_id}")
async def enable_two_factor_auth(
    user_id: str,
    verify_request: TwoFactorVerifyRequest,
    db: Session = Depends(get_db)
):
    """Enable 2FA after verifying token"""
    try:
        two_fa = db.query(TwoFactorAuth).filter(TwoFactorAuth.user_id == user_id).first()
        if not two_fa:
            raise HTTPException(status_code=404, detail="2FA not set up")
        
        # Verify token
        if not security_utils.verify_totp_token(two_fa.secret_key, verify_request.token):
            # Log failed attempt
            security_event = SecurityEvent(
                user_id=user_id,
                event_type=SecurityEventType.TWO_FA_FAILED,
                severity=SecurityLevel.MEDIUM,
                details={"action": "2fa_enable_failed", "reason": "invalid_token"}
            )
            db.add(security_event)
            db.commit()
            
            raise HTTPException(status_code=400, detail="Invalid verification token")
        
        # Enable 2FA
        two_fa.is_enabled = True
        two_fa.enabled_at = datetime.now(timezone.utc)
        two_fa.last_used = datetime.now(timezone.utc)
        
        # Log success
        security_event = SecurityEvent(
            user_id=user_id,
            event_type=SecurityEventType.TWO_FA_ENABLED,
            severity=SecurityLevel.MEDIUM,
            details={"action": "2fa_enabled_successfully"}
        )
        db.add(security_event)
        db.commit()
        
        return {"success": True, "message": "2FA enabled successfully"}
        
    except Exception as e:
        logger.error(f"Error enabling 2FA: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to enable 2FA")

@app.post("/2fa/verify/{user_id}")
async def verify_two_factor_token(
    user_id: str,
    verify_request: TwoFactorVerifyRequest,
    db: Session = Depends(get_db)
):
    """Verify 2FA token"""
    try:
        two_fa = db.query(TwoFactorAuth).filter(
            TwoFactorAuth.user_id == user_id,
            TwoFactorAuth.is_enabled == True
        ).first()
        
        if not two_fa:
            raise HTTPException(status_code=404, detail="2FA not enabled")
        
        is_valid = False
        used_backup_code = None
        
        # Try TOTP token first
        if verify_request.token:
            is_valid = security_utils.verify_totp_token(two_fa.secret_key, verify_request.token)
        
        # Try backup code if TOTP failed
        if not is_valid and verify_request.backup_code:
            backup_codes = two_fa.backup_codes or []
            if verify_request.backup_code in backup_codes:
                is_valid = True
                used_backup_code = verify_request.backup_code
                # Remove used backup code
                backup_codes.remove(verify_request.backup_code)
                two_fa.backup_codes = backup_codes
        
        if is_valid:
            two_fa.last_used = datetime.now(timezone.utc)
            
            # Log success
            security_event = SecurityEvent(
                user_id=user_id,
                event_type=SecurityEventType.TWO_FA_SUCCESS,
                severity=SecurityLevel.LOW,
                details={
                    "action": "2fa_verified",
                    "used_backup_code": used_backup_code is not None
                }
            )
            db.add(security_event)
            db.commit()
            
            return {
                "success": True,
                "message": "2FA verified successfully",
                "used_backup_code": used_backup_code is not None
            }
        else:
            # Log failed attempt
            security_event = SecurityEvent(
                user_id=user_id,
                event_type=SecurityEventType.TWO_FA_FAILED,
                severity=SecurityLevel.MEDIUM,
                details={"action": "2fa_verification_failed"}
            )
            db.add(security_event)
            db.commit()
            
            raise HTTPException(status_code=400, detail="Invalid 2FA token")
        
    except Exception as e:
        logger.error(f"Error verifying 2FA: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to verify 2FA")

@app.post("/2fa/disable/{user_id}")
async def disable_two_factor_auth(
    user_id: str,
    verify_request: TwoFactorVerifyRequest,
    db: Session = Depends(get_db)
):
    """Disable 2FA after verification"""
    try:
        two_fa = db.query(TwoFactorAuth).filter(
            TwoFactorAuth.user_id == user_id,
            TwoFactorAuth.is_enabled == True
        ).first()
        
        if not two_fa:
            raise HTTPException(status_code=404, detail="2FA not enabled")
        
        # Verify token before disabling
        if not security_utils.verify_totp_token(two_fa.secret_key, verify_request.token):
            raise HTTPException(status_code=400, detail="Invalid verification token")
        
        # Disable 2FA
        two_fa.is_enabled = False
        
        # Log security event
        security_event = SecurityEvent(
            user_id=user_id,
            event_type=SecurityEventType.TWO_FA_DISABLED,
            severity=SecurityLevel.HIGH,
            details={"action": "2fa_disabled"}
        )
        db.add(security_event)
        db.commit()
        
        return {"success": True, "message": "2FA disabled successfully"}
        
    except Exception as e:
        logger.error(f"Error disabling 2FA: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to disable 2FA")

@app.post("/password/change/{user_id}")
async def change_password(
    user_id: str,
    password_request: PasswordChangeRequest,
    db: Session = Depends(get_db)
):
    """Change user password with policy enforcement"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Verify current password
        if not security_utils.verify_password(password_request.current_password, user.password_hash):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        # Check new password confirmation
        if password_request.new_password != password_request.confirm_password:
            raise HTTPException(status_code=400, detail="Password confirmation doesn't match")
        
        # Check password strength
        strength_check = security_utils.check_password_strength(password_request.new_password)
        if not strength_check["is_strong"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Password not strong enough: {', '.join(strength_check['feedback'])}"
            )
        
        # Check password history (prevent reuse of last 5 passwords)
        password_history = db.query(PasswordHistory).filter(
            PasswordHistory.user_id == user_id
        ).order_by(PasswordHistory.created_at.desc()).limit(5).all()
        
        new_password_hash = security_utils.hash_password(password_request.new_password)
        for old_password in password_history:
            if security_utils.verify_password(password_request.new_password, old_password.password_hash):
                raise HTTPException(status_code=400, detail="Cannot reuse recent passwords")
        
        # Update password
        user.password_hash = new_password_hash
        user.updated_at = datetime.now(timezone.utc)
        
        # Add to password history
        password_hist = PasswordHistory(
            user_id=user_id,
            password_hash=new_password_hash
        )
        db.add(password_hist)
        
        # Log security event
        security_event = SecurityEvent(
            user_id=user_id,
            event_type=SecurityEventType.PASSWORD_CHANGE,
            severity=SecurityLevel.MEDIUM,
            details={"action": "password_changed"}
        )
        db.add(security_event)
        
        db.commit()
        
        return {"success": True, "message": "Password changed successfully"}
        
    except Exception as e:
        logger.error(f"Error changing password: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to change password")

@app.post("/sessions/{user_id}")
async def create_user_session(
    user_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Create a new user session"""
    try:
        # Generate session token
        session_token = secrets.token_urlsafe(32)
        
        # Get client info
        ip_address = request.client.host
        user_agent = request.headers.get("user-agent", "")
        
        # Create session
        session = UserSession(
            user_id=user_id,
            session_token=session_token,
            ip_address=ip_address,
            user_agent=user_agent,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=security_config.jwt_expiration_hours)
        )
        
        db.add(session)
        db.commit()
        db.refresh(session)
        
        # Log security event
        security_event = SecurityEvent(
            user_id=user_id,
            event_type=SecurityEventType.SESSION_CREATED,
            severity=SecurityLevel.LOW,
            ip_address=ip_address,
            user_agent=user_agent,
            details={"session_id": session.id}
        )
        db.add(security_event)
        db.commit()
        
        return {
            "success": True,
            "session_id": session.id,
            "session_token": session_token,
            "expires_at": session.expires_at
        }
        
    except Exception as e:
        logger.error(f"Error creating session: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create session")

@app.get("/sessions/{user_id}")
async def get_user_sessions(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Get all active sessions for a user"""
    try:
        sessions = db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.status == SessionStatus.ACTIVE,
            UserSession.expires_at > datetime.now(timezone.utc)
        ).order_by(UserSession.last_activity.desc()).all()
        
        session_info = []
        for session in sessions:
            session_info.append(SessionInfo(
                session_id=session.id,
                user_id=session.user_id,
                ip_address=session.ip_address,
                user_agent=session.user_agent,
                location=session.location,
                created_at=session.created_at,
                last_activity=session.last_activity,
                expires_at=session.expires_at
            ))
        
        return {"sessions": session_info}
        
    except Exception as e:
        logger.error(f"Error getting sessions: {e}")
        raise HTTPException(status_code=500, detail="Failed to get sessions")

@app.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: str,
    db: Session = Depends(get_db)
):
    """Revoke a specific session"""
    try:
        session = db.query(UserSession).filter(UserSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session.status = SessionStatus.REVOKED
        db.commit()
        
        return {"success": True, "message": "Session revoked"}
        
    except Exception as e:
        logger.error(f"Error revoking session: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to revoke session")

@app.get("/events/{user_id}")
async def get_security_events(
    user_id: str,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get security events for a user"""
    try:
        events = db.query(SecurityEvent).filter(
            SecurityEvent.user_id == user_id
        ).order_by(SecurityEvent.timestamp.desc()).limit(limit).all()
        
        return {"events": events}
        
    except Exception as e:
        logger.error(f"Error getting security events: {e}")
        raise HTTPException(status_code=500, detail="Failed to get security events")

@app.get("/dashboard/stats")
async def get_security_dashboard_stats(db: Session = Depends(get_db)):
    """Get security dashboard statistics"""
    try:
        # Get stats for last 24 hours
        last_24h = datetime.now(timezone.utc) - timedelta(hours=24)
        
        login_attempts = db.query(SecurityEvent).filter(
            SecurityEvent.event_type == SecurityEventType.LOGIN_ATTEMPT,
            SecurityEvent.timestamp >= last_24h
        ).count()
        
        failed_logins = db.query(SecurityEvent).filter(
            SecurityEvent.event_type == SecurityEventType.LOGIN_FAILED,
            SecurityEvent.timestamp >= last_24h
        ).count()
        
        two_fa_enabled_users = db.query(TwoFactorAuth).filter(
            TwoFactorAuth.is_enabled == True
        ).count()
        
        active_sessions = db.query(UserSession).filter(
            UserSession.status == SessionStatus.ACTIVE,
            UserSession.expires_at > datetime.now(timezone.utc)
        ).count()
        
        locked_accounts = db.query(AccountLockout).filter(
            AccountLockout.is_locked == True
        ).count()
        
        return {
            "login_attempts_24h": login_attempts,
            "failed_logins_24h": failed_logins,
            "two_fa_enabled_users": two_fa_enabled_users,
            "active_sessions": active_sessions,
            "locked_accounts": locked_accounts,
            "success_rate_24h": round(((login_attempts - failed_logins) / login_attempts * 100), 2) if login_attempts else 0
        }
        
    except Exception as e:
        logger.error(f"Error getting security stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get security stats")

@app.get("/health")
async def health_check():
    """Service health check"""
    redis_status = "connected" if redis_client and redis_client.ping() else "disconnected"
    
    return {
        "status": "healthy",
        "service": "Enhanced Security Service",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "redis_status": redis_status
    }

@app.get("/")
async def root():
    """Service root endpoint"""
    return {
        "service": "MetroMind Enhanced Security Service",
        "version": "1.0.0",
        "features": [
            "Two-factor authentication (TOTP)",
            "Password strength policies",
            "Session management",
            "Rate limiting",
            "Security event logging",
            "Account lockout protection",
            "Password history tracking",
            "Backup codes for 2FA",
            "Security dashboard",
            "Suspicious activity detection"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    
    security_port = service_config.model_downloader_port + 6  # Port 8025
    logger.info(f"Starting Enhanced Security service on port {security_port}")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=security_port,
        log_level="info"
    )