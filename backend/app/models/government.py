from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from app.database.connection import Base
from datetime import datetime

class government(Base):
    __tablename__ = "government_login"

    government_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    government_member_id = Column(Integer, nullable=False, unique=True)
    password = Column(String(100), nullable=False)


class Escalation(Base):
    __tablename__ = "escalations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    fir_id = Column(String(36), ForeignKey("Fir_Registration.id"), nullable=False, index=True)

    # Not strict FK to citizen_login to avoid coupling; keep simple integer link
    citizen_id = Column(Integer, nullable=True)
    aadhar_no = Column(String(100), nullable=False)

    reason = Column(String(2000), nullable=False)

    status = Column(String(20), nullable=False, default="pending")  # pending|in_review|resolved|rejected
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
