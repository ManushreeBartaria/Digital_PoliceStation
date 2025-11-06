from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.connection import engine, Base
from app.models import  PoliceMember
from app.api.routes import (
    policememberroutes,
    firroutes,
    citizenroutes,
    governmentroutes
)


app = FastAPI(title="Digital Police Station API", version="1.0")


Base.metadata.create_all(bind=engine)


origins = [
    "http://localhost:5173",  
    "http://127.0.0.1:5173",
    "http://localhost:3000",  
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(policememberroutes.router, prefix="/policeauth", tags=["Police Authentication"])
app.include_router(firroutes.router, prefix="/fir", tags=["FIR Registration"])
app.include_router(citizenroutes.router, prefix="/citizen", tags=["Citizen"])
app.include_router(governmentroutes.router, prefix="/government", tags=["Government"])


@app.get("/", tags=["Root"])
def read_root():
    return {"message": "Backend is working fine 🚀"}
