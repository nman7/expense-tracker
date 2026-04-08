from fastapi import APIRouter, HTTPException
from database import get_connection

router = APIRouter()

# categories are already seeded in DB, no need to add or delete from here
@router.get("/")
def get_categories():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # fetching all categories in alphabetical order for the dropdown
        cursor.execute("SELECT * FROM categories ORDER BY name ASC")
        categories = cursor.fetchall()
        return categories
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # always close the connection after use
        cursor.close()
        conn.close()
