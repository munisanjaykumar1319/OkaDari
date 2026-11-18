import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.base_class import Base
from app.db.session import get_db
from app.core.security import get_password_hash, create_access_token
from app.models.user import User
from app.models.ride import Ride
from app.models.booking import Booking

# In-memory SQLite with StaticPool for test isolation
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def auth_users(db_session):
    rider = User(
        full_name="Arjun Rider",
        email="arjun@example.com",
        phone="9876543210",
        hashed_password=get_password_hash("RiderPass123!"),
        role="rider",
        is_verified=False,
        is_dl_verified=False,
        bike_model="Yamaha FZ 150",
        bike_plate="KA01AB1234",
    )
    passenger = User(
        full_name="Pooja Passenger",
        email="pooja@example.com",
        phone="9123456780",
        hashed_password=get_password_hash("PassPass123!"),
        role="passenger",
        is_verified=False,
        is_dl_verified=False,
    )
    db_session.add(rider)
    db_session.add(passenger)
    db_session.commit()
    db_session.refresh(rider)
    db_session.refresh(passenger)

    rider_token = create_access_token(rider.id)
    passenger_token = create_access_token(passenger.id)

    return {
        "rider": rider,
        "passenger": passenger,
        "rider_headers": {"Authorization": f"Bearer {rider_token}"},
        "passenger_headers": {"Authorization": f"Bearer {passenger_token}"},
    }


def test_phone_verification_flow(client, auth_users):
    headers = auth_users["passenger_headers"]
    
    # 1. Request OTP
    send_res = client.post(
        "/api/v1/safety/phone/send-otp",
        headers=headers,
        json={"phone": "9888877777"}
    )
    assert send_res.status_code == 200
    data = send_res.json()
    assert data["otp_sent"] is True
    assert "mock_otp" in data
    mock_otp = data["mock_otp"]

    # 2. Try with wrong OTP
    bad_verify = client.post(
        "/api/v1/safety/phone/verify-otp",
        headers=headers,
        json={"phone": "9888877777", "otp": "000000"}
    )
    assert bad_verify.status_code == 400

    # 3. Verify with correct OTP
    good_verify = client.post(
        "/api/v1/safety/phone/verify-otp",
        headers=headers,
        json={"phone": "9888877777", "otp": mock_otp}
    )
    assert good_verify.status_code == 200
    assert good_verify.json()["is_verified"] is True


def test_driving_license_verification(client, auth_users):
    headers = auth_users["rider_headers"]

    # 1. Invalid short DL
    bad_res = client.post(
        "/api/v1/safety/license/verify",
        headers=headers,
        json={"driving_license_number": "AB"}
    )
    assert bad_res.status_code == 422 or bad_res.status_code == 400

    # 2. Valid DL
    good_res = client.post(
        "/api/v1/safety/license/verify",
        headers=headers,
        json={"driving_license_number": "KA-04-20210001234"}
    )
    assert good_res.status_code == 200
    assert good_res.json()["is_dl_verified"] is True
    assert "Government DL Verified" in good_res.json()["badge"]


def test_emergency_contact_and_sos(client, auth_users):
    headers = auth_users["passenger_headers"]

    # 1. Set emergency contact
    contact_res = client.post(
        "/api/v1/safety/emergency-contact",
        headers=headers,
        json={
            "name": "Father Suresh",
            "phone": "9988776655",
            "relationship": "Father"
        }
    )
    assert contact_res.status_code == 200
    assert contact_res.json()["emergency_contact_name"] == "Father Suresh"

    # 2. Trigger SOS
    sos_res = client.post(
        "/api/v1/safety/sos",
        headers=headers,
        json={
            "current_lat": 12.9716,
            "current_lng": 77.5946,
            "current_location_name": "MG Road, Bengaluru",
            "notes": "Feeling uncomfortable on highway"
        }
    )
    assert sos_res.status_code == 200
    sos_data = sos_res.json()
    assert sos_data["status"] == "DISPATCHED"
    assert "112" in sos_data["helpline_numbers"]["National Emergency (Police/Fire/Medical)"]
    assert any(c["name"] == "Father Suresh" for c in sos_data["emergency_contacts_alerted"])


