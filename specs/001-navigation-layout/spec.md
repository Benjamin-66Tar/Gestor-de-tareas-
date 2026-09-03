# Feature Specification: Navigation Layout

**Feature Branch**: `001-navigation-layout`

**Created**: 2026-07-03

**Status**: Draft

**Input**: User description: "Navbar: Izquierda: Logotipo/Texto "Aura" con tipografía destacada y branding colorido. Derecha: Icono de notificaciones con badge de conteo y componente de perfil de usuario (Avatar). TabBar (Debajo de Navbar): Pestañas de navegación horizontal para conmutar dinámicamente entre las secciones: Calendario, Objetivos, Proyectos y Eventos."

## Clarifications

### Session 2026-09-03
- Q: ¿Cuál debe ser el mecanismo y estructura central para gestionar y visualizar las metas en la sección de Objetivos? → A: Progreso cuantificable e hitos (Metas con porcentaje de avance 0-100%, fecha límite, categoría temática y lista de hitos/sub-metas clave para completarlas).
- Q: ¿Cómo debe actualizarse el porcentaje de progreso (0-100%) de cada meta? → A: Modo híbrido configurable por meta: ajuste manual libre (0-100%) o cálculo automático basado en hitos completados, donde los hitos tienen ponderación igual por defecto con opción de asignar valores/pesos personalizados a cada hito.
- Q: ¿Cómo debe organizarse y visualizarse la lista de objetivos dentro de la pantalla de la sección? → A: Vista dual conmutable (Tarjetas visuales con barra de progreso e hitos, o Lista compacta tipo tabla), con filtros rápidos por estado (Todas, Activas, Completadas, Pausadas) y por categorías temáticas.
- Q: ¿Qué tipo de interfaz o flujo de interacción debe utilizarse para crear y editar los objetivos y sus hitos en pantalla? → A: Panel lateral deslizable (Slide-over drawer) desde el borde derecho, permitiendo ver y editar detalles, notas, ponderaciones e hitos sin perder el contexto de la lista de metas.
- Q: ¿Cómo deben relacionarse las fechas límite de los objetivos e hitos con la vista de Calendario y las notificaciones? → A: Sincronización automática con Calendario (Los objetivos e hitos con fecha límite se proyectan automáticamente en la vista de Calendario con el color de su categoría y emiten notificaciones/alertas de proximidad).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Header Navigation Bar (Navbar) (Priority: P1)
As a user, I want a persistent header at the top of the application to see the application branding ("Aura") and access utility actions (notifications and profile).

**Why this priority**: It is the core branding and anchor element for the application shell.

**Independent Test**: Can load the application on any route and verify the Navbar is present with the correct branding logo on the left, and notification and profile buttons on the right.

**Acceptance Scenarios**:
1. **Given** the user has loaded any application page, **When** they look at the top header, **Then** they MUST see the "Aura" logo on the left and the notification icon and user avatar on the right.
2. **Given** the user has 3 unread notifications, **When** the page loads, **Then** the notification icon MUST display a numeric badge showing "3".
3. **Given** the user has 0 unread notifications, **When** the page loads, **Then** the notification icon MUST NOT show any badge.

---

### User Story 2 - Section Switching TabBar (Priority: P1)
As a user, I want to switch dynamically between Calendar, Goals, Projects, and Events via a tab bar so that I can manage my tasks and events.

**Why this priority**: It is the primary navigation mechanism for the core views of the application.

**Independent Test**: Can click each tab and verify the correct placeholder content renders in the main view area without a full page refresh.

**Acceptance Scenarios**:
1. **Given** the user is viewing the application, **When** they click on the "Objetivos" tab, **Then** the main viewport MUST switch to the Goals section immediately, and the "Objetivos" tab MUST display the active visual highlight.
2. **Given** the user is on the "Proyectos" tab, **When** they reload the page, **Then** the active tab MUST remain "Proyectos" and the viewport MUST load the Projects section.
3. **Given** the user navigates to the "Objetivos" tab, **When** the section renders, **Then** it MUST display the user's active goals showing title, visual progress bar (0-100%), target deadline, category tag, and milestone items.
4. **Given** the user is in the "Objetivos" section, **When** they toggle between Card and List view, **Then** the layout MUST switch immediately while preserving active status and category filters.
5. **Given** the user is in the "Objetivos" section, **When** they click to create or edit a goal, **Then** a slide-over drawer panel MUST open from the right edge allowing them to configure properties, progress mode, and milestone weights without leaving the view.
6. **Given** a goal or milestone has an assigned deadline, **When** the user switches to the "Calendario" tab, **Then** the deadline MUST appear marked on the corresponding date styled with the goal's category color.

---

### User Story 3 - Quick Action Dropdowns (Priority: P2)
As a user, I want to interact with the notification icon and profile avatar to view recent alerts and settings.

**Why this priority**: Enhances utility by providing contextual actions without leaving the current view.

