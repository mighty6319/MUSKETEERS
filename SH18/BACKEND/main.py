import json
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from schemas import UserDataRequest
from auth import save_auth_data
from database import get_connection


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


SURVEY_DATA_PATH = Path(__file__).parent / "data" / "survey_data.json"


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():
    return {
        "message": "KNOW'E LEDGER backend is running"
    }


# ============================================================
# SURVEY DATA
# ============================================================

@app.get("/api/survey-data")
def get_survey_data():

    return json.loads(
        SURVEY_DATA_PATH.read_text(encoding="utf-8")
    )


# ============================================================
# USERNAME CHECK
# ============================================================

@app.get("/api/username-check")
def check_username(
    username: str = Query(..., min_length=1)
):

    username = username.strip()

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
            (username,)
        )

        result = cursor.fetchone()

        # Safety check:
        # fetchone() can technically return None.
        if result is None:
            return {"exists": False}

        return {
            "exists": bool(result[0])
        }

    finally:
        cursor.close()
        conn.close()


# ============================================================
# AUTHENTICATION / FINAL DATABASE CONFIRMATION
# ============================================================

@app.get("/api/auth-data")
def get_auth_data(
    username: str = Query(..., min_length=1),
    user_id: str = Query(..., min_length=1, alias="id")
):

    username = username.strip()
    user_id = user_id.strip()

    conn = get_connection()
    cursor = conn.cursor()

    try:

        # ----------------------------------------------------
        # STEP 1:
        # Check username + ID together
        # ----------------------------------------------------

        cursor.execute(
            """
            SELECT id, username, status
            FROM auth_data
            WHERE LOWER(username) = LOWER(%s)
              AND id = %s
            """,
            (username, user_id)
        )

        auth_row = cursor.fetchone()

        # fetchone() may return None.
        if auth_row is None:
            raise HTTPException(
                status_code=404,
                detail="Username and User ID do not match."
            )

        database_id = auth_row[0]
        confirmed_username = auth_row[1]
        status = auth_row[2]

        # ----------------------------------------------------
        # STEP 2:
        # Database status must be PASS
        # ----------------------------------------------------

        if status != "pass":
            raise HTTPException(
                status_code=403,
                detail="This account is not confirmed."
            )

        # ----------------------------------------------------
        # STEP 3:
        # Get profile
        # ----------------------------------------------------

        cursor.execute(
            """
            SELECT
                age,
                income_type,
                gender,
                nature,
                city,
                salary
            FROM user_data
            WHERE id = %s
            """,
            (database_id,)
        )

        profile_row = cursor.fetchone()

        if profile_row is None:
            raise HTTPException(
                status_code=404,
                detail="The user's profile is incomplete."
            )

        (
            age,
            income_type,
            gender,
            nature,
            city,
            salary
        ) = profile_row

        # ----------------------------------------------------
        # STEP 4:
        # Get expenses
        # ----------------------------------------------------

        cursor.execute(
            """
            SELECT
                category,
                percentage,
                amount
            FROM user_expenses
            WHERE id = %s
            ORDER BY category
            """,
            (database_id,)
        )

        expense_rows = cursor.fetchall()

        expenses = []

        for row in expense_rows:

            category = row[0]
            percentage = row[1]
            amount = row[2]

            expenses.append(
                {
                    "category": category,
                    "percentage": float(percentage),
                    "amount": float(amount)
                }
            )

        # ----------------------------------------------------
        # FINAL RESPONSE
        # ----------------------------------------------------

        return {
            "userdata": {
                "username": confirmed_username,
                "id": database_id,
                "status": status
            },

            "profile": {
                "age": age,
                "income_type": income_type,
                "gender": gender,
                "nature": nature,
                "city": city,
                "salary": float(salary),
                "expenses": expenses
            }
        }

    finally:
        cursor.close()
        conn.close()


# ============================================================
# CREATE / SAVE USER PROFILE
# ============================================================

@app.post("/api/user-data")
def receive_user_data(
    data: UserDataRequest
):

    # ========================================================
    # USER DATA
    # ========================================================

    user_id = data.userdata.id
    username = data.userdata.username.strip()

    # New profiles are confirmed after successful DB save.
    status = "pass"

    # ========================================================
    # PROFILE DATA
    # ========================================================

    age = data.profile.age
    income_type = data.profile.income_type
    gender = data.profile.gender
    nature = data.profile.nature
    city = data.profile.city
    salary = data.profile.salary
    expenses = data.profile.expenses

    print("========================================")
    print("CREATING USER PROFILE")
    print("========================================")

    print("USER ID:", user_id)
    print("USERNAME:", username)
    print("STATUS:", status)

    print("AGE:", age)
    print("INCOME TYPE:", income_type)
    print("GENDER:", gender)
    print("NATURE:", nature)
    print("CITY:", city)
    print("SALARY:", salary)
    print("EXPENSES:", expenses)

    conn = get_connection()
    cursor = conn.cursor()

    try:

        # ====================================================
        # USERNAME MUST BE UNIQUE
        # ====================================================

        cursor.execute(
            """
            SELECT id
            FROM auth_data
            WHERE LOWER(username) = LOWER(%s)
              AND id <> %s
            """,
            (username, user_id)
        )

        existing_row = cursor.fetchone()

        if existing_row is not None:
            raise HTTPException(
                status_code=409,
                detail="This username already exists."
            )

        # ====================================================
        # SAVE AUTH DATA
        # ====================================================

        save_auth_data(
            user_id,
            username,
            status,
            conn
        )

        # ====================================================
        # SAVE PROFILE
        # ====================================================

        cursor.execute(
            """
            INSERT INTO user_data
            (
                id,
                age,
                income_type,
                gender,
                nature,
                city,
                salary
            )
            VALUES
            (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id)
            DO UPDATE SET
                age = EXCLUDED.age,
                income_type = EXCLUDED.income_type,
                gender = EXCLUDED.gender,
                nature = EXCLUDED.nature,
                city = EXCLUDED.city,
                salary = EXCLUDED.salary
            """,
            (
                user_id,
                age,
                income_type,
                gender,
                nature,
                city,
                salary
            )
        )

        # ====================================================
        # REPLACE EXPENSES FOR THIS USER
        # ====================================================

        cursor.execute(
            """
            DELETE FROM user_expenses
            WHERE id = %s
            """,
            (user_id,)
        )

        for category, percentage in expenses.items():

            percentage = float(percentage)

            amount = salary * percentage / 100

            cursor.execute(
                """
                INSERT INTO user_expenses
                (
                    id,
                    category,
                    percentage,
                    amount
                )
                VALUES
                (%s, %s, %s, %s)
                """,
                (
                    user_id,
                    category,
                    percentage,
                    amount
                )
            )

        # ====================================================
        # COMMIT EVERYTHING
        # ====================================================

        conn.commit()

    except HTTPException:
        conn.rollback()
        raise

    except Exception:
        conn.rollback()
        raise

    finally:
        cursor.close()
        conn.close()

    return {
        "status": "success",
        "message": "User data received successfully",
        "userdata": {
            "id": user_id,
            "username": username,
            "status": status
        }
    }