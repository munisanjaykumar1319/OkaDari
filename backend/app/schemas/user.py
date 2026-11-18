from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    role: Optional[str] = "both"
    bike_model: Optional[str] = None
    bike_plate: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    bike_model: Optional[str] = None
    bike_plate: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None


class UserResponse(UserBase):
    id: int
    is_verified: bool
    is_dl_verified: bool
    driving_license_number: Optional[str] = None
    rating_avg: float
    rating_count: int
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
