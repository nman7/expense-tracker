from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_connection

router = APIRouter()

# request body shape for creating/updating an expense
class ExpenseBody(BaseModel):
    title: str
    category_id: int
    amount: float
    date: str
    description: Optional[str] = None


@router.get("/")
def get_expenses(category_id: Optional[int] = None, month: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        query = """
            SELECT e.id, e.title, e.amount, e.date, e.description, e.created_at,
                   c.id as category_id, c.name as category_name, c.color as category_color
            FROM expenses e
            JOIN categories c ON e.category_id = c.id
            WHERE 1=1
        """
        params = []

        if category_id:
            query += " AND e.category_id = %s"
            params.append(category_id)

        if month:
            # month format: YYYY-MM
            query += " AND DATE_FORMAT(e.date, '%Y-%m') = %s"
            params.append(month)

        query += " ORDER BY e.date DESC"

        cursor.execute(query, params)
        expenses = cursor.fetchall()

        # convert date to string so it serialises cleanly
        for exp in expenses:
            exp["date"] = str(exp["date"])
            exp["created_at"] = str(exp["created_at"])

        return expenses
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.post("/", status_code=201)
def create_expense(body: ExpenseBody):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "INSERT INTO expenses (title, category_id, amount, date, description) VALUES (%s, %s, %s, %s, %s)",
            (body.title, body.category_id, body.amount, body.date, body.description)
        )
        conn.commit()
        new_id = cursor.lastrowid

        # return the newly created expense with category info
        cursor.execute("""
            SELECT e.id, e.title, e.amount, e.date, e.description, e.created_at,
                   c.id as category_id, c.name as category_name, c.color as category_color
            FROM expenses e
            JOIN categories c ON e.category_id = c.id
            WHERE e.id = %s
        """, (new_id,))
        expense = cursor.fetchone()
        expense["date"] = str(expense["date"])
        expense["created_at"] = str(expense["created_at"])
        return expense
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.put("/{expense_id}")
def update_expense(expense_id: int, body: ExpenseBody):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """UPDATE expenses
               SET title=%s, category_id=%s, amount=%s, date=%s, description=%s
               WHERE id=%s""",
            (body.title, body.category_id, body.amount, body.date, body.description, expense_id)
        )
        conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Expense not found")

        # return updated expense with category info
        cursor.execute("""
            SELECT e.id, e.title, e.amount, e.date, e.description, e.created_at,
                   c.id as category_id, c.name as category_name, c.color as category_color
            FROM expenses e
            JOIN categories c ON e.category_id = c.id
            WHERE e.id = %s
        """, (expense_id,))
        expense = cursor.fetchone()
        expense["date"] = str(expense["date"])
        expense["created_at"] = str(expense["created_at"])
        return expense
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.delete("/{expense_id}", status_code=204)
def delete_expense(expense_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM expenses WHERE id = %s", (expense_id,))
        conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Expense not found")

        return None
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()
