# KNOW'E LEDGER

KNOW'E LEDGER is a financial learning platform where users create a profile, explore how their income is distributed across expenses, and make decisions in a risk-free simulation environment.

The project is currently in development. The working application consists of a static HTML/CSS/JavaScript frontend, a FastAPI backend, and a PostgreSQL database.

## Features

- Create and verify a player profile.
- Store profile, salary, and expense data in PostgreSQL.
- View saved profile and expense data on the dashboard.
- Display income and expense summaries and charts.
- Load survey data from the backend.
- Use the financial rules documented in [`SH18/DOCS/FINACIAL-RULES.md`](SH18/DOCS/FINACIAL-RULES.md).

## Project Structure

```text
SH18/
├── BACKEND/                 FastAPI application and PostgreSQL access
│   ├── data/                Survey data
│   └── main.py              API entry point
├── DATABASE/                Database resources
├── DOCS/                    Project documentation
└── FRONTEND/
	├── MUSIC/               Background audio
	├── assets/              Images, video, and favicon
	└── WELCOME PAGE/
		├── START/           Landing page, login, and profile setup
		└── MAIN/            Authenticated dashboard
```

## Requirements

- Python 3.10 or newer
- PostgreSQL running locally on port `5432`
- A database named `KNOW'E LEDGER`
- A modern web browser

The repository does not yet include a dependency lockfile or requirements file. Install the backend packages with:

```powershell
py -m pip install fastapi uvicorn psycopg2-binary pydantic
```

## Run Locally

### 1. Configure PostgreSQL

Create the `KNOW'E LEDGER` database and the tables expected by the backend: `auth_data`, `user_data`, and `user_expenses`.

Update the connection settings in [`SH18/BACKEND/database.py`](SH18/BACKEND/database.py) to match your local PostgreSQL user and password. The current file uses `postgres` / `POSTGRES` by default.

### 2. Start the API

From the repository root:

```powershell
cd SH18\BACKEND
py -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The API will be available at `http://127.0.0.1:8000`. FastAPI's interactive documentation is available at `http://127.0.0.1:8000/docs`.

### 3. Open the frontend

Open [`SH18/FRONTEND/WELCOME PAGE/START/start.html`](SH18/FRONTEND/WELCOME%20PAGE/START/start.html) in a browser. The frontend JavaScript expects the API to be running at `http://127.0.0.1:8000`.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/` | Health check |
| `GET` | `/api/survey-data` | Return survey data |
| `GET` | `/api/username-check?username=...` | Check whether a username exists |
| `GET` | `/api/auth-data?username=...&id=...` | Verify a user and load their profile |
| `POST` | `/api/user-data` | Save authentication, profile, and expense data |

## Contributors

- Ayush
```bash
  https://github.com/mighty6319
```
- Shristi
```bash
  https://github.com/SHRISTI125
```
- Aditya
```bash
  https://github.com/AG-SPYaadi
```
- Anirban
```bash
  https://github.com/ANIRBAN-ROY-2203
```
- Subrat
```bash
  https://github.com/Lieve-EZ
```
- Ankit
```bash
  https://github.com/Ankit-1907
```

## Status

In development. Database schema setup, financial rules, and additional simulation features are still being expanded.
