from pydantic import BaseModel
from typing import Optional, Dict, Any


class CostEstimateRequest(BaseModel):
    distance_km: float
    vehicle_preset: Optional[str] = "STANDARD_COMMUTER"
    fuel_price_per_l: Optional[float] = 105.0
    custom_mileage: Optional[float] = None


class CostEstimateResponse(BaseModel):
    distance_km: float
    vehicle_type: str
    is_ev: bool
    fuel_label: str
    fuel_cost: float
    maintenance_cost: float
    total_operating_cost: float
    rider_fair_share: float
    suggested_passenger_contribution: float
    max_allowed_contribution: float
    platform_fee: float
    estimated_cab_auto_fare: float
    passenger_savings_amount: float
    passenger_savings_percent: int
    co2_saved_kg: float
