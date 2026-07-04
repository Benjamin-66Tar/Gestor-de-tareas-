# Tasks: Navigation Layout

**Input**: Design documents from `/specs/001-navigation-layout/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and configuration.

- [x] T001 Initialize React + Vite + TypeScript project in workspace root
- [x] T002 Initialize Django project in aura_backend/
- [x] T003 Install and configure Tailwind CSS in the root project (tailwind.config.js)
- [x] T004 Setup global style declarations in src/index.css

---

## Phase 2: Foundational (Backend Development)

**Purpose**: Database persistence, serialization, NLP service, and API controllers.

- [x] T005 Create ElementoAura model in aura_backend/models.py
- [x] T006 [P] Create ElementoAuraSerializer in aura_backend/serializers.py
- [x] T007 [P] Create NLP service processing text with OpenAI in aura_backend/services.py
- [x] T008 Create ElementoAuraListAPI view in aura_backend/views.py

---

## Phase 3: User Story 1 & 2 - UI & State Navigation Layout (Priority: P1)

**Goal**: Implement layout, Navbar, TabBar, state context, and dynamic page views.

- [x] T009 [P] [US1] Create ElementoTipo and PlanElemento domain types in src/domain/types.ts
- [x] T010 [US1] Create AuraState provider and hooks in src/context/AuraState.tsx
- [x] T011 [US1] Build Navbar, TabBar, ContenidoPrincipal, and App components in src/App.tsx

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Database migrations, testing, and validations.

- [x] T012 Run Django database migrations and configure settings
- [x] T013 Verify application transitions and layout locally
