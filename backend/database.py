import mysql.connector
from dotenv import load_dotenv
import os

# loading env file so password is not hardcoded in code
load_dotenv()

def get_connection():
    # connecting to mysql, using socket on mac and fallback to normal TCP
    return mysql.connector.connect(
        unix_socket=os.getenv("DB_SOCKET", "/tmp/mysql.sock"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "expense_tracker")
    )
