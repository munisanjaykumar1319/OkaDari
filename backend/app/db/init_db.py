from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.db.base import Base
from app.db.session import engine
from app.models.user import User
from app.models.ride import Ride
from app.models.booking import Booking


def init_db(db: Session = None) -> None:
    # Create all database tables
    Base.metadata.create_all(bind=engine)

    if db is None:
        return

    # Check if seed user exists
    user = db.query(User).filter(User.email == "rohit@example.com").first()
    if not user:
        demo_rider = User(
            full_name="Rohit Kumar",
            email="rohit@example.com",
            phone="+91 98765 43210",
            hashed_password="mock_hashed_password_for_phase_3",
            role="both",
            is_verified=True,
            is_dl_verified=True,
            driving_license_number="DL-09-2022-004589",
            bike_model="Royal Enfield Hunter 350",
            bike_plate="TS 09 EZ 4589",
            rating_avg=4.9,
            rating_count=28,
            emergency_contact_name="Aakash Kumar",
            emergency_contact_phone="+91 98765 11111"
        )
        db.add(demo_rider)
        db.commit()
        db.refresh(demo_rider)

        demo_passenger = User(
            full_name="Priya Verma",
            email="priya@example.com",
            phone="+91 98123 45678",
            hashed_password="mock_hashed_password_for_phase_3",
            role="passenger",
            is_verified=True,
            rating_avg=5.0,
            rating_count=12,
            emergency_contact_name="Sanjay Verma",
            emergency_contact_phone="+91 98123 22222"
        )
        db.add(demo_passenger)
        db.commit()
        db.refresh(demo_passenger)

        # Seed sample ride
        sample_ride = Ride(
            rider_id=demo_rider.id,
            origin="Hitech City Cyber Towers",
            destination="Gachibowli DLF",
            origin_lat=17.4504,
            origin_lon=78.3808,
            destination_lat=17.4435,
            destination_lon=78.3575,
            departure_time=datetime.utcnow() + timedelta(hours=3),
            available_seats=1,
            bike_model=demo_rider.bike_model,
            bike_plate=demo_rider.bike_plate,
            helmet_provided=True,
            distance_km=12.0,
            estimated_fuel_cost=36.0,
            cost_per_seat=45.0,
            status="OPEN",
            notes="Starting promptly at 9:00 AM. Spare helmet available."
        )
        db.add(sample_ride)
        db.commit()
        db.refresh(sample_ride)

        # Seed sample booking
        sample_booking = Booking(
            ride_id=sample_ride.id,
            passenger_id=demo_passenger.id,
            seats_booked=1,
            agreed_contribution=45.0,
            pickup_point="Cyber Towers Main Gate",
            passenger_note="I will be waiting near pillar 12.",
            status="ACCEPTED"
        )
        db.add(sample_booking)
        db.commit()
