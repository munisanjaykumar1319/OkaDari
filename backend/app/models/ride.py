from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class Ride(Base):
    __tablename__ = "rides"

    id = Column(Integer, primary_key=True, index=True)
    rider_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Route Information
    origin = Column(String(200), nullable=False, index=True)
    destination = Column(String(200), nullable=False, index=True)
    origin_lat = Column(Float, nullable=True)
    origin_lon = Column(Float, nullable=True)
    destination_lat = Column(Float, nullable=True)
    destination_lon = Column(Float, nullable=True)

    # Schedule
    departure_time = Column(DateTime, nullable=False, index=True)
    
    # Seats & Vehicle
    available_seats = Column(Integer, default=1, nullable=False)
    bike_model = Column(String(100), nullable=False)
    bike_plate = Column(String(50), nullable=False)
    helmet_provided = Column(Boolean, default=True)

    # Cost-Sharing Breakdown
    distance_km = Column(Float, default=0.0)
    estimated_fuel_cost = Column(Float, default=0.0)
    cost_per_seat = Column(Float, nullable=False)  # Fair agreed contribution

    # Status & Meta
    status = Column(String(20), default="OPEN", index=True)  # OPEN, FULL, COMPLETED, CANCELLED
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    rider = relationship("User", back_populates="offered_rides")
    bookings = relationship("Booking", back_populates="ride", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="ride", cascade="all, delete-orphan")
