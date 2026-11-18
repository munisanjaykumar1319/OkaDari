"""
Live Location Tracking endpoints.
Security model:
  - Only the ride's provider (rider) can start/pause/resume/stop sharing and push updates.
  - Only the provider OR a passenger with an ACCEPTED booking can read the latest location.
  - WebSocket connections are authenticated via ?token=<JWT> query param.
  - Location data lives only in RAM; never persisted to the database.
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.security import decode_access_token
from app.models.booking import Booking
from app.models.ride import Ride
from app.models.user import User
from app.schemas.location import (
    LatestLocationResponse,
    LocationStatusResponse,
    LocationUpdateRequest,
)
from app.services.location_tracker import location_tracker

router = APIRouter()


# ─────────────────────────── helpers ────────────────────────────

def _get_ride_or_404(ride_id: int, db: Session) -> Ride:
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
    return ride


def _assert_is_provider(ride: Ride, current_user: User):
    if ride.rider_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the ride provider can control location sharing",
        )


def _assert_can_view(ride: Ride, current_user: User, db: Session):
    is_provider = ride.rider_id == current_user.id
    if is_provider:
        return
    is_accepted_passenger = (
        db.query(Booking)
        .filter(
            Booking.ride_id == ride.id,
            Booking.passenger_id == current_user.id,
            Booking.status == "ACCEPTED",
        )
        .first()
        is not None
    )
    if not is_accepted_passenger:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: you are not authorised to view this ride's location",
        )


# ─────────────────────────── REST endpoints ────────────────────────────

@router.post("/{ride_id}/location/start", response_model=LocationStatusResponse, tags=["Live Location Tracking"])
async def start_sharing(
    ride_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Rider starts live location sharing for a ride."""
    ride = _get_ride_or_404(ride_id, db)
    _assert_is_provider(ride, current_user)
    success = await location_tracker.start_session(ride_id, current_user.id)
    if not success:
        raise HTTPException(status_code=409, detail="Location sharing is already active for this ride")
    return LocationStatusResponse(
        ride_id=ride_id,
        status="SHARING",
        last_updated=datetime.utcnow(),
        provider_name=current_user.full_name,
    )


@router.post("/{ride_id}/location/pause", response_model=LocationStatusResponse, tags=["Live Location Tracking"])
async def pause_sharing(
    ride_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Rider pauses live location sharing."""
    ride = _get_ride_or_404(ride_id, db)
    _assert_is_provider(ride, current_user)
    success = await location_tracker.pause_session(ride_id, current_user.id)
    if not success:
        raise HTTPException(status_code=409, detail="No active sharing session to pause")
    return LocationStatusResponse(
        ride_id=ride_id,
        status="PAUSED",
        last_updated=datetime.utcnow(),
        provider_name=current_user.full_name,
    )


@router.post("/{ride_id}/location/resume", response_model=LocationStatusResponse, tags=["Live Location Tracking"])
async def resume_sharing(
    ride_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Rider resumes a paused sharing session."""
    ride = _get_ride_or_404(ride_id, db)
    _assert_is_provider(ride, current_user)
    success = await location_tracker.resume_session(ride_id, current_user.id)
    if not success:
        raise HTTPException(status_code=409, detail="No paused session to resume")
    return LocationStatusResponse(
        ride_id=ride_id,
        status="SHARING",
        last_updated=datetime.utcnow(),
        provider_name=current_user.full_name,
    )


@router.post("/{ride_id}/location/stop", response_model=LocationStatusResponse, tags=["Live Location Tracking"])
async def stop_sharing(
    ride_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Rider stops live location sharing and clears all location data."""
    ride = _get_ride_or_404(ride_id, db)
    _assert_is_provider(ride, current_user)
    await location_tracker.stop_session(ride_id, current_user.id)
    return LocationStatusResponse(
        ride_id=ride_id,
        status="IDLE",
        last_updated=None,
        provider_name=current_user.full_name,
    )


@router.post("/{ride_id}/location/update", response_model=LocationStatusResponse, tags=["Live Location Tracking"])
async def push_location_update(
    ride_id: int,
    body: LocationUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Rider pushes a GPS coordinate update (called every 5-10 s by the client)."""
    ride = _get_ride_or_404(ride_id, db)
    _assert_is_provider(ride, current_user)
    success = await location_tracker.update_location(
        ride_id, current_user.id, body.lat, body.lon, body.accuracy
    )
    if not success:
        raise HTTPException(
            status_code=409,
            detail="Location sharing is not active. Start sharing first.",
        )
    return LocationStatusResponse(
        ride_id=ride_id,
        status="SHARING",
        last_updated=datetime.utcnow(),
        provider_name=current_user.full_name,
    )


@router.get("/{ride_id}/location/latest", response_model=LatestLocationResponse, tags=["Live Location Tracking"])
async def get_latest_location(
    ride_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the latest known location for a ride (provider or accepted passenger only)."""
    ride = _get_ride_or_404(ride_id, db)
    _assert_can_view(ride, current_user, db)
    data = location_tracker.get_latest(ride_id)
    if not data:
        raise HTTPException(status_code=404, detail="No live location data available for this ride")
    return LatestLocationResponse(**data)


@router.get("/{ride_id}/location/status", response_model=LocationStatusResponse, tags=["Live Location Tracking"])
async def get_sharing_status(
    ride_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current sharing status (provider or accepted passenger)."""
    ride = _get_ride_or_404(ride_id, db)
    _assert_can_view(ride, current_user, db)
    status_val = location_tracker.get_status(ride_id, ride.rider_id)
    return LocationStatusResponse(
        ride_id=ride_id,
        status=status_val,
        last_updated=None,
        provider_name=None,
    )


# ─────────────────────────── WebSocket ────────────────────────────

@router.websocket("/{ride_id}/location/ws")
async def location_websocket(
    ride_id: int,
    websocket: WebSocket,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    WebSocket endpoint for real-time location streaming.
    Authenticate via ?token=<JWT> query parameter.
    Only authorised passengers (ACCEPTED booking) or the provider can connect.
    """
    # 1. Authenticate
    if not token:
        await websocket.close(code=4401)
        return

    payload = decode_access_token(token)
    if not payload:
        await websocket.close(code=4401)
        return

    user_id_str = payload.get("sub")
    if not user_id_str:
        await websocket.close(code=4401)
        return

    try:
        user_id = int(user_id_str)
    except ValueError:
        await websocket.close(code=4401)
        return

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        await websocket.close(code=4401)
        return

    # 2. Authorise
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        await websocket.close(code=4404)
        return

    is_provider = ride.rider_id == user_id
    is_accepted_passenger = (
        db.query(Booking)
        .filter(
            Booking.ride_id == ride_id,
            Booking.passenger_id == user_id,
            Booking.status == "ACCEPTED",
        )
        .first()
        is not None
    )

    if not (is_provider or is_accepted_passenger):
        await websocket.close(code=4403)
        return

    # 3. Accept connection
    await websocket.accept()
    await location_tracker.add_connection(ride_id, websocket)

    # Send current status immediately on connect
    data = location_tracker.get_latest(ride_id)
    if data:
        await websocket.send_json({
            "type": "location",
            "lat": data["lat"],
            "lon": data["lon"],
            "accuracy": data["accuracy"],
            "timestamp": data["timestamp"].isoformat(),
        })
    else:
        await websocket.send_json({"type": "status", "status": "waiting"})

    # 4. Keep alive – listen for client ping / disconnect
    try:
        while True:
            msg = await websocket.receive_text()
            if msg == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        pass
    finally:
        await location_tracker.remove_connection(ride_id, websocket)
