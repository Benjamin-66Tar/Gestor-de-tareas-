# Implementation Plan: Navigation Layout

**Branch**: `001-navigation-layout` | **Date**: 2026-07-03 | **Spec**: [spec.md](file:///d:/Sistemas/Proyectos/Gestor_tareas/specs/001-navigation-layout/spec.md)

**Input**: Feature specification from `/specs/001-navigation-layout/spec.md`

## Summary

The Navigation Layout feature establishes the core shell of the "Aura" task manager application. It consists of a top Navbar containing branding, user profile settings, and notifications, and a TabBar below it to toggle between four key views: Calendar, Goals, Projects, and Events. The implementation follows a layered architecture dividing the backend (Django) and frontend (React + Vite + TypeScript).

## Technical Context

**Language/Version**: Python 3.12, TypeScript 5.0+, HTML5, CSS3

**Primary Dependencies**: Django (backend), React 18+, Vite (frontend), OpenAI SDK (structured outputs), Redis (cache)

**Storage**: SQLite (development/quick mocking)

**Testing**: pytest (backend), Vitest (frontend)

**Target Platform**: Web browsers (Chrome, Safari, Firefox, Edge)

**Project Type**: Web application (Option 2: frontend + backend)

**Performance Goals**: UI tab transitions in under 100ms, API query caching

**Constraints**: Strict Layered Architecture, CSS pure styles (no Tailwind)

**Scale/Scope**: Navigation shell, user sessions, mock notifications count, static mock views for Calendar, Goals, Projects, Events.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

1. **Colorido y Altamente Visual**: The active navigation tabs, notification badge counts, and brand elements MUST utilize vibrant, cohesive HSL-based palettes with high visual contrast. -> **PASS**
2. **Rendimiento Ultra Rápido**: Navigating tabs MUST perform locally in the UI in under 100ms using state management (Zustand) and optimized rendering. Backend APIs MUST support future caching. -> **PASS**
3. **Modularidad Estricta**: Clear boundaries between React frontend layers (UI, State, Services, Domain) and Django backend layers (API, Serializers, Services, Persistencia). -> **PASS**

## Project Structure

### Documentation (this feature)

```text
specs/001-navigation-layout/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── config/          # Django settings/urls
│   ├── manage.py
│   ├── api/             # Views, routing, serializers
│   ├── services/        # Business logic (e.g., NPL, external integrations)
│   └── models/          # Django database models
└── tests/

frontend/
├── src/
│   ├── components/      # UI components (Navbar, TabBar)
│   ├── pages/           # Pages (Calendario, Objetivos, Proyectos, Eventos)
│   ├── services/        # API clients (fetch/axios calls)
│   ├── store/           # Zustand state management
│   └── types/           # Domain and TypeScript interfaces
└── tests/
```

**Structure Decision**: Option 2: Web application (frontend + backend directories) since we are implementing both Django and React.

## Proposed Changes

### Backend (Django)

#### [NEW] [models.py](file:///d:/Sistemas/Proyectos/Gestor_tareas/backend/src/models/user_profile.py)
Profile database definition to persist active session avatar and user details.

#### [NEW] [views.py](file:///d:/Sistemas/Proyectos/Gestor_tareas/backend/src/api/views.py)
API endpoints for user profile metadata and notification count.

### Frontend (React + Vite + TypeScript)

#### [NEW] [Navbar.tsx](file:///d:/Sistemas/Proyectos/Gestor_tareas/frontend/src/components/Navbar.tsx)
The persistent top bar with logo, notification icon/badge, and avatar profile.

#### [NEW] [TabBar.tsx](file:///d:/Sistemas/Proyectos/Gestor_tareas/frontend/src/components/TabBar.tsx)
The tabs element for horizontal navigation between views.

#### [NEW] [store.ts](file:///d:/Sistemas/Proyectos/Gestor_tareas/frontend/src/store/navigation.ts)
Zustand store for managing selected tabs and synchronization.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
