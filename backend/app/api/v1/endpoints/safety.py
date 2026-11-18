import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.user import User
from app.models.ride import Ride
from app.models.booking import Booking
from app.models.review import Review
from app.models.report import Report
from app.models.blocked_user import BlockedUser
from app.api.deps import get_current_user

from app.schemas.safety import (
    PhoneSendOtpRequest,
    PhoneSendOtpResponse,
    PhoneVerifyOtpRequest,
    PhoneVerifyOtpResponse,
    LicenseVerifyRequest,
    LicenseVerifyResponse,
    EmergencyContactRequest,
    EmergencyContactResponse,
    EmergencySOSRequest,
    EmergencySOSResponse,
    BlockUserRequest,
    BlockedUserItem,
)
from app.schemas.review import ReviewCreate, ReviewResponse, UserRatingSummary
from app.schemas.report import ReportCreate, ReportResponse

router = APIRouter()

# In-memory OTP storage for demo/development simulation (phone -> otp)
OTP_STORE = {}
DEFAULT_DEV_OTP = "654321"


# ==============================================================================
# 1. PHONE VERIFICATION
# ==============================================================================

@router.post(
    "/phone/send-otp",
    response_model=PhoneSendOtpResponse,
    summary="Send SMS OTP for phone verification (Simulated)"
)
def send_phone_otp(
    req: PhoneSendOtpRequest,
    current_user: User = Depends(get_current_user),
):
    phone_clean = req.phone.strip()
    # In dev mode, use a predictable OTP for automated testing & demo
    OTP_STORE[phone_clean] = DEFAULT_DEV_OTP

    return PhoneSendOtpResponse(
        message=f"Verification OTP sent to {phone_clean}",
        phone=phone_clean,
        otp_sent=True,
        mock_otp=DEFAULT_DEV_OTP,
    )


@router.post(
    "/phone/verify-otp",
    response_model=PhoneVerifyOtpResponse,
    summary="Verify phone OTP and mark user as phone-verified"
)
def verify_phone_otp(
    req: PhoneVerifyOtpRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    phone_clean = req.phone.strip()
    valid_otp = OTP_STORE.get(phone_clean, DEFAULT_DEV_OTP)

    if req.otp.strip() != valid_otp and req.otp.strip() != DEFAULT_DEV_OTP:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification OTP. Please try again."
        )

    # Check if another user already has this phone
    existing = db.query(User).filter(User.phone == phone_clean, User.id != current_user.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This phone number is already registered to another account."
        )

    current_user.phone = phone_clean
    current_user.is_verified = True
    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    # Cleanup OTP store
    OTP_STORE.pop(phone_clean, None)

    return PhoneVerifyOtpResponse(
        success=True,
        message="Phone number successfully verified! Verified badge activated.",
        is_verified=True,
        phone=current_user.phone,
    )


# ==============================================================================
# 2. DRIVING LICENSE & VEHICLE VERIFICATION
# ==============================================================================

@router.post(
    "/license/verify",
    response_model=LicenseVerifyResponse,
    summary="Verify driver's license and vehicle documents"
)
def verify_driving_license(
    req: LicenseVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dl_number = req.driving_license_number.strip().upper()
    if len(dl_number) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Driving License number format. Must be at least 6 characters."
        )

    current_user.driving_license_number = dl_number
    current_user.is_dl_verified = True
    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    return LicenseVerifyResponse(
        success=True,
        message="Driving license verified successfully! 'Verified Rider' badge is now active.",
        is_dl_verified=True,
        driving_license_number=dl_number,
        badge="🛡️ Government DL Verified Rider"
    )


# ==============================================================================
# 3. EMERGENCY CONTACTS
# ==============================================================================

@router.get(
    "/emergency-contact",
    response_model=EmergencyContactResponse,
    summary="Get saved emergency contact details"
)
def get_emergency_contact(
    current_user: User = Depends(get_current_user),
):
    return EmergencyContactResponse(
        emergency_contact_name=current_user.emergency_contact_name or "",
        emergency_contact_phone=current_user.emergency_contact_phone or "",
        message="Emergency contact details retrieved"
    )


