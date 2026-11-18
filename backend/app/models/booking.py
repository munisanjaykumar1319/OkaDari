from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    ride_id = Column(Integer, ForeignKey("rides.id", ondelete="CASCADE"), nullable=False, index=True)
    passenger_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    seats_booked = Column(Integer, default=1, nullable=False)
    agreed_contribution = Column(Float, nullable=False)
    pickup_point = Column(String(200), nullable=True)
    passenger_note = Column(Text, nullable=True)

    status = Column(String(20), default="PENDING", index=True)  # PENDING, ACCEPTED, REJECTED, CANCELLED, COMPLETED
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    ride = relationship("Ride", back_populates="bookings")
    passenger = relationship("User", back_populates="bookings")
