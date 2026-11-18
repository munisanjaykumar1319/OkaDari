import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.base_class import Base
from app.db.session import get_db
from app.models.user import User
from app.models.ride import Ride
from app.models.booking import Booking
from app.models.review import Review
from app.models.report import Report

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


# ==============================================================================
# 1. COMPLETE END-TO-END RIDE-SHARING LIFECYCLE
# ==============================================================================

def test_complete_e2e_lifecycle(client):
    """
    Simulates complete journey from registration to ride offer, search, smart-match,
    booking request, rider acceptance, seat management, and completion with review.
    """
    # 1. Rider Registration
    rider_reg = client.post("/api/v1/auth/register", json={
        "full_name": "Rohan Deshmukh",
        "email": "rohan.rider@example.com",
        "password": "RiderSecret123!",
        "role": "rider",
        "bike_model": "Honda CB350",
        "bike_plate": "MH12AB9988"
    })
    assert rider_reg.status_code == 201
    rider_token = rider_reg.json()["access_token"]
    rider_headers = {"Authorization": f"Bearer {rider_token}"}

    # 2. Rider Verifies Phone & Driving License
    otp_req = client.post("/api/v1/safety/phone/send-otp", headers=rider_headers, json={"phone": "9876543210"})
    assert otp_req.status_code == 200
    mock_otp = otp_req.json()["mock_otp"]

    verify_phone = client.post("/api/v1/safety/phone/verify-otp", headers=rider_headers, json={
        "phone": "9876543210",
        "otp": mock_otp
    })
    assert verify_phone.status_code == 200
    assert verify_phone.json()["is_verified"] is True

    verify_dl = client.post("/api/v1/safety/license/verify", headers=rider_headers, json={
        "driving_license_number": "MH-12-20220019283"
    })
    assert verify_dl.status_code == 200
    assert verify_dl.json()["is_dl_verified"] is True

    # 3. Passenger Registration & Emergency Contact Setup
    pass_reg = client.post("/api/v1/auth/register", json={
        "full_name": "Ananya Sharma",
        "email": "ananya.passenger@example.com",
        "password": "PassSecret123!",
        "role": "passenger"
    })
    assert pass_reg.status_code == 201
    pass_token = pass_reg.json()["access_token"]
    pass_headers = {"Authorization": f"Bearer {pass_token}"}

    save_contact = client.post("/api/v1/safety/emergency-contact", headers=pass_headers, json={
        "name": "Sunita Sharma",
        "phone": "9822334455",
        "relationship": "Mother"
    })
    assert save_contact.status_code == 200

    # 4. Fair Cost Calculation for 25km commute
    cost_calc = client.post("/api/v1/cost/estimate", json={
        "distance_km": 25.0,
        "vehicle_preset": "STANDARD_COMMUTER",
        "fuel_price_per_l": 103.0
    })
    assert cost_calc.status_code == 200
    cost_data = cost_calc.json()
    assert cost_data["suggested_passenger_contribution"] > 0
    suggested_cost = cost_data["suggested_passenger_contribution"]

    # 5. Rider Offers a Ride
    departure_time = (datetime.utcnow() + timedelta(days=1)).replace(microsecond=0)
    ride_res = client.post("/api/v1/rides/offer", headers=rider_headers, json={
        "origin": "Hennur Cross",
        "destination": "Electronic City Phase 1",
        "origin_lat": 13.0358,
        "origin_lon": 77.6324,
        "destination_lat": 12.8399,
        "destination_lon": 77.6770,
        "departure_time": departure_time.isoformat(),
        "available_seats": 1,
        "bike_model": "Honda CB350",
        "bike_plate": "MH12AB9988",
        "cost_per_seat": suggested_cost,
        "distance_km": 25.0,
        "helmet_provided": True
    })
    assert ride_res.status_code == 201
    ride_id = ride_res.json()["id"]
    assert ride_res.json()["status"] == "OPEN"

    # 6. Passenger Searches and Runs Smart Match
    match_res = client.post("/api/v1/rides/smart-match", headers=pass_headers, json={
        "origin": "Hennur Cross",
        "destination": "Electronic City",
        "origin_lat": 13.0350,
        "origin_lon": 77.6320,
        "destination_lat": 12.8400,
        "destination_lon": 77.6775,
        "departure_time": departure_time.isoformat(),
        "min_score": 50.0
    })
    assert match_res.status_code == 200
    matches = match_res.json()["matches"]
    assert len(matches) >= 1
    assert matches[0]["ride"]["id"] == ride_id
    assert matches[0]["match_score"] >= 80.0

    # 7. Passenger Requests Booking
    book_req = client.post("/api/v1/bookings/request", headers=pass_headers, json={
        "ride_id": ride_id,
        "seats_booked": 1,
        "agreed_contribution": suggested_cost,
        "pickup_point": "Hennur Bus Stop",
        "passenger_note": "Will be wearing a light backpack"
    })
    assert book_req.status_code == 201
    booking_id = book_req.json()["id"]
    assert book_req.json()["status"] == "PENDING"

    # 8. Rider Inspects and Accepts Request
    rider_requests = client.get(f"/api/v1/bookings/ride/{ride_id}/requests", headers=rider_headers)
    assert rider_requests.status_code == 200
    assert len(rider_requests.json()) == 1

    accept_res = client.patch(f"/api/v1/bookings/{booking_id}/accept", headers=rider_headers)
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "ACCEPTED"

    # 9. Verify Ride State Transition: Seats = 0 -> Status = FULL
    updated_ride = client.get(f"/api/v1/rides/{ride_id}", headers=rider_headers)
    assert updated_ride.status_code == 200
    assert updated_ride.json()["available_seats"] == 0
    assert updated_ride.json()["status"] == "FULL"

    # 10. Passenger Submits 5-Star Review
    review_res = client.post("/api/v1/safety/reviews", headers=pass_headers, json={
        "ride_id": ride_id,
        "reviewee_id": ride_res.json()["rider_id"],
        "rating": 5,
        "comment": "Super punctual and safe rider! Clean helmet was provided."
    })
    assert review_res.status_code == 201
    assert review_res.json()["rating"] == 5

    # 11. Verify Rider's Public Rating Summary
    rider_id = ride_res.json()["rider_id"]
    rating_summary = client.get(f"/api/v1/safety/reviews/user/{rider_id}")
    assert rating_summary.status_code == 200
    summary_data = rating_summary.json()
    assert summary_data["rating_avg"] == 5.0
    assert summary_data["rating_count"] == 1
    assert len(summary_data["reviews"]) == 1


