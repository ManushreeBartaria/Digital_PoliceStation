from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from fastapi.security import OAuth2PasswordBearer

from app.database.connection import get_db
from app.utils.security import create_access_token, verify_password, verify_access_token
from app.models.policemember import PoliceMember
from app.schemas.PoliceMemberCreate import (
    PoliceMemberCreate,
    PoliceMemberResponse,
    PoliceAuth,
    PoliceAuthResponse,
    MemberDetails,
)

router = APIRouter()
# Matches what the FIR router advertises; used by Swagger and dependency resolution
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/policeauth/policeauth")


def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Decode and validate JWT, normalize keys for downstream usage.
    Expects tokens created by /policeauth to contain: sub (member_id), name, station_id.
    """
    payload: Optional[dict] = verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    # Accept both our canonical keys and any legacy forms
    member_id = payload.get("sub") or payload.get("member_id")
    station_id = payload.get("station_id")
    name = payload.get("name")

    if member_id is None or station_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    return {
        "member_id": int(member_id) if isinstance(member_id, (str, int)) else member_id,
        "station_id": int(station_id) if isinstance(station_id, (str, int)) else station_id,
        "name": name,
    }


@router.post("/addpolicemember", response_model=PoliceMemberResponse)
def add_policemember(member: PoliceMemberCreate, db: Session = Depends(get_db)):
    """
    Create a new police member.
    NOTE: If you plan to store hashed passwords, replace direct assignment with a hasher.
    """
    new_member = PoliceMember(
        name=member.name,
        password=member.password,  # replace with hashed password if using hashing
        station_id=member.station_id,
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return {"message": "Police member added successfully", "member_id": new_member.member_id}


@router.post("/policeauth", response_model=PoliceAuthResponse)
def policeauth(police: PoliceAuth, db: Session = Depends(get_db)):
    """
    Authenticate a police member and issue a JWT that FIR router can decode.
    Token payload includes: sub (member_id), name, station_id.
    """
    member = (
        db.query(PoliceMember)
        .filter(
            PoliceMember.member_id == police.member_id,
            PoliceMember.station_id == police.station_id,
            PoliceMember.password == police.password,  # if hashing, verify with verify_password()
        )
        .first()
    )
    if not member:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # If you store hashed password, do:
    # if not verify_password(police.password, member.password):
    #     raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(
        {
            "sub": str(member.member_id),     # FIR expects 'sub'
            "name": member.name,              # FIR uses this in response
            "station_id": member.station_id,  # useful across routes
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "police_member_id": member.member_id,
        "station_id": member.station_id,
        "name": member.name,
    }


@router.get("/allmembers", response_model=List[MemberDetails])
def get_all_members(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List all members from the current user's station.
    """
    station_id = int(current_user["station_id"])
    members = db.query(PoliceMember).filter(PoliceMember.station_id == station_id).all()
    return members
