"""
Tests for live location tracking endpoints.
Covers: start/update/pause/resume/stop flow, auth/authz gates, WebSocket streaming.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.services.location_tracker import location_tracker

TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
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
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)
    # Clean any in-memory location state between tests
    location_tracker._sessions.clear()
    location_tracker._locks.clear()


# ─── Fixtures ───────────────────────────────────────────────────────────────

RIDER_PAYLOAD = {
    "full_name": "Arjun Rider",
    "email": "arjun.rider@test.com",
    "password": "RiderPass123!",
    "phone": "+91 90000 11111",
    "role": "rider",
    "bike_model": "Royal Enfield Classic 350",
    "bike_plate": "TS 09 AB 1234",
    "emergency_contact_name": "Mom",
    "emergency_contact_phone": "+91 90000 99999",
}

PASSENGER_PAYLOAD = {
    "full_name": "Priya Passenger",
    "email": "priya.passenger@test.com",
    "password": "PassengerPass123!",
    "phone": "+91 90000 22222",
    "role": "passenger",
}

STRANGER_PAYLOAD = {
    "full_name": "Random Stranger",
    "email": "stranger@test.com",
    "password": "StrangerPass123!",
    "phone": "+91 90000 33333",
    "role": "passenger",
}

RIDE_PAYLOAD = {
    "origin": "Hitech City, Hyderabad",
    "destination": "Charminar, Hyderabad",
    "origin_lat": 17.4504,
    "origin_lon": 78.3808,
    "destination_lat": 17.3604,
    "destination_lon": 78.4736,
    "departure_time": "2027-06-01T08:00:00",
    "available_seats": 1,
    "bike_model": "Royal Enfield Classic 350",
    "bike_plate": "TS09AB1234",
    "helmet_provided": True,
    "distance_km": 22.5,
    "estimated_fuel_cost": 65.0,
    "cost_per_seat": 60.0,
    "notes": "Daily commute, comfortable pace",
}


def _register_and_login(client, payload):
    r = client.post("/api/v1/auth/register", json=payload)
    assert r.status_code == 201, r.text
    return r.json()["access_token"]


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


# ─── Tests ───────────────────────────────────────────────────────────────────

def _create_ride(client, token):
    """Helper: create a ride via the correct /offer endpoint."""
    r = client.post("/api/v1/rides/offer", json=RIDE_PAYLOAD, headers=_auth(token))
    assert r.status_code == 201, f"ride creation failed: {r.text}"
    return r.json()["id"]


def _create_booking(client, ride_id, passenger_token):
    """Helper: request a booking via /bookings/request."""
    r = client.post(
        "/api/v1/bookings/request",
        json={"ride_id": ride_id, "seats_booked": 1, "agreed_contribution": 60.0},
        headers=_auth(passenger_token),
    )
    assert r.status_code == 201, f"booking creation failed: {r.text}"
    return r.json()["id"]


def _accept_booking(client, booking_id, rider_token):
    """Helper: rider accepts a booking via /bookings/{id}/accept."""
    r = client.patch(f"/api/v1/bookings/{booking_id}/accept", headers=_auth(rider_token))
    assert r.status_code == 200, f"booking accept failed: {r.text}"


def test_start_sharing_as_rider(client):
    rider_token = _register_and_login(client, RIDER_PAYLOAD)
    ride_id = _create_ride(client, rider_token)

    # Start sharing
    r = client.post(f"/api/v1/rides/{ride_id}/location/start", headers=_auth(rider_token))
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "SHARING"
    assert data["ride_id"] == ride_id

    # Cleanup
    client.post(f"/api/v1/rides/{ride_id}/location/stop", headers=_auth(rider_token))


def test_push_location_update(client):
    rider_token = _register_and_login(client, RIDER_PAYLOAD)
    ride_id = _create_ride(client, rider_token)

    client.post(f"/api/v1/rides/{ride_id}/location/start", headers=_auth(rider_token))

    r = client.post(
        f"/api/v1/rides/{ride_id}/location/update",
        json={"lat": 17.4504, "lon": 78.3808, "accuracy": 5.0},
        headers=_auth(rider_token),
    )
    assert r.status_code == 200
    assert r.json()["status"] == "SHARING"

    client.post(f"/api/v1/rides/{ride_id}/location/stop", headers=_auth(rider_token))


def test_pause_and_resume(client):
    rider_token = _register_and_login(client, RIDER_PAYLOAD)
    ride_id = _create_ride(client, rider_token)

    client.post(f"/api/v1/rides/{ride_id}/location/start", headers=_auth(rider_token))

    # Pause
    r = client.post(f"/api/v1/rides/{ride_id}/location/pause", headers=_auth(rider_token))
    assert r.status_code == 200
    assert r.json()["status"] == "PAUSED"

    # Resume
    r = client.post(f"/api/v1/rides/{ride_id}/location/resume", headers=_auth(rider_token))
    assert r.status_code == 200
    assert r.json()["status"] == "SHARING"

    client.post(f"/api/v1/rides/{ride_id}/location/stop", headers=_auth(rider_token))


def test_stop_clears_data(client):
    rider_token = _register_and_login(client, RIDER_PAYLOAD)
    ride_id = _create_ride(client, rider_token)

    client.post(f"/api/v1/rides/{ride_id}/location/start", headers=_auth(rider_token))
    client.post(
        f"/api/v1/rides/{ride_id}/location/update",
        json={"lat": 17.45, "lon": 78.38},
        headers=_auth(rider_token),
    )

    # Stop sharing – data must be wiped
    r = client.post(f"/api/v1/rides/{ride_id}/location/stop", headers=_auth(rider_token))
    assert r.status_code == 200
    assert r.json()["status"] == "IDLE"

    # Rider themselves should now get 404 (no live data)
    r = client.get(f"/api/v1/rides/{ride_id}/location/latest", headers=_auth(rider_token))
    assert r.status_code == 404


def test_passenger_with_accepted_booking_can_view_location(client):
    rider_token = _register_and_login(client, RIDER_PAYLOAD)
    passenger_token = _register_and_login(client, PASSENGER_PAYLOAD)

    ride_id = _create_ride(client, rider_token)
    booking_id = _create_booking(client, ride_id, passenger_token)
    _accept_booking(client, booking_id, rider_token)

    # Rider starts sharing and pushes location
    client.post(f"/api/v1/rides/{ride_id}/location/start", headers=_auth(rider_token))
    client.post(
        f"/api/v1/rides/{ride_id}/location/update",
        json={"lat": 17.4504, "lon": 78.3808, "accuracy": 8.0},
        headers=_auth(rider_token),
    )

    # Accepted passenger can view
    r = client.get(f"/api/v1/rides/{ride_id}/location/latest", headers=_auth(passenger_token))
    assert r.status_code == 200
    data = r.json()
    assert data["lat"] == pytest.approx(17.4504)
    assert data["lon"] == pytest.approx(78.3808)
    assert data["status"] == "SHARING"

    client.post(f"/api/v1/rides/{ride_id}/location/stop", headers=_auth(rider_token))


def test_unauthorized_stranger_cannot_view_location(client):
    rider_token = _register_and_login(client, RIDER_PAYLOAD)
    stranger_token = _register_and_login(client, STRANGER_PAYLOAD)

    ride_id = _create_ride(client, rider_token)

    client.post(f"/api/v1/rides/{ride_id}/location/start", headers=_auth(rider_token))
    client.post(
        f"/api/v1/rides/{ride_id}/location/update",
        json={"lat": 17.4504, "lon": 78.3808},
        headers=_auth(rider_token),
    )

    # Stranger must be forbidden
    r = client.get(f"/api/v1/rides/{ride_id}/location/latest", headers=_auth(stranger_token))
    assert r.status_code == 403

    client.post(f"/api/v1/rides/{ride_id}/location/stop", headers=_auth(rider_token))


def test_non_provider_cannot_start_sharing(client):
    rider_token = _register_and_login(client, RIDER_PAYLOAD)
    passenger_token = _register_and_login(client, PASSENGER_PAYLOAD)

    ride_id = _create_ride(client, rider_token)

    r = client.post(f"/api/v1/rides/{ride_id}/location/start", headers=_auth(passenger_token))
    assert r.status_code == 403


def test_update_without_start_fails(client):
    rider_token = _register_and_login(client, RIDER_PAYLOAD)
    ride_id = _create_ride(client, rider_token)

    # Push update without starting first
    r = client.post(
        f"/api/v1/rides/{ride_id}/location/update",
        json={"lat": 17.45, "lon": 78.38},
        headers=_auth(rider_token),
    )
    assert r.status_code == 409


def test_duplicate_start_fails(client):
    rider_token = _register_and_login(client, RIDER_PAYLOAD)
    ride_id = _create_ride(client, rider_token)

    client.post(f"/api/v1/rides/{ride_id}/location/start", headers=_auth(rider_token))
    r = client.post(f"/api/v1/rides/{ride_id}/location/start", headers=_auth(rider_token))
    assert r.status_code == 409

    client.post(f"/api/v1/rides/{ride_id}/location/stop", headers=_auth(rider_token))


def test_unauthenticated_request_rejected(client):
    r = client.post("/api/v1/rides/999/location/start")
    assert r.status_code == 401


def test_location_status_endpoint(client):
    rider_token = _register_and_login(client, RIDER_PAYLOAD)
    ride_id = _create_ride(client, rider_token)

    client.post(f"/api/v1/rides/{ride_id}/location/start", headers=_auth(rider_token))

    r = client.get(f"/api/v1/rides/{ride_id}/location/status", headers=_auth(rider_token))
    assert r.status_code == 200
    assert r.json()["status"] == "SHARING"

    client.post(f"/api/v1/rides/{ride_id}/location/stop", headers=_auth(rider_token))
