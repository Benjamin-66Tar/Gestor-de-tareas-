# Tasks: Navigation Layout

**Input**: Design documents from `/specs/001-navigation-layout/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, directory structure, and environment configuration.

- [ ] T001 Create backend/ and frontend/ directory structure per implementation plan
- [ ] T002 Initialize Django project in backend/ and React + Vite project in frontend/
- [ ] T003 Confirm Tailwind CSS version (v3 vs v4) with the user and install Tailwind CSS dependencies in frontend/package.json
- [ ] T004 [P] Configure linting, formatting, and TypeScript configs in frontend/tsconfig.json and backend/pyproject.toml

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core UI styling and database models setup.

- [ ] T005 Configure Tailwind CSS settings in frontend/tailwind.config.js (or CSS variables) incorporating the Aura vibrant color palette
- [ ] T006 [P] Setup global style declarations in frontend/src/index.css using custom scrollbars and layout resets
- [ ] T007 Create UserProfile and Notification models in backend/src/models/user_profile.py and run Django migrations
- [ ] T008 Setup URL routing and basic view controllers for profile/notifications endpoints in backend/src/api/views.py and backend/src/config/urls.py

---

## Phase 3: User Story 1 - Header Navigation Bar (Navbar) (Priority: P1)

**Goal**: Persist a header showing the "Aura" branding, notification icon, and user avatar.

**Independent Test**: Load the application and verify the Navbar components align correctly, display the mock username/avatar, and the notifications icon renders a count badge.

- [ ] T009 [P] [US1] Create UserProfile TypeScript interfaces in frontend/src/types/user.ts
- [ ] T010 [P] [US1] Implement navigation state store in frontend/src/store/navigation.ts using Zustand
- [ ] T011 [US1] Build Navbar component in frontend/src/components/Navbar.tsx displaying the Aura branding, notification badge, and avatar

---

## Phase 4: User Story 2 - Section Switching TabBar (Priority: P1)

**Goal**: Switch dynamically between Calendar, Goals, Projects, and Events via a TabBar.

**Independent Test**: Click each tab and verify the viewport renders the corresponding section layout immediately and updates active visual highlights.

- [ ] T012 [P] [US2] Implement static view placeholders for Goals in frontend/src/pages/Goals.tsx, Projects in frontend/src/pages/Projects.tsx, and Events in frontend/src/pages/Events.tsx
- [ ] T013 [US2] Build the Timeline/Calendar layout component in frontend/src/pages/Calendar.tsx for scheduling events
- [ ] T014 [US2] Build the TabBar component in frontend/src/components/TabBar.tsx using Zustand store state for selection
- [ ] T015 [US2] Integrate Navbar, TabBar, and main content routing in the base application shell in frontend/src/App.tsx

---

## Phase 5: User Story 3 - Quick Action Dropdowns (Priority: P2)

**Goal**: Interactive dropdown menus for notifications and user profile options.

**Independent Test**: Toggle each dropdown by clicking its Navbar icon, verify items render, and check that clicking outside closes the dropdowns.

- [ ] T016 [P] [US3] Create Notification TypeScript interfaces in frontend/src/types/notification.ts
- [ ] T017 [US3] Implement API client calls in frontend/src/services/api.ts to fetch notifications from `/api/v1/notifications/`
- [ ] T018 [US3] Build Notifications Dropdown component in frontend/src/components/NotificationsDropdown.tsx
- [ ] T019 [US3] Build Profile Menu Dropdown component in frontend/src/components/ProfileDropdown.tsx
- [ ] T020 [US3] Integrate both dropdown components in the Navbar frontend/src/components/Navbar.tsx with click-outside hooks to close

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Styling refinements, performance checks, and final validation.

- [ ] T021 Validate layout responsiveness on mobile, tablet, and desktop viewports
- [ ] T022 Verify that active tab transition speeds are under 100ms
- [ ] T023 Run end-to-end flow checks according to quickstart.md validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
  - US1 (Navbar) and US2 (TabBar) can be implemented in parallel.
  - US3 (Dropdowns) depends on US1 (Navbar) being complete.
- **Polish (Final Phase)**: Depends on all user stories being complete.

### Parallel Opportunities

- Setup tasks T003 and T004 can run in parallel.
- Foundational styling (T005, T006) can run in parallel with database setup (T007, T008).
- UI component skeletons (T011, T012, T013) can run in parallel once store (T010) is complete.

---

## Implementation Strategy

### MVP First (User Story 1 & 2 Only)

1. Complete Setup and Foundational phases.
2. Complete US1 (Navbar skeleton) and US2 (TabBar routing skeleton).
3. **STOP and VALIDATE**: Verify page shell displays correctly and tabs switch content.
4. Add dropdown interactivity (US3) and final styling polish.
