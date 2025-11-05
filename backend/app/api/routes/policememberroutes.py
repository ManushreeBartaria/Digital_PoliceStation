from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.utils.security import create_access_token, verify_password, verify_access_token
from fastapi.security import OAuth2PasswordBearer
from app.models.policemember import PoliceMember
from app.schemas.PoliceMemberCreate import PoliceMemberCreate, PoliceMemberResponse, PoliceAuth, PoliceAuthResponse, MemberDetails
from typing import List

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/policeauth/policeauth")

def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload
  

@router.post("/addpolicemember", response_model=PoliceMemberResponse)
def add_policemember(member: PoliceMemberCreate, db: Session = Depends(get_db)):
    new_member = PoliceMember(name=member.name, password=member.password, station_id=member.station_id)
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return {"message": "Police member added successfully", "member_id": new_member.member_id}
  
@router.post("/policeauth", response_model=PoliceAuthResponse)
def policeauth(police: PoliceAuth, db: Session = Depends(get_db)):
    member = db.query(PoliceMember).filter(
    PoliceMember.member_id == police.member_id,
    PoliceMember.station_id == police.station_id,
    PoliceMember.password == police.password
).first()
    if not member:
      raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token({"member_id": member.member_id, "station_id": member.station_id})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/allmembers", response_model=List[MemberDetails])
def get_all_members(current_user:dict=(Depends(get_current_user)), db: Session = Depends(get_db)):
    station_id=current_user["station_id"]
    members = db.query(PoliceMember).filter(PoliceMember.station_id == station_id).all()
    return members
