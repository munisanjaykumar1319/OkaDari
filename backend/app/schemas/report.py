from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class ReportBase(BaseModel):
    reported_user_id: int
    ride_id: Optional[int] = None
    reason: str  # RASH_DRIVING, UNSAFE_BEHAVIOR, OVERCHARGING, NO_SHOW, OTHER
    description: str


class ReportCreate(ReportBase):
    pass


class ReportResponse(ReportBase):
    id: int
    reporter_id: int
    reporter_name: Optional[str] = None
    reported_user_name: Optional[str] = None
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
