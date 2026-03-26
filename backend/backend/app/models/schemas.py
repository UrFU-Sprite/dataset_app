from pydantic import BaseModel, Field, UUID4
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

# Enums
class ProjectType(str, Enum):
    CLASSIFICATION = "classification"
    BBOX = "bounding_box"
    SEGMENTATION = "segmentation"
    NER = "named_entity_recognition"

class ProjectStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    CLOSED = "closed"

class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    VERIFIED = "verified"
    SKIPPED = "skipped"

class UserRole(str, Enum):
    ADMIN = "admin"
    CUSTOMER = "customer"
    ANNOTATOR = "annotator"

class TransactionType(str, Enum):
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    PAYMENT_FOR_TASK = "payment_for_task"
    BONUS = "bonus"

class TransactionStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"

# Project schemas
class ProjectCreate(BaseModel):
    name: str
    type: ProjectType
    config: Dict[str, Any]
    description: Optional[str] = None
    tags: List[str] = []

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    status: Optional[ProjectStatus] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    type: ProjectType
    config: Dict[str, Any]
    status: ProjectStatus
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime]
    description: Optional[str]
    tags: List[str]
    
    class Config:
        from_attributes = True

# Task schemas
class TaskCreate(BaseModel):
    project_id: str
    data: Dict[str, Any]
    metadata: Optional[Dict[str, Any]] = None

class TaskUpdate(BaseModel):
    status: Optional[TaskStatus] = None
    assigned_to: Optional[int] = None
    annotations: Optional[Dict[str, Any]] = None

class TaskResponse(BaseModel):
    id: str
    project_id: str
    data: Dict[str, Any]
    status: TaskStatus
    assigned_to: Optional[int]
    annotations: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime
    metadata: Optional[Dict[str, Any]]

# User schemas
class UserCreate(BaseModel):
    email: str
    password: str
    role: UserRole
    full_name: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: str
    role: UserRole
    full_name: Optional[str]
    created_at: datetime

class UserProfileResponse(BaseModel):
    user_id: int
    skills: List[Dict[str, Any]]
    rating: float
    total_earned: float
    tasks_completed: int

# Finance schemas
class TransactionCreate(BaseModel):
    amount: float
    type: TransactionType
    reference_id: Optional[int] = None

class TransactionResponse(BaseModel):
    id: int
    user_id: int
    amount: float
    type: TransactionType
    status: TransactionStatus
    reference_id: Optional[int]
    created_at: datetime

class WalletResponse(BaseModel):
    user_id: int
    balance: float

# Analytics schemas
class AnnotationEvent(BaseModel):
    task_id: str
    user_id: int
    project_id: int
    action_type: str
    annotation_data: Optional[Dict[str, Any]]
    latency_ms: int

class QualityMetrics(BaseModel):
    user_id: int
    project_id: int
    f1_score: float
    precision: float
    recall: float
    tasks_completed: int
    period: str
