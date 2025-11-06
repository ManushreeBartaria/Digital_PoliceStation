from sqlalchemy import Column, String, Integer, Date, Time, ForeignKey, DateTime
from app.database.connection import Base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

class FirRegistration(Base):
    __tablename__ = "Fir_Registration"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), unique=True, index=True)
    fullname = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)
    address = Column(String(200), nullable=False)
    contact_number = Column(String(20), nullable=False)
    id_proof_type = Column(String(50), nullable=False)
    id_proof_value = Column(String(100), nullable=True)
    incident_date = Column(Date, nullable=False)
    incident_time = Column(Time, nullable=False)
    offence_type = Column(String(100), nullable=False)
    incident_location = Column(String(200), nullable=False)
    case_narrative = Column(String(1000), nullable=False)
    Stationid = Column(Integer, nullable=False)
    member_id = Column(Integer, ForeignKey("PoliceMember.member_id"))

    progress_updates = relationship("FIRProgress", back_populates="fir", cascade="all, delete-orphan")
    closed_entry = relationship("closedFir", back_populates="original_fir", uselist=False, cascade="all, delete-orphan")
    culprits = relationship("Culprit", back_populates="fir", cascade="all, delete-orphan")

class FIRProgress(Base):
    __tablename__ = "fir_progress"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    fir_id = Column(String(36), ForeignKey("Fir_Registration.id"))
    progress_text = Column(String(1000), nullable=True)
    evidence_text = Column(String(1000), nullable=True)
    evidence_photos = Column(String(2000), nullable=True)
    witness_info = Column(String(1000), nullable=True)
    other_info = Column(String(1000), nullable=True)
    culprit_id = Column(Integer, ForeignKey("culprit.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    fir = relationship("FirRegistration", back_populates="progress_updates")
    culprit = relationship("Culprit", back_populates="progress_entries", foreign_keys=[culprit_id])

class Culprit(Base):
    __tablename__ = "culprit"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    fir_id = Column(String(36), ForeignKey("Fir_Registration.id"))
    station_id = Column(Integer, nullable=False)
    member_id = Column(Integer, ForeignKey("PoliceMember.member_id"))
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    address = Column(String(200), nullable=True)
    identity_marks = Column(String(300), nullable=True)
    custody_status = Column(String(50), nullable=True)
    details = Column(String(1000), nullable=True)
    last_known_location = Column(String(200), nullable=True)

    fir = relationship("FirRegistration", back_populates="culprits")
    progress_entries = relationship("FIRProgress", back_populates="culprit")

class closedFir(Base):
    __tablename__ = "closed_fir"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    fir_id = Column(String(36), ForeignKey("Fir_Registration.id"))
    fullname = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)
    address = Column(String(200), nullable=False)
    contact_number = Column(String(20), nullable=False)
    id_proof_type = Column(String(50), nullable=False)
    id_proof_value = Column(String(100), nullable=True)
    incident_date = Column(Date, nullable=False)
    incident_time = Column(Time, nullable=False)
    offence_type = Column(String(100), nullable=False)
    incident_location = Column(String(200), nullable=False)
    case_narrative = Column(String(1000), nullable=False)
    closed_at = Column(Date, default=datetime.utcnow)
    Stationid = Column(Integer, nullable=False)
    member_id = Column(Integer, ForeignKey("PoliceMember.member_id"))

    original_fir = relationship("FirRegistration", back_populates="closed_entry")