**Independent Test**: Can click on the notification badge and avatar to trigger respective dropdown panels and verify content.

**Acceptance Scenarios**:
1. **Given** the user is on any screen, **When** they click the notification icon, **Then** a dropdown panel MUST open displaying a list of recent notification items.
2. **Given** the user has the notification dropdown open, **When** they click outside the panel, **Then** the dropdown MUST close.
3. **Given** the user is on any screen, **When** they click the avatar, **Then** a profile options menu MUST open containing links for Profile, Settings, and Log Out.

---

## Edge Cases

- **Mobile Viewports**: On narrow screens, the TabBar horizontal text might overflow. The system MUST render it cleanly (e.g. using horizontal swipe or compact icons with text).
- **Extremely High Notification Counts**: If the user has more than 99 notifications, the badge MUST display "99+" instead of wrapping or breaking the layout.
- **Lost Connectivity**: If the application fails to fetch the latest notifications count, the badge SHOULD fail silently without displaying corrupt text or breaking the header layout.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: The system MUST render the main header (Navbar) at the top of all views.
- **FR-002**: The Navbar MUST display the branding logo "Aura" on the left with a colorful, high-visual-contrast design.
- **FR-003**: The Navbar MUST display a notification icon on the right, which shows a numeric badge of unread notifications.
- **FR-004**: The Navbar MUST display a user avatar on the right representing the logged-in user.
- **FR-005**: The TabBar MUST be displayed directly below the Navbar, containing exactly four tabs: "Calendario", "Objetivos", "Proyectos", and "Eventos".
- **FR-006**: Clicking any tab MUST dynamically switch the content in the main viewport to the corresponding section without full page reloads.
- **FR-007**: The active tab MUST be visually highlighted using a distinct color state to indicate the current section to the user.
- **FR-008**: The system MUST persist the active tab state locally to maintain the user's location upon page refresh.
- **FR-009**: Clicking the notification icon MUST toggle a notification dropdown panel.
- **FR-010**: Clicking the user avatar MUST toggle a user settings dropdown menu.
- **FR-011**: The "Objetivos" section MUST allow users to view and manage goals defined with measurable progress (0-100%), target deadline, category tag, and milestone items.
- **FR-012**: The "Objetivos" section MUST support two progress tracking modes configurable per goal: manual percentage adjustment (0-100%) or automatic milestone-based calculation.
- **FR-013**: In automatic milestone mode, the progress MUST calculate equally across milestones by default, while supporting optional custom weighting/values per milestone.
- **FR-014**: The "Objetivos" section MUST display visual progress bars for each goal, reflecting completion percentage and status.
- **FR-015**: The "Objetivos" section MUST provide a view switcher allowing users to toggle between a visual card grid and a compact list/table view.
- **FR-016**: The "Objetivos" section MUST support filtering goals by status (All, Active, Completed, Paused) and by category tags across both view modes.
- **FR-017**: The "Objetivos" section MUST provide a slide-over drawer from the right edge for creating and editing goals without navigating away from the dashboard.
- **FR-018**: The slide-over drawer MUST allow managing milestones (add, edit title, mark complete, remove) and assigning custom weights/values when in milestone progress mode.
- **FR-019**: Goals and dated milestones MUST automatically project onto the "Calendario" section as deadline markers, styled using the goal's category theme color.
- **FR-020**: The system MUST issue notification alerts when a goal or milestone deadline is approaching or overdue.

### Key Entities
- **UserSession**: Represents the currently logged-in user, exposing their avatar image URL and auth state.
- **Notification**: Represents a single notification item, with properties for read/unread state and creation timestamp.
- **NavigationSection**: Represents a valid section tab (Calendar, Goals, Projects, Events).
- **Goal**: Represents an objective with title, target deadline, category tag, progress mode (`Manual` or `MilestoneBased`), progress percentage (0-100%), and status (Active, Completed, Paused).
- **GoalMilestone**: Represents a key checkable milestone or sub-target associated with a Goal, including title, completion state, and an optional weight value.

## Success Criteria *(mandatory)*

### Measurable Outcomes
- **SC-001**: Users can switch between sections via the TabBar with no visible delay, updating the view in under 100 milliseconds.
- **SC-002**: The layout is responsive, displaying correctly on mobile, tablet, and desktop viewports without horizontal scrolling or overlapping text.
- **SC-003**: The color coding for the active tab and notification badge is accessible, maintaining a minimum color contrast ratio of 4.5:1.
- **SC-004**: 100% of users can successfully find and access the primary views (Calendario, Objetivos, Proyectos, Eventos) within their first 5 seconds of interaction.

## Assumptions

- We assume that "Aura" is the project name or main product brand.
- The design of the active tab and notification badge will utilize the project's color palette (defined in the constitution as "Colorido y Altamente Visual").
- User profile data and notification count will be loaded upon application startup.
