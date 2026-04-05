from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from routes import expenses, categories

app = FastAPI(title="Expense Tracker API")

# allow frontend to talk to backend during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# api routes
app.include_router(expenses.router, prefix="/api/expenses", tags=["expenses"])
app.include_router(categories.router, prefix="/api/categories", tags=["categories"])

# serve the frontend
app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")
