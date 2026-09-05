# Quickstart & Validation Guide: Navigation Layout & Objetivos

This guide details how to set up, run, and validate the Navigation Layout and Objetivos feature following the Layered Architecture.

---

## 1. Environment & Prerequisites

Ensure the following tools are installed:
- **Node.js**: v18+ and `npm`
- **Python**: v3.12+
- **SQLite3** (local dev default)

---

## 2. Setup & Execution

### Backend (Django + DRF)
```powershell
# From repository root
# 1. Activate virtual environment
.\venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run database migrations
python manage.py makemigrations
python manage.py migrate

# 4. Start backend server
python manage.py runserver 8000
```

### Frontend (React + Vite + TypeScript)
```powershell
# In a second terminal at repository root
# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev
```

The application is available at `http://localhost:5173`.

---

## 3. End-to-End Validation Scenarios

### Scenario 1: Shell Navigation & Instant Tab Switching (<100ms)
1. Navigate to `http://localhost:5173`.
2. Verify the top **Navbar**:
   - Branding "Aura" appears on the left with high-contrast colorful typography.
   - Bell icon shows unread badge counter (e.g., "3").
   - User avatar appears on the right; clicking it opens the profile menu.
3. In the **TabBar**, click through `CALENDARIO`, `OBJETIVOS`, `PROYECTOS`, and `EVENTOS`.
4. Verify the active tab switches instantly (under 100ms) with its distinct theme highlight.
5. Reload the browser page and verify the active tab persists locally.

### Scenario 2: Objetivos Dual View (Cards vs List) & Filtering
1. Click on the **"OBJETIVOS"** tab.
2. Verify goals are displayed in the default **Card Grid** view:
   - Each card displays its title, category pill, deadline, and visual progress bar (0-100%).
3. Click the **View Switcher** to toggle to **Compact List (Table)** view.
   - Verify layout transforms smoothly into a compact data table showing same goals.
4. Test **Filters**:
   - Select status filter chip `Activas`, `Completadas`, or `En pausa`.
   - Select category filter (e.g. `Salud` or `Trabajo`).
   - Switch between Card and List view and verify the active filter remains applied.

### Scenario 3: Slide-over Drawer for Goal Creation & Milestone Weighting
1. In the "Objetivos" section, click the **"+ Nuevo Objetivo"** button.
2. Verify the **Slide-over Drawer** smoothly opens from the right edge without hiding the main view.
3. Enter goal details:
   - Title: "Aprender TypeScript Avanzado"
   - Category: "Aprendizaje"
   - Mode: Select `Automático por Hitos`
4. Add 3 milestones:
   - Hito 1: "Completar fundamentos" (Peso: 1)
   - Hito 2: "Construir proyecto" (Peso: 2)
   - Hito 3: "Certificación" (Peso: 1)
5. Save the goal.
6. Verify the goal appears in the list with `0%` progress.
7. Click the first milestone ("Completar fundamentos").
   - Verify progress bar recalculates automatically: `1 / 4 = 25%`.
8. Click the second milestone ("Construir proyecto").
   - Verify progress updates automatically: `(1 + 2) / 4 = 75%`.

### Scenario 4: Manual Progress Mode
1. In the Drawer, edit or create a goal with Mode: `Manual`.
2. Drag or input the progress slider to `85%`.
3. Save and verify the goal displays an 85% progress bar regardless of milestone checkboxes.

### Scenario 5: Calendar Synchronization & Deadline Projections
1. Create a goal with deadline set to the 15th of the current month.
2. Click on the **"CALENDARIO"** tab in the TabBar.
3. Verify that the 15th displays a deadline badge with the goal's category theme color.
4. Click the deadline badge to view the goal quick summary.

---

## 4. Automated Testing

### Backend Layer Tests (Django)
```powershell
pytest backend/tests.py -v
```
Validates:
- Domain service progress calculations (equal vs weighted milestones).
- Serializer validation constraints (weight > 0, progress 0-100).
- Calendar deadline projection service.
- REST API endpoint response codes and schemas.

### Frontend Compilation & Linting
```powershell
npm run build
```
Validates that all TypeScript types, interfaces, and JSX components compile with zero type errors.
