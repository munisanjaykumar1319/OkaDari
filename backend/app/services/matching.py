import math
from datetime import datetime
from typing import Optional, Tuple, Dict, Any


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance in kilometers between two points 
    on the earth (specified in decimal degrees).
    """
    R = 6371.0  # Earth's radius in kilometers

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    distance = R * c
    return round(distance, 2)


def calculate_text_similarity(text1: str, text2: str) -> float:
    """
    Calculates token-based overlap similarity between two location strings.
    Returns a score between 0.0 and 1.0.
    """
    if not text1 or not text2:
        return 0.0

    t1 = set(text1.lower().replace(',', ' ').replace('-', ' ').split())
    t2 = set(text2.lower().replace(',', ' ').replace('-', ' ').split())

    # Filter common stop words
    stop_words = {"road", "rd", "street", "st", "junction", "signal", "metro", "station", "hyderabad", "bangalore", "mumbai", "delhi", "near"}
    tokens1 = {w for w in t1 if w not in stop_words and len(w) > 2} or t1
    tokens2 = {w for w in t2 if w not in stop_words and len(w) > 2} or t2

    intersection = tokens1.intersection(tokens2)
    union = tokens1.union(tokens2)

    if not union:
        return 0.0

    jaccard = len(intersection) / len(union)

    # If any meaningful token exactly matches (e.g. "Hitech", "Gachibowli", "DLF"), boost base score
    if intersection:
        return max(0.65, jaccard * 1.5)

    return jaccard


def calculate_proximity_score(d_km: float) -> float:
    """
    Scores proximity in kilometers:
    <= 0.5 km: 100%
    <= 1.5 km: 90%
    <= 3.0 km: 75%
    <= 5.0 km: 55%
    > 5.0 km: decays to 0
    """
    if d_km <= 0.5:
        return 1.0
    elif d_km <= 1.5:
        return 0.90
    elif d_km <= 3.0:
        return 0.75
    elif d_km <= 5.0:
        return 0.55
    elif d_km <= 8.0:
        return 0.30
    return max(0.0, 1.0 - (d_km / 10.0))


def calculate_time_score(time_diff_minutes: float) -> float:
    """
    Scores departure schedule compatibility:
    <= 15 mins: 1.0
    <= 30 mins: 0.85
    <= 60 mins: 0.65
    <= 120 mins: 0.35
    > 120 mins: decays
    """
    diff = abs(time_diff_minutes)
    if diff <= 15:
        return 1.0
    elif diff <= 30:
        return 0.85
    elif diff <= 60:
        return 0.65
    elif diff <= 120:
        return 0.35
    return max(0.05, 1.0 - (diff / 240.0))


def compute_smart_ride_match(
    p_origin: str,
    p_dest: str,
    p_dep_time: datetime,
    p_origin_coords: Optional[Tuple[float, float]],
    p_dest_coords: Optional[Tuple[float, float]],
    ride_origin: str,
    ride_dest: str,
    ride_dep_time: datetime,
    ride_origin_coords: Optional[Tuple[float, float]],
    ride_dest_coords: Optional[Tuple[float, float]],
) -> Dict[str, Any]:
    """
    Computes multi-dimensional smart matching between passenger request and an offered ride.
    """
    # 1. Pickup compatibility
    pickup_dist_km: Optional[float] = None
    if p_origin_coords and ride_origin_coords:
        pickup_dist_km = haversine_distance(p_origin_coords[0], p_origin_coords[1], ride_origin_coords[0], ride_origin_coords[1])
        pickup_score = calculate_proximity_score(pickup_dist_km)
    else:
        pickup_score = calculate_text_similarity(p_origin, ride_origin)
        pickup_dist_km = round(max(0.2, (1.0 - pickup_score) * 4.5), 1)

    # 2. Destination compatibility
    dropoff_dist_km: Optional[float] = None
    if p_dest_coords and ride_dest_coords:
        dropoff_dist_km = haversine_distance(p_dest_coords[0], p_dest_coords[1], ride_dest_coords[0], ride_dest_coords[1])
        dropoff_score = calculate_proximity_score(dropoff_dist_km)
    else:
        dropoff_score = calculate_text_similarity(p_dest, ride_dest)
        dropoff_dist_km = round(max(0.2, (1.0 - dropoff_score) * 4.5), 1)

    # 3. Schedule compatibility
    time_diff_minutes = abs((ride_dep_time - p_dep_time).total_seconds()) / 60.0
    time_score = calculate_time_score(time_diff_minutes)

    # 4. Route direction / overlap score
    route_score = (pickup_score * 0.5) + (dropoff_score * 0.5)

    # Weighted composite score:
    # Pickup: 35%, Dropoff: 35%, Time: 20%, Route Overlap: 10%
    composite = (pickup_score * 0.35) + (dropoff_score * 0.35) + (time_score * 0.20) + (route_score * 0.10)
    match_percentage = round(min(99.0, composite * 100.0), 1)

    if match_percentage >= 90:
        tag = "Excellent Match"
    elif match_percentage >= 75:
        tag = "Great Match"
    elif match_percentage >= 60:
        tag = "Good Match"
    else:
        tag = "Partial Route Match"

    return {
        "match_score": match_percentage,
        "pickup_distance_km": pickup_dist_km,
        "dropoff_distance_km": dropoff_dist_km,
        "time_difference_minutes": int(time_diff_minutes),
        "compatibility_tag": tag,
        "pickup_score": round(pickup_score * 100, 1),
        "dropoff_score": round(dropoff_score * 100, 1),
        "time_score": round(time_score * 100, 1)
    }
