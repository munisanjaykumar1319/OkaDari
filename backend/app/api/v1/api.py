from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, rides, bookings

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & Profile"])
api_router.include_router(rides.router, prefix="/rides", tags=["Rides Management"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["Booking Management"])
