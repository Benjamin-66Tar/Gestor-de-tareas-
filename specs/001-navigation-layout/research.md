# Technical Research: Navigation Layout, Layered Architecture & Tech Stack

## 1. Architectural Style: Layered Architecture (Arquitectura de Capas)

### Decision
Adopt a strict **Layered Architecture** across both the backend (Django + DRF) and frontend (React + TypeScript).

### Rationale
- **Separation of Concerns**: Isolating the Presentation, Service (Business Logic), Serialization/DTO, and Persistence layers ensures that business rules (such as milestone progress computation or deadline projection) are decoupled from HTTP controllers and frontend UI components.
- **Testability**: The Service layer in Django and client services in React can be tested independently with unit tests without needing mock HTTP requests or rendering DOM trees.
- **Maintainability & Evolution**: Changes to the storage engine (e.g., SQLite to PostgreSQL) or frontend UI framework only affect their respective layers without rippling through business logic.

### Layer Blueprint
- **Backend**:
  - `Presentation Layer`: `views.py`, `urls.py` — REST API ViewSets, request validation, authentication, HTTP status codes, and response caching.
  - `Service Layer`: `services.py` — Domain algorithms (hybrid progress evaluation, calendar projection, notification dispatching).
  - `Serialization Layer`: `serializers.py` — DRF DTOs, data validation rules, nested serialization.
  - `Persistence Layer`: `models.py` — ORM entities, relationships, database constraints, migrations.
- **Frontend**:
  - `Presentation Layer`: `components/` — UI views, cards, drawers, responsive Tailwind layouts.
  - `State / Application Layer`: `context/AuraState.tsx` — UI state, filter states, drawer lifecycle, optimistic updates.
  - `Service / Client Layer`: `services/api.ts` — Typed network calls, error normalization.
  - `Domain Layer`: `domain/types.ts` — TypeScript interfaces, enums, pure domain logic.

### Alternatives Considered
- **Monolithic MVC (Django standard views with templates)**: Rejected because it does not support sub-100ms client-side transitions or the rich interactive drawer/card UX required by Aura.
- **Clean / Hexagonal Architecture (Ports and Adapters)**: Overkill for this project stage; creates excessive boilerplate compared to a pragmatic Layered Architecture.

---

## 2. Technology Stack Selection & Justification

### Decision
- **Frontend**: **React 18 + Vite + TypeScript + Tailwind CSS**
- **Backend**: **Python 3.12 + Django 6 + Django REST Framework (DRF)**
- **Persistence & Caching**: **SQLite (Dev) / PostgreSQL (Prod) + Redis**

### Rationale

| Layer | Selected Tech | Key Reasons | Alternatives Evaluated |
|---|---|---|---|
| **Frontend Framework** | React 18 + Vite | Sub-second HMR, instant component rendering, massive ecosystem for rich productivity components. | Vue 3, Next.js (SSR unnecessary for authenticated SPA shell). |
| **Type Safety** | TypeScript 5+ | Shared contract alignment with DRF serializers, prevents runtime property errors. | Plain JavaScript (lacks compile-time guarantees). |
| **CSS Framework** | Tailwind CSS 3.4 | Perfect for Aura's vibrant, colorful aesthetic; zero runtime overhead, responsive utility classes. | Styled-components (runtime CSS-in-JS performance penalty), Bootstrap (inflexible styling). |
| **Backend Framework** | Django 6 + DRF | Industry-standard ORM, declarative migrations, robust authentication, high development speed. | FastAPI (lighter, but requires piecing together ORM/migrations/auth manually), Flask (minimalist). |
| **Database** | SQLite → PostgreSQL | SQLite provides immediate zero-config local development (`db.sqlite3`); seamless transition to Postgres via Django ORM. | MongoDB (NoSQL lacks relational guarantees needed for milestones and calendar events). |
| **Caching** | Redis (`django-redis`) | In-memory key-value caching enables sub-millisecond retrieval of unread notifications count and section payloads. | In-memory cache (`locmem`: non-scalable), Database cache (adds DB contention). |

---

## 3. Goal Progress Calculation Engine

### Decision
Implement a hybrid calculation engine in `backend/services.py` supporting two distinct modes per Goal:
1. `MANUAL`: Direct user percentage setting (0-100%).
2. `MILESTONES`: Automatic calculation based on milestone completion:
   - **Equal weight (default)**: `Progress = (Completed Milestones / Total Milestones) * 100`
   - **Weighted milestones**: Each milestone can optionally define a `weight` (integer or decimal).
     $$\text{Progress} = \frac{\sum_{m \in \text{completed}} \text{weight}_m}{\sum_{m \in \text{all}} \text{weight}_m} \times 100$$
   - If total weight is 0 or all weights are null, fallback cleanly to equal weight.
   - Result is clamped to $[0, 100]$.

