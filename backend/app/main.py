from fastapi import FastAPI
from app.database.connection import engine, Base
from app.models import PoliceStation, PoliceMember
from app.api.routes import policememberroutes,firroutes,citizenroutes,governmentroutes


app = FastAPI()

Base.metadata.create_all(bind=engine)

app.include_router(policememberroutes.router, prefix="/policeauth", tags=["Police Authentication"])
app.include_router(firroutes.router, prefix="/fir", tags=["FIR Registration"])
app.include_router(citizenroutes.router, prefix="/citizen", tags=["Citizen"])
app.include_router(governmentroutes.router, prefix="/government", tags=["Government"])

@app.get("/")
def read_root():
    return {"message": "Backend is working fine 🚀"}




