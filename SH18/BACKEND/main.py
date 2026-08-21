import json
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from schemas import UserDataRequest
from auth import save_auth_data
from database import get_connection


# Creates the FastAPI application
app = FastAPI()


# Allows your frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


SURVEY_DATA_PATH = Path(__file__).parent / "data" / "survey_data.json"


# Test route to check whether FastAPI is running
@app.get("/")
def home():

    return {
        "message": "KNOW'E LEDGER backend is running"
    }


@app.get("/api/survey-data")
def get_survey_data():

    return json.loads(SURVEY_DATA_PATH.read_text(encoding="utf-8"))


@app.get("/api/username-check")
def check_username(username: str = Query(..., min_length=1)):

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT EXISTS(
                SELECT 1
                FROM auth_data
                WHERE LOWER(username) = LOWER(%s)
            )
            """,
            (username.strip(),)
        )
        return {"exists": cursor.fetchone()[0]}
    finally:
        cursor.close()
        conn.close()


@app.get("/api/auth-data")
def get_auth_data(
    username: str = Query(..., min_length=1),
    user_id: str = Query(..., min_length=1, alias="id")
):

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT id, username, status
            FROM auth_data
            WHERE LOWER(username) = LOWER(%s) AND id = %s
            """,
            (username.strip(), user_id.strip())
        )
        auth_row = cursor.fetchone()

        if not auth_row or auth_row[2] != "pass":
            raise HTTPException(status_code=404, detail="User was not confirmed by the database.")

        user_id, confirmed_username, status = auth_row
        cursor.execute(
            """
            SELECT age, income_preference, gender, nature, city, salary
            FROM user_data
            WHERE id = %s
            """,
            (user_id,)
        )
        profile_row = cursor.fetchone()

        if not profile_row:
            raise HTTPException(status_code=404, detail="The user's profile is incomplete.")

        cursor.execute(
            """
            SELECT category, percentage, amount
            FROM user_expenses
            WHERE id = %s
            ORDER BY category
            """,
            (user_id,)
        )
        expenses = [
            {"category": category, "percentage": percentage, "amount": amount}
            for category, percentage, amount in cursor.fetchall()
        ]

        age, income, gender, nature, city, salary = profile_row
        return {
            "userdata": {
                "username": confirmed_username,
                "id": user_id,
                "status": status
            },
            "profile": {
                "age": age,
                "income": income,
                "gender": gender,
                "nature": nature,
                "city": city,
                "salary": salary,
                "expenses": expenses
            }
        }
    finally:
        cursor.close()
        conn.close()


# Receives userdata and profile JSON from JavaScript
@app.post("/api/user-data")
def receive_user_data(data: UserDataRequest):

    # Get authentication information
    user_id = data.userdata.id
    username = data.userdata.username
    status = "pass"

    # Get profile information
    age = data.profile.age
    income = data.profile.income
    gender = data.profile.gender
    nature = data.profile.nature
    city = data.profile.city
    salary = data.profile.salary
    expenses = data.profile.Expenses

    # Print received data for testing
    print("USER ID:", user_id)
    print("USERNAME:", username)
    print("STATUS:", status)

    print("AGE:", age)
    print("INCOME:", income)
    print("GENDER:", gender)
    print("NATURE:", nature)
    print("CITY:", city)
    print("SALARY:", salary)
    
    print("EXPENSES:", expenses)

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT id
            FROM auth_data
            WHERE LOWER(username) = LOWER(%s) AND id <> %s
            """,
            (username.strip(), user_id)
        )
        if cursor.fetchone():
            raise HTTPException(status_code=409, detail="This username already exists.")

        save_auth_data(
            user_id,
            username,
            status,
            conn
        )

        cursor.execute(
            """
            INSERT INTO user_data
            (
                id,
                age,
                income_preference,
                gender,
                nature,
                city,
                salary
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                user_id,
                age,
                income,
                gender,
                nature,
                city,
                salary
            )
        )

        for category, percentage in expenses.items():
            amount = salary * float(percentage) / 100
            cursor.execute(
                """
                INSERT INTO user_expenses
                (
                    id,
                    category,
                    percentage,
                    amount
                )
                VALUES (%s, %s, %s, %s)
                """,
                (
                    user_id,
                    category,
                    percentage,
                    amount
                )
            )

        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

    # Send response back to JavaScript
    return {
        "status": "success",
        "message": "User data received successfully"
    }