# ==============================================================================
# 2. SECURITY & AUTHENTICATION TESTS
# ==============================================================================

def test_unauthorized_access_protection(client):
    """Endpoints requiring authentication must return 401 when accessed without token"""
    assert client.get("/api/v1/auth/me").status_code == 401
    assert client.post("/api/v1/rides/offer", json={}).status_code == 401
    assert client.get("/api/v1/bookings/my-bookings").status_code == 401
    assert client.post("/api/v1/safety/emergency-contact", json={}).status_code == 401
    assert client.post("/api/v1/safety/sos", json={}).status_code == 401


def test_malformed_token_rejection(client):
    """Malformed or expired tokens must be rejected with 401"""
    bad_headers = {"Authorization": "Bearer totally.invalid.token"}
    res = client.get("/api/v1/auth/me", headers=bad_headers)
    assert res.status_code == 401


def test_cross_user_booking_tampering_forbidden(client):
    """User B cannot accept or reject a booking request sent to User A's ride"""
    # Create Rider A
    res_a = client.post("/api/v1/auth/register", json={
        "full_name": "Rider A",
        "email": "ridera@example.com",
        "password": "Password123!",
        "role": "rider",
        "bike_model": "Hero Splendor",
        "bike_plate": "DL01A1111"
    })
    token_a = res_a.json()["access_token"]

    # Create Imposter Rider B
    res_b = client.post("/api/v1/auth/register", json={
        "full_name": "Rider B",
        "email": "riderb@example.com",
        "password": "Password123!",
        "role": "rider",
        "bike_model": "Bajaj Pulsar",
        "bike_plate": "DL01B2222"
    })
    token_b = res_b.json()["access_token"]

    # Create Passenger C
    res_c = client.post("/api/v1/auth/register", json={
        "full_name": "Passenger C",
        "email": "passengerc@example.com",
        "password": "Password123!",
        "role": "passenger"
    })
    token_c = res_c.json()["access_token"]

    # Rider A offers ride
    ride = client.post("/api/v1/rides/offer", headers={"Authorization": f"Bearer {token_a}"}, json={
        "origin": "Connaught Place",
        "destination": "Noida Sector 62",
        "departure_time": (datetime.utcnow() + timedelta(days=1)).isoformat(),
        "available_seats": 1,
        "bike_model": "Hero Splendor",
        "bike_plate": "DL01A1111",
        "cost_per_seat": 70.0
    }).json()

    # Passenger C requests to book Rider A's ride
    booking = client.post("/api/v1/bookings/request", headers={"Authorization": f"Bearer {token_c}"}, json={
        "ride_id": ride["id"],
        "seats_booked": 1,
        "agreed_contribution": 70.0
    }).json()

    # Imposter Rider B attempts to accept Passenger C's booking on Rider A's ride
    tamper_res = client.patch(
        f"/api/v1/bookings/{booking['id']}/accept",
        headers={"Authorization": f"Bearer {token_b}"}
    )
    assert tamper_res.status_code == 403


# ==============================================================================
# 3. BUSINESS LOGIC & CONSTRAINTS ENFORCEMENT
# ==============================================================================

