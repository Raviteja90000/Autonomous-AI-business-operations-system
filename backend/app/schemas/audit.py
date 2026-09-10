from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class AuditFilterRequest(BaseModel):
    domain: Optional[str] = None
    actor_type: Optional[str] = None
    action: Optional[str] = None
    result: Optional[str] = None
    limit: int = Field(default=50, ge=1, le=200)
    offset: int = Field(default=0, ge=0)


class AuditEventResponse(BaseModel):
    id: str
    timestamp: datetime
    actor_id: str
    actor_type: str
    actor_email: str
    action: str
    domain: str
    resource_type: str
    resource_id: str
    result: str
    risk_level: str
    trace_id: str
    request_id: Optional[str] = None
    ip_address: Optional[str] = None
    details: Dict[str, Any] = {}

    class Config:
        from_attributes = True


class SystemEventResponse(BaseModel):
    id: str
    event_type: str
    severity: str
    message: str
    source: str
    details: Dict[str, Any] = {}
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    organization_id: Optional[str] = None
    title: str
    message: str
    notification_type: str
    is_read: bool
    link_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