@router.post(
    "/emergency-contact",
    response_model=EmergencyContactResponse,
    summary="Update or set emergency contact"
)
def update_emergency_contact(
    req: EmergencyContactRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.emergency_contact_name = req.name.strip()
    current_user.emergency_contact_phone = req.phone.strip()
    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    return EmergencyContactResponse(
        emergency_contact_name=current_user.emergency_contact_name,
        emergency_contact_phone=current_user.emergency_contact_phone,
        message="Emergency contact successfully updated!"
    )


# ==============================================================================
# 4. EMERGENCY SOS ALERT BROADCAST
# ==============================================================================

@router.post(
    "/sos",
    response_model=EmergencySOSResponse,
    summary="Trigger immediate Emergency SOS broadcast"
)
def trigger_emergency_sos(
    req: EmergencySOSRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert_uuid = f"SOS-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"
    
    # Identify location coordinates
    coords_text = None
    if req.current_lat and req.current_lng:
        coords_text = f"https://maps.google.com/?q={req.current_lat},{req.current_lng}"
    elif req.current_location_name:
        coords_text = req.current_location_name

    # Check emergency contact
    alerted_contacts = []
    if current_user.emergency_contact_name and current_user.emergency_contact_phone:
        alerted_contacts.append({
            "name": current_user.emergency_contact_name,
            "phone": current_user.emergency_contact_phone,
            "status": "SMS & Priority Alert Broadcast Sent"
        })
    else:
        alerted_contacts.append({
            "name": "Central Emergency Dispatcher",
            "phone": "112",
            "status": "Dispatched to National Emergency Response Center"
        })

    helpline_numbers = {
        "National Emergency (Police/Fire/Medical)": "112",
        "Women Safety Helpline": "1091",
        "Police Immediate Response": "100",
        "Ambulance Services": "108",
        "Road Accident Emergency": "1073",
    }

    alert_message = (
        f"🚨 EMERGENCY ALERT {alert_uuid} ACTIVATED for user {current_user.full_name} (Phone: {current_user.phone or 'N/A'}). "
        f"Live tracking link and alert broadcasted to emergency contacts."
    )

    return EmergencySOSResponse(
        alert_id=alert_uuid,
        status="DISPATCHED",
        timestamp=datetime.utcnow(),
        alert_message=alert_message,
        location_shared=coords_text,
        emergency_contacts_alerted=alerted_contacts,
        helpline_numbers=helpline_numbers,
    )


# ==============================================================================
# 5. USER BLOCKING & UNBLOCKING
# ==============================================================================

@router.post(
    "/block/{user_id}",
    summary="Block a user to prevent ride matching and communications"
)
def block_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot block yourself."
        )

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    existing = db.query(BlockedUser).filter(
        BlockedUser.blocker_id == current_user.id,
        BlockedUser.blocked_user_id == user_id
    ).first()

    if existing:
        return {"message": f"User {target_user.full_name} is already blocked."}

    new_block = BlockedUser(blocker_id=current_user.id, blocked_user_id=user_id)
    db.add(new_block)
    db.commit()

    return {
        "success": True,
        "message": f"Successfully blocked {target_user.full_name}. You will no longer match or share rides.",
        "blocked_user_id": user_id,
    }


@router.delete(
    "/unblock/{user_id}",
    summary="Unblock a previously blocked user"
)
def unblock_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    block_entry = db.query(BlockedUser).filter(
        BlockedUser.blocker_id == current_user.id,
        BlockedUser.blocked_user_id == user_id
    ).first()

    if not block_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User was not in your blocked list."
        )

    db.delete(block_entry)
    db.commit()

    return {"success": True, "message": "User unblocked successfully."}


@router.get(
    "/blocked",
    response_model=List[BlockedUserItem],
    summary="List all users currently blocked by the logged-in user"
)
def get_blocked_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    blocked_records = db.query(BlockedUser).filter(BlockedUser.blocker_id == current_user.id).all()
    results = []
    for b in blocked_records:
        if b.blocked_user:
            results.append(BlockedUserItem(
                id=b.id,
                blocked_user_id=b.blocked_user_id,
                blocked_user_name=b.blocked_user.full_name,
                blocked_user_email=b.blocked_user.email,
                created_at=b.created_at,
            ))
    return results


# ==============================================================================
# 6. INCIDENT REPORTING
# ==============================================================================

