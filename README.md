# Expense Tracker

A web app that helps you keep track of your personal spending. You can add expenses with a title, amount, date, category, and optional notes. You can edit or delete them anytime, filter by category or month, and see a visual breakdown of where your money is going. Everything happens on one page with no reloads.

---

## Tech Stack

| Layer      | Technology                                                    |
|------------|---------------------------------------------------------------|
| Frontend   | Vanilla JavaScript (ES6+)                                     |
| Styling    | Custom CSS (CSS variables, flexbox, grid)                     |
| Charts     | Chart.js                                                      |
| Backend    | Python 3 / FastAPI                                            |
| Routing    | FastAPI APIRouter (`/api/expenses`, `/api/categories`)        |
| Server     | Uvicorn                                                       |
| Database   | MySQL                                                         |
| DB Driver  | mysql-connector-python                                        |
| Validation | Pydantic (FastAPI)                                            |
| Deployment | Not deployed, runs locally via Uvicorn                        |

---

## Features

- Add, edit, and delete expenses without leaving the page
- Each expense has a title, amount, date, category, and optional description
- Filter expenses by category or by month
- Summary cards showing total spent, this months total, top spending category, and transaction count
- Doughnut chart breaking down spending by category
- Bar chart showing spending trends month by month
- Inline delete confirmation so you dont accidentally remove something
- Form validation with clear error messages before anything gets saved
- Toast notifications when you add, edit, or delete an expense
- Error banner if the backend goes down
- Keyboard accessible, Escape closes the modal and focus moves correctly
- Works on mobile and tablet

---

## Folder Structure

```
expense-tracker/
├── backend/                  # FastAPI server
│   ├── routes/
│   │   ├── expenses.py       # all CRUD endpoints for expenses
│   │   └── categories.py     # endpoint to get the category list
│   ├── database.py           # MySQL connection setup
│   ├── main.py               # app entry point, CORS, mounts frontend
│   ├── .env.example          # template for your DB credentials
│   └── requirements.txt      # Python dependencies
├── frontend/                 # everything the browser loads
│   ├── index.html            # the only HTML file
│   ├── app.js                # all JS, API calls, rendering, events
│   └── style.css             # all styles
└── database/
    ├── schema.sql            # creates the tables
    └── seed.sql              # adds sample categories and expenses
```

---

## Getting Started

### 1. Set up the database

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

### 2. Start the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # on Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # then open .env and fill in your DB details
uvicorn main:app --reload
```

The API runs at `http://localhost:8000`. You can explore all endpoints at `http://localhost:8000/docs`.

### 3. Open the app

The frontend is served automatically by FastAPI. Just go to `http://localhost:8000` in your browser.

---

## Challenges

One thing that took some figuring out was getting FastAPI to serve the static frontend files while also handling API routes. The static mount has to go last in `main.py`, otherwise it intercepts API requests before they reach the routers. MySQL also does not return dates as plain strings by default, so every route that returns an expense had to manually convert the date and timestamp fields using `str()`. On the frontend, Chart.js holds onto its canvas element between renders, so the old chart instance has to be explicitly destroyed before drawing a new one. Skipping that caused a silent error that broke chart updates entirely. Building the delete confirmation inline without any popups or libraries also needed careful focus management to keep it keyboard accessible.
