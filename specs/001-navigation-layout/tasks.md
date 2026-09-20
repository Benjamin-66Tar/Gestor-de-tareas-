# Tasks: Navigation Layout, Objetivos, Proyectos, Eventos & Web Push Notifications (PWA)

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

- [X] T033 [P] [US4] Define TypeScript domain models and interfaces for Project, ProjectTask, TaskSubtask, ProjectStatus, TaskStatus, TaskPriority, and ProjectFilterCriteria in src/domain/types.ts
- [X] T034 [P] [US4] Implement database models Project, ProjectTask, and TaskSubtask in backend/models.py
- [X] T035 [P] [US4] Create DRF serializers ProjectSerializer, ProjectTaskSerializer, and TaskSubtaskSerializer in backend/serializers.py
- [X] T036 [US4] Implement project progress calculation and project task calendar synchronization services in backend/services.py
- [X] T037 [US4] Generate and apply database migrations for Project, ProjectTask, and TaskSubtask models in backend/
- [X] T038 [P] [US4] Implement REST API endpoints for Projects CRUD, Tasks CRUD, Kanban status transition, and Subtask toggle in backend/views.py and backend/urls.py
- [X] T039 [P] [US4] Create unit tests for project progress calculation, task status transitions, and calendar projection in backend/tests.py
- [X] T040 [P] [US4] Implement typed API client service methods for Projects, Tasks, and Subtasks in src/services/api.ts
- [X] T041 [US4] Extend application state context with projects list, active project, search/lifecycle filters, Kanban task movements, and project/task drawer state in src/context/AuraState.tsx
- [X] T042 [P] [US4] Build ProjectCard component showing title, color theme accent, progress bar (0-100%), task count, and optional linked goal pill in src/components/projects/ProjectCard.tsx
- [X] T043 [P] [US4] Build ProjectsHub component with lifecycle filter pills (Activos, Completados, Archivados), instant search bar, and new project action in src/components/projects/ProjectsHub.tsx
- [X] T044 [P] [US4] Build TaskCard component displaying priority badge, deadline tag, checklist counter, and column switcher in src/components/projects/TaskCard.tsx
- [X] T045 [P] [US4] Build KanbanColumn component with task count badge, task cards, and quick task inline creation in src/components/projects/KanbanColumn.tsx
- [X] T046 [US4] Build KanbanBoard component with 3 fixed columns (Por hacer, En progreso, Completado) supporting drag-and-drop transitions in src/components/projects/KanbanBoard.tsx
- [X] T047 [US4] Build ProjectWorkspace component with breadcrumb back navigation, progress header, and Kanban/List view switcher in src/components/projects/ProjectWorkspace.tsx
- [X] T048 [P] [US4] Build ProjectDrawer slide-over panel for creating and editing project details, theme color, and Goal linkage in src/components/projects/ProjectDrawer.tsx
- [X] T049 [P] [US4] Build TaskDrawer slide-over panel for task details, priority, deadline, and checklist subtasks management in src/components/projects/TaskDrawer.tsx
- [X] T050 [US4] Build ProjectsView container switching between ProjectsHub and ProjectWorkspace in src/components/projects/ProjectsView.tsx
- [X] T051 [US4] Integrate project task deadlines with project color styling into CalendarGrid in src/components/CalendarGrid.tsx
- [X] T052 [US4] Wire ProjectsView into the main application layout for the PROYECTOS tab in src/App.tsx

**Checkpoint**: User Story 4 is complete, testable, and fully integrated with the shell, goals, and calendar.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validation, responsive audit, performance verification, and edge case resilience across all features.

- [X] T028 [P] Perform responsive viewport audit for mobile screens (TabBar swipe and GoalDrawer full-width adaptation) in src/index.css
- [X] T029 [P] Add boundary checks for extremely high notification counts ("99+") and network connectivity failures in src/components/Navbar.tsx
- [X] T030 Execute backend test suite with pytest backend/tests.py to verify 100% pass rate
- [X] T031 Run frontend production build check with npm run build to verify zero TypeScript or linting errors
- [X] T032 Execute end-to-end verification scenarios per quickstart.md
- [X] T053 [P] Perform responsive audit for Kanban board horizontal scrolling on narrow/mobile viewports in src/index.css
- [X] T054 Execute complete backend test suite including project and task test cases with pytest backend/tests.py
- [X] T055 Run frontend production build check with npm run build to verify zero TypeScript errors
- [X] T056 Execute end-to-end verification scenarios 6 through 10 in quickstart.md

---

## Phase 8: User Story 5 - Events Management Hub & Schedule (Priority: P1)

**Goal**: Deliver the complete Events management section: chronological agenda grouped into 4 dynamic time blocks (*"Hoy"*, *"Esta semana"*, *"Próximos"*, *"Pasados"*) with visual cards; category theme filtering; explicit lifecycle statuses (*"Programado"*, *"Completado"*, *"Cancelado"*) with quick inline actions; slide-over drawer for full event configuration; and automatic projection onto the "Calendario" tab and Navbar reminder alerts.

