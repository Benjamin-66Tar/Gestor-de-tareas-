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

---

## 11. Event Scheduling, Chronological Grouping & Lifecycle States

### Decision
Model events via an `EventItem` entity with start/end datetime, location or virtual link, color-coded category, and explicit lifecycle status (`PROGRAMMED`, `COMPLETED`, `CANCELED`).
Organize the events view chronologically into 4 dynamic time blocks:
1. **"Hoy" (Today)**: Events occurring on the current calendar date ($T_{\text{start}} \le \text{today } 23:59:59 \land T_{\text{end}} \ge \text{today } 00:00:00$).
2. **"Esta semana" (This Week)**: Events scheduled after today but within the current calendar week (ending Sunday 23:59:59).
3. **"Próximos" (Upcoming)**: Events beyond the current calendar week.
4. **"Pasados" (Past)**: Events whose end time has already elapsed ($T_{\text{end}} < \text{now}$).

### Rationale
- **Cognitive Clarity**: Time blocks allow users to immediately identify what demands immediate attention today vs. upcoming commitments without needing to mentally parse calendar grids.
- **Actionable Status**: Supporting `COMPLETED` and `CANCELED` provides direct user satisfaction (checking off attended meetings or finished appointments) without destroying event history.

### Alternatives Considered
- **Strict Single-List Calendar View**: Rejected because duplicating the grid of the "Calendario" tab adds cognitive friction and fails to deliver an agile agenda view.
- **Passive No-Status Timestamps Only**: Rejected because users frequently need to record whether a meeting took place, was canceled, or rescheduled.

---

## 12. Calendar Projection & Proactive Reminder Notifications for Events

### Decision
- **Bidirectional/Unified Calendar Feed**: Extend `sync_all_to_calendar(user)` so that `EventItem` entries are projected into the Calendar grid with their full start and end time span and category color.
- **Proactive Alerts**: Implement `check_approaching_event_reminders(user)` in `services.py` to evaluate scheduled events whose $T_{\text{start}} - \text{now} \le \text{reminder\_minutes}$ and generate a real-time `Notification` item for the Navbar badge.

### Rationale
- **Unified Overview**: The user has one single source of truth in the "Calendario" tab showing Goal deadlines, Project task deadlines, and scheduled Events.
- **Timely Awareness**: Unread notification counter in the Navbar alerts the user before meetings start without requiring third-party push notification complexity at this stage.

---

## 13. Event Slide-over Drawer UX & Quick Inline Actions

### Decision
Provide:
1. A right-edge slide-over drawer (`EventDrawer.tsx`) for full event creation/editing (time pickers, category dropdown with color badges, location/URL input, reminder selector).
2. Quick inline action buttons on each event card (`Completar`, `Cancelar`, `Editar`) for instant one-click lifecycle changes without opening the drawer.

### Rationale
- **Preserved Context**: Matches the drawer pattern established in `GoalDrawer` and `ProjectDrawer`/`TaskDrawer`, maintaining architectural consistency across the application.
- **High Efficiency**: Users can mark an event as completed in $<100$ms directly from their chronological agenda.

---

## 14. Web Push Notifications Architecture & PWA Strategy (VAPID + Native Web Push)

### Decision
Implement native **Web Push Notifications** utilizing the standard W3C Push API and IETF VAPID protocol (RFC 8291 / RFC 8292), paired with a Progressive Web App (PWA) manifest and Service Worker (`sw.js`).
1. **Backend Delivery**: Use `pywebpush` in Django to deliver encrypted push payloads directly to browser push services (Google FCM, Apple WebPush, Mozilla Autopush) using server-side VAPID public/private keypairs.
2. **Multi-device Subscription Store**: Model `PushSubscription` with a 1:N relationship to `User`, storing `endpoint`, cryptographic keys (`p256dh`, `auth`), and user-agent metadata.
3. **Automatic Endpoint Pruning**: In `services.py`, catch push errors: when a push service returns HTTP 410 (*Gone*) or HTTP 404 (*Not Found*), automatically delete the stale subscription from the database.
4. **Lightweight In-Process Scheduler**: Run an in-process background worker (evaluating approaching event reminders and task deadlines every 1–5 minutes) in Django without requiring external Redis/Celery queue dependencies.
5. **PWA & Mobile Compatibility**:
   - Provide a Web App Manifest (`manifest.json` / `manifest.webmanifest`) enabling standalone installation.
   - On **Laptops (Windows, macOS, Linux)** and **Android**, push notifications work natively via desktop/mobile browsers.
   - On **iOS (iPhone/iPad, iOS 16.4+)**, Web Push is strictly enabled once the user adds Aura to their home screen as a PWA ("Añadir a pantalla de inicio").
