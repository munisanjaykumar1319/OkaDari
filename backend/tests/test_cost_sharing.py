import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.cost_calculator import calculate_journey_cost_breakdown, VEHICLE_PRESETS

client = TestClient(app)


def test_calculate_journey_cost_breakdown_formula():
    # 10 km on Standard Commuter (45 km/L @ 105/L)
    # Fuel: (10 / 45) * 105 = 23.33
    # Maintenance: 10 * 0.40 = 4.00
    # Operating total: ~27.33
    # 50% = ~13.66 -> rounded to nearest 5 = 20 (with min floor of 20)
    data = calculate_journey_cost_breakdown(10.0, "STANDARD_COMMUTER", 105.0)
    assert data["distance_km"] == 10.0
    assert data["fuel_cost"] == 23.33
    assert data["maintenance_cost"] == 4.0
    assert data["total_operating_cost"] == 27.33
    assert data["platform_fee"] == 0.0
    assert data["suggested_passenger_contribution"] == 20.0
    assert data["passenger_savings_percent"] > 50


def test_ev_cost_calculation():
    # 20 km on EV: electricity 20 * 0.35 = 7.00, maint = 20 * 0.25 = 5.00 -> total = 12.00
    data = calculate_journey_cost_breakdown(20.0, "ELECTRIC_2W")
    assert data["is_ev"] is True
    assert data["fuel_cost"] == 7.0
    assert data["maintenance_cost"] == 5.0
    assert data["total_operating_cost"] == 12.0


def test_cost_estimate_api_endpoint():
    payload = {
        "distance_km": 15.0,
        "vehicle_preset": "PERFORMANCE_CRUISER",
        "fuel_price_per_l": 105.0
    }
    response = client.post("/api/v1/cost/estimate", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["distance_km"] == 15.0
    assert "Cruiser" in res["vehicle_type"]
    assert res["total_operating_cost"] > 0
    assert res["suggested_passenger_contribution"] > 0
    assert res["platform_fee"] == 0.0


def test_cost_estimate_invalid_distance():
    response = client.post("/api/v1/cost/estimate", json={"distance_km": -5.0})
    assert response.status_code == 400


def test_get_presets_endpoint():
    response = client.get("/api/v1/cost/presets")
    assert response.status_code == 200
    data = response.json()
    assert "STANDARD_COMMUTER" in data["presets"]
    assert "ELECTRIC_2W" in data["presets"]
    assert data["default_petrol_price"] == 105.0
