import pytest
from datetime import datetime, timedelta
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
from app.db.base import Base
from app.models.user import User
from app.models.ride import Ride
from app.models.booking import Booking
from app.models.review import Review
from app.models.report import Report

# Use an in-memory SQLite database for isolated test execution
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def test_tables_created(db_session):
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    expected_tables = ["users", "rides", "bookings", "reviews", "reports"]
    for table in expected_tables:
        assert table in tables, f"Expected table '{table}' not found in database."


def test_user_creation_and_attributes(db_session):
    user = User(
        full_name="Arjun Varma",
        email="arjun@example.com",
        phone="+91 99988 77766",
        hashed_password="hashed_pw_test",
        role="rider",
        bike_model="KTM Duke 390",
        bike_plate="TS 09 AB 1234",
        is_verified=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    assert user.id is not None
    assert user.full_name == "Arjun Varma"
    assert user.bike_model == "KTM Duke 390"
    assert user.rating_avg == 5.0
    assert user.rating_count == 0


def test_ride_and_user_relationship(db_session):
    rider = User(
        full_name="Kavya Reddy",
        email="kavya@example.com",
        hashed_password="pw",
        bike_model="Honda Activa 6G",
        bike_plate="TS 10 CC 9988"
    )
    db_session.add(rider)
    db_session.commit()

    ride = Ride(
        rider_id=rider.id,
        origin="Madhapur Metro",
        destination="Gachibowli Junction",
        departure_time=datetime.utcnow() + timedelta(hours=2),
        available_seats=1,
        bike_model=rider.bike_model,
        bike_plate=rider.bike_plate,
        cost_per_seat=40.0,
        distance_km=7.5,
        estimated_fuel_cost=22.5
    )
    db_session.add(ride)
    db_session.commit()
    db_session.refresh(rider)

    assert len(rider.offered_rides) == 1
    assert rider.offered_rides[0].origin == "Madhapur Metro"
    assert ride.rider.full_name == "Kavya Reddy"


def test_booking_and_status_flow(db_session):
    rider = User(full_name="Rider One", email="r1@example.com", hashed_password="pw", bike_model="FZ", bike_plate="TS01")
    passenger = User(full_name="Passenger One", email="p1@example.com", hashed_password="pw")
    db_session.add_all([rider, passenger])
    db_session.commit()

    ride = Ride(
        rider_id=rider.id,
        origin="Origin A",
        destination="Dest B",
        departure_time=datetime.utcnow() + timedelta(hours=1),
        available_seats=1,
        bike_model="FZ",
        bike_plate="TS01",
        cost_per_seat=30.0
    )
    db_session.add(ride)
    db_session.commit()

    booking = Booking(
        ride_id=ride.id,
        passenger_id=passenger.id,
        seats_booked=1,
        agreed_contribution=30.0,
        status="PENDING"
    )
    db_session.add(booking)
    db_session.commit()
    db_session.refresh(ride)
    db_session.refresh(passenger)

    assert len(ride.bookings) == 1
    assert ride.bookings[0].passenger.email == "p1@example.com"
    assert len(passenger.bookings) == 1
    assert passenger.bookings[0].status == "PENDING"

    # Status update flow
    booking.status = "ACCEPTED"
    db_session.commit()
    db_session.refresh(booking)
    assert booking.status == "ACCEPTED"


def test_review_and_rating(db_session):
    rider = User(full_name="Rider Reviewee", email="rider_rev@example.com", hashed_password="pw", bike_model="Pulsar", bike_plate="TS02")
    passenger = User(full_name="Passenger Reviewer", email="pass_rev@example.com", hashed_password="pw")
    db_session.add_all([rider, passenger])
    db_session.commit()

    ride = Ride(
        rider_id=rider.id,
        origin="Point A",
        destination="Point B",
        departure_time=datetime.utcnow() + timedelta(hours=1),
        available_seats=1,
        bike_model="Pulsar",
        bike_plate="TS02",
        cost_per_seat=25.0
    )
    db_session.add(ride)
    db_session.commit()

    review = Review(
        ride_id=ride.id,
        reviewer_id=passenger.id,
        reviewee_id=rider.id,
        rating=5,
        comment="Smooth ride and very punctual!"
    )
    db_session.add(review)
    db_session.commit()
    db_session.refresh(rider)

    assert len(rider.reviews_received) == 1
    assert rider.reviews_received[0].rating == 5
    assert rider.reviews_received[0].comment == "Smooth ride and very punctual!"


def test_report_creation(db_session):
    user1 = User(full_name="Complainant", email="comp@example.com", hashed_password="pw")
    user2 = User(full_name="Reported User", email="rep@example.com", hashed_password="pw")
    db_session.add_all([user1, user2])
    db_session.commit()

    report = Report(
        reporter_id=user1.id,
        reported_user_id=user2.id,
        reason="RASH_DRIVING",
        description="Rider was exceeding speed limits on the flyover.",
        status="OPEN"
    )
    db_session.add(report)
    db_session.commit()
    db_session.refresh(user1)
    db_session.refresh(user2)

    assert len(user1.reports_filed) == 1
    assert len(user2.reports_against) == 1
    assert user1.reports_filed[0].reason == "RASH_DRIVING"
    assert user1.reports_filed[0].status == "OPEN"
