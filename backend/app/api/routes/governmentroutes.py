# app/api/routes/governmentroutes.py
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database.connection import get_db
from app.utils.security import create_access_token, verify_access_token

from app.models.government import government, Escalation
from app.models.firregistation import FirRegistration

from app.schemas.goverment import (
    govermentCreate,
    governmentResponse,
    governmentAuth,
    governmentauthresponse,
    governmentsearchfir,
    governmentsearchfirresponse,
    escalateFIRRequest,   # kept for lookup
    escalateFIRResponse,  # kept for lookup
)

router = APIRouter()

# fully prefixed
gov_oauth = OAuth2PasswordBearer(tokenUrl="/government/governmentAuth")


def get_current_government(token: str = Depends(gov_oauth)):
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    # token contains {"government_member_id": ...}
    if not payload.get("government_member_id"):
        raise HTTPException(status_code=401, detail="Invalid token payload")
    return payload


@router.post("/addgovernment", response_model=governmentResponse)
def add_government(member: govermentCreate, db: Session = Depends(get_db)):
    new_member = government(
        government_member_id=member.government_member_id,
        password=member.password,
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return {"message": "Government added successfully"}


@router.post("/governmentAuth", response_model=governmentauthresponse)
def governmentauth(government_member: governmentAuth, db: Session = Depends(get_db)):
    member = (
        db.query(government)
        .filter(
            government.government_member_id == government_member.government_member_id,
            government.password == government_member.password,
        )
        .first()
    )
    if not member:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token({"government_member_id": member.government_member_id})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/governmentsearchfir", response_model=governmentsearchfirresponse)
def search_fir(
    search: governmentsearchfir,
    current_user: dict = Depends(get_current_government),
    db: Session = Depends(get_db),
):
    firs = db.query(FirRegistration).filter(FirRegistration.address.contains(search.region)).all()
    return {"fir": firs}


# ---------- Escalation moderation (Government) ----------

@router.get("/escalations")
def list_escalations(
    status: str = Query("pending", pattern="^(pending|in_review|resolved|rejected|all)$"),
    current_user: dict = Depends(get_current_government),
    db: Session = Depends(get_db),
):
    q = db.query(Escalation)
    if status != "all":
        q = q.filter(Escalation.status == status)
    items = q.order_by(Escalation.created_at.desc()).all()
    return [
        {
            "id": e.id,
            "fir_id": e.fir_id,
            "citizen_id": e.citizen_id,
            "aadhar_no": e.aadhar_no,
            "reason": e.reason,
            "status": e.status,
            "created_at": e.created_at,
            "updated_at": e.updated_at,
        }
        for e in items
    ]


@router.patch("/escalations/{escalation_id}/status")
def update_escalation_status(
    escalation_id: int = Path(..., gt=0),
    new_status: str = Query(..., pattern="^(pending|in_review|resolved|rejected)$"),
    current_user: dict = Depends(get_current_government),
    db: Session = Depends(get_db),
):
    e = db.query(Escalation).filter(Escalation.id == escalation_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Escalation not found")
    e.status = new_status
    db.add(e)
    db.commit()
    db.refresh(e)
    return {
        "id": e.id,
        "fir_id": e.fir_id,
        "citizen_id": e.citizen_id,
        "aadhar_no": e.aadhar_no,
        "reason": e.reason,
        "status": e.status,
        "created_at": e.created_at,
        "updated_at": e.updated_at,
    }


# Optional lookup helper: does NOT create an escalation.
@router.post("/escalatefir/lookup", response_model=escalateFIRResponse)
def escalate_fir_lookup(
    request: escalateFIRRequest,
    current_user: dict = Depends(get_current_government),
    db: Session = Depends(get_db),
):
    fir = db.query(FirRegistration).filter(FirRegistration.id == request.fir_id).first()
    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found")
    return {"fir": fir}
