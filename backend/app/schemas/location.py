from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class LocationUpdateRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90, description="Latitude")
    lon: float = Field(..., ge=-180, le=180, description="Longitude")
    accuracy: Optional[float] = Field(None, ge=0, description="GPS accuracy in metres")


class LocationStatusResponse(BaseModel):
    ride_id: int
    status: str  # IDLE | SHARING | PAUSED
    last_updated: Optional[datetime]
    provider_name: Optional[str]


class LatestLocationResponse(BaseModel):
    ride_id: int
    lat: float
    lon: float
    accuracy: Optional[float]
    timestamp: datetime
    status: str  # SHARING | PAUSED
