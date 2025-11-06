from typing import Optional, List
from pydantic import BaseModel, Field
from app.schemas.Fir import FirCreate
from datetime import datetime

class govermentCreate(BaseModel):
    government_member_id: int
    password: str

    model_config = {"from_attributes": True}


class governmentResponse(BaseModel):
    message: str

    model_config = {"from_attributes": True}


class governmentAuth(BaseModel):
    government_member_id: int
    password: str

    model_config = {"from_attributes": True}


class governmentauthresponse(BaseModel):
    access_token: str
    token_type: str

    model_config = {"from_attributes": True}


class governmentsearchfir(BaseModel):
    region: str

    model_config = {"from_attributes": True}


class governmentsearchfirresponse(BaseModel):
    # You used FirCreate here; keeping as-is to match your code path
    fir: List[FirCreate]

    model_config = {"from_attributes": True}


class escalateFIRRequest(BaseModel):
    fir_id: str

    model_config = {"from_attributes": True}


class escalateFIRResponse(BaseModel):
    fir: FirCreate

    model_config = {"from_attributes": True}


# ----- Escalation -----

class EscalationCreate(BaseModel):
    fir_id: str = Field(..., example="uuid-of-fir")
    reason: str = Field(..., min_length=10, example="Key witnesses not examined, CCTV footage ignored.")

    model_config = {"from_attributes": True}


class EscalationRecord(BaseModel):
    id: int
    fir_id: str
    citizen_id: Optional[int] = None
    aadhar_no: str
    reason: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
