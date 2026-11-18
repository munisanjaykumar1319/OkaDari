from typing import Dict, Any, Optional

# Standard commuter vehicle presets
VEHICLE_PRESETS = {
    "STANDARD_COMMUTER": {
        "name": "Standard Commuter (100cc - 150cc)",
        "mileage_km_l": 45.0,
        "maintenance_per_km": 0.40,
        "is_ev": False
    },
    "PERFORMANCE_CRUISER": {
        "name": "Cruiser / Sports (250cc - 350cc+)",
        "mileage_km_l": 32.0,
        "maintenance_per_km": 0.65,
        "is_ev": False
    },
    "SCOOTER": {
        "name": "Gearless Scooter (Activa / Jupiter)",
        "mileage_km_l": 40.0,
        "maintenance_per_km": 0.45,
        "is_ev": False
    },
    "ELECTRIC_2W": {
        "name": "Electric Two-Wheeler (EV)",
        "mileage_km_l": 0.0,
        "electricity_cost_per_km": 0.35,
        "maintenance_per_km": 0.25,
        "is_ev": True
    }
}

DEFAULT_PETROL_PRICE_PER_LITER = 105.0


def calculate_journey_cost_breakdown(
    distance_km: float,
    vehicle_preset: str = "STANDARD_COMMUTER",
    fuel_price_per_l: float = DEFAULT_PETROL_PRICE_PER_LITER,
    custom_mileage: Optional[float] = None
) -> Dict[str, Any]:
    """
    Computes a 100% transparent, legal, non-profit cost-sharing breakdown.
    Formula:
      Total Vehicle Trip Cost = Fuel Expense + Routine Maintenance Wear
      Suggested Passenger Contribution = 50% of Trip Cost (rounded to nearest ₹5)
    """
    dist = max(1.0, round(float(distance_km), 2))
    preset = VEHICLE_PRESETS.get(vehicle_preset, VEHICLE_PRESETS["STANDARD_COMMUTER"])

    if preset["is_ev"]:
        fuel_cost = round(dist * preset["electricity_cost_per_km"], 2)
        fuel_label = "Electricity Charging Cost"
    else:
        mileage = custom_mileage if (custom_mileage and custom_mileage > 0) else preset["mileage_km_l"]
        fuel_consumed_liters = dist / mileage
        fuel_cost = round(fuel_consumed_liters * fuel_price_per_l, 2)
        fuel_label = f"Petrol Cost ({mileage:.0f} km/L @ ₹{fuel_price_per_l}/L)"

    maintenance_cost = round(dist * preset["maintenance_per_km"], 2)
    total_operating_cost = round(fuel_cost + maintenance_cost, 2)

    # 50% fair passenger split, rounded to nearest 5 for clean cash/UPI transfers
    raw_half = total_operating_cost * 0.5
    suggested_contribution = max(20.0, round(raw_half / 5.0) * 5.0)

    # Legal non-profit cap (no commercial profiteering permitted on personal vehicle)
    max_cap = round(total_operating_cost * 0.70 / 5.0) * 5.0

    # Comparable commercial cab/auto fare benchmark (~ ₹15-18/km base in metros)
    estimated_cab_fare = round(max(100.0, dist * 16.5 + 40.0))
    passenger_savings = max(0.0, round(estimated_cab_fare - suggested_contribution))
    savings_percent = round((passenger_savings / estimated_cab_fare) * 100) if estimated_cab_fare > 0 else 60

    # CO2 emission comparison: ~35g/km on bike vs ~150g/km in solo cab
    co2_saved_kg = round((dist * 0.115), 2)

    return {
        "distance_km": dist,
        "vehicle_type": preset["name"],
        "is_ev": preset["is_ev"],
        "fuel_label": fuel_label,
        "fuel_cost": fuel_cost,
        "maintenance_cost": maintenance_cost,
        "total_operating_cost": total_operating_cost,
        "rider_fair_share": round(total_operating_cost - suggested_contribution, 2),
        "suggested_passenger_contribution": suggested_contribution,
        "max_allowed_contribution": max_cap,
        "platform_fee": 0.0,
        "estimated_cab_auto_fare": estimated_cab_fare,
        "passenger_savings_amount": passenger_savings,
        "passenger_savings_percent": savings_percent,
        "co2_saved_kg": co2_saved_kg
    }
