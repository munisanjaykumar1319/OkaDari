from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any
from app.schemas.cost import CostEstimateRequest, CostEstimateResponse
from app.services.cost_calculator import calculate_journey_cost_breakdown, VEHICLE_PRESETS

router = APIRouter()


@router.post("/estimate", response_model=CostEstimateResponse, summary="Estimate transparent journey costs and fair 50% passenger split")
def estimate_cost(request: CostEstimateRequest):
    if request.distance_km <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Distance must be greater than zero kilometers"
        )

    breakdown = calculate_journey_cost_breakdown(
        distance_km=request.distance_km,
        vehicle_preset=request.vehicle_preset or "STANDARD_COMMUTER",
        fuel_price_per_l=request.fuel_price_per_l or 105.0,
        custom_mileage=request.custom_mileage
    )
    return breakdown


@router.get("/presets", summary="Get standard vehicle mileage presets and cost baselines")
def get_presets():
    return {
        "presets": VEHICLE_PRESETS,
        "default_petrol_price": 105.0,
        "non_profit_rule": "Peer ride-pooling contribution covers fuel & vehicle wear only; zero commercial profit."
    }