def test_block_and_unblock_user(client, auth_users):
    passenger_headers = auth_users["passenger_headers"]
    rider = auth_users["rider"]
    passenger = auth_users["passenger"]

    # 1. Self block fails
    self_block = client.post(f"/api/v1/safety/block/{passenger.id}", headers=passenger_headers)
    assert self_block.status_code == 400

    # 2. Block rider
    block_res = client.post(f"/api/v1/safety/block/{rider.id}", headers=passenger_headers)
    assert block_res.status_code == 200
    assert block_res.json()["success"] is True

    # 3. Get blocked users list
    list_res = client.get("/api/v1/safety/blocked", headers=passenger_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1
    assert list_res.json()[0]["blocked_user_id"] == rider.id

    # 4. Unblock rider
    unblock_res = client.delete(f"/api/v1/safety/unblock/{rider.id}", headers=passenger_headers)
    assert unblock_res.status_code == 200

    # 5. List now empty
    list_after = client.get("/api/v1/safety/blocked", headers=passenger_headers)
    assert len(list_after.json()) == 0


def test_report_user(client, auth_users):
    headers = auth_users["passenger_headers"]
    rider = auth_users["rider"]

    report_res = client.post(
        "/api/v1/safety/report",
        headers=headers,
        json={
            "reported_user_id": rider.id,
            "reason": "RASH_DRIVING",
            "description": "Rider was driving at high speed in heavy rain without caution."
        }
    )
    assert report_res.status_code == 201
    report_data = report_res.json()
    assert report_data["reason"] == "RASH_DRIVING"
    assert report_data["status"] == "OPEN"

    # View my reports
    my_reports = client.get("/api/v1/safety/reports/my", headers=headers)
    assert my_reports.status_code == 200
    assert len(my_reports.json()) >= 1


def test_ride_review_and_rating_recalculation(client, auth_users, db_session):
    rider = auth_users["rider"]
    passenger = auth_users["passenger"]
    rider_headers = auth_users["rider_headers"]
    passenger_headers = auth_users["passenger_headers"]

    # Setup a ride
    ride = Ride(
        rider_id=rider.id,
        origin="Koramangala",
        destination="Whitefield",
        departure_time=datetime.utcnow() + timedelta(hours=2),
        available_seats=1,
        bike_model="Yamaha FZ",
        bike_plate="KA01AB1234",
        cost_per_seat=120.0,
        status="COMPLETED"
    )
    db_session.add(ride)
    db_session.commit()
    db_session.refresh(ride)

    # Add accepted booking for passenger
    booking = Booking(
        ride_id=ride.id,
        passenger_id=passenger.id,
        seats_booked=1,
        agreed_contribution=120.0,
        status="ACCEPTED"
    )
    db_session.add(booking)
    db_session.commit()

    # Passenger reviews rider (5 stars)
    review_res = client.post(
        "/api/v1/safety/reviews",
        headers=passenger_headers,
        json={
            "ride_id": ride.id,
            "reviewee_id": rider.id,
            "rating": 5,
            "comment": "Smooth and very safe driving! Provided a clean helmet."
        }
    )
    assert review_res.status_code == 201
    review_data = review_res.json()
    assert review_data["rating"] == 5

    # Check rider rating
    summary_res = client.get(f"/api/v1/safety/reviews/user/{rider.id}")
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["rating_count"] == 1
    assert summary["rating_avg"] == 5.0
    assert len(summary["reviews"]) == 1

    # Duplicate review should be rejected
    dup_res = client.post(
        "/api/v1/safety/reviews",
        headers=passenger_headers,
        json={
            "ride_id": ride.id,
            "reviewee_id": rider.id,
            "rating": 4,
            "comment": "Trying again"
        }
    )
    assert dup_res.status_code == 400


def test_search_excludes_blocked_users(client, auth_users, db_session):
    rider = auth_users["rider"]
    passenger = auth_users["passenger"]
    passenger_headers = auth_users["passenger_headers"]

    # Rider offers an open ride
    ride = Ride(
        rider_id=rider.id,
        origin="Indiranagar",
        destination="Electronic City",
        departure_time=datetime.utcnow() + timedelta(hours=3),
        available_seats=1,
        bike_model="Yamaha FZ",
        bike_plate="KA01AB1234",
        cost_per_seat=100.0,
        status="OPEN"
    )
    db_session.add(ride)
    db_session.commit()

    # Passenger searches and finds ride
    res1 = client.get("/api/v1/rides/search?origin=Indiranagar", headers=passenger_headers)
    assert res1.status_code == 200
    assert len(res1.json()) == 1

    # Passenger blocks rider
    block_res = client.post(f"/api/v1/safety/block/{rider.id}", headers=passenger_headers)
    assert block_res.status_code == 200

    # Passenger searches again: ride should be excluded!
    res2 = client.get("/api/v1/rides/search?origin=Indiranagar", headers=passenger_headers)
    assert res2.status_code == 200
    assert len(res2.json()) == 0

