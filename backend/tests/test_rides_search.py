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


def seed_search_rides(client):
    reg = client.post("/api/v1/auth/register", json={
        "full_name": "Rider Search Seeder",
        "email": "search_seeder@example.com",
        "password": "Password123!",
        "role": "rider",
        "bike_model": "RE Classic 350",
        "bike_plate": "TS 09 SEED 1"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    tomorrow = datetime.utcnow() + timedelta(days=1)
    day_after = datetime.utcnow() + timedelta(days=2)

    # Ride 1: Hitech City -> Gachibowli, ₹40, Helmet=True
    client.post("/api/v1/rides/offer", json={
        "origin": "Hitech City Cyber Towers",
        "destination": "Gachibowli DLF",
        "departure_time": (tomorrow.replace(hour=9, minute=0)).isoformat(),
        "available_seats": 1,
        "bike_model": "RE Classic 350",
        "bike_plate": "TS 09 SEED 1",
        "helmet_provided": True,
        "distance_km": 10.0,
        "cost_per_seat": 40.0
    }, headers=headers)

    # Ride 2: Indiranagar -> Whitefield, ₹80, Helmet=False
    client.post("/api/v1/rides/offer", json={
        "origin": "Indiranagar 100ft Road",
        "destination": "Whitefield ITPL",
        "departure_time": (tomorrow.replace(hour=10, minute=30)).isoformat(),
        "available_seats": 1,
        "bike_model": "Ather 450X",
        "bike_plate": "KA 01 SEED 2",
        "helmet_provided": False,
        "distance_km": 16.0,
        "cost_per_seat": 80.0
    }, headers=headers)

    # Ride 3: Kondapur -> Financial District, ₹30, Helmet=True (Day after tomorrow)
    client.post("/api/v1/rides/offer", json={
        "origin": "Kondapur Signal",
        "destination": "Financial District",
        "departure_time": (day_after.replace(hour=8, minute=30)).isoformat(),
        "available_seats": 1,
        "bike_model": "TVS Jupiter",
        "bike_plate": "TS 08 SEED 3",
        "helmet_provided": True,
        "distance_km": 8.0,
        "cost_per_seat": 30.0
    }, headers=headers)


def test_search_all_open_rides(client):
    seed_search_rides(client)
    response = client.get("/api/v1/rides/search")
    assert response.status_code == 200
    rides = response.json()
    assert len(rides) == 3


def test_search_filter_by_origin(client):
    seed_search_rides(client)
    response = client.get("/api/v1/rides/search?origin=Hitech")
    assert response.status_code == 200
    rides = response.json()
    assert len(rides) == 1
    assert "Hitech" in rides[0]["origin"]


def test_search_filter_by_destination(client):
    seed_search_rides(client)
    response = client.get("/api/v1/rides/search?destination=Whitefield")
    assert response.status_code == 200
    rides = response.json()
    assert len(rides) == 1
    assert "Whitefield" in rides[0]["destination"]


def test_search_filter_by_max_cost(client):
    seed_search_rides(client)
    # Filter rides with cost <= 40
    response = client.get("/api/v1/rides/search?max_cost=40")
    assert response.status_code == 200
    rides = response.json()
    assert len(rides) == 2
    for r in rides:
        assert r["cost_per_seat"] <= 40.0


def test_search_filter_by_helmet_required(client):
    seed_search_rides(client)
    response = client.get("/api/v1/rides/search?helmet_required=true")
    assert response.status_code == 200
    rides = response.json()
    assert len(rides) == 2
    for r in rides:
        assert r["helmet_provided"] is True


def test_search_filter_by_date(client):
    seed_search_rides(client)
    tomorrow_str = (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d")
    response = client.get(f"/api/v1/rides/search?date={tomorrow_str}")
    assert response.status_code == 200
    rides = response.json()
    assert len(rides) == 2


def test_search_sort_by_cost_asc(client):
    seed_search_rides(client)
    response = client.get("/api/v1/rides/search?sort_by=cost_asc")
    assert response.status_code == 200
    rides = response.json()
    costs = [r["cost_per_seat"] for r in rides]
    assert costs == sorted(costs)
    assert costs[0] == 30.0
    assert costs[-1] == 80.0
