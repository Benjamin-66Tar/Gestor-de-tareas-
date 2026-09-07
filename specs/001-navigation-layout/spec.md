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

### Session 2026-09-07
- Q: ¿Cómo debe estructurarse la visualización y navegación principal de la sección de Proyectos? → A: Hub de proyectos con tarjetas visuales (color, estado, porcentaje de progreso) que al hacer clic abren un espacio de trabajo dedicado con tablero Kanban y vista conmutable de lista de tareas.
- Q: ¿Cómo debe estructurarse el flujo de trabajo (estados/columnas) y los atributos clave de las tareas en el tablero Kanban de cada proyecto? → A: Flujo fijo de 3 estados ("Por hacer", "En progreso", "Completado"), con tareas que incluyen título, prioridad visual colorida (Baja, Media, Alta), fecha límite y checklist de subtareas, calculando automáticamente el porcentaje de avance del proyecto según las tareas completadas.
- Q: ¿Cómo deben integrarse los Proyectos y sus tareas con las demás secciones (Objetivos y Calendario)? → A: Integración flexible completa: los proyectos pueden asociarse opcionalmente a un Objetivo existente, y todas las tareas con fecha límite se proyectan automáticamente en la vista de Calendario estilizadas con el color identificativo del proyecto.
- Q: ¿Qué patrón de interfaz debe utilizarse para crear y editar los Proyectos y las Tareas dentro de la sección? → A: Creación rápida directa (botón de alta ágil en el hub y al pie de cada columna Kanban) complementada con un panel lateral deslizable (Slide-over drawer) desde el borde derecho para ver y editar los detalles completos (fechas, prioridad, checklist de subtareas, vínculos).
- Q: ¿Cómo debe gestionarse la búsqueda, el filtrado y el ciclo de vida (estados) de los Proyectos en el Hub principal? → A: Píldoras de filtro rápido por ciclo de vida ("Activos", "Completados", "Archivados", con "Activos" por defecto) y barra de búsqueda instantánea para filtrar proyectos en tiempo real por título o etiqueta.

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

### User Story 4 - Projects Management Hub & Workspace (Priority: P1)
As a user, I want to view a hub of my projects and open a dedicated project workspace with a Kanban board and list view, so that I can organize and track all tasks for each project.

**Why this priority**: Core functionality for the "Proyectos" navigation section.

**Independent Test**: Can navigate to the Projects tab, view a grid of project cards with progress and status, click a project card to enter its workspace, and toggle between Kanban and list views.

**Acceptance Scenarios**:
1. **Given** the user navigates to the "Proyectos" tab, **When** the section renders, **Then** it MUST display a hub grid of project cards showing project title, color identifier, status, and overall progress percentage.
2. **Given** the user is viewing the projects hub, **When** they click on a project card, **Then** the view MUST transition to the project workspace displaying its Kanban board and task management tools.
3. **Given** the user is inside a project workspace, **When** they toggle between Kanban board and task list view, **Then** the view MUST update immediately while retaining the current project context.
4. **Given** the user is inside a project workspace, **When** they click to go back or breadcrumb navigate, **Then** they MUST return to the main projects hub.
5. **Given** the user is viewing a project's Kanban board, **When** they inspect the board columns, **Then** they MUST see exactly three workflow columns: "Por hacer", "En progreso", and "Completado".
6. **Given** a user changes a task status by moving it to "Completado", **When** the change is saved, **Then** the project's overall progress percentage MUST recalculate automatically and update both in the workspace header and on the projects hub card.
7. **Given** a project task, **When** viewed or edited, **Then** it MUST display its title, color-coded priority badge (Baja, Media, Alta), deadline date, and an interactive checklist of subtasks.
8. **Given** a project is linked to an existing Goal, **When** tasks are completed in the project, **Then** the associated Goal displays the linked project and its progress status.
9. **Given** a project task has an assigned deadline date, **When** the user switches to the "Calendario" tab, **Then** the task deadline MUST appear on the calendar date, color-coded with the project's theme color.
10. **Given** the user is on the projects hub or inside a Kanban column, **When** they trigger quick-add, **Then** they can create a project or task immediately with basic info without a full-page modal interrupting their view.
11. **Given** the user clicks to edit full details of a project or task, **When** the action triggers, **Then** a slide-over drawer panel MUST open from the right edge, allowing editing of color, priority, deadline, checklist of subtasks, and goal linkage without leaving the dashboard.
12. **Given** the user is viewing the projects hub, **When** they switch between "Activos", "Completados", and "Archivados" filter pills, or type into the instant search bar, **Then** the projects grid MUST immediately update to show only matching projects without reloading.

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
- **FR-021**: The "Proyectos" section MUST display a projects hub showing cards for each project with title, color identifier, status, and overall task completion progress.
- **FR-022**: Selecting a project card MUST open a dedicated project workspace featuring an interactive Kanban board and a toggleable task list view.
- **FR-023**: The project workspace MUST support returning to the projects hub via breadcrumb or back navigation.
- **FR-024**: The project workspace Kanban board MUST provide three fixed workflow columns: "Por hacer", "En progreso", and "Completado".
- **FR-025**: Tasks within a project MUST support title, description, color-coded priority level (Baja, Media, Alta), optional deadline date, and an embedded checklist of subtasks.
- **FR-026**: The system MUST automatically calculate each project's overall progress percentage as `(completed tasks / total tasks) * 100`, updating the progress bar in real time upon task status changes.
- **FR-027**: When all tasks in a project are in the "Completado" column, the project's progress MUST display 100%. If a project has zero tasks, its progress MUST default to 0%.
- **FR-028**: Projects MAY be optionally linked to an existing `Goal`, allowing users to connect project execution directly to overarching goals.
- **FR-029**: Project tasks with assigned deadline dates MUST automatically project onto the "Calendario" section, styled using the parent project's theme color.
- **FR-030**: The system MUST issue notification alerts when a project task deadline is approaching or overdue.
- **FR-031**: The projects hub and project workspace MUST support quick creation triggers for adding new projects and tasks with minimal input friction.
- **FR-032**: Detailed inspection and editing of projects and project tasks MUST utilize a slide-over drawer panel emerging from the right viewport edge, preserving view context.
- **FR-033**: The projects hub MUST provide quick-filter status pills for "Activos" (default), "Completados", and "Archivados" to control which project lifecycle state is currently displayed.
- **FR-034**: The projects hub MUST include an instant, real-time search input that filters project cards by title or category tags as the user types.

### Key Entities
- **UserSession**: Represents the currently logged-in user, exposing their avatar image URL and auth state.
- **Notification**: Represents a single notification item, with properties for read/unread state and creation timestamp.
- **NavigationSection**: Represents a valid section tab (Calendar, Goals, Projects, Events).
- **Goal**: Represents an objective with title, target deadline, category tag, progress mode (`Manual` or `MilestoneBased`), progress percentage (0-100%), and status (Active, Completed, Paused).
- **GoalMilestone**: Represents a key checkable milestone or sub-target associated with a Goal, including title, completion state, and an optional weight value.
- **Project**: Represents a project with title, description, color theme/tag, lifecycle status (`Active`, `Completed`, `Archived`), calculated overall task progress (0-100%), and an optional foreign link to a `Goal`.
- **ProjectTask**: Represents a task within a project, belonging to one of three workflow columns (`ToDo`, `InProgress`, `Done`), with title, description, priority (`Low`, `Medium`, `High`), due date, and an ordered list of subtasks.
- **TaskSubtask**: Represents a checkable subtask item within a `ProjectTask`, with title and completion state.

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
