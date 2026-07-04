# Quickstart & Validation Guide: Navigation Layout

This guide details how to run, test, and manually/automatically verify the Navigation Layout feature.

## Prerequisites

Ensure you have the following installed:
- Node.js (v18+) and npm
- Python (v3.12+)
- SQLite3

---

## 1. Setup & Installation

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment and activate it
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install django djangorestframework django-redis django-cors-headers openai pydantic pytest

# Run database migrations
python manage.py migrate

# Start backend server
python manage.py runserver
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install packages
npm install

# Start development server
npm run dev
```

---

## 2. Manual Verification Scenarios

### Scenario 1: Verify Header Layout (Navbar)
1. Open the application in your browser (typically `http://localhost:5173`).
2. Verify the top header (Navbar) is present:
   - On the left, check that the brand logo "Aura" renders with distinct typography and colorful branding.
   - On the right, check that the notification icon and user avatar render correctly.
   - Verify that the notification badge displays the count of unread notifications matching the backend database (or mock database).

### Scenario 2: Dynamic Tab Navigation (TabBar)
1. Verify the TabBar is displayed directly below the Navbar with four tabs: "Calendario", "Objetivos", "Proyectos", and "Eventos".
2. Click on the **"Objetivos"** tab.
   - Verify that the main viewport updates immediately (under 100ms) showing the Goals placeholder.
   - Verify that the "Objetivos" tab has the active styling (highlight color).
3. Click on **"Calendario"**.
   - Verify that the view switches back and active styling transitions to the "Calendario" tab.
4. Refresh the page.
   - Verify that the active tab selection is persisted and loads the active tab view immediately.

### Scenario 3: Interactivity (Dropdowns)
1. Click on the notification icon.
   - Verify that the notification panel toggles open, showing a list of recent notifications.
   - Click anywhere outside the dropdown and verify it closes.
2. Click on the user avatar.
   - Verify that the user options menu toggles open (Profile, Settings, Log Out).
   - Click outside and verify it closes.

---

## 3. Automated Tests

To execute automated tests for this layout:

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm run test
```
