CREATE TABLE IF NOT EXISTS auth_data (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_data (
    id TEXT PRIMARY KEY REFERENCES auth_data(id) ON DELETE CASCADE,
    age INTEGER NOT NULL,
    income_type TEXT NOT NULL,
    gender TEXT NOT NULL,
    nature TEXT NOT NULL,
    city TEXT NOT NULL,
    salary NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS user_expenses (
    id TEXT NOT NULL REFERENCES auth_data(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    percentage NUMERIC NOT NULL,
    amount NUMERIC NOT NULL,
    PRIMARY KEY (id, category)
);

CREATE TABLE IF NOT EXISTS simulation_state (
    id TEXT NOT NULL REFERENCES auth_data(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    month INTEGER NOT NULL,
    current_scene TEXT NOT NULL,
    completed_month INTEGER NOT NULL DEFAULT 0,
    balance NUMERIC NOT NULL,
    state JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, month)
);