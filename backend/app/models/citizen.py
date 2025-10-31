from sqlalchemy import Column, Integer, String, ForeignKey
from app.database.connection import Base
from sqlalchemy.orm import relationship

class citizen(Base):
    __tablename__ = "citizen_login"

    citizen_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    aadhar_no = Column(String(100), nullable=False)
    password = Column(String(100), nullable=False)
  