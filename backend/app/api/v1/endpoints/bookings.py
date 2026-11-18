from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.ride import Ride
from app.models.booking import Booking
from app.schemas.booking import BookingCreate, BookingResponse, BookingUpdateStatus
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/request", response_model=BookingResponse, status_code=status.HTTP_201_CREATED, summary="Send a booking request for an open ride")
def request_booking(
    booking_in: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ride = db.query(Ride).filter(Ride.id == booking_in.ride_id).first()
    if not ride:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The requested ride does not exist"
        )

    # Rider cannot book their own ride
    if ride.rider_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot book a ride that you offered"
        )

    # Check ride is open and has departure in future
    if ride.status != "OPEN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This ride is currently {ride.status.lower()} and not accepting bookings"
        )

    if ride.available_seats < booking_in.seats_booked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only {ride.available_seats} seat(s) available on this ride"
        )

    # Check for existing pending or accepted booking from this passenger
    existing = db.query(Booking).filter(
        Booking.ride_id == ride.id,
        Booking.passenger_id == current_user.id,
        Booking.status.in_(["PENDING", "ACCEPTED"])
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You already have a {existing.status.lower()} booking request for this ride"
        )

    new_booking = Booking(
        ride_id=ride.id,
        passenger_id=current_user.id,
        seats_booked=booking_in.seats_booked,
        agreed_contribution=booking_in.agreed_contribution or ride.cost_per_seat,
        pickup_point=booking_in.pickup_point or ride.origin,
        passenger_note=booking_in.passenger_note,
        status="PENDING"
    )

    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return new_booking


@router.get("/my-bookings", response_model=List[BookingResponse], summary="List all bookings made by the current user")
def get_my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bookings = (
        db.query(Booking)
        .filter(Booking.passenger_id == current_user.id)
        .order_by(Booking.created_at.desc())
        .all()
    )
    return bookings


@router.get("/ride/{ride_id}/requests", response_model=List[BookingResponse], summary="Get all booking requests for a ride (for rider)")
def get_ride_booking_requests(
    ride_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")

    if ride.rider_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not authorized to view requests for this ride")

    bookings = db.query(Booking).filter(Booking.ride_id == ride_id).all()
    return bookings


@router.patch("/{booking_id}/accept", response_model=BookingResponse, summary="Rider accepts a booking request")
def accept_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking request not found")

    ride = db.query(Ride).filter(Ride.id == booking.ride_id).first()
    if not ride or ride.rider_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the ride's host can accept booking requests")

    if booking.status != "PENDING":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot accept a booking that is already {booking.status.lower()}"
        )

    if ride.available_seats < booking.seats_booked:
        raise HTTPException(
            status_code=400,
            detail="Not enough available seats left on this ride"
        )

    # Accept booking & update available seats
    booking.status = "ACCEPTED"
    ride.available_seats -= booking.seats_booked
    if ride.available_seats <= 0:
        ride.status = "FULL"

    db.add(booking)
    db.add(ride)
    db.commit()
    db.refresh(booking)
    return booking


@router.patch("/{booking_id}/reject", response_model=BookingResponse, summary="Rider rejects a booking request")
def reject_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking request not found")

    ride = db.query(Ride).filter(Ride.id == booking.ride_id).first()
    if not ride or ride.rider_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the ride's host can reject booking requests")

    if booking.status != "PENDING":
        raise HTTPException(status_code=400, detail=f"Booking is already {booking.status.lower()}")

    booking.status = "REJECTED"
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


@router.patch("/{booking_id}/cancel", response_model=BookingResponse, summary="Cancel an existing booking")
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    ride = db.query(Ride).filter(Ride.id == booking.ride_id).first()

    # Passenger or Rider can cancel
    is_passenger = booking.passenger_id == current_user.id
    is_rider = ride and (ride.rider_id == current_user.id)

    if not (is_passenger or is_rider):
        raise HTTPException(status_code=403, detail="You are not authorized to cancel this booking")

    if booking.status == "CANCELLED":
        return booking

    was_accepted = booking.status == "ACCEPTED"
    booking.status = "CANCELLED"

    # If it was accepted, return seats back to ride
    if was_accepted and ride:
        ride.available_seats += booking.seats_booked
        if ride.status == "FULL":
            ride.status = "OPEN"
        db.add(ride)

    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


@router.get("/{booking_id}", response_model=BookingResponse, summary="Get details of a specific booking")
def get_booking_details(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    ride = db.query(Ride).filter(Ride.id == booking.ride_id).first()
    if booking.passenger_id != current_user.id and (not ride or ride.rider_id != current_user.id):
        raise HTTPException(status_code=403, detail="You are not authorized to view this booking")

    return booking
