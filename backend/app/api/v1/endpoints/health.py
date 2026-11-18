from fastapi import APIRouter
from datetime import datetime

router = APIRouter()


@router.get("/health", summary="Health check endpoint")
def health_check():
    return {
        "status": "healthy",
        "system": "Smart Bike Ride-Sharing & Cost-Sharing API",
        "phase": "Phase 1 - Project Setup",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "version": "1.0.0"
    }
