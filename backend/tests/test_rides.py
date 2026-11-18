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


def get_auth_token(client, email="rider_test@example.com"):
    reg = client.post("/api/v1/auth/register", json={
        "full_name": "Rider Tester",
        "email": email,
        "password": "Password123!",
        "role": "rider",
        "bike_model": "KTM 250 Duke",
        "bike_plate": "TS 09 KT 1234"
    })
    return reg.json()["access_token"]


def test_offer_ride_success(client):
    token = get_auth_token(client, "rider_offer_1@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    future_time = (datetime.utcnow() + timedelta(days=1)).isoformat()
    payload = {
        "origin": "Hitech City Metro",
        "destination": "Financial District",
        "departure_time": future_time,
        "available_seats": 1,
        "bike_model": "KTM 250 Duke",
        "bike_plate": "TS 09 KT 1234",
        "helmet_provided": True,
        "distance_km": 11.5,
        "cost_per_seat": 40.0,
        "notes": "Leaving on time from gate 2."
    }

    response = client.post("/api/v1/rides/offer", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["origin"] == "Hitech City Metro"
    assert data["destination"] == "Financial District"
    assert data["cost_per_seat"] == 40.0
    assert data["status"] == "OPEN"
    assert data["estimated_fuel_cost"] == 34.5  # 11.5 * 3.0


def test_offer_ride_past_time_fails(client):
    token = get_auth_token(client, "rider_past@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    past_time = (datetime.utcnow() - timedelta(hours=2)).isoformat()
    payload = {
        "origin": "Origin",
        "destination": "Dest",
        "departure_time": past_time,
        "available_seats": 1,
        "bike_model": "Bike",
        "bike_plate": "PLATE",
        "cost_per_seat": 30.0
    }
    response = client.post("/api/v1/rides/offer", json=payload, headers=headers)
    assert response.status_code == 400
    assert "Departure time must be in the future" in response.json()["detail"]


def test_offer_ride_unauthorized(client):
    payload = {
        "origin": "Origin",
        "destination": "Dest",
        "departure_time": (datetime.utcnow() + timedelta(days=1)).isoformat(),
        "available_seats": 1,
        "bike_model": "Bike",
        "bike_plate": "PLATE",
        "cost_per_seat": 30.0
    }
    response = client.post("/api/v1/rides/offer", json=payload)
    assert response.status_code == 401


def test_get_my_offered_rides(client):
    token = get_auth_token(client, "rider_list@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Offer 2 rides
    for i in [1, 2]:
        client.post("/api/v1/rides/offer", json={
            "origin": f"Point {i}",
            "destination": f"Destination {i}",
            "departure_time": (datetime.utcnow() + timedelta(days=i)).isoformat(),
            "available_seats": 1,
            "bike_model": "Bike",
            "bike_plate": "PLATE",
            "cost_per_seat": 25.0 * i
        }, headers=headers)

    response = client.get("/api/v1/rides/my-offered", headers=headers)
    assert response.status_code == 200
    rides = response.json()
    assert len(rides) == 2


def test_update_and_cancel_ride(client):
    token = get_auth_token(client, "rider_manage@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Create ride
    res = client.post("/api/v1/rides/offer", json={
        "origin": "Start A",
        "destination": "End B",
        "departure_time": (datetime.utcnow() + timedelta(days=2)).isoformat(),
        "available_seats": 1,
        "bike_model": "Bike",
        "bike_plate": "PLATE",
        "cost_per_seat": 35.0
    }, headers=headers)
    ride_id = res.json()["id"]

    # Update ride
    update_res = client.put(f"/api/v1/rides/{ride_id}", json={
        "cost_per_seat": 45.0,
        "notes": "Updated note: will wait 5 mins."
    }, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["cost_per_seat"] == 45.0
    assert "will wait 5 mins" in update_res.json()["notes"]

    # Cancel ride
    cancel_res = client.patch(f"/api/v1/rides/{ride_id}/cancel", headers=headers)
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "CANCELLED"
