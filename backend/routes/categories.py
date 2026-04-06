from fastapi import APIRouter, HTTPException
from database import get_connection

router = APIRouter()

# Categories are pre-seeded in the database and are read-only via the API.
# They are fetched once on page load to populate the filter and form dropdowns.
@router.get("/")
def get_categories():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM categories ORDER BY name ASC")
        categories = cursor.fetchall()
        return categories
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()
