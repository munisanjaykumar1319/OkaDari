import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.services.matching import haversine_distance, calculate_text_similarity, calculate_time_score

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


def test_haversine_distance():
    # Hitech City (17.4504, 78.3808) to Gachibowli (17.4435, 78.3575) is approx ~2.6 km
    dist = haversine_distance(17.4504, 78.3808, 17.4435, 78.3575)
    assert 2.0 <= dist <= 3.2


def test_text_similarity():
    sim1 = calculate_text_similarity("Hitech City Metro Station", "Hitech City Cyber Towers")
    assert sim1 >= 0.65

    sim2 = calculate_text_similarity("Bandra Mumbai", "Hitech Hyderabad")
    assert sim2 < 0.2


def test_time_compatibility_score():
    score_10m = calculate_time_score(10.0)
    assert score_10m == 1.0

    score_25m = calculate_time_score(25.0)
    assert score_25m == 0.85

    score_180m = calculate_time_score(180.0)
    assert score_180m < 0.35


def test_smart_match_endpoint_and_ranking(client):
    # Register rider
    reg = client.post("/api/v1/auth/register", json={
        "full_name": "Rider Smart Match",
        "email": "smart_rider@example.com",
        "password": "Password123!",
        "role": "rider",
        "bike_model": "RE Hunter",
        "bike_plate": "TS 09 SM 1"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    dep_time = datetime.utcnow() + timedelta(days=1, hours=9)

    # Ride 1: Exact target route (Hitech City -> Gachibowli DLF), coordinates matching closely
    client.post("/api/v1/rides/offer", json={
        "origin": "Hitech City Cyber Towers",
        "destination": "Gachibowli DLF",
        "origin_lat": 17.4504,
        "origin_lon": 78.3808,
        "destination_lat": 17.4435,
        "destination_lon": 78.3575,
        "departure_time": dep_time.isoformat(),
        "available_seats": 1,
        "bike_model": "RE Hunter",
        "bike_plate": "TS 09 SM 1",
        "distance_km": 10.0,
        "cost_per_seat": 40.0
    }, headers=headers)

    # Ride 2: Nearby route, departs 45 minutes later
    client.post("/api/v1/rides/offer", json={
        "origin": "Madhapur Metro",
        "destination": "Financial District",
        "origin_lat": 17.4485,
        "origin_lon": 78.3908,
        "destination_lat": 17.4135,
        "destination_lon": 78.3475,
        "departure_time": (dep_time + timedelta(minutes=45)).isoformat(),
        "available_seats": 1,
        "bike_model": "Ather 450X",
        "bike_plate": "TS 09 SM 2",
        "distance_km": 14.0,
        "cost_per_seat": 50.0
    }, headers=headers)

    # Ride 3: Different city route (Indiranagar -> Whitefield in Bengaluru)
    client.post("/api/v1/rides/offer", json={
        "origin": "Indiranagar 100ft Road",
        "destination": "Whitefield ITPL",
        "departure_time": dep_time.isoformat(),
        "available_seats": 1,
        "bike_model": "TVS Jupiter",
        "bike_plate": "KA 01 SM 3",
        "distance_km": 18.0,
        "cost_per_seat": 70.0
    }, headers=headers)

    # Request smart match for passenger travelling from Hitech City to Gachibowli
    match_payload = {
        "origin": "Hitech City",
        "destination": "Gachibowli",
        "origin_lat": 17.4500,
        "origin_lon": 78.3800,
        "destination_lat": 17.4430,
        "destination_lon": 78.3570,
        "departure_time": dep_time.isoformat(),
        "min_score": 40.0
    }

    response = client.post("/api/v1/rides/smart-match", json=match_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total_matches"] >= 2
    matches = data["matches"]

    # Verify ranking: Match 1 must have higher match score than Match 2
    assert matches[0]["match_score"] >= matches[1]["match_score"]
    # Best match should be the Hitech -> Gachibowli ride
    best_ride = matches[0]["ride"]
    assert "Hitech" in best_ride["origin"]
    assert "Gachibowli" in best_ride["destination"]
    assert matches[0]["match_score"] >= 85.0
    assert matches[0]["compatibility_tag"] in ["Excellent Match", "Great Match"]
