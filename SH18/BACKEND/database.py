import psycopg2


# Creates a connection between Python and PostgreSQL
def get_connection():

    return psycopg2.connect(
        host="localhost",
        port=5432,
        database="KNOW'E LEDGER",
        user="postgres",
        password="POSTGRES"
    )