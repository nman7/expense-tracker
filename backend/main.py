from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from routes import expenses, categories

app = FastAPI(title="Expense Tracker API")

# without this browser will block all the request from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# adding the routes for expenses and categories
app.include_router(expenses.router, prefix="/api/expenses", tags=["expenses"])
app.include_router(categories.router, prefix="/api/categories", tags=["categories"])

# this line must be at last otherwise it will intercept all API calls
app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")
