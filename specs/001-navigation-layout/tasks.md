# Tasks: Navigation Layout & Objetivos Section

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

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation, responsive audit, performance verification, and edge case resilience.

- [X] T028 [P] Perform responsive viewport audit for mobile screens (TabBar swipe and GoalDrawer full-width adaptation) in src/index.css
- [X] T029 [P] Add boundary checks for extremely high notification counts ("99+") and network connectivity failures in src/components/Navbar.tsx
- [X] T030 Execute backend test suite with pytest backend/tests.py to verify 100% pass rate
- [X] T031 Run frontend production build check with npm run build to verify zero TypeScript or linting errors
- [X] T032 Execute end-to-end verification scenarios per quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational phase.
- **User Story 2 (Phase 4)**: Depends on Foundational phase. Can execute in parallel with US1.
- **User Story 3 (Phase 5)**: Depends on US1 (attaches to Navbar buttons) and Foundational phase.
- **Polish (Phase 6)**: Depends on all user stories being completed.

### Parallel Opportunities

- **Phase 1**: T001 and T002 can run in parallel.
- **Phase 2**: T003, T004, T005, and T008 can run concurrently across frontend and backend.
- **Phase 3**: T010, T011 can run in parallel with T012.
- **Phase 4**:
  - Backend tasks T014, T015 can run in parallel with frontend components T016, T017, T018.
  - Component development for `GoalCard` (T017) and `GoalTable` (T018) can proceed in parallel.
- **Phase 5**: T023, T024 can run in parallel with UI popovers T025, T026.
- **Phase 6**: T028, T029 can be handled concurrently.

---

## Implementation Strategy

### MVP First (User Story 1 & User Story 2)

1. Complete Phase 1 (Setup) and Phase 2 (Foundational).
2. Deliver User Story 1 (Navbar shell).
3. Deliver User Story 2 (TabBar navigation + complete Objetivos section with slide-over drawer and calendar sync).
4. **STOP and VALIDATE**: Verify all acceptance scenarios in `quickstart.md`.

### Incremental Delivery

1. Setup + Foundation ready.
2. User Story 1 (Navbar branding & unread badge) → Test independently.
3. User Story 2 (Objetivos dual view, drawer, milestones, calendar sync) → Test independently.
4. User Story 3 (Dropdown menus for alerts & profile) → Test independently.
5. Polish & Cross-cutting validations (Mobile responsiveness, high badge counts, build passes).
