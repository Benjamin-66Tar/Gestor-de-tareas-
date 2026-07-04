# Implementation Plan: Navigation Layout

**Branch**: `001-navigation-layout` | **Date**: 2026-07-03 | **Spec**: [spec.md](file:///d:/Sistemas/Proyectos/Gestor_tareas/specs/001-navigation-layout/spec.md)

**Input**: Feature specification from `/specs/001-navigation-layout/spec.md`

## Summary

The Navigation Layout feature establishes the core shell of the "Aura" task manager application. It consists of a top Navbar containing branding, user profile settings, and notifications, and a TabBar below it to toggle between four key views: Calendar, Goals, Projects, and Events. The implementation follows a layered architecture dividing the backend (Django) and frontend (React + Vite + TypeScript).

## Technical Context

**Language/Version**: Python 3.12, TypeScript 5.0+, HTML5, CSS3

**Primary Dependencies**: Django (backend), React 18+, Vite (frontend), OpenAI SDK (structured outputs), Redis (cache), Tailwind CSS

**Storage**: SQLite (development/quick mocking)

**Testing**: pytest (backend)

**Target Platform**: Web browsers (Chrome, Safari, Firefox, Edge)

**Project Type**: Web application (Root-level frontend + aura_backend/ directory)

**Performance Goals**: UI tab transitions in under 100ms, API query caching

**Constraints**: Strict Layered Architecture, Tailwind CSS styling

**Scale/Scope**: Navigation shell, user sessions, mock notifications count, static mock views for Calendar, Goals, Projects, Events.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

1. **Colorido y Altamente Visual**: The active navigation tabs, notification badge counts, and brand elements MUST utilize vibrant, cohesive HSL-based palettes with high visual contrast. -> **PASS**
2. **Rendimiento Ultra Rápido**: Navigating tabs MUST perform locally in the UI in under 100ms using state management (React Context) and optimized rendering. Backend APIs MUST support caching. -> **PASS**
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
aura_backend/
├── models.py            # Django database models
├── serializers.py       # DRF serializers
├── services.py          # Business logic & OpenAI NPL integrations
├── views.py             # API controllers
└── ...
src/
├── domain/              # Domain and TypeScript interfaces (types.ts)
├── context/             # React Context state management (AuraState.tsx)
├── components/          # UI components
├── App.tsx              # Main layout, Navbar, and TabBar integration
└── ...
```

## Proposed Changes

### Backend (Django)

#### [NEW] [models.py](file:///d:/Sistemas/Proyectos/Gestor_tareas/aura_backend/models.py)
ElementoAura database definition for persisting goals, projects, events, and activities.

#### [NEW] [serializers.py](file:///d:/Sistemas/Proyectos/Gestor_tareas/aura_backend/serializers.py)
ModelSerializer for ElementoAura schema validation.

#### [NEW] [services.py](file:///d:/Sistemas/Proyectos/Gestor_tareas/aura_backend/services.py)
OpenAI integration with structured outputs format.

#### [NEW] [views.py](file:///d:/Sistemas/Proyectos/Gestor_tareas/aura_backend/views.py)
API endpoints with Redis caching.

### Frontend (React + Vite + TypeScript)

#### [NEW] [types.ts](file:///d:/Sistemas/Proyectos/Gestor_tareas/src/domain/types.ts)
TypeScript interfaces for business models.

#### [NEW] [AuraState.tsx](file:///d:/Sistemas/Proyectos/Gestor_tareas/src/context/AuraState.tsx)
Context provider and custom state hooks.

#### [NEW] [App.tsx](file:///d:/Sistemas/Proyectos/Gestor_tareas/src/App.tsx)
Interactive Navbar, TabBar, and dynamic layouts.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
