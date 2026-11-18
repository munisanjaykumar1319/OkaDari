from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    phone = Column(String(20), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="both")  # "rider", "passenger", "both"
    
    # Verification & Profile
    is_verified = Column(Boolean, default=False)
    driving_license_number = Column(String(50), nullable=True)
    is_dl_verified = Column(Boolean, default=False)
    avatar_url = Column(String(255), nullable=True)
    
    # Ratings & Reputation
    rating_avg = Column(Float, default=5.0)
    rating_count = Column(Integer, default=0)
    
    # Bike Details (for riders)
    bike_model = Column(String(100), nullable=True)
    bike_plate = Column(String(50), nullable=True)
    
    # Emergency Contact
    emergency_contact_name = Column(String(100), nullable=True)
    emergency_contact_phone = Column(String(20), nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    offered_rides = relationship("Ride", back_populates="rider", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="passenger", cascade="all, delete-orphan")
    reviews_given = relationship("Review", foreign_keys="Review.reviewer_id", back_populates="reviewer")
    reviews_received = relationship("Review", foreign_keys="Review.reviewee_id", back_populates="reviewee")
    reports_filed = relationship("Report", foreign_keys="Report.reporter_id", back_populates="reporter")
    reports_against = relationship("Report", foreign_keys="Report.reported_user_id", back_populates="reported_user")
    blocked_users = relationship("BlockedUser", foreign_keys="BlockedUser.blocker_id", cascade="all, delete-orphan")
