# Feature Specification: Navigation Layout

**Feature Branch**: `001-navigation-layout`

**Created**: 2026-07-03

**Status**: Draft

**Input**: User description: "Navbar: Izquierda: Logotipo/Texto "Aura" con tipografía destacada y branding colorido. Derecha: Icono de notificaciones con badge de conteo y componente de perfil de usuario (Avatar). TabBar (Debajo de Navbar): Pestañas de navegación horizontal para conmutar dinámicamente entre las secciones: Calendario, Objetivos, Proyectos y Eventos."

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

### Key Entities
- **UserSession**: Represents the currently logged-in user, exposing their avatar image URL and auth state.
- **Notification**: Represents a single notification item, with properties for read/unread state and creation timestamp.
- **NavigationSection**: Represents a valid section tab (Calendar, Goals, Projects, Events).

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
