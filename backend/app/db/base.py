# Import all models so that Base has them before being
# imported by Alembic or Base.metadata.create_all

from app.db.base_class import Base
from app.models.user import User
from app.models.ride import Ride
from app.models.booking import Booking
from app.models.review import Review
from app.models.report import Report
