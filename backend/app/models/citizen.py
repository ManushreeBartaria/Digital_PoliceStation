from sqlalchemy import Column, Integer, String
from app.database.connection import Base

class citizen(Base):
    __tablename__ = "citizen_login"

    citizen_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    aadhar_no = Column(String(100), nullable=False)
    password = Column(String(100), nullable=False)
