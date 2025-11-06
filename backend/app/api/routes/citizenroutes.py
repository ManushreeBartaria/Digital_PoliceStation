# app/api/routes/citizenroutes.py
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.utils.security import create_access_token, verify_access_token

from app.models.citizen import citizen  # user table
from app.models.firregistation import FirRegistration
from app.models.government import Escalation  # canonical escalation table

from app.schemas.citizen import (
    citizenCreate,
    citizenResponse,
    citizenAuth,
    citizenauthresponse,
    EscalationCreate,
    EscalationRecord,
)

router = APIRouter()

# IMPORTANT: must include router prefix used in main.py
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/citizen/citizenAuth")


def _norm_str(value) -> str:
    """Normalize text inputs: stringify and strip."""
    if value is None:
        return ""
    return str(value).strip()


def get_current_citizen(token: str = Depends(oauth2_scheme)) -> dict:
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    cid = payload.get("citizen_id")
    aadhar_no = _norm_str(payload.get("aadhar_no"))
    if not aadhar_no:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    return {"citizen_id": cid, "aadhar_no": aadhar_no}


@router.post("/addcitizen", response_model=citizenResponse)
def add_citizen(member: citizenCreate, db: Session = Depends(get_db)):
    # Normalize before insert to avoid later equality mismatches
    aadhar_no = _norm_str(member.aadhar_no)
    password = _norm_str(member.password)

    if not aadhar_no or not password:
        raise HTTPException(status_code=422, detail="Aadhar and password are required")

    # Optional: ensure uniqueness on aadhar_no
    existing = db.query(citizen).filter(citizen.aadhar_no == aadhar_no).first()
    if existing:
        raise HTTPException(status_code=409, detail="Citizen with this Aadhar already exists")

    new_member = citizen(aadhar_no=aadhar_no, password=password)
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return {"message": "Citizen added successfully", "citizen_id": new_member.citizen_id}


@router.post("/citizenAuth", response_model=citizenauthresponse)
def citizenauth(citizen_member: citizenAuth, db: Session = Depends(get_db)):
    # Normalize input to match what we store
    aadhar = _norm_str(citizen_member.aadhar_no)
    password = _norm_str(citizen_member.password)

    if not aadhar or not password:
        raise HTTPException(status_code=422, detail="Aadhar and password are required")

    # Exact-match on normalized fields
    member = (
        db.query(citizen)
        .filter(citizen.aadhar_no == aadhar, citizen.password == password)
        .first()
    )
    if not member:
        # Avoid leaking which field failed
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(
        {"citizen_id": member.citizen_id, "aadhar_no": member.aadhar_no}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "citizen_id": member.citizen_id,
        "aadhar_no": member.aadhar_no,
    }


# ----------------- Citizen escalation -----------------
# Creates/updates an escalation record for (fir_id, aadhar_no)
@router.post("/escalatefir", response_model=EscalationRecord)
def citizen_escalate_fir(
    payload: EscalationCreate,
    current_user: dict = Depends(get_current_citizen),
    db: Session = Depends(get_db),
):
    aadhar_no = _norm_str(current_user["aadhar_no"])
    fir_id = _norm_str(payload.fir_id)
    reason = _norm_str(payload.reason)

    if not fir_id or not reason:
        raise HTTPException(status_code=422, detail="fir_id and reason are required")

    # ensure FIR exists and belongs to the citizen (by Aadhar)
    f = db.query(FirRegistration).filter(FirRegistration.id == fir_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="FIR not found")
    if _norm_str(f.id_proof_value) != aadhar_no:
        raise HTTPException(status_code=403, detail="You are not authorized to escalate this FIR")

    # upsert by (fir_id, aadhar_no)
    existing = (
        db.query(Escalation)
        .filter(Escalation.fir_id == fir_id, Escalation.aadhar_no == aadhar_no)
        .first()
    )
    if existing:
        existing.reason = reason
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return {
            "fir_id": existing.fir_id,
            "aadhar_no": existing.aadhar_no,
            "reason": existing.reason,
        }

    esc = Escalation(
        fir_id=fir_id,
        citizen_id=current_user.get("citizen_id"),
        aadhar_no=aadhar_no,
        reason=reason,
        status="pending",
    )
    db.add(esc)
    db.commit()
    db.refresh(esc)
    return {"fir_id": esc.fir_id, "aadhar_no": esc.aadhar_no, "reason": esc.reason}
