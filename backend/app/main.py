from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1.api import api_router
from app.db.init_db import init_db
from app.db.session import SessionLocal


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and development seeds
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for Smart Bike Ride-Sharing and Cost-Sharing System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to Smart Bike Ride-Sharing & Cost-Sharing API",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health",
        "phase": "Phase 3 - Database Design Complete",
        "tables": ["users", "rides", "bookings", "reviews", "reports"]
    }
