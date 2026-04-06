# Expense Tracker

A single-page web application for tracking personal expenses. Users can log spending across categories, edit or remove entries, and view breakdowns and monthly trends — all without leaving the page.

---

## Tech Stack

| Layer      | Technology                               |
|------------|------------------------------------------|
| Frontend   | Vanilla JavaScript (ES6+)                |
| Styling    | Custom CSS (CSS variables, flexbox, grid)|
| Charts     | Chart.js                                 |
| Backend    | Python 3 / FastAPI                       |
| Routing    | FastAPI APIRouter (`/api/expenses`, `/api/categories`) |
| Server     | Uvicorn                                  |
| Database   | MySQL                                    |
| DB Driver  | mysql-connector-python                   |
| Validation | Pydantic (FastAPI)                       |
| Deployment | Not deployed — run locally via Uvicorn   |

---

## Features

- Add, edit, and delete expense entries with instant page updates
- Filter expenses by category or month
- Summary cards: total spent, this-month total, top category, transaction count
- Doughnut chart showing spending by category
- Bar chart showing monthly spending trend
- Inline delete confirmation (no browser dialogs)
- Client-side form validation with inline error messages
- Error banner if the backend is unreachable
- Keyboard accessible: Escape closes modal, focus management on open
- `aria-label` on all icon-only buttons
- Responsive layout for mobile and tablet

---

## Folder Structure

```
expense-tracker/
├── backend/               # FastAPI application
│   ├── routes/
│   │   ├── expenses.py    # CRUD endpoints for expenses
│   │   └── categories.py  # endpoint to fetch category list
│   ├── database.py        # MySQL connection helper
│   ├── main.py            # app entry point, CORS, route registration
│   ├── .env.example       # environment variable template
│   └── requirements.txt
├── frontend/              # single-page frontend
│   ├── index.html         # the one HTML file
│   ├── app.js             # all JS: API calls, rendering, events
│   └── style.css
└── database/
    ├── schema.sql         # table definitions
    └── seed.sql           # sample data
```

---

## Getting Started

### 1. Database

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # fill in your DB credentials
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### 3. Frontend

Open `frontend/index.html` directly in a browser, or let FastAPI serve it (it's already configured to serve the frontend folder at `/`).

---

## Challenges

Getting FastAPI to serve the static frontend while also handling API routes required careful ordering — the static `StaticFiles` mount must come last in `main.py` so it doesn't intercept API requests before they reach the routers. Handling MySQL date serialisation was non-obvious because Python's `datetime.date` objects are not JSON-serialisable by default, requiring explicit `str()` conversion in every route handler that returns a date field. On the frontend, re-rendering charts on every data refresh required explicitly destroying the previous Chart.js instances first; skipping this caused a "canvas already in use" error that silently broke chart updates. Building the inline delete confirmation without a UI library involved careful DOM manipulation and programmatic focus management to keep the interaction keyboard-accessible. Preventing XSS required routing all user-supplied text through a `createTextNode`-based escape helper before injecting it via `innerHTML`, since template literals do not sanitise values automatically.