**Independent Test**: Navigate to the "Eventos" tab. Verify the chronological blocks render with cards and category filter pills. Click "+ Nuevo Evento" to open the slide-over drawer; create an event with time, location/link, and category theme; verify it appears in the corresponding time block. Click "Completar" on the card to verify status changes to `COMPLETED`. Switch to the "Calendario" tab and verify the event is projected with its category color.

- [X] T057 [P] [US5] Define TypeScript domain models and interfaces for EventItem, EventStatus, TimeBlock, and EventFilterCriteria in src/domain/types.ts
- [X] T058 [P] [US5] Implement database model EventItem in backend/models.py
- [X] T059 [P] [US5] Create DRF serializer EventItemSerializer with start/end time validation and time_block calculation in backend/serializers.py
- [X] T060 [US5] Implement event calendar synchronization and proactive reminder alerts in backend/services.py
- [X] T061 [US5] Generate and apply database migrations for EventItem model in backend/
- [X] T062 [P] [US5] Implement REST API endpoints for Events CRUD and status transition in backend/views.py and backend/urls.py
- [X] T063 [P] [US5] Create unit tests for event creation, validation, status transitions, and calendar projection in backend/tests.py
- [X] T064 [P] [US5] Implement typed API client service methods for Events in src/services/api.ts
- [X] T065 [US5] Extend application state context with events state, time-block classification, category filters, quick status toggling, and event drawer in src/context/AuraState.tsx
- [X] T066 [P] [US5] Build EventCard component displaying category color badge, time span, location/link, description, and quick actions in src/components/events/EventCard.tsx
- [X] T067 [P] [US5] Build EventTimelineBlock component for grouping events into temporal blocks in src/components/events/EventTimelineBlock.tsx
- [X] T068 [P] [US5] Build EventDrawer slide-over panel for creating and editing event details, time pickers, category theme, and reminder lead times in src/components/events/EventDrawer.tsx
- [X] T069 [US5] Build EventsView container component with header, "+ Nuevo Evento" trigger, category filter pills, and time-block timeline blocks in src/components/events/EventsView.tsx
- [X] T070 [US5] Integrate scheduled events with category color styling into CalendarGrid in src/components/CalendarGrid.tsx
- [X] T071 [US5] Wire EventsView into the main application layout for the EVENTOS tab in src/App.tsx
- [X] T072 [US5] Execute backend test suite for events with pytest backend/tests.py
- [X] T073 [US5] Run frontend production build check with npm run build to verify zero TypeScript errors
- [X] T074 [US5] Execute end-to-end verification scenarios 11 through 14 in quickstart.md

---

## Phase 9: User Story 6 - Web Push Notifications & PWA Support (Priority: P1)

**Goal**: Deliver native Web Push Notifications across laptops (desktop browsers) and mobile phones (Android & iOS 16.4+ as PWA) using standard VAPID protocol with `pywebpush` in Django and native Service Worker (`sw.js`) + PWA manifest (`manifest.json`) in React/Vite. Support multi-device 1:N subscriptions per user with automatic pruning of invalid endpoints (HTTP 410/404), a lightweight in-process background scheduler for timely event reminder and deadline evaluation, contextual deep linking with window reuse on notification click, and explicit user-gesture subscription controls with iOS PWA onboarding guidance.

**Independent Test**:
1. Open Aura on laptop (Chrome/Edge/Safari); verify `manifest.json` loads and `sw.js` is registered without triggering unsolicited permission prompts.
2. Click "Activar notificaciones en este dispositivo" in the notification dropdown; grant permission and verify the device subscription is persisted in `PushSubscription` on the backend.
3. Trigger a test push notification via `POST /api/v1/notifications/push/test/` or simulate an event reminder; verify the OS desktop banner displays title and body.
4. Click the OS banner; verify the Service Worker focuses the active Aura tab and navigates directly to the notified event/task without opening redundant tabs.
5. In iOS Safari, open Aura and verify the onboarding banner guides the user to "Añadir a pantalla de inicio"; verify that opening the installed PWA allows enabling push alerts.

