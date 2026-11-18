from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import Token, LoginRequest, RegisterRequest
from app.schemas.user import UserResponse, UserUpdate
from app.core.security import verify_password, get_password_hash, create_access_token
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED, summary="Register a new user")
def register(
    register_in: RegisterRequest,
    db: Session = Depends(get_db)
):
    # Check if email is already taken
    existing_user = db.query(User).filter(User.email == register_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
        )
    
    # Check if phone is already taken
    if register_in.phone:
        existing_phone = db.query(User).filter(User.phone == register_in.phone).first()
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this phone number already exists"
            )

    # Validate role selection
    if register_in.role not in ["rider", "passenger", "both"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be one of: 'rider', 'passenger', 'both'"
        )

    # If role is rider, bike details recommended
    user = User(
        full_name=register_in.full_name,
        email=register_in.email,
        phone=register_in.phone,
        hashed_password=get_password_hash(register_in.password),
        role=register_in.role,
        bike_model=register_in.bike_model,
        bike_plate=register_in.bike_plate,
        emergency_contact_name=register_in.emergency_contact_name,
        emergency_contact_phone=register_in.emergency_contact_phone,
        is_verified=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/login", response_model=Token, summary="Login user and return JWT access token")
def login(
    login_in: LoginRequest,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=UserResponse, summary="Get current logged-in user profile")
def get_me(
    current_user: User = Depends(get_current_user)
):
    return current_user


@router.put("/profile", response_model=UserResponse, summary="Update user profile and vehicle details")
def update_profile(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    update_data = user_update.model_dump(exclude_unset=True)
    
    # If phone is changing, ensure uniqueness
    if "phone" in update_data and update_data["phone"] != current_user.phone:
        existing = db.query(User).filter(User.phone == update_data["phone"]).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number is already associated with another account"
            )

    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user