### Alternatives Considered
- **Client-only progress calculation**: Rejected because backend APIs and notifications need the true progress value for reports and deadline evaluations.
- **Database Triggers / Stored Procedures**: Rejected to preserve database vendor portability and keep business logic inside Python services.

---

## 4. UI View Switching & Filter Preservation

### Decision
Handle view switching (`cards` vs `list`) and filtering (status and category) inside `AuraState.tsx` without resetting component state.

### Rationale
- Toggling between the visual card grid and the compact list view merely re-renders the same filtered dataset using different presentational components (`GoalCard` vs `GoalTable`).
- Transitions occur entirely in-memory in $<50$ms, satisfying Success Criteria SC-001 ($<100$ms).

---

## 5. Goal Creation & Editing: Slide-over Drawer (Panel Lateral)

### Decision
Use a slide-over drawer (`GoalDrawer.tsx`) anchored to the right viewport edge for all goal CRUD operations.

### Rationale
- **Context Preservation**: The user can see their current goals list while adding or editing a goal or adjusting milestone weights.
- **Ergonomics**: Provides ample vertical scrolling space for long milestone checklists without crowding the screen like a standard centered modal.

---

## 6. Calendar Synchronization Strategy

### Decision
Compute calendar events dynamically via a projection service in the backend (`sync_goals_to_calendar`), rather than duplicating calendar rows in the database.

### Rationale
- **Single Source of Truth**: When a goal deadline changes or an milestone is marked complete, the change is immediately reflected in the Calendar tab without sync delay or synchronization bugs.
- **Color Association**: Projected deadline events inherit the goal's category theme color automatically.

---

## 7. Project & Task Data Hierarchy & Kanban State Machine

### Decision
Implement a deterministic 3-column workflow (`TODO` -> `IN_PROGRESS` -> `DONE`) for tasks within each project.
- Project completion percentage is automatically computed as:
  $$\text{Progress} = \begin{cases} 0\% & \text{if total tasks} = 0 \\ \left(\frac{\text{count}(\text{tasks with status } = \text{DONE})}{\text{total tasks}}\right) \times 100 & \text{otherwise} \end{cases}$$
- Tasks support subtasks/checklists, priority levels (`LOW`, `MEDIUM`, `HIGH`), and optional deadlines.

### Rationale
- **Zero Configuration Friction**: A fixed 3-state workflow removes complex board setup overhead while matching the natural execution lifecycle.
- **Predictable Progress Metric**: Users receive clear, unambiguous visual completion feedback without arbitrary manual estimation.

### Alternatives Considered
- **Configurable / Custom Kanban Columns**: Rejected because it adds excessive database complexity, custom column ordering schemas, and makes automatic progress calculation subjective.
- **Weighted Tasks by Story Points/Hours**: Rejected to prevent administrative cognitive load and stay aligned with Aura's clean and agile user experience.

---

## 8. Kanban Interaction & Drag-and-Drop Paradigm

### Decision
Adopt a hybrid interaction model:
1. Native HTML5 Drag and Drop / mouse event handlers with zero-dependency CSS transitions for dragging task cards between columns.
2. Direct action button / dropdown on each task card (`Mover a...`) for keyboard and mobile accessibility.

### Rationale
- **Ultra-Fast Performance**: Zero external heavy dragging dependencies (e.g. avoiding massive bundle overhead of `react-beautiful-dnd`) ensures sub-100ms response times.
- **Accessibility & Mobile Readiness**: Guarantees seamless operation on touchscreens and mobile viewports where drag-and-drop can conflict with screen scrolling.

---

## 9. Cross-Section Integration (Projects <-> Goals & Projects <-> Calendar)

### Decision
- **Optional Goal Linking**: Projects can specify a foreign key to a `Goal`. When present, the Goal details drawer displays the associated project and its progress.
- **Unified Calendar Projection**: Extend the backend projection service (`sync_all_to_calendar`) to aggregate both Goal/Milestone deadlines and Project Task deadlines into the Calendar feed, styled using the parent Project's color theme.

### Rationale
- Connects high-level strategy (Goals) with daily execution (Project Tasks) without forcing strict hierarchy where none is needed.
- Provides a centralized calendar view of all user commitments across the app.

---

## 10. Project Hub Lifecycle & In-Memory Filtering

### Decision
Implement in-memory filtering for project lifecycle status (`Active` default, `Completed`, `Archived`) and instant text search in `AuraState.tsx`.

### Rationale
- **Sub-10ms UI Feedback**: Filtering active projects or searching by title happens entirely on the client without waiting for server round-trips.
- **Visual Tidiness**: Users can easily archive completed projects to maintain a focused workspace while retaining historical records.
