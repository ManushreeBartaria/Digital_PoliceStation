# app/api/routes/policememberroutes.py
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.connection import get_db
from app.utils.security import create_access_token, verify_access_token
from app.models.policemember import PoliceMember
from app.schemas.PoliceMemberCreate import (
    PoliceMemberCreate,
    PoliceMemberResponse,
    PoliceAuth,
    PoliceAuthResponse,
    MemberDetails,
)

router = APIRouter()

# Must point to fully prefixed auth path
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/policeauth/policeauth")


def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    payload: Optional[dict] = verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

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
    new_member = PoliceMember(
        name=member.name,
        password=member.password,  # replace with hash in production
        station_id=member.station_id,
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return {"message": "Police member added successfully", "member_id": new_member.member_id}


@router.post("/policeauth", response_model=PoliceAuthResponse)
def policeauth(police: PoliceAuth, db: Session = Depends(get_db)):
    member = (
        db.query(PoliceMember)
        .filter(
            PoliceMember.member_id == police.member_id,
            PoliceMember.station_id == police.station_id,
            PoliceMember.password == police.password,
        )
        .first()
    )
    if not member:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(
        {
            "sub": str(member.member_id),
            "name": member.name,
            "station_id": member.station_id,
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
def get_all_members(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    station_id = int(current_user["station_id"])
    members = db.query(PoliceMember).filter(PoliceMember.station_id == station_id).all()
    return members
