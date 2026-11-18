from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.schemas.ride import RideResponse


class SmartMatchRequest(BaseModel):
    origin: str
    destination: str
    origin_lat: Optional[float] = None
    origin_lon: Optional[float] = None
    destination_lat: Optional[float] = None
    destination_lon: Optional[float] = None
    departure_time: datetime
    max_pickup_km: float = 8.0
    time_window_minutes: int = 120
    min_score: float = 40.0


class SmartMatchItem(BaseModel):
    ride: RideResponse
    match_score: float
    pickup_distance_km: float
    dropoff_distance_km: float
    time_difference_minutes: int
    compatibility_tag: str
    pickup_score: float
    dropoff_score: float
    time_score: float

    model_config = ConfigDict(from_attributes=True)


class SmartMatchResponse(BaseModel):
    total_matches: int
    best_match_score: float
    matches: List[SmartMatchItem]
