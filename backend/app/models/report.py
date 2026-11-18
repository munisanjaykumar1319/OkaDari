from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reported_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    ride_id = Column(Integer, ForeignKey("rides.id", ondelete="SET NULL"), nullable=True, index=True)

    reason = Column(String(50), nullable=False)  # RASH_DRIVING, UNSAFE_BEHAVIOR, OVERCHARGING, NO_SHOW, OTHER
    description = Column(Text, nullable=False)
    status = Column(String(20), default="OPEN", index=True)  # OPEN, INVESTIGATING, RESOLVED, DISMISSED

    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    reporter = relationship("User", foreign_keys=[reporter_id], back_populates="reports_filed")
    reported_user = relationship("User", foreign_keys=[reported_user_id], back_populates="reports_against")
    ride = relationship("Ride")
