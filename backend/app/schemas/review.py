from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime


class ReviewBase(BaseModel):
    ride_id: int
    reviewee_id: int
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")
    comment: Optional[str] = None


class ReviewCreate(ReviewBase):
    pass


class ReviewResponse(ReviewBase):
    id: int
    reviewer_id: int
    reviewer_name: Optional[str] = None
    reviewee_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserRatingSummary(BaseModel):
    user_id: int
    rating_avg: float
    rating_count: int
    reviews: list[ReviewResponse] = []

