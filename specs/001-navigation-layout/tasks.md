# Tasks: Navigation Layout & Calendar Section

**Input**: Design documents from `/specs/001-navigation-layout/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4...)
- Include exact file paths in descriptions

## Path Conventions
- **Backend**: `backend/`
- **Frontend**: `src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure.

- [x] T001 Initialize React + Vite + TypeScript project in workspace root
- [x] T002 Initialize Django project in backend/
- [x] T003 Install and configure Tailwind CSS in the root project (tailwind.config.js)
- [x] T004 Setup global style declarations in src/index.css

---

## Phase 2: Foundational (Backend Development)

**Purpose**: Database persistence, serialization, NLP service, and API controllers.

- [x] T005 Create ElementoAura model in backend/models.py
- [x] T006 [P] Create ElementoAuraSerializer in backend/serializers.py
- [x] T007 [P] Create NLP service processing text with OpenAI in backend/services.py
- [x] T008 Create ElementoAuraListAPI view in backend/views.py

---

## Phase 3: User Story 1 & 2 - UI & State Navigation Layout (Priority: P1)

**Goal**: Implement layout, Navbar, TabBar, state context, and dynamic page views.

- [x] T009 [P] [US1] Create ElementoTipo and PlanElemento domain types in src/domain/types.ts
- [x] T010 [US1] Create AuraState provider and hooks in src/context/AuraState.tsx
- [x] T011 [US1] Build Navbar, TabBar, ContenidoPrincipal, and App components in src/App.tsx

---

## Phase 4: User Story 4 - Calendar View (Priority: P1)

**Goal**: Implement a fully functional monthly calendar grid displaying items with their due dates and category colors, along with month-to-month navigation.

**Independent Test**: Click on the "Calendario" tab, verify the calendar grid for the current month renders correctly with correct days/week alignment, navigate between months, and verify that events for the selected month are retrieved and displayed on their respective days.

- [x] T014 [US4] Support start_date/end_date query parameters in backend/views.py to filter ElementoAura items by month
- [x] T015 [P] [US4] Create unit tests for date filtering in backend/tests.py
- [x] T016 [P] [US4] Extend TypeScript types with calendar-specific interfaces in src/domain/types.ts
- [x] T017 [US4] Create monthly date grid calculation utilities in src/utils/dateUtils.ts
- [x] T018 [US4] Implement CalendarGrid component showing days and events in src/components/CalendarGrid.tsx
- [x] T019 [US4] Integrate CalendarGrid and month navigation in src/App.tsx

---

## Phase 5: User Story 5 - Calendar Item CRUD (Priority: P2)

**Goal**: Allow creation, editing, and deletion of calendar items (ElementoAura) directly from the calendar interface.

**Independent Test**: Click on a calendar day or an existing event to open a modal form. Verify that creating a new item, updating its properties, or deleting it successfully hits the backend and reflects on the UI without reloading the page.

- [x] T020 [US5] Implement POST/PUT/DELETE API endpoints for full CRUD of ElementoAura in backend/views.py
- [x] T021 [P] [US5] Create unit tests for ElementoAura CRUD operations in backend/tests.py
- [x] T022 [US5] Build interactive ElementoModal component with detail and form inputs in src/components/ElementoModal.tsx
- [x] T023 [US5] Update AuraState context to handle local CRUD state actions and API calls in src/context/AuraState.tsx
- [x] T024 [US5] Wire calendar event click and day click to ElementoModal in src/components/CalendarGrid.tsx

---

## Phase 6: User Story 6 - Calendar Filters & Responsive Design (Priority: P2)

**Goal**: Filter calendar items by their types (Objectives, Projects, Events, Activities) and support mobile devices with a clean Agenda view.

**Independent Test**: Check that toggling category selectors filters items displayed on the calendar grid. Resize the window to mobile width and verify that the grid is replaced by a responsive list/agenda view.

- [x] T025 [US6] Add element type filter selectors above the calendar in src/components/CalendarGrid.tsx
- [x] T026 [P] [US6] Build AgendaView component for mobile screens in src/components/AgendaView.tsx
- [x] T027 [US6] Add responsive conditional layout (Grid on desktop, Agenda on mobile) in src/components/CalendarGrid.tsx

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Database migrations, integration testing, styling touch-ups, and final validations.

- [x] T012 Run Django database migrations and configure settings
- [x] T013 Verify application transitions and layout locally
- [x] T028 Perform layout responsiveness audit and fix any mobile layout overflow issues in src/index.css
- [x] T029 Verify complete integration of the Calendar view, actions, and API endpoints with Redis cache invalidation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup & Foundation (Phases 1 & 2)**: Complete.
- **US 1 & 2 (Phase 3)**: Complete.
- **Calendar View (Phase 4)**: Depends on complete backend/frontend setup (complete). Blocks Phase 5 & 6 actions.
- **Calendar CRUD (Phase 5)**: Depends on Phase 4 calendar grid infrastructure.
- **Filters & Mobile (Phase 6)**: Can run concurrently with Phase 5 but depends on Phase 4 grid infrastructure.
- **Polish (Phase N)**: Depends on completing the respective phase tasks.

### Within Each User Story

- Backend models/views/tests first.
- Utilities and TypeScript models.
- Core UI components and state integration.
- Responsive design and styling tweaks.

### Parallel Opportunities

- Within Phase 4: Backend date filtering query parameter tests ([P] T015) can run in parallel with frontend types definition ([P] T016).
- Within Phase 5: Backend CRUD endpoints tests ([P] T021) can run in parallel with frontend form design.
- Within Phase 6: Mobile AgendaView component ([P] T026) can be built in parallel with filter UI logic.

---

## Implementation Strategy

### MVP First (User Story 4 Only)

1. Implement query parameter filtering on backend `/api/v1/elementos/`.
2. Implement front-end monthly grid and month navigation.
3. Fetch and render items in the correct grid squares.
4. **Checkpoint**: Verify user can view events by month.

### Incremental Delivery

1. Deliver Calendar View (Phase 4) → Verify monthly display.
2. Deliver Calendar CRUD (Phase 5) → Verify item addition and modifications.
3. Deliver Filters & Mobile (Phase 6) → Verify filtering and responsiveness.
