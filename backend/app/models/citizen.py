from sqlalchemy import Column, Integer, String, ForeignKey
from app.database.connection import Base

class citizen(Base):
    __tablename__ = "citizen_login"

    citizen_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    aadhar_no = Column(String(100), nullable=False)
    password = Column(String(100), nullable=False)


# Minimal escalation table: ONLY the fields used on the frontend.
# Use a composite primary key so we don't add an auto-increment id.
class CitizenEscalation(Base):
    __tablename__ = "citizen_escalations"

    # Keep only the three fields required by the UI
    fir_id = Column(String(36), ForeignKey("Fir_Registration.id"), primary_key=True, index=True)
    aadhar_no = Column(String(100), primary_key=True, index=True)
    reason = Column(String(2000), nullable=False)
