from pydantic import BaseModel

class citizenCreate(BaseModel):
    aadhar_no: str
    password: str
    
    model_config = {
        "from_attributes": True
    }

class citizenResponse(BaseModel):
    message: str
    citizen_id: int
    
    model_config = {
        "from_attributes": True
    }

class citizenAuth(BaseModel):
    aadhar_no: str
    password: str
    
    model_config = {
        "from_attributes": True
    }
        
class citizenauthresponse(BaseModel):
    access_token: str
    token_type: str
    
    model_config = {
        "from_attributes": True
    }    
       
    
