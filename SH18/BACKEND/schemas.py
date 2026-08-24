from pydantic import BaseModel
from typing import Dict


# ============================================================
# AUTHENTICATION DATA
# ============================================================

class UserData(BaseModel):

    username: str
    id: str
    status: str


# ============================================================
# PROFILE DATA
# ============================================================

class ProfileData(BaseModel):

    age: int
    income_type: str
    gender: str
    nature: str
    city: str
    salary: float

    # Example:
    #
    # {
    #     "rent": 30,
    #     "food": 20,
    #     "transport": 10
    # }
    #
    expenses: Dict[str, float]


# ============================================================
# COMPLETE REQUEST
# ============================================================

class UserDataRequest(BaseModel):

    userdata: UserData
    profile: ProfileData
# ============================================================
# SIMULATION CHECKPOINT
# ============================================================

class SimulationCheckpoint(BaseModel):
    id: str
    username: str
    month: int
    current_scene: str
    completed_month: int
    balance: float
    state: Dict
