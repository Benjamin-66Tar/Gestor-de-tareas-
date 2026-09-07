# Tasks: Navigation Layout, Objetivos & Proyectos Management

**Input**: Design documents from `/specs/001-navigation-layout/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/api.md`, `quickstart.md`)

**Prerequisites**: `plan.md`, `spec.md`, `data-model.md`, `contracts/api.md`, `quickstart.md`

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story, strictly adhering to the **Layered Architecture (Arquitectura de Capas)**.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., [US1], [US2], [US3])
- Exact file paths are specified for every task

## Path Conventions
- **Backend (Django)**: `backend/`
- **Frontend (React)**: `src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic dependencies.

- [X] T001 Configure backend settings, CORS, and REST framework in backend/settings.py
- [X] T002 [P] Configure Vite dev server proxy for /api/v1/ backend communication in vite.config.ts

---

## Phase 2: Foundational (Blocking Prerequisites - Models, Services & State)

**Purpose**: Core data persistence, service layer calculation logic, and application state that MUST be complete before user stories can be implemented.

**⚠️ CRITICAL**: All user story implementations depend on this foundational phase.

- [X] T003 [P] Create domain models and TypeScript interfaces for Goal, GoalMilestone, NotificationItem, UserProfile, ProgressMode, and GoalStatus in src/domain/types.ts
- [X] T004 [P] Implement database models UserProfile, Notification, Goal, and GoalMilestone in backend/models.py
- [X] T005 [P] Create DRF serializers for UserProfile, Notification, GoalMilestone, and Goal in backend/serializers.py
- [X] T006 Implement domain service functions for hybrid milestone progress calculation and calendar deadline synchronization in backend/services.py
- [X] T007 Apply database migrations for new models using makemigrations and migrate in backend/
- [X] T008 [P] Implement typed frontend HTTP client for backend REST API communication in src/services/api.ts
- [X] T009 Extend application state context with active tab persistence, goals state, filters, notifications, and drawer visibility in src/context/AuraState.tsx

**Checkpoint**: Foundation ready - user story implementation can now proceed.

---

## Phase 3: User Story 1 - Header Navigation Bar (Navbar) (Priority: P1)

**Goal**: Deliver the persistent top header showing colorful "Aura" branding, notification icon with dynamic unread badge count, and user avatar.

**Independent Test**: Load the application on any route; verify the "Aura" logo is rendered on the left with vibrant styling, and the notification bell (with unread numeric badge) and user profile avatar render on the right.

- [X] T010 [P] [US1] Implement REST API endpoints for user profile and unread notifications count in backend/views.py and backend/urls.py
- [X] T011 [P] [US1] Create unit tests for user profile and unread notifications count endpoints in backend/tests.py
- [X] T012 [US1] Build Navbar component with branding logo, notification button badge, and user avatar in src/components/Navbar.tsx
- [X] T013 [US1] Integrate Navbar into the main application layout in src/App.tsx

**Checkpoint**: User Story 1 is functional and verifiable independently.

---

## Phase 4: User Story 2 - Section Switching TabBar & Objetivos Section (Priority: P1) 🎯 MVP

**Goal**: Deliver instant horizontal tab switching (<100ms) with local persistence, plus the complete Objetivos section featuring dual card/list views, filter chips, right slide-over drawer for goal/milestone CRUD with weighted progress calculation, and calendar synchronization.

**Independent Test**: Switch between tabs and verify transitions are instant (<100ms) and persisted across page refresh. Click "Objetivos": verify dual view (cards vs list), filter chips by status and category, open the slide-over drawer to create/edit goals with milestone weights, verify automatic progress calculation, and verify goal deadlines project onto the "Calendario" tab.

- [X] T014 [P] [US2] Implement REST API endpoints for Goals CRUD and milestone toggle in backend/views.py and backend/urls.py
- [X] T015 [P] [US2] Create unit tests for goal creation, weighted milestone progress calculation, and calendar sync in backend/tests.py
- [X] T016 [P] [US2] Create TabBar component supporting dynamic navigation and active tab highlighting in src/components/TabBar.tsx
- [X] T017 [P] [US2] Build GoalCard component showing category theme badge, progress bar (0-100%), deadline, and expandable milestone list in src/components/goals/GoalCard.tsx
- [X] T018 [P] [US2] Build GoalTable component for compact list view with status indicators and progress bars in src/components/goals/GoalTable.tsx
- [X] T019 [US2] Build GoalDrawer slide-over panel from the right edge for creating and editing goals, switching progress mode, and configuring milestone weights in src/components/goals/GoalDrawer.tsx
- [X] T020 [US2] Build GoalsView container component with view switcher (Cards vs List), status/category filter chips, and drawer integration in src/components/goals/GoalsView.tsx
- [X] T021 [US2] Update CalendarGrid to display synchronized goal and milestone deadlines as colored calendar event markers in src/components/CalendarGrid.tsx
- [X] T022 [US2] Wire TabBar and dynamic rendering of GoalsView and CalendarGrid in src/App.tsx

**Checkpoint**: User Stories 1 and 2 are fully integrated and provide the complete core MVP experience.

---

## Phase 5: User Story 3 - Quick Action Dropdowns (Priority: P2)

**Goal**: Provide interactive dropdown menus when clicking the notification icon and user avatar, displaying recent alerts and profile/settings options that dismiss on outside click.

**Independent Test**: Click the notification bell -> popover opens showing recent alerts with mark-as-read action; click outside -> closes. Click the avatar -> popover opens showing Profile, Settings, and Log Out options; click outside -> closes.

- [X] T023 [P] [US3] Implement notifications list and mark-as-read endpoints in backend/views.py and backend/urls.py
- [X] T024 [P] [US3] Create unit tests for notification listing and mark-as-read actions in backend/tests.py
- [X] T025 [P] [US3] Build NotificationDropdown popover component with mark-as-read and outside-click dismissal in src/components/NotificationDropdown.tsx
- [X] T026 [P] [US3] Build ProfileMenu popover component with links for Profile, Settings, Log Out, and outside-click dismissal in src/components/ProfileMenu.tsx
- [X] T027 [US3] Integrate NotificationDropdown and ProfileMenu into Navbar in src/components/Navbar.tsx

**Checkpoint**: All three user stories are complete and independently functional.

---

## Phase 6: User Story 4 - Projects Management Hub & Workspace (Priority: P1)

**Goal**: Deliver the complete Projects management section: visual Projects Hub with cards, lifecycle filtering (*Activos*, *Completados*, *Archivados*) and instant search; dedicated project workspace featuring a 3-column Kanban board (*Por hacer*, *En progreso*, *Completado*) with drag-and-drop support; task priority badges, deadlines, and checklists; real-time automatic project progress calculation; optional linkage to strategic Goals; slide-over drawers for project/task creation and editing; and deadline synchronization with the Calendar tab.

**Independent Test**: Navigate to the "Proyectos" tab. Verify the Hub renders with project cards and status filter pills. Create a new project via "+ Nuevo Proyecto" in the slide-over drawer; verify it appears in the hub. Open the project workspace; verify 3 Kanban columns. Create tasks, check subtasks, move tasks between columns, and verify real-time recalculation of the project progress bar. Verify task deadlines appear on the "Calendario" tab styled with the project's theme color.

- [ ] T033 [P] [US4] Define TypeScript domain models and interfaces for Project, ProjectTask, TaskSubtask, ProjectStatus, TaskStatus, TaskPriority, and ProjectFilterCriteria in src/domain/types.ts
- [ ] T034 [P] [US4] Implement database models Project, ProjectTask, and TaskSubtask in backend/models.py
- [ ] T035 [P] [US4] Create DRF serializers ProjectSerializer, ProjectTaskSerializer, and TaskSubtaskSerializer in backend/serializers.py
- [ ] T036 [US4] Implement project progress calculation and project task calendar synchronization services in backend/services.py
- [ ] T037 [US4] Generate and apply database migrations for Project, ProjectTask, and TaskSubtask models in backend/
- [ ] T038 [P] [US4] Implement REST API endpoints for Projects CRUD, Tasks CRUD, Kanban status transition, and Subtask toggle in backend/views.py and backend/urls.py
- [ ] T039 [P] [US4] Create unit tests for project progress calculation, task status transitions, and calendar projection in backend/tests.py
- [ ] T040 [P] [US4] Implement typed API client service methods for Projects, Tasks, and Subtasks in src/services/api.ts
- [ ] T041 [US4] Extend application state context with projects list, active project, search/lifecycle filters, Kanban task movements, and project/task drawer state in src/context/AuraState.tsx
- [ ] T042 [P] [US4] Build ProjectCard component showing title, color theme accent, progress bar (0-100%), task count, and optional linked goal pill in src/components/projects/ProjectCard.tsx
- [ ] T043 [P] [US4] Build ProjectsHub component with lifecycle filter pills (Activos, Completados, Archivados), instant search bar, and new project action in src/components/projects/ProjectsHub.tsx
- [ ] T044 [P] [US4] Build TaskCard component displaying priority badge, deadline tag, checklist counter, and column switcher in src/components/projects/TaskCard.tsx
- [ ] T045 [P] [US4] Build KanbanColumn component with task count badge, task cards, and quick task inline creation in src/components/projects/KanbanColumn.tsx
- [ ] T046 [US4] Build KanbanBoard component with 3 fixed columns (Por hacer, En progreso, Completado) supporting drag-and-drop transitions in src/components/projects/KanbanBoard.tsx
- [ ] T047 [US4] Build ProjectWorkspace component with breadcrumb back navigation, progress header, and Kanban/List view switcher in src/components/projects/ProjectWorkspace.tsx
- [ ] T048 [P] [US4] Build ProjectDrawer slide-over panel for creating and editing project details, theme color, and Goal linkage in src/components/projects/ProjectDrawer.tsx
- [ ] T049 [P] [US4] Build TaskDrawer slide-over panel for task details, priority, deadline, and checklist subtasks management in src/components/projects/TaskDrawer.tsx
- [ ] T050 [US4] Build ProjectsView container switching between ProjectsHub and ProjectWorkspace in src/components/projects/ProjectsView.tsx
- [ ] T051 [US4] Integrate project task deadlines with project color styling into CalendarGrid in src/components/CalendarGrid.tsx
- [ ] T052 [US4] Wire ProjectsView into the main application layout for the PROYECTOS tab in src/App.tsx

**Checkpoint**: User Story 4 is complete, testable, and fully integrated with the shell, goals, and calendar.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validation, responsive audit, performance verification, and edge case resilience across all features.

- [X] T028 [P] Perform responsive viewport audit for mobile screens (TabBar swipe and GoalDrawer full-width adaptation) in src/index.css
- [X] T029 [P] Add boundary checks for extremely high notification counts ("99+") and network connectivity failures in src/components/Navbar.tsx
- [X] T030 Execute backend test suite with pytest backend/tests.py to verify 100% pass rate
- [X] T031 Run frontend production build check with npm run build to verify zero TypeScript or linting errors
- [X] T032 Execute end-to-end verification scenarios per quickstart.md
- [ ] T053 [P] Perform responsive audit for Kanban board horizontal scrolling on narrow/mobile viewports in src/index.css
- [ ] T054 Execute complete backend test suite including project and task test cases with pytest backend/tests.py
- [ ] T055 Run frontend production build check with npm run build to verify zero TypeScript errors
- [ ] T056 Execute end-to-end verification scenarios 6 through 10 in quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Completed [X].
- **Foundational (Phase 2)**: Completed [X].
- **User Story 1 (Phase 3)**: Completed [X].
- **User Story 2 (Phase 4)**: Completed [X].
- **User Story 3 (Phase 5)**: Completed [X].
- **User Story 4 (Phase 6)**: Ready to execute. Depends on Foundational phase and integrates with US2 (Goals/Calendar).
- **Polish (Phase 7)**: Depends on User Story 4 completion.

### User Story 4 Parallel Opportunities

- **Backend & Models**: T033 (domain types), T034 (models), T035 (serializers), and T040 (API client) can be created in parallel.
- **Frontend Components**:
  - `ProjectCard` (T042) and `ProjectsHub` (T043) can be built concurrently with `TaskCard` (T044) and `KanbanColumn` (T045).
  - Drawers `ProjectDrawer` (T048) and `TaskDrawer` (T049) can be built in parallel.
- **Testing & Verification**: T039 (unit tests) and T054 (test execution) validate backend integrity independently from frontend UI components.

---

## Parallel Example: User Story 4

```bash
# Launch backend models and serializers together:
Task: "Implement database models Project, ProjectTask, and TaskSubtask in backend/models.py"
Task: "Create DRF serializers ProjectSerializer, ProjectTaskSerializer, and TaskSubtaskSerializer in backend/serializers.py"

