from pydantic import BaseModel
from typing import Dict


# Structure of userdata coming from JavaScript
class UserData(BaseModel):
    username: str
    id: str
    status: str


# Structure of the user's profile data
class ProfileData(BaseModel):
    age: int
    income: str
    gender: str
    nature: str
    city: str
    salary: float
    Expenses: Dict[str, float]


# Complete JSON request sent by JavaScript
class UserDataRequest(BaseModel):
    userdata: UserData
    profile: ProfileData