"""
Authentication API — Login, Signup, JWT, Role Management
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.core.security import get_password_hash, verify_password, create_access_token

router = APIRouter()

# In-memory user store (replace with PostgreSQL in production)
users_db = {
    "admin@urbanheat.ai": {
        "id": "usr_001",
        "email": "admin@urbanheat.ai",
        "name": "Dr. Ananya Sharma",
        "password": get_password_hash("admin123"),
        "role": "admin",
        "organization": "ISRO SAC",
        "avatar": None,
    },
    "researcher@urbanheat.ai": {
        "id": "usr_002",
        "email": "researcher@urbanheat.ai",
        "name": "Dr. Rajesh Kumar",
        "password": get_password_hash("research123"),
        "role": "researcher",
        "organization": "IIT Delhi - Climate Lab",
        "avatar": None,
    },
    "planner@urbanheat.ai": {
        "id": "usr_003",
        "email": "planner@urbanheat.ai",
        "name": "Priya Patel",
        "password": get_password_hash("planner123"),
        "role": "government_planner",
        "organization": "Ministry of Urban Development",
        "avatar": None,
    },
    "demo@urbanheat.ai": {
        "id": "usr_004",
        "email": "demo@urbanheat.ai",
        "name": "Demo User",
        "password": get_password_hash("demo123"),
        "role": "public",
        "organization": "Public",
        "avatar": None,
    },
}


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SignupRequest(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: str = "public"
    organization: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """Authenticate user and return JWT token."""
    user = users_db.get(request.email)
    if not user or not verify_password(request.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(
        data={"sub": user["id"], "email": user["email"], "role": user["role"]}
    )

    user_data = {k: v for k, v in user.items() if k != "password"}
    return AuthResponse(access_token=token, user=user_data)


@router.post("/signup", response_model=AuthResponse)
async def signup(request: SignupRequest):
    """Register a new user account."""
    if request.email in users_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user_id = f"usr_{len(users_db) + 1:03d}"
    user = {
        "id": user_id,
        "email": request.email,
        "name": request.name,
        "password": get_password_hash(request.password),
        "role": request.role,
        "organization": request.organization or "Public",
        "avatar": None,
    }
    users_db[request.email] = user

    token = create_access_token(
        data={"sub": user_id, "email": request.email, "role": request.role}
    )

    user_data = {k: v for k, v in user.items() if k != "password"}
    return AuthResponse(access_token=token, user=user_data)


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Send OTP for password reset."""
    return {
        "message": "If an account exists with this email, an OTP has been sent.",
        "otp_sent": request.email in users_db,
        "demo_otp": "123456",  # For demo purposes
    }


@router.post("/verify-otp")
async def verify_otp(request: OTPVerifyRequest):
    """Verify OTP for password reset."""
    if request.otp == "123456":
        return {"message": "OTP verified successfully", "verified": True}
    raise HTTPException(status_code=400, detail="Invalid OTP")


@router.get("/me")
async def get_me():
    """Get current user profile (demo mode)."""
    user = users_db["demo@urbanheat.ai"]
    return {k: v for k, v in user.items() if k != "password"}
