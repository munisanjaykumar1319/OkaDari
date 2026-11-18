from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, rides, bookings, cost, safety, location

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & Profile"])
api_router.include_router(rides.router, prefix="/rides", tags=["Rides Management"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["Booking Management"])
api_router.include_router(cost.router, prefix="/cost", tags=["Cost-Sharing System"])
api_router.include_router(safety.router, prefix="/safety", tags=["Safety & Trust"])
api_router.include_router(location.router, prefix="/rides", tags=["Live Location Tracking"])