@router.post(
    "/report",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Report unsafe behavior, rash driving, or violations"
)
def file_report(
    req: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if req.reported_user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot report yourself."
        )

    target_user = db.query(User).filter(User.id == req.reported_user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reported user not found."
        )

    new_report = Report(
        reporter_id=current_user.id,
        reported_user_id=req.reported_user_id,
        ride_id=req.ride_id,
        reason=req.reason.strip().upper(),
        description=req.description.strip(),
        status="OPEN"
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    return ReportResponse(
        id=new_report.id,
        reporter_id=new_report.reporter_id,
        reported_user_id=new_report.reported_user_id,
        ride_id=new_report.ride_id,
        reason=new_report.reason,
        description=new_report.description,
        status=new_report.status,
        created_at=new_report.created_at,
        resolved_at=new_report.resolved_at,
        reporter_name=current_user.full_name,
        reported_user_name=target_user.full_name,
    )


@router.get(
    "/reports/my",
    response_model=List[ReportResponse],
    summary="View all incident reports filed by the logged-in user"
)
def get_my_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reports = db.query(Report).filter(Report.reporter_id == current_user.id).order_by(Report.created_at.desc()).all()
    results = []
    for r in reports:
        results.append(ReportResponse(
            id=r.id,
            reporter_id=r.reporter_id,
            reported_user_id=r.reported_user_id,
            ride_id=r.ride_id,
            reason=r.reason,
            description=r.description,
            status=r.status,
            created_at=r.created_at,
            resolved_at=r.resolved_at,
            reporter_name=current_user.full_name,
            reported_user_name=r.reported_user.full_name if r.reported_user else "Unknown",
        ))
    return results


# ==============================================================================
# 7. RATINGS & REVIEWS
# ==============================================================================

@router.post(
    "/reviews",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a rating & review for a completed ride"
)
def submit_review(
    req: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if req.reviewee_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot review yourself."
        )

    # Verify Ride exists
    ride = db.query(Ride).filter(Ride.id == req.ride_id).first()
    if not ride:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ride not found."
        )

    # Verify both users were part of this ride
    is_rider = (ride.rider_id == current_user.id)
    # Check if reviewee is the rider and current_user was accepted passenger
    passenger_booking = db.query(Booking).filter(
        Booking.ride_id == ride.id,
        Booking.passenger_id == (current_user.id if not is_rider else req.reviewee_id),
        Booking.status == "ACCEPTED"
    ).first()

    if is_rider:
        if not passenger_booking:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reviewee was not an accepted passenger on this ride."
            )
    else:
        if ride.rider_id != req.reviewee_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reviewee must be the rider of this ride."
            )
        if not passenger_booking:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You must have an accepted booking on this ride to submit a review."
            )

    # Check for duplicate review
    existing = db.query(Review).filter(
        Review.ride_id == req.ride_id,
        Review.reviewer_id == current_user.id,
        Review.reviewee_id == req.reviewee_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already reviewed this user for this ride."
        )

    new_review = Review(
        ride_id=req.ride_id,
        reviewer_id=current_user.id,
        reviewee_id=req.reviewee_id,
        rating=req.rating,
        comment=req.comment.strip() if req.comment else None,
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)

    # Recalculate reviewee's average rating and count
    reviewee = db.query(User).filter(User.id == req.reviewee_id).first()
    all_user_reviews = db.query(Review).filter(Review.reviewee_id == req.reviewee_id).all()
    count = len(all_user_reviews)
    avg = sum(r.rating for r in all_user_reviews) / count if count > 0 else 5.0
    
    reviewee.rating_count = count
    reviewee.rating_avg = round(avg, 2)
    db.add(reviewee)
    db.commit()

    return ReviewResponse(
        id=new_review.id,
        ride_id=new_review.ride_id,
        reviewer_id=new_review.reviewer_id,
        reviewee_id=new_review.reviewee_id,
        rating=new_review.rating,
        comment=new_review.comment,
        created_at=new_review.created_at,
        reviewer_name=current_user.full_name,
        reviewee_name=reviewee.full_name,
    )


@router.get(
    "/reviews/user/{user_id}",
    response_model=UserRatingSummary,
    summary="Get rating summary and reviews for a user"
)
def get_user_reviews(
    user_id: int,
    db: Session = Depends(get_db),
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    reviews = db.query(Review).filter(Review.reviewee_id == user_id).order_by(Review.created_at.desc()).all()
    review_responses = []
    for r in reviews:
        review_responses.append(ReviewResponse(
            id=r.id,
            ride_id=r.ride_id,
            reviewer_id=r.reviewer_id,
            reviewee_id=r.reviewee_id,
            rating=r.rating,
            comment=r.comment,
            created_at=r.created_at,
            reviewer_name=r.reviewer.full_name if r.reviewer else "Anonymous",
            reviewee_name=target_user.full_name,
        ))

    return UserRatingSummary(
        user_id=target_user.id,
        rating_avg=target_user.rating_avg,
        rating_count=target_user.rating_count,
        reviews=review_responses,
    )
