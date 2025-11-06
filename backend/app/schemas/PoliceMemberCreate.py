from pydantic import BaseModel

class PoliceMemberCreate(BaseModel):
    name: str
    password: str
    station_id: int
    
    model_config = {
        "from_attributes": True
    }

class PoliceMemberResponse(BaseModel):
    message: str
    member_id: int
    
    model_config = {
        "from_attributes": True
    }

class PoliceAuth(BaseModel):
    station_id: int
    member_id: int
    password: str
    
    model_config = {
        "from_attributes": True
    }
        
class PoliceAuthResponse(BaseModel):
    access_token: str
    token_type: str
    police_member_id: int
    station_id: int
    name: str
    
    model_config = {
        "from_attributes": True
    }    
    
class MemberDetails(BaseModel):
    name: str
    model_config = {
        "from_attributes": True
    }    
