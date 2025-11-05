from sqlalchemy import Column, Integer, String, ForeignKey
from app.database.connection import Base
from sqlalchemy.orm import relationship

class PoliceMember(Base):
    __tablename__ = "PoliceMember"

    member_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    password = Column(String(100), nullable=False)
    station_id = Column(Integer, nullable=False)