- [X] T075 [P] [US6] Define TypeScript domain types for PushSubscriptionKeys, PushSubscriptionDTO, and WebPushStatus in src/domain/types.ts
- [X] T076 [P] [US6] Implement database model PushSubscription with 1:N user relationship and unique endpoint constraint in backend/models.py
- [X] T077 [P] [US6] Create DRF serializer PushSubscriptionSerializer for validating subscription endpoints and cryptographic keys in backend/serializers.py
- [X] T078 [US6] Generate and apply database migrations for PushSubscription model in backend/
- [X] T079 [US6] Implement WebPushService in backend/services.py with VAPID signing, pywebpush payload delivery, and automatic HTTP 410/404 subscription pruning
- [X] T080 [US6] Implement lightweight in-process background scheduler in backend/services.py evaluating approaching event reminders and task deadlines on periodic intervals
- [X] T081 [P] [US6] Implement REST API endpoints for VAPID public key, push subscribe, unsubscribe, and test dispatch in backend/views.py and backend/urls.py
- [X] T082 [P] [US6] Create automated tests for PushSubscription CRUD, VAPID delivery, and 410 Gone pruning in backend/tests.py
- [X] T083 [P] [US6] Create Web App Manifest with standalone display mode, branding icons, and theme color in public/manifest.json
- [X] T084 [P] [US6] Create native Service Worker handling push events and notificationclick deep linking with window reuse in public/sw.js
- [X] T085 [US6] Register manifest and Service Worker in index.html and configure Vite build output in vite.config.ts
- [X] T086 [P] [US6] Implement typed API client service methods for Web Push subscription and test dispatch in src/services/api.ts
- [X] T087 [US6] Implement usePushNotifications custom React hook for permission handling, VAPID key conversion, and backend synchronization in src/hooks/usePushNotifications.ts
- [X] T088 [US6] Update NotificationDropdown component with explicit user-gesture push activation button and iOS PWA onboarding guidance in src/components/NotificationDropdown.tsx
- [X] T089 [US6] Execute backend test suite for Web Push with pytest backend/tests.py
- [X] T090 [US6] Run frontend production build check with npm run build to verify zero TypeScript errors
- [X] T091 [US6] Execute end-to-end verification Scenario 15 for Web Push and PWA in quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Completed [X].
- **Foundational (Phase 2)**: Completed [X].
- **User Story 1 (Phase 3)**: Completed [X].
- **User Story 2 (Phase 4)**: Completed [X].
- **User Story 3 (Phase 5)**: Completed [X].
- **User Story 4 (Phase 6)**: Completed [X].
- **Polish (Phase 7)**: Completed [X].
- **User Story 5 (Phase 8)**: Completed [X].
- **User Story 6 (Phase 9 - Web Push & PWA)**: Ready to execute. Depends on Foundational phase (Phase 2), User Story 1 (Navbar shell), and User Story 3 (Notification Dropdown).

### User Story 6 Parallel Opportunities

- **Backend Models & Serializers**: T075 (domain types), T076 (models), T077 (serializers), and T086 (client api) can be implemented in parallel.
- **PWA & Service Worker**: T083 (`manifest.json`) and T084 (`sw.js`) can be built concurrently with backend endpoints (T081) and tests (T082).
- **Frontend Hook & UI**: `usePushNotifications.ts` (T087) and `NotificationDropdown.tsx` (T088) can be developed once the API client (T086) and Service Worker (T084) are in place.
- **Verification**: T089 (backend pytest) and T090 (frontend build) validate stack health before end-to-end manual validation in T091.

---

## Parallel Example: User Story 6

```bash
# Launch backend models and serializers together:
Task: "Implement database model PushSubscription in backend/models.py"
Task: "Create DRF serializer PushSubscriptionSerializer in backend/serializers.py"

# Launch PWA infrastructure together:
Task: "Create Web App Manifest in public/manifest.json"
Task: "Create native Service Worker in public/sw.js"

# Launch client types and API client together:
Task: "Define TypeScript domain types in src/domain/types.ts"
Task: "Implement typed API client service methods in src/services/api.ts"
```

---

## Implementation Strategy

### Incremental Delivery for User Story 6 (Web Push & PWA)

1. **Step 1: Data & Serialization Foundations (T075 - T078)**:
   - TypeScript interfaces (`PushSubscriptionKeys`, `PushSubscriptionDTO`, `WebPushStatus`).
   - Django model `PushSubscription` (1:N user relationship) and migration.
   - DRF serializer for subscription validation.
2. **Step 2: Push Delivery & Scheduling Logic (T079 - T082)**:
   - `WebPushService` utilizing `pywebpush` with VAPID signing and automatic pruning on HTTP 410/404.
   - In-process background scheduler for evaluating approaching deadlines and event reminders.
   - REST endpoints (`public-key/`, `subscribe/`, `unsubscribe/`, `test/`) and unit tests in `backend/tests.py`.
3. **Step 3: PWA Manifest & Service Worker (T083 - T085)**:
   - `public/manifest.json` with standalone display for mobile installation.
   - `public/sw.js` with `push` handler and `notificationclick` deep linking with window reuse.
   - Registration in `index.html` and Vite configuration.
4. **Step 4: Frontend State & User-Gesture UI (T086 - T088)**:
   - Typed API calls in `src/services/api.ts`.
   - `usePushNotifications` hook with permission state and VAPID key conversion.
   - Explicit activation toggle and iOS PWA onboarding in `NotificationDropdown.tsx`.
5. **Step 5: Testing & Validation (T089 - T091)**:
   - Run backend test suite (`pytest backend/tests.py`).
   - Run production build (`npm run build`).
   - Execute Quickstart Scenario 15 across laptop and mobile browsers.


