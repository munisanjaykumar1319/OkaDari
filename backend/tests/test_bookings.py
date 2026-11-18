import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.db.base import Base
from app.db.session import get_db

TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def client():
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def create_user_and_token(client, email, role="both", bike_model=None):
    reg = client.post("/api/v1/auth/register", json={
        "full_name": f"User {email}",
        "email": email,
        "password": "Password123!",
        "role": role,
        "bike_model": bike_model or "KTM Duke 200",
        "bike_plate": "TS 09 BK 1111"
    })
    return reg.json()["access_token"]


def test_booking_request_and_lifecycle(client):
    # Setup Rider and Passenger
    rider_token = create_user_and_token(client, "rider_book@example.com", "rider", "Honda Hness CB350")
    pass_token = create_user_and_token(client, "pass_book@example.com", "passenger")

    rider_headers = {"Authorization": f"Bearer {rider_token}"}
    pass_headers = {"Authorization": f"Bearer {pass_token}"}

    # 1. Rider offers a ride with 1 seat
    dep_time = (datetime.utcnow() + timedelta(days=1)).isoformat()
    ride_res = client.post("/api/v1/rides/offer", json={
        "origin": "Hitech City",
        "destination": "Gachibowli",
        "departure_time": dep_time,
        "available_seats": 1,
        "bike_model": "Honda Hness CB350",
        "bike_plate": "TS 09 BK 1111",
        "cost_per_seat": 45.0
    }, headers=rider_headers)
    assert ride_res.status_code == 201
    ride_id = ride_res.json()["id"]

    # 2. Rider cannot book their own ride
    self_book = client.post("/api/v1/bookings/request", json={
        "ride_id": ride_id,
        "seats_booked": 1,
        "agreed_contribution": 45.0
    }, headers=rider_headers)
    assert self_book.status_code == 400
    assert "cannot book a ride that you offered" in self_book.json()["detail"]

    # 3. Passenger requests to book
    book_res = client.post("/api/v1/bookings/request", json={
        "ride_id": ride_id,
        "seats_booked": 1,
        "agreed_contribution": 45.0,
        "pickup_point": "Cyber Towers Gate 1",
        "passenger_note": "Will have a small backpack."
    }, headers=pass_headers)
    assert book_res.status_code == 201
    booking_data = book_res.json()
    booking_id = booking_data["id"]
    assert booking_data["status"] == "PENDING"
    assert booking_data["agreed_contribution"] == 45.0

    # 4. Duplicate request from same passenger fails
    dup_res = client.post("/api/v1/bookings/request", json={
        "ride_id": ride_id,
        "seats_booked": 1,
        "agreed_contribution": 45.0
    }, headers=pass_headers)
    assert dup_res.status_code == 400

    # 5. Check my-bookings endpoint
    my_bookings_res = client.get("/api/v1/bookings/my-bookings", headers=pass_headers)
    assert my_bookings_res.status_code == 200
    assert len(my_bookings_res.json()) == 1

    # 6. Rider accepts the booking request
    accept_res = client.patch(f"/api/v1/bookings/{booking_id}/accept", headers=rider_headers)
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "ACCEPTED"

    # Verify ride is now FULL and available_seats is 0
    ride_check = client.get(f"/api/v1/rides/{ride_id}")
    assert ride_check.json()["status"] == "FULL"
    assert ride_check.json()["available_seats"] == 0

    # 7. Passenger cancels their accepted booking
    cancel_res = client.patch(f"/api/v1/bookings/{booking_id}/cancel", headers=pass_headers)
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "CANCELLED"

    # Verify ride available_seats restored and status back to OPEN
    ride_restored = client.get(f"/api/v1/rides/{ride_id}")
    assert ride_restored.json()["status"] == "OPEN"
    assert ride_restored.json()["available_seats"] == 1


def test_booking_rejection_flow(client):
    rider_token = create_user_and_token(client, "rider_rej@example.com", "rider")
    pass_token = create_user_and_token(client, "pass_rej@example.com", "passenger")

    rider_headers = {"Authorization": f"Bearer {rider_token}"}
    pass_headers = {"Authorization": f"Bearer {pass_token}"}

    dep_time = (datetime.utcnow() + timedelta(days=1)).isoformat()
    ride_res = client.post("/api/v1/rides/offer", json={
        "origin": "Point A",
        "destination": "Point B",
        "departure_time": dep_time,
        "available_seats": 1,
        "bike_model": "Bike",
        "bike_plate": "PLATE",
        "cost_per_seat": 35.0
    }, headers=rider_headers)
    ride_id = ride_res.json()["id"]

    # Book request
    book_res = client.post("/api/v1/bookings/request", json={
        "ride_id": ride_id,
        "seats_booked": 1,
        "agreed_contribution": 35.0
    }, headers=pass_headers)
    booking_id = book_res.json()["id"]

    # Rider rejects
    rej_res = client.patch(f"/api/v1/bookings/{booking_id}/reject", headers=rider_headers)
    assert rej_res.status_code == 200
    assert rej_res.json()["status"] == "REJECTED"
