from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from app.schemas.user import UserResponse
from app.schemas.ride import RideResponse


class BookingBase(BaseModel):
    ride_id: int
    seats_booked: int = 1
    agreed_contribution: float
    pickup_point: Optional[str] = None
    passenger_note: Optional[str] = None


class BookingCreate(BookingBase):
    pass


class BookingUpdateStatus(BaseModel):
    status: str  # ACCEPTED, REJECTED, CANCELLED, COMPLETED


class BookingResponse(BookingBase):
    id: int
    passenger_id: int
    status: str
    created_at: datetime
    passenger: Optional[UserResponse] = None
    ride: Optional[RideResponse] = None

    model_config = ConfigDict(from_attributes=True)