def test_self_booking_prevented(client):
    """Riders cannot book their own ride"""
    res = client.post("/api/v1/auth/register", json={
        "full_name": "Self Booker",
        "email": "selfbooker@example.com",
        "password": "Password123!",
        "role": "rider",
        "bike_model": "TVS Apache",
        "bike_plate": "TN01AB3333"
    })
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    ride = client.post("/api/v1/rides/offer", headers=headers, json={
        "origin": "Adyar",
        "destination": "Velachery",
        "departure_time": (datetime.utcnow() + timedelta(days=1)).isoformat(),
        "available_seats": 1,
        "bike_model": "TVS Apache",
        "bike_plate": "TN01AB3333",
        "cost_per_seat": 50.0
    }).json()

    book_res = client.post("/api/v1/bookings/request", headers=headers, json={
        "ride_id": ride["id"],
        "seats_booked": 1,
        "agreed_contribution": 50.0
    })
    assert book_res.status_code == 400
    assert "cannot book a ride that you offered" in book_res.json()["detail"].lower()


def test_booking_cancellation_restores_seat_and_reopens_ride(client):
    """Cancelling an accepted booking increments available seats and transitions FULL -> OPEN"""
    # Rider
    res_rider = client.post("/api/v1/auth/register", json={
        "full_name": "Rider Dinesh",
        "email": "dinesh@example.com",
        "password": "Password123!",
        "role": "rider",
        "bike_model": "Yamaha R15",
        "bike_plate": "KA04AA5555"
    })
    rider_token = res_rider.json()["access_token"]

    # Passenger
    res_pass = client.post("/api/v1/auth/register", json={
        "full_name": "Passenger Meera",
        "email": "meera@example.com",
        "password": "Password123!",
        "role": "passenger"
    })
    pass_token = res_pass.json()["access_token"]

    # Offer ride with 1 seat
    ride = client.post("/api/v1/rides/offer", headers={"Authorization": f"Bearer {rider_token}"}, json={
        "origin": "Koramangala",
        "destination": "MG Road",
        "departure_time": (datetime.utcnow() + timedelta(days=1)).isoformat(),
        "available_seats": 1,
        "bike_model": "Yamaha R15",
        "bike_plate": "KA04AA5555",
        "cost_per_seat": 60.0
    }).json()

    # Book and accept
    booking = client.post("/api/v1/bookings/request", headers={"Authorization": f"Bearer {pass_token}"}, json={
        "ride_id": ride["id"],
        "seats_booked": 1,
        "agreed_contribution": 60.0
    }).json()

    client.patch(f"/api/v1/bookings/{booking['id']}/accept", headers={"Authorization": f"Bearer {rider_token}"})

    # Ride is FULL
    ride_check1 = client.get(f"/api/v1/rides/{ride['id']}").json()
    assert ride_check1["status"] == "FULL"
    assert ride_check1["available_seats"] == 0

    # Passenger cancels booking
    cancel_res = client.patch(f"/api/v1/bookings/{booking['id']}/cancel", headers={"Authorization": f"Bearer {pass_token}"})
    assert cancel_res.status_code == 200

    # Ride reopens: seats = 1, status = OPEN
    ride_check2 = client.get(f"/api/v1/rides/{ride['id']}").json()
    assert ride_check2["status"] == "OPEN"
    assert ride_check2["available_seats"] == 1


def test_invalid_ride_parameters_rejected(client):
    """Rides with past time, invalid seats, or non-positive cost must fail validation"""
    res = client.post("/api/v1/auth/register", json={
        "full_name": "Rider Param",
        "email": "param@example.com",
        "password": "Password123!",
        "role": "rider",
        "bike_model": "Hero Glamour",
        "bike_plate": "MH01AB0001"
    })
    headers = {"Authorization": f"Bearer {res.json()['access_token']}"}

    # Past departure time
    past_res = client.post("/api/v1/rides/offer", headers=headers, json={
        "origin": "A",
        "destination": "B",
        "departure_time": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
        "available_seats": 1,
        "bike_model": "Hero Glamour",
        "bike_plate": "MH01AB0001",
        "cost_per_seat": 50.0
    })
    assert past_res.status_code == 400

    # Invalid seats (> 2 on a two-wheeler)
    seats_res = client.post("/api/v1/rides/offer", headers=headers, json={
        "origin": "A",
        "destination": "B",
        "departure_time": (datetime.utcnow() + timedelta(days=1)).isoformat(),
        "available_seats": 4,
        "bike_model": "Hero Glamour",
        "bike_plate": "MH01AB0001",
        "cost_per_seat": 50.0
    })
    assert seats_res.status_code == 400

    # Non-positive cost
    cost_res = client.post("/api/v1/rides/offer", headers=headers, json={
        "origin": "A",
        "destination": "B",
        "departure_time": (datetime.utcnow() + timedelta(days=1)).isoformat(),
        "available_seats": 1,
        "bike_model": "Hero Glamour",
        "bike_plate": "MH01AB0001",
        "cost_per_seat": 0.0
    })
    assert cost_res.status_code == 400
