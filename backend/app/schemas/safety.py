from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime


# Phone Verification
class PhoneSendOtpRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15, description="Phone number with country code")


class PhoneSendOtpResponse(BaseModel):
    message: str
    phone: str
    otp_sent: bool
    mock_otp: Optional[str] = None  # Returned in dev environment for automated testing / demo


class PhoneVerifyOtpRequest(BaseModel):
    phone: str
    otp: str = Field(..., min_length=4, max_length=6)


class PhoneVerifyOtpResponse(BaseModel):
    success: bool
    message: str
    is_verified: bool
    phone: str


# Driving License Verification
class LicenseVerifyRequest(BaseModel):
    driving_license_number: str = Field(..., min_length=6, max_length=30)
    state: Optional[str] = None
    vehicle_rc_number: Optional[str] = None


class LicenseVerifyResponse(BaseModel):
    success: bool
    message: str
    is_dl_verified: bool
    driving_license_number: str
    badge: str


# Emergency Contact
class EmergencyContactRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=10, max_length=20)
    relationship: Optional[str] = "Friend/Family"


class EmergencyContactResponse(BaseModel):
    emergency_contact_name: str
    emergency_contact_phone: str
    message: str


# Emergency SOS Alert
class EmergencySOSRequest(BaseModel):
    ride_id: Optional[int] = None
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    current_location_name: Optional[str] = None
    notes: Optional[str] = None


class EmergencySOSResponse(BaseModel):
    alert_id: str
    status: str
    timestamp: datetime
    alert_message: str
    location_shared: Optional[str] = None
    emergency_contacts_alerted: List[Dict[str, str]]
    helpline_numbers: Dict[str, str]


# Block User
class BlockUserRequest(BaseModel):
    user_id: int
    reason: Optional[str] = None


class BlockedUserItem(BaseModel):
    id: int
    blocked_user_id: int
    blocked_user_name: str
    blocked_user_email: str
    created_at: datetime
