from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, time, datetime

class FirCreate(BaseModel):
    fullname: str = Field(..., example="John Doe")
    age: int = Field(..., example=30)
    gender: str = Field(..., example="Male")
    address: str = Field(..., example="123 Main Street, City")
    contact_number: str = Field(..., example="+911234567890")
    id_proof_type: str = Field(..., example="Aadhar")
    id_proof_value: Optional[str] = Field(None, example="1234-5678-9012")
    incident_date: date = Field(..., example="2025-09-07")
    incident_time: time = Field(..., example="14:30")
    offence_type: str = Field(..., example="Theft")
    incident_location: str = Field(..., example="Downtown Market")
    case_narrative: str = Field(..., example="Detailed description of the incident...")
    StationId: Optional[int] = None
    member_id: Optional[int] = None

    model_config = {"from_attributes": True}

class FirResponse(BaseModel):
    message: str
    report_id: str
    registered_by_id: int
    registered_by_name: str

    model_config = {"from_attributes": True}

class CulpritCreate(BaseModel):
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    identity_marks: Optional[str] = None
    custody_status: Optional[str] = None
    details: Optional[str] = None
    last_known_location: Optional[str] = None

    model_config = {"from_attributes": True}

class FIRProgressUpdate(BaseModel):
    fir_id: str
    progress_text: Optional[str] = None
    evidence_text: Optional[str] = None
    evidence_photos: Optional[str] = None
    witness_info: Optional[str] = None
    other_info: Optional[str] = None
    culprit: Optional[CulpritCreate] = None

    model_config = {"from_attributes": True}

class FIRProgressRecord(BaseModel):
    id: int
    progress_text: Optional[str] = None
    evidence_text: Optional[str] = None
    evidence_photos: Optional[str] = None
    witness_info: Optional[str] = None
    other_info: Optional[str] = None
    culprit_id: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}

class FIRProgressRequest(BaseModel):
    fir_id: str

    model_config = {"from_attributes": True}

class FIRProgressResponse(BaseModel):
    progress: List[FIRProgressRecord]

    model_config = {"from_attributes": True}

class FIRCloseRequest(BaseModel):
    fir_id: str

    model_config = {"from_attributes": True}

class FIRCloseResponse(BaseModel):
    message: str

    model_config = {"from_attributes": True}

class CulpritRecord(BaseModel):
    id: int
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    identity_marks: Optional[str] = None
    custody_status: Optional[str] = None
    details: Optional[str] = None
    last_known_location: Optional[str] = None

    model_config = {"from_attributes": True}

class FIRDetailsResponse(BaseModel):
    fir_id: str
    fullname: str
    age: int
    gender: str
    address: str
    contact_number: str
    id_proof_type: str
    id_proof_value: Optional[str]
    incident_date: date
    incident_time: time
    offence_type: str
    incident_location: str
    case_narrative: str
    station_id: int
    member_id: int
    status: str
    progress: List[FIRProgressRecord]
    culprits: List[CulpritRecord]

    model_config = {"from_attributes": True}
