import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.db.base import Base
from app.db.session import get_db

# Use isolated SQLite in-memory database with StaticPool for test execution
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


def test_register_user_success(client):
    payload = {
        "full_name": "Divya Sharma",
        "email": "divya@example.com",
        "password": "SecurePassword123!",
        "phone": "+91 98877 66554",
        "role": "rider",
        "bike_model": "Honda CB300R",
        "bike_plate": "TS 08 XY 1234",
        "emergency_contact_name": "Rajesh Sharma",
        "emergency_contact_phone": "+91 98877 11111"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "divya@example.com"
    assert data["user"]["role"] == "rider"
    assert data["user"]["bike_model"] == "Honda CB300R"


def test_register_duplicate_email(client):
    payload = {
        "full_name": "User One",
        "email": "duplicate@example.com",
        "password": "Password123!",
        "role": "passenger"
    }
    res1 = client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    # Attempt duplicate registration
    res2 = client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"]


def test_login_success_and_token(client):
    # Register first
    client.post("/api/v1/auth/register", json={
        "full_name": "Siddharth Rao",
        "email": "sid@example.com",
        "password": "CorrectPassword456!",
        "role": "both"
    })

    # Login
    response = client.post("/api/v1/auth/login", json={
        "email": "sid@example.com",
        "password": "CorrectPassword456!"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["full_name"] == "Siddharth Rao"


def test_login_invalid_password(client):
    client.post("/api/v1/auth/register", json={
        "full_name": "Siddharth Rao",
        "email": "sid2@example.com",
        "password": "CorrectPassword456!",
        "role": "both"
    })

    response = client.post("/api/v1/auth/login", json={
        "email": "sid2@example.com",
        "password": "WrongPassword!"
    })
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]


def test_get_current_user_profile(client):
    reg = client.post("/api/v1/auth/register", json={
        "full_name": "Karthik Reddy",
        "email": "karthik@example.com",
        "password": "MyPassword123!",
        "role": "rider",
        "bike_model": "Ather 450X"
    })
    token = reg.json()["access_token"]

    # Call /me with Bearer token
    headers = {"Authorization": f"Bearer {token}"}
    me_resp = client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    user_data = me_resp.json()
    assert user_data["full_name"] == "Karthik Reddy"
    assert user_data["bike_model"] == "Ather 450X"


def test_get_current_user_unauthorized(client):
    # Call /me without token
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401

    # Call /me with forged token
    resp2 = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer fake.jwt.token"})
    assert resp2.status_code == 401


def test_update_profile(client):
    reg = client.post("/api/v1/auth/register", json={
        "full_name": "Ananya Sen",
        "email": "ananya@example.com",
        "password": "MyPassword123!",
        "role": "passenger"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    update_payload = {
        "role": "both",
        "bike_model": "Vespa SXL 150",
        "bike_plate": "TS 09 V 7788",
        "emergency_contact_name": "Subhash Sen",
        "emergency_contact_phone": "+91 98888 22222"
    }
    update_resp = client.put("/api/v1/auth/profile", json=update_payload, headers=headers)
    assert update_resp.status_code == 200
    updated_user = update_resp.json()
    assert updated_user["role"] == "both"
    assert updated_user["bike_model"] == "Vespa SXL 150"
    assert updated_user["emergency_contact_name"] == "Subhash Sen"
