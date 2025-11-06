# app/schemas/citizen.py
from pydantic import BaseModel, Field, field_validator
from typing import Optional


# ---------- Helpers ----------
def _trim(v):
    return str(v).strip() if v is not None else v


# ---------- Citizen: register & auth ----------

class citizenCreate(BaseModel):
    aadhar_no: str = Field(..., min_length=4, max_length=64)
    password: str = Field(..., min_length=1, max_length=255)

    @field_validator("aadhar_no", "password", mode="before")
    @classmethod
    def trim_fields(cls, v):
        return _trim(v)

    model_config = {"from_attributes": True}


class citizenResponse(BaseModel):
    message: str
    citizen_id: int
    model_config = {"from_attributes": True}


class citizenAuth(BaseModel):
    aadhar_no: str = Field(..., min_length=4, max_length=64)
    password: str = Field(..., min_length=1, max_length=255)

    @field_validator("aadhar_no", "password", mode="before")
    @classmethod
    def trim_fields(cls, v):
        return _trim(v)

    model_config = {"from_attributes": True}


class citizenauthresponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    citizen_id: int
    aadhar_no: str
    model_config = {"from_attributes": True}


# ---------- Escalation (citizen creates/updates) ----------

class EscalationCreate(BaseModel):
    fir_id: str = Field(..., min_length=1, max_length=64)
    reason: str = Field(..., min_length=1, max_length=2000)

    @field_validator("fir_id", "reason", mode="before")
    @classmethod
    def trim_fields(cls, v):
        return _trim(v)

    model_config = {"from_attributes": True}


class EscalationRecord(BaseModel):
    fir_id: str
    aadhar_no: str
    reason: str
    model_config = {"from_attributes": True}
