from typing import List, Optional
from datetime import datetime, timedelta, date as date_type
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.session import get_db
from app.models.user import User
from app.models.ride import Ride
from app.models.booking import Booking
from app.schemas.ride import RideCreate, RideUpdate, RideResponse
from app.schemas.matching import SmartMatchRequest, SmartMatchResponse, SmartMatchItem
from app.services.matching import compute_smart_ride_match
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/offer", response_model=RideResponse, status_code=status.HTTP_201_CREATED, summary="Offer / Publish a new bike ride")
def offer_ride(
    ride_in: RideCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate departure time is in the future
    if ride_in.departure_time <= datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Departure time must be in the future"
        )

    # Validate seats for a two-wheeler
    if ride_in.available_seats < 1 or ride_in.available_seats > 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Available seats for bike ride-sharing must be 1 or 2"
        )

    # Validate cost contribution
    if ride_in.cost_per_seat <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cost contribution must be greater than zero"
        )

    # If user doesn't have bike details saved, save these as default
    if not current_user.bike_model:
        current_user.bike_model = ride_in.bike_model
        current_user.bike_plate = ride_in.bike_plate
        db.add(current_user)

    # Calculate estimated fuel cost if not provided (~ ₹3/km for standard commuter bike)
    estimated_fuel = ride_in.estimated_fuel_cost
    if estimated_fuel <= 0 and ride_in.distance_km > 0:
        estimated_fuel = round(ride_in.distance_km * 3.0, 2)

    new_ride = Ride(
        rider_id=current_user.id,
        origin=ride_in.origin.strip(),
        destination=ride_in.destination.strip(),
        origin_lat=ride_in.origin_lat,
        origin_lon=ride_in.origin_lon,
        destination_lat=ride_in.destination_lat,
        destination_lon=ride_in.destination_lon,
        departure_time=ride_in.departure_time,
        available_seats=ride_in.available_seats,
        bike_model=ride_in.bike_model.strip(),
        bike_plate=ride_in.bike_plate.strip().upper(),
        helmet_provided=ride_in.helmet_provided,
        distance_km=ride_in.distance_km,
        estimated_fuel_cost=estimated_fuel,
        cost_per_seat=ride_in.cost_per_seat,
        status="OPEN",
        notes=ride_in.notes
    )

    db.add(new_ride)
    db.commit()
    db.refresh(new_ride)
    return new_ride


