from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.utils.security import create_access_token, verify_access_token
from fastapi.security import OAuth2PasswordBearer
from app.models.citizen import citizen
from app.schemas.citizen import citizenCreate, citizenResponse, citizenAuth, citizenauthresponse

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/citizen/citizenAuth")

def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload

@router.post("/addcitizen", response_model=citizenResponse)
def add_citizen(member: citizenCreate, db: Session = Depends(get_db)):
    new_member = citizen(aadhar_no=member.aadhar_no, password=member.password)
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return {"message": "Citizen added successfully", "citizen_id": new_member.citizen_id}

@router.post("/citizenAuth", response_model=citizenauthresponse)
def citizenauth(citizen_member: citizenAuth, db: Session = Depends(get_db)):
    member = db.query(citizen).filter(
        citizen.aadhar_no == citizen_member.aadhar_no,
        citizen.password == citizen_member.password
    ).first()
    if not member:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token({"citizen_id": member.citizen_id, "aadhar_no": member.aadhar_no})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "citizen_id": member.citizen_id,
        "aadhar_no": member.aadhar_no
    }
