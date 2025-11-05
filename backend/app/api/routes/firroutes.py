from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.schemas.Fir import (
    FirCreate,
    FirResponse,
    FIRProgressUpdate,
    FIRProgressRequest,
    FIRProgressResponse,
    FIRCloseRequest,
    FIRCloseResponse,
    FIRDetailsResponse,
)
from app.models.firregistation import FirRegistration, closedFir, FIRProgress, Culprit
from datetime import datetime
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/policeauth/policeauth")
SECRET_KEY = "hackathon-secret-key"
ALGORITHM = "HS256"

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        user_name = payload.get("name")
        station_id = payload.get("station_id")
        if user_id is None or station_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {
            "id": int(user_id) if isinstance(user_id, str) and user_id.isdigit() else user_id,
            "name": user_name,
            "station_id": station_id,
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/register_incident", response_model=FirResponse)
def register_incident(report: FirCreate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    new_report = FirRegistration(
        id=None,
        fullname=report.fullname,
        age=report.age,
        gender=report.gender,
        address=report.address,
        contact_number=report.contact_number,
        id_proof_type=report.id_proof_type,
        id_proof_value=report.id_proof_value,
        incident_date=report.incident_date,
        incident_time=report.incident_time,
        offence_type=report.offence_type,
        incident_location=report.incident_location,
        case_narrative=report.case_narrative,
        Stationid=current_user["station_id"],
        member_id=current_user["id"],
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return {
        "message": "Incident registered successfully",
        "report_id": new_report.id,
        "registered_by_id": current_user["id"],
        "registered_by_name": current_user["name"],
    }

@router.post("/add_progress", response_model=FIRProgressResponse)
def add_progress(progress_update: FIRProgressUpdate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    fir = db.query(FirRegistration).filter(FirRegistration.id == progress_update.fir_id).first()
    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found")

    culprit_id = None
    if progress_update.culprit and progress_update.culprit.name:
        c = Culprit(
            fir_id=fir.id,
            station_id=fir.Stationid,
            member_id=current_user["id"],
            name=progress_update.culprit.name,
            age=progress_update.culprit.age,
            gender=progress_update.culprit.gender,
            address=progress_update.culprit.address,
            identity_marks=progress_update.culprit.identity_marks,
            custody_status=progress_update.culprit.custody_status,
            details=progress_update.culprit.details,
            last_known_location=progress_update.culprit.last_known_location,
        )
        db.add(c)
        db.flush()
        culprit_id = c.id

    new_progress = FIRProgress(
        fir_id=fir.id,
        progress_text=progress_update.progress_text,
        evidence_text=progress_update.evidence_text,
        evidence_photos=progress_update.evidence_photos,
        witness_info=progress_update.witness_info,
        other_info=progress_update.other_info,
        culprit_id=culprit_id,
    )
    db.add(new_progress)
    db.commit()

    records = (
        db.query(FIRProgress)
        .filter(FIRProgress.fir_id == fir.id)
        .order_by(FIRProgress.id.desc())
        .all()
    )
    return {"progress": records}

@router.post("/get_progress", response_model=FIRProgressResponse)
def get_progress(progress_request: FIRProgressRequest, db: Session = Depends(get_db)):
    fir = db.query(FirRegistration).filter(FirRegistration.id == progress_request.fir_id).first()
    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found")
    records = (
        db.query(FIRProgress)
        .filter(FIRProgress.fir_id == progress_request.fir_id)
        .order_by(FIRProgress.id.desc())
        .all()
    )
    return {"progress": records}

@router.get("/details", response_model=FIRDetailsResponse)
def get_fir_details(fir_id: str, db: Session = Depends(get_db)):
    f = db.query(FirRegistration).filter(FirRegistration.id == fir_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="FIR not found")
    status_val = getattr(f, "status", "active")
    progress = (
        db.query(FIRProgress)
        .filter(FIRProgress.fir_id == fir_id)
        .order_by(FIRProgress.id.desc())
        .all()
    )
    culprits = db.query(Culprit).filter(Culprit.fir_id == fir_id).all()
    return {
        "fir_id": f.id,
        "fullname": f.fullname,
        "age": f.age,
        "gender": f.gender,
        "address": f.address,
        "contact_number": f.contact_number,
        "id_proof_type": f.id_proof_type,
        "id_proof_value": f.id_proof_value,
        "incident_date": f.incident_date,
        "incident_time": f.incident_time,
        "offence_type": f.offence_type,
        "incident_location": f.incident_location,
        "case_narrative": f.case_narrative,
        "station_id": f.Stationid,
        "member_id": f.member_id,
        "status": status_val,
        "progress": progress,
        "culprits": culprits,
    }

@router.post("/close_fir", response_model=FIRCloseResponse)
def close_fir(close_request: FIRCloseRequest, db: Session = Depends(get_db)):
    fir = db.query(FirRegistration).filter(FirRegistration.id == close_request.fir_id).first()
    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found")
    c = closedFir(
        fir_id=fir.id,
        fullname=fir.fullname,
        age=fir.age,
        gender=fir.gender,
        address=fir.address,
        contact_number=fir.contact_number,
        id_proof_type=fir.id_proof_type,
        id_proof_value=fir.id_proof_value,
        incident_date=fir.incident_date,
        incident_time=fir.incident_time,
        offence_type=fir.offence_type,
        incident_location=fir.incident_location,
        case_narrative=fir.case_narrative,
        closed_at=datetime.utcnow().date(),
        Stationid=fir.Stationid,
        member_id=fir.member_id,
    )
    db.add(c)
    if hasattr(fir, "status"):
        fir.status = "closed"
        db.add(fir)
    db.commit()
    db.refresh(c)
    return {"message": "FIR closed successfully"}

@router.get("/list")
def list_all_firs(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    firs = db.query(FirRegistration).all()
    return [
        {
            "fir_id": f.id,
            "fullname": f.fullname,
            "offence_type": f.offence_type,
            "incident_location": f.incident_location,
            "status": getattr(f, "status", "active"),
            "incident_date": f.incident_date,
            "station_id": f.Stationid,
        }
        for f in firs
    ]

@router.get("/list_by_station")
def list_firs_by_station(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    station_id = current_user["station_id"]
    firs = db.query(FirRegistration).filter(FirRegistration.Stationid == station_id).all()
    active = [f for f in firs if getattr(f, "status", "active") != "closed"]
    closed = [f for f in firs if getattr(f, "status", "active") == "closed"]
    return {
        "active": [
            {
                "fir_id": f.id,
                "fullname": f.fullname,
                "incident_location": f.incident_location,
                "offence_type": f.offence_type,
                "status": getattr(f, "status", "active"),
                "incident_date": f.incident_date,
                "station_id": f.Stationid,
            }
            for f in active
        ],
        "closed": [
            {
                "fir_id": f.id,
                "fullname": f.fullname,
                "incident_location": f.incident_location,
                "offence_type": f.offence_type,
                "status": "closed",
                "incident_date": f.incident_date,
                "station_id": f.Stationid,
            }
            for f in closed
        ],
        "all": [
            {
                "fir_id": f.id,
                "fullname": f.fullname,
                "incident_location": f.incident_location,
                "offence_type": f.offence_type,
                "status": getattr(f, "status", "active"),
                "incident_date": f.incident_date,
                "station_id": f.Stationid,
            }
            for f in firs
        ],
    }

@router.get("/search")
def search_firs(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    pattern = f"%{q}%"
    results = (
        db.query(FirRegistration)
        .filter(
            (FirRegistration.fullname.ilike(pattern))
            | (FirRegistration.offence_type.ilike(pattern))
            | (FirRegistration.incident_location.ilike(pattern))
        )
        .all()
    )
    return [
        {
            "fir_id": f.id,
            "fullname": f.fullname,
            "offence_type": f.offence_type,
            "incident_location": f.incident_location,
            "status": getattr(f, "status", "active"),
            "incident_date": f.incident_date,
            "station_id": f.Stationid,
        }
        for f in results
    ]