@router.get("/my-offered", response_model=List[RideResponse], summary="List all rides offered by the current user")
def get_my_offered_rides(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rides = (
        db.query(Ride)
        .filter(Ride.rider_id == current_user.id)
        .order_by(Ride.departure_time.desc())
        .all()
    )
    return rides


@router.get("/search", response_model=List[RideResponse], summary="Search and filter available bike rides")
def search_rides(
    origin: Optional[str] = Query(None, description="Starting location keyword"),
    destination: Optional[str] = Query(None, description="Destination location keyword"),
    date: Optional[str] = Query(None, description="Travel date in YYYY-MM-DD format"),
    max_cost: Optional[float] = Query(None, description="Maximum agreed contribution"),
    helmet_required: Optional[bool] = Query(None, description="Filter rides where helmet is provided"),
    sort_by: Optional[str] = Query("time_asc", description="Sorting: time_asc, time_desc, cost_asc, cost_desc"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(Ride).filter(
        Ride.status == "OPEN",
        Ride.departure_time >= datetime.utcnow(),
        Ride.available_seats >= 1
    )

    if origin and origin.strip():
        query = query.filter(Ride.origin.ilike(f"%{origin.strip()}%"))

    if destination and destination.strip():
        query = query.filter(Ride.destination.ilike(f"%{destination.strip()}%"))

    if date and date.strip():
        try:
            target_date = datetime.strptime(date.strip(), "%Y-%m-%d").date()
            start_of_day = datetime.combine(target_date, datetime.min.time())
            end_of_day = datetime.combine(target_date, datetime.max.time())
            query = query.filter(
                Ride.departure_time >= start_of_day,
                Ride.departure_time <= end_of_day
            )
        except ValueError:
            pass

    if max_cost is not None and max_cost > 0:
        query = query.filter(Ride.cost_per_seat <= max_cost)

    if helmet_required is True:
        query = query.filter(Ride.helmet_provided == True)

    # Sorting
    if sort_by == "cost_asc":
        query = query.order_by(Ride.cost_per_seat.asc())
    elif sort_by == "cost_desc":
        query = query.order_by(Ride.cost_per_seat.desc())
    elif sort_by == "time_desc":
        query = query.order_by(Ride.departure_time.desc())
    else:  # time_asc default
        query = query.order_by(Ride.departure_time.asc())

    rides = query.offset(offset).limit(limit).all()
    return rides


@router.post("/smart-match", response_model=SmartMatchResponse, summary="Intelligently score and rank rides based on route similarity, coordinates, and departure compatibility")
def smart_match_rides(
    req: SmartMatchRequest,
    db: Session = Depends(get_db),
):
    # Search for all open upcoming rides
    candidate_rides = db.query(Ride).filter(
        Ride.status == "OPEN",
        Ride.departure_time >= datetime.utcnow(),
        Ride.available_seats >= 1
    ).all()

    p_origin_coords = (req.origin_lat, req.origin_lon) if (req.origin_lat and req.origin_lon) else None
    p_dest_coords = (req.destination_lat, req.destination_lon) if (req.destination_lat and req.destination_lon) else None

    matches: List[SmartMatchItem] = []

    for ride in candidate_rides:
        r_origin_coords = (ride.origin_lat, ride.origin_lon) if (ride.origin_lat and ride.origin_lon) else None
        r_dest_coords = (ride.destination_lat, ride.destination_lon) if (ride.destination_lat and ride.destination_lon) else None

        match_metrics = compute_smart_ride_match(
            p_origin=req.origin,
            p_dest=req.destination,
            p_dep_time=req.departure_time,
            p_origin_coords=p_origin_coords,
            p_dest_coords=p_dest_coords,
            ride_origin=ride.origin,
            ride_dest=ride.destination,
            ride_dep_time=ride.departure_time,
            ride_origin_coords=r_origin_coords,
            ride_dest_coords=r_dest_coords,
        )

        score = match_metrics["match_score"]
        if score >= req.min_score:
            matches.append(
                SmartMatchItem(
                    ride=ride,
                    match_score=score,
                    pickup_distance_km=match_metrics["pickup_distance_km"],
                    dropoff_distance_km=match_metrics["dropoff_distance_km"],
                    time_difference_minutes=match_metrics["time_difference_minutes"],
                    compatibility_tag=match_metrics["compatibility_tag"],
                    pickup_score=match_metrics["pickup_score"],
                    dropoff_score=match_metrics["dropoff_score"],
                    time_score=match_metrics["time_score"]
                )
            )

    # Rank rides strictly by match score descending
    matches.sort(key=lambda m: m.match_score, reverse=True)

    best_score = matches[0].match_score if matches else 0.0

    return SmartMatchResponse(
        total_matches=len(matches),
        best_match_score=best_score,
        matches=matches
    )


@router.get("/{ride_id}", response_model=RideResponse, summary="Get details of a specific ride")
def get_ride_by_id(
    ride_id: int,
    db: Session = Depends(get_db),
):
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ride not found"
        )
    return ride


@router.put("/{ride_id}", response_model=RideResponse, summary="Update details of an offered ride")
def update_ride(
    ride_id: int,
    ride_update: RideUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ride not found"
        )

    # Check ownership
    if ride.rider_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to edit this ride"
        )

    if ride.status in ["CANCELLED", "COMPLETED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot edit a ride that is already {ride.status.lower()}"
        )

    update_data = ride_update.model_dump(exclude_unset=True)

    if "departure_time" in update_data and update_data["departure_time"]:
        if update_data["departure_time"] <= datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New departure time must be in the future"
            )

    for field, value in update_data.items():
        setattr(ride, field, value)

    db.add(ride)
    db.commit()
    db.refresh(ride)
    return ride


@router.patch("/{ride_id}/cancel", response_model=RideResponse, summary="Cancel an offered ride")
def cancel_ride(
    ride_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ride not found"
        )

    if ride.rider_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to cancel this ride"
        )

    if ride.status == "CANCELLED":
        return ride

    ride.status = "CANCELLED"

    # Also update any pending bookings on this ride to CANCELLED
    bookings = db.query(Booking).filter(Booking.ride_id == ride.id).all()
    for b in bookings:
        if b.status in ["PENDING", "ACCEPTED"]:
            b.status = "CANCELLED"
            db.add(b)

    db.add(ride)
    db.commit()
    db.refresh(ride)
    return ride