# Launch frontend domain types and API client together:
Task: "Define TypeScript domain models and interfaces in src/domain/types.ts"
Task: "Implement typed API client service methods in src/services/api.ts"

# Launch UI components together:
Task: "Build ProjectCard component in src/components/projects/ProjectCard.tsx"
Task: "Build TaskCard component in src/components/projects/TaskCard.tsx"
Task: "Build ProjectDrawer in src/components/projects/ProjectDrawer.tsx"
Task: "Build TaskDrawer in src/components/projects/TaskDrawer.tsx"
```

---

## Implementation Strategy

### Incremental Delivery for User Story 4

1. **Step 1: Data & Service Foundations (T033 - T040)**:
   - TypeScript domain types & Django ORM models (`Project`, `ProjectTask`, `TaskSubtask`).
   - DRF serializers & service logic (progress formula, calendar sync).
   - Database migrations & API ViewSets.
   - Backend unit tests.
2. **Step 2: Frontend State & Hub (T041 - T043, T048)**:
   - State management in `AuraState.tsx` (projects, filter state, project drawer).
   - Visual cards in `ProjectCard.tsx` and grid in `ProjectsHub.tsx`.
   - `ProjectDrawer.tsx` for creating/editing projects and linking to Goals.
3. **Step 3: Kanban Workspace & Tasks (T044 - T047, T049 - T050)**:
   - `TaskCard.tsx` with priority tags, deadlines, and checklists.
   - `KanbanColumn.tsx` and `KanbanBoard.tsx` (3-column workflow with drag-and-drop).
   - `TaskDrawer.tsx` for task details and checklist subtasks.
   - `ProjectWorkspace.tsx` and container `ProjectsView.tsx`.
4. **Step 4: Cross-Section Integration & Layout (T051 - T052)**:
   - Project task deadline markers in `CalendarGrid.tsx`.
   - Wire `ProjectsView` into `App.tsx` on tab `'PROYECTOS'`.
5. **Step 5: Polish & Full Verification (T053 - T056)**:
   - Mobile responsive check for Kanban columns.
   - Run `pytest backend/tests.py` and `npm run build`.
   - Validate Quickstart scenarios 6-10.