6. **Interaction & Deep Linking**: Service Worker intercepts `push` and displays system notifications; on `notificationclick`, it searches for existing open tabs via `clients.matchAll({ type: 'window' })`, focusing an existing tab (`client.focus()`) and navigating to the contextual item or opening a new window if closed.
7. **User-Gesture Onboarding**: Permission is requested strictly via user interaction (toggle/button in UI dropdown or settings), preventing browser spam suppression and fulfilling Apple WebKit's strict *user gesture* requirement.

### Rationale
- **Zero Third-Party SaaS Dependencies**: 100% standards-compliant without monthly costs, subscription limits, or third-party trackers (OneSignal, Pusher).
- **Lightweight & High Speed**: Maintains Aura's sub-100ms responsiveness and eliminates heavyweight Redis/Celery infrastructure while providing autonomous background delivery.
- **Data Timeliness (Network-First)**: Service Worker avoids caching dynamic task/event API responses, preventing desynchronization bugs.

### Alternatives Considered
- **Firebase Cloud Messaging (FCM Web SDK)**: Rejected due to unnecessary bundle bloat, Google Cloud configuration complexity, and identical iOS 16.4+ PWA restrictions.
- **Celery + Redis + Celery Beat**: Rejected because it introduces external container/broker overhead that conflicts with Aura's rapid lightweight SQLite development constitution.
- **WebSocket-Only**: Rejected because WebSockets cannot deliver alerts when the browser tab is closed or the mobile screen is locked.

---

## 15. Welcome & Authentication Screen Architecture (Split Layout & Session Persistence)

### Decision
Implement an integrated **Welcome & Authentication Screen** serving as the application's entrance gateway, composed of a split 2-part responsive layout and persistent session state:
1. **Split 2-Part Visual Layout**:
   - **Part 1 (Hero Visual Banner)**: A colorful, high-visual-contrast panel containing a modern SVG productivity illustration, Aura branding logo, and two inspirational quotes (*"Organiza tu día con claridad y propósito."* y *"Transforma cada meta en un logro tangible."* as placeholders until final assets).
   - **Part 2 (Interactive Authentication / Welcome)**:
     - For new visitors or logged-out users: A card containing toggleable tabs (*"Iniciar Sesión"* / *"Crear Cuenta"*) with form validation (username, email, password matching).
     - For returning users with an active account/session: Renders the welcome greeting displaying the user's name/avatar, a prominent primary button (*"Entrar a Aura"* / *"Continuar"*), and a secondary link (*"Cambiar de cuenta"* / *"Cerrar sesión"*).
2. **Session Persistence & Returning Flow**:
   - Utilize standard Token / Session Storage in browser `localStorage` (`aura_user_session`).
   - On page startup, `AuraState` verifies whether a valid session exists. If present, it initializes in `isWelcomeOnly = true` mode, presenting the inspiring hero banner with the direct-entry button, satisfying SC-005 (<1s entry without retyping credentials).
3. **Logout & Account Switch Flow**:
   - Calling `logout()` or `switchAccount()` clears `localStorage`, resets session state in `AuraState`, and immediately transitions the view back to the full split screen with login/registration tabs.
4. **Mobile Responsive Grid**:
   - On desktop and tablet viewports ($\ge 768$px): 2-column layout (`grid grid-cols-1 md:grid-cols-2`).
   - On mobile screens ($<768$px): Automatically stacks into a clean single vertical column with a compact hero banner at the top and interactive form/button below, preventing horizontal scroll or truncated text.

### Rationale
- **Zero Friction for Returning Users**: Avoids annoying credential prompts on every visit while keeping user data private and allowing effortless account switching.
- **High Visual Appeal**: First impressions set the tone for Aura's colorful, motivating, and ultra-fast ethos.
- **Constitution Compliance**: Implements pure React state transition (<50ms) without full-page reloads, adhering strictly to Principle II (Rendimiento Ultra Rápido) and Principle I (Colorido y Altamente Visual).

### Alternatives Considered
- **Separate dedicated route pages (`/login` and `/register`)**: Rejected because full-page navigation creates unnecessary routing overhead and disrupts the split-screen aesthetic.
- **Modal Popup Login**: Rejected because authentication is the front door of the app; modal popups over an empty blurred background look unpolished and perform poorly on mobile viewports.
