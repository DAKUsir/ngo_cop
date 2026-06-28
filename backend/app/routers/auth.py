from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from bson import ObjectId

from app.models.schemas import UserRegister, UserLogin, Token, UserOut
from app.database.mongodb import users_collection
from app.utils.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

DEMO_EMAIL    = "demo@impactlens.ai"
DEMO_PASSWORD = "demo1234"
DEMO_NAME     = "Demo User"
DEMO_ORG      = "ImpactLens Demo NGO"


def _serialize_user(user: dict) -> UserOut:
    return UserOut(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        organization=user.get("organization"),
        role=user.get("role", "user"),
        created_at=user["created_at"],
    )


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(body: UserRegister):
    existing = await users_collection.find_one({"email": body.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_doc = {
        "name": body.name,
        "email": body.email,
        "password": hash_password(body.password),
        "organization": body.organization,
        "role": "user",
        "created_at": datetime.now(timezone.utc),
    }
    result = await users_collection.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    token = create_access_token(str(result.inserted_id))
    return Token(access_token=token, user=_serialize_user(user_doc))


@router.post("/login", response_model=Token)
async def login(body: UserLogin):
    user = await users_collection.find_one({"email": body.email})
    if not user or not verify_password(body.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(str(user["_id"]))
    return Token(access_token=token, user=_serialize_user(user))


@router.post("/demo", response_model=Token, summary="One-click demo login (no registration needed)")
async def demo_login():
    """Creates the demo account on first call, then returns a valid JWT.
    Use this to skip registration during development / demos."""
    user = await users_collection.find_one({"email": DEMO_EMAIL})
    if not user:
        user_doc = {
            "name": DEMO_NAME,
            "email": DEMO_EMAIL,
            "password": hash_password(DEMO_PASSWORD),
            "organization": DEMO_ORG,
            "role": "demo",
            "created_at": datetime.now(timezone.utc),
        }
        result = await users_collection.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        user = user_doc

    token = create_access_token(str(user["_id"]))
    return Token(access_token=token, user=_serialize_user(user))


@router.get("/me", response_model=UserOut)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserOut(
        id=str(current_user["_id"]),
        name=current_user["name"],
        email=current_user["email"],
        organization=current_user.get("organization"),
        role=current_user.get("role", "user"),
        created_at=current_user["created_at"],
    )
