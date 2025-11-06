from pydantic import BaseModel
from typing import Optional, List
from app.schemas.Fir import FirCreate
class govermentCreate(BaseModel):
    government_member_id:int
    password: str
    
    model_config = {
        "from_attributes": True
    }

class governmentResponse(BaseModel):
    message: str
    
    model_config = {
        "from_attributes": True
    }

class governmentAuth(BaseModel):
    government_member_id:int
    password: str
    
    model_config = {
        "from_attributes": True
    }
        
class governmentauthresponse(BaseModel):
    access_token: str
    token_type: str
    
    model_config = {
        "from_attributes": True
    }    
    
class governmentsearchfir(BaseModel):
    region:str
     
    model_config = {    
        "from_attributes": True
    }
    
class governmentsearchfirresponse(BaseModel):
    fir:List[FirCreate]   
    model_config = {    
        "from_attributes": True
    } 
    
class escalateFIRRequest(BaseModel):
    fir_id: str
    model_config = {
        "from_attributes": True
    }    
    
class escalateFIRResponse(BaseModel):
    fir: FirCreate
    model_config = {
        "from_attributes": True
    }    