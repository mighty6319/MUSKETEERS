from database import get_connection


# Saves the user's ID, username and status into auth_data
def save_auth_data(user_id, username, status, conn=None):

    owns_connection = conn is None
    connection = conn or get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT INTO auth_data
        (id, username, status)
        VALUES (%s, %s, %s)
        ON CONFLICT (id)
        DO UPDATE SET
            username = EXCLUDED.username,
            status = EXCLUDED.status
        """,
        (user_id, username, status)
    )

    if owns_connection:
        connection.commit()

    cursor.close()
    if owns_connection:
        connection.close()