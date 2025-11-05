from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.utils.security import create_access_token, verify_password, verify_access_token
from fastapi.security import OAuth2PasswordBearer
from app.models.citizen import citizen
from app.schemas.citizen import citizenCreate, citizenResponse, citizenAuth, citizenauthresponse
from app.models.government import government
from app.schemas.goverment import govermentCreate, governmentResponse, governmentAuth, governmentauthresponse, governmentsearchfir, governmentsearchfirresponse, escalateFIRRequest, escalateFIRResponse
from typing import List
from app.models.firregistation import FirRegistration

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/government/governmentAuth")

def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload

@router.post("/addgovernment", response_model=governmentResponse)
def add_government(member: govermentCreate, db: Session = Depends(get_db)):
    new_member = government(government_member_id=member.government_member_id,password=member.password)
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return {"message": "Government added successfully"}
  
@router.post("/governmentAuth", response_model=governmentauthresponse)
def governmentauth(government_member: governmentAuth, db: Session = Depends(get_db)):
    member = db.query(government).filter(
    government.password == government_member.password
).first()
    if not member:
      raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token({"government_member_id": member.government_member_id})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/governmentsearchfir", response_model=governmentsearchfirresponse)  
def search_fir(search: governmentsearchfir, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    firs = db.query(FirRegistration).filter(FirRegistration.address.contains(search.region)).all()
    return {"fir": firs}

@router.post("/escalatefir", response_model=escalateFIRResponse)
def escalate_fir(request: escalateFIRRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    fir = db.query(FirRegistration).filter(FirRegistration.id == request.fir_id).first()
    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found")
    return {"fir": fir}