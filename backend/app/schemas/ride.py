from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from app.schemas.user import UserResponse


class RideBase(BaseModel):
    origin: str
    destination: str
    origin_lat: Optional[float] = None
    origin_lon: Optional[float] = None
    destination_lat: Optional[float] = None
    destination_lon: Optional[float] = None
    departure_time: datetime
    available_seats: int = 1
    bike_model: str
    bike_plate: str
    helmet_provided: bool = True
    distance_km: float = 0.0
    estimated_fuel_cost: float = 0.0
    cost_per_seat: float
    notes: Optional[str] = None


class RideCreate(RideBase):
    pass


class RideUpdate(BaseModel):
    origin: Optional[str] = None
    destination: Optional[str] = None
    departure_time: Optional[datetime] = None
    available_seats: Optional[int] = None
    cost_per_seat: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class RideResponse(RideBase):
    id: int
    rider_id: int
    status: str
    created_at: datetime
    rider: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)
