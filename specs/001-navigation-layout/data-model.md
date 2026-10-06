# Data Model: Navigation Layout & Objetivos

This document formalizes the backend database schema (Django ORM) and the frontend domain models (TypeScript) following the Layered Architecture.

---

## Backend Persistence Layer (Django Models)

### 1. `UserProfile`
Represents the user's profile, session metadata, and preferences.

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUIDField | Primary Key, default=uuid4 | Unique user profile identifier. |
| `user` | OneToOneField (User) | On Delete: Cascade | Django auth user relationship. |
| `avatar_url` | URLField | Max Length: 500, Nullable, Blank | Avatar image resource URL. |
| `theme_preference` | CharField | Choices: `['light', 'dark']`, Default: `'dark'` | UI theme preference. |

---

### 2. `Notification`
Represents alerts, task reminders, and approaching goal deadline notifications.

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUIDField | Primary Key, default=uuid4 | Unique notification identifier. |
| `user` | ForeignKey (User) | On Delete: Cascade | Notification recipient. |
| `title` | CharField | Max Length: 120 | Short summary/subject. |
| `message` | TextField | Max Length: 500 | Detailed notification body. |
| `is_read` | BooleanField | Default: False, DB Index | Read/unread indicator. |
| `created_at` | DateTimeField | Auto Now Add, DB Index | Creation timestamp. |

---

### 3. `Goal` (Objetivo)
Represents a user goal managed in the "Objetivos" section.

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUIDField | Primary Key, default=uuid4 | Unique goal identifier. |
| `user` | ForeignKey (User) | On Delete: Cascade | Owner of the goal. |
| `title` | CharField | Max Length: 200 | Title of the objective. |
| `description` | TextField | Blank, Nullable | Detailed description or context. |
| `category` | CharField | Max Length: 50, Default: `'General'` | Thematic category (e.g., 'Trabajo', 'Salud'). |
| `color_hex` | CharField | Max Length: 7, Default: `'#10B981'` | Hex color code for category badge and calendar marker. |
| `start_date` | DateTimeField | Nullable, Blank | Range start date for spanning multiple days. |
| `deadline` | DateTimeField | Nullable, Blank, DB Index | Target completion date/time. |
| `reminder_minutes` | PositiveIntegerField | Nullable, Blank, Default: 0 | Alert lead time in minutes (0=exact, 15, 60, 1440). |
| `time_horizon` | CharField | Choices: `['SHORT_TERM', 'LONG_TERM']`, Default: `'SHORT_TERM'` | Time horizon classification (Corto Plazo vs Largo Plazo). |
| `parent_goal` | ForeignKey (Goal) | Nullable, Blank, On Delete: SET_NULL, Related Name: `'sub_goals'` | Optional parent Long-Term goal. |
| `progress_mode` | CharField | Choices: `['MANUAL', 'MILESTONES', 'CONNECTED']`, Default: `'MILESTONES'` | Calculation mode for progress. |
| `progress_percentage` | PositiveSmallIntegerField | Default: 0, Min: 0, Max: 100 | Current calculated or manual progress (0-100%). |
| `status` | CharField | Choices: `['ACTIVE', 'COMPLETED', 'PAUSED']`, Default: `'ACTIVE'` | Current status of the goal. |
| `created_at` | DateTimeField | Auto Now Add | Timestamp of creation. |
| `updated_at` | DateTimeField | Auto Now | Timestamp of last update. |

---

### 4. `GoalMilestone` (Hito de Objetivo)
Represents an actionable milestone or sub-target associated with a Goal.

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUIDField | Primary Key, default=uuid4 | Unique milestone identifier. |
| `goal` | ForeignKey (Goal) | Related Name: `'milestones'`, On Delete: Cascade | Parent Goal reference. |
| `title` | CharField | Max Length: 200 | Milestone action title. |
| `is_completed` | BooleanField | Default: False | Whether the milestone is completed. |
| `weight` | PositiveSmallIntegerField | Nullable, Blank, Default: 1 | Custom weight value for weighted progress calculation. |
| `target_date` | DateField | Nullable, Blank | Optional deadline for this specific milestone. |
| `order` | PositiveIntegerField | Default: 0 | Display sequence order. |

---

### 5. `Project` (Proyecto)
Represents a project container with tasks and progress tracking.

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUIDField | Primary Key, default=uuid4 | Unique project identifier. |
| `user` | ForeignKey (User) | On Delete: Cascade | Owner of the project. |
| `goal` | ForeignKey (Goal) | Nullable, Blank, On Delete: SET_NULL, Related Name: `'projects'` | Optional linked strategic goal. |
| `title` | CharField | Max Length: 200 | Title of the project. |
| `description` | TextField | Blank, Nullable | Detailed scope or notes. |
| `color_hex` | CharField | Max Length: 7, Default: `'#6366F1'` | Vibrant hex color for cards, tags, and calendar markers. |
| `status` | CharField | Choices: `['ACTIVE', 'COMPLETED', 'ARCHIVED']`, Default: `'ACTIVE'` | Project lifecycle state. |
| `progress_percentage` | PositiveSmallIntegerField | Default: 0, Min: 0, Max: 100 | Real-time calculated progress percentage. |
| `created_at` | DateTimeField | Auto Now Add | Creation timestamp. |
| `updated_at` | DateTimeField | Auto Now | Last update timestamp. |

---

### 6. `ProjectTask` (Tarea de Proyecto)
Represents an actionable task belonging to a project's Kanban board.

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUIDField | Primary Key, default=uuid4 | Unique task identifier. |
| `project` | ForeignKey (Project) | Related Name: `'tasks'`, On Delete: Cascade | Parent project reference. |
| `title` | CharField | Max Length: 250 | Task title. |
| `description` | TextField | Blank, Nullable | Detailed description or context. |
| `status` | CharField | Choices: `['TODO', 'IN_PROGRESS', 'DONE']`, Default: `'TODO'` | Workflow Kanban column. |
| `priority` | CharField | Choices: `['LOW', 'MEDIUM', 'HIGH']`, Default: `'MEDIUM'` | Color-coded priority level. |
| `deadline` | DateTimeField | Nullable, Blank, DB Index | Target completion date and time (`datetime-local`). |
| `reminder_minutes` | PositiveIntegerField | Nullable, Blank, Default: 0 | Alert lead time in minutes (0=exact, 15, 60, 1440). |
| `order` | PositiveIntegerField | Default: 0 | Sorting position within the Kanban column. |
| `created_at` | DateTimeField | Auto Now Add | Creation timestamp. |
| `updated_at` | DateTimeField | Auto Now | Last update timestamp. |

---

### 7. `TaskSubtask` (Subtarea / Checklist Item)
Represents a lightweight checklist item within a task.

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUIDField | Primary Key, default=uuid4 | Unique subtask identifier. |
| `task` | ForeignKey (ProjectTask) | Related Name: `'subtasks'`, On Delete: Cascade | Parent task reference. |
| `title` | CharField | Max Length: 200 | Actionable item text. |
| `is_completed` | BooleanField | Default: False | Completion status. |
| `order` | PositiveIntegerField | Default: 0 | Sequence order within checklist. |

---

### 8. `EventItem` (Evento)
Represents a scheduled agenda event (meeting, appointment, deadline, special date).

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUIDField | Primary Key, default=uuid4 | Unique event identifier. |
| `user` | ForeignKey (User) | On Delete: Cascade | Event owner/attendee. |
| `title` | CharField | Max Length: 200 | Event summary/title. |
| `description` | TextField | Blank, Nullable | Detailed notes, agenda, or context. |
| `start_time` | DateTimeField | DB Index | Event start datetime. |
| `end_time` | DateTimeField | DB Index | Event end datetime. |
| `location` | CharField | Max Length: 250, Blank, Nullable | Physical location (office, address, room). |
| `meeting_url` | URLField | Max Length: 500, Blank, Nullable | Virtual meeting link (Zoom, Meet, Teams). |
| `category` | CharField | Max Length: 50, Default: `'General'` | Thematic category (e.g. 'Trabajo', 'Personal'). |
| `color_hex` | CharField | Max Length: 7, Default: `'#3B82F6'` | Vibrant color hex for card badges and calendar. |
| `status` | CharField | Choices: `['PROGRAMMED', 'COMPLETED', 'CANCELED']`, Default: `'PROGRAMMED'` | Current event lifecycle state. |
| `reminder_minutes` | PositiveIntegerField | Default: 15, Nullable, Blank | Minutes prior to start for notification alert. |
| `created_at` | DateTimeField | Auto Now Add | Timestamp of creation. |
### 8. `PushSubscription`
Represents an active client device (laptop or mobile) registered for native Web Push alerts.

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUIDField | Primary Key, default=uuid4 | Unique subscription identifier. |
| `user` | ForeignKey (User) | On Delete: Cascade, related_name='push_subscriptions' | User owner of the subscribed device. |
| `endpoint` | TextField | DB Index | Push service endpoint URL (Google FCM, Apple WebPush, Mozilla Autopush). |
| `p256dh` | CharField | Max Length: 255 | Client public ECDH key for payload encryption. |
| `auth` | CharField | Max Length: 255 | Client authentication secret. |
| `user_agent` | CharField | Max Length: 255, Blank, Nullable | Browser and OS metadata (e.g., 'Chrome Desktop', 'Safari iOS PWA'). |
| `created_at` | DateTimeField | Auto Now Add | Registration timestamp. |
| `updated_at` | DateTimeField | Auto Now | Last updated timestamp. |

---

### 9. `LearningItem` (Ítem de Aprendizaje)
Represents a learning resource (course, book, article, tech documentation) managed in the "Aprendizaje" section.

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUIDField | Primary Key, default=uuid4 | Unique learning item identifier. |
| `user` | ForeignKey (User) | On Delete: Cascade, related_name='aura_learning_items' | Owner of the learning resource. |
| `title` | CharField | Max Length: 200 | Title of the course, book, article, or documentation. |
| `description` | TextField | Blank, Nullable | Overview, syllabus description, or notes. |
| `resource_type` | CharField | Choices: `['COURSE', 'BOOK', 'ARTICLE', 'TECH_DOC']`, Default: `'COURSE'` | Format/type of the learning material. |
| `platform_name` | CharField | Max Length: 100, Blank, Nullable | Platform name (e.g. 'Udemy', 'YouTube', 'Libro Físico', 'Doc Oficial'). |
| `platform_url` | URLField | Max Length: 500, Blank, Nullable | Direct web link to open the course or reading material. |
| `color_hex` | CharField | Max Length: 7, Default: `'#8B5CF6'` | Vibrant theme color (Electric Violet by default). |
| `status` | CharField | Choices: `['BACKLOG', 'IN_PROGRESS', 'PAUSED', 'COMPLETED']`, Default: `'BACKLOG'` | Learning lifecycle stage. |
| `progress_mode` | CharField | Choices: `['MANUAL', 'TOPICS']`, Default: `'TOPICS'` | Calculation mode (modular checklist vs manual % / units). |
| `progress_percentage` | PositiveSmallIntegerField | Default: 0, Min: 0, Max: 100 | Current calculated or manual progress (0-100%). |
| `current_unit` | PositiveIntegerField | Default: 0 | Current page or completed lesson count. |
| `total_units` | PositiveIntegerField | Default: 0 | Total page count or total lesson count. |
| `last_point_reached` | CharField | Max Length: 250, Blank, Nullable | Bookmark notes (e.g., "Módulo 4: Hooks personalizados" o "Página 142"). |
| `takeaways_markdown` | TextField | Blank, Nullable | Key takeaways, summary points, and notes in Markdown. |
| `goal` | ForeignKey (Goal) | Nullable, Blank, On Delete: SET_NULL, related_name='learning_items' | Optional linked strategic goal. |
| `project` | ForeignKey (Project) | Nullable, Blank, On Delete: SET_NULL, related_name='learning_items' | Optional linked project. |
| `last_activity_at` | DateTimeField | Auto Now Add, DB Index | Timestamp of last user study session or progress update. |
| `dormancy_alert_days` | PositiveSmallIntegerField | Default: 7 | Inactivity days threshold before triggering dormancy notifications. |
| `is_deleted` | BooleanField | Default: False, DB Index | Soft delete indicator. |
| `deleted_at` | DateTimeField | Blank, Nullable | Soft deletion timestamp. |
| `created_at` | DateTimeField | Auto Now Add | Creation timestamp. |
| `updated_at` | DateTimeField | Auto Now | Last update timestamp. |

---

### 10. `LearningTopic` (Tema / Módulo de Aprendizaje)
Represents a checkable topic, chapter, or module within a `LearningItem`.

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUIDField | Primary Key, default=uuid4 | Unique topic identifier. |
| `learning_item` | ForeignKey (LearningItem) | Related Name: `'topics'`, On Delete: Cascade | Parent learning item reference. |
| `title` | CharField | Max Length: 200 | Title of the chapter, lesson, or documentation section. |
| `is_completed` | BooleanField | Default: False | Completion status of the module/topic. |
| `order` | PositiveIntegerField | Default: 0 | Display sequence order. |
| `section_name` | CharField | Max Length: 150, Blank, Nullable | Optional grouping (e.g. "Capítulo 1", "Módulo Avanzado"). |

---

### 10. `ActivityCheckIn` (Registro Diario de Constancia)
Represents a daily attendance check-in for a learning course or calendar study event to build habit streaks without closing parent activities.

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUIDField | Primary Key, default=uuid4 | Unique check-in identifier. |
| `user` | ForeignKey (User) | On Delete: Cascade, Related Name: `'activity_checkins'` | User who logged attendance. |
| `date` | DateField | Default: timezone.localdate, DB Index | Target date of attendance. |
| `learning_item` | ForeignKey (LearningItem) | Nullable, Blank, On Delete: CASCADE, Related Name: `'check_ins'` | Associated learning course/book. |
| `event_item` | ForeignKey (EventItem) | Nullable, Blank, On Delete: CASCADE, Related Name: `'check_ins'` | Associated calendar event. |
| `is_completed` | BooleanField | Default: True | Active state of the daily check-in. |
| `streak_count` | PositiveIntegerField | Default: 1 | Current consecutive streak calculated at check-in time. |
| `created_at` | DateTimeField | Auto Now Add | Timestamp when check-in was recorded. |
| `updated_at` | DateTimeField | Auto Now | Timestamp of last modification. |

---

## Validation & Business Rules

1. **Progress Range**: `progress_percentage` must always be between 0 and 100 inclusive.
2. **Milestone Weight**: When specified, `weight` must be $>0$. If no weights are specified, milestones default to equal weight (1).
3. **Project Progress Calculation**:
   - $\text{Progress} = (\text{count of tasks with status DONE} / \text{total tasks}) \times 100$.
   - If a project has 0 tasks, its progress is `0%`.
   - When all tasks are `DONE`, progress is `100%`.
4. **Status Transitions**:
   - Marking a goal status as `COMPLETED` automatically sets `progress_percentage = 100`.
   - In `MILESTONES` mode, when all milestones are completed, `status` automatically transitions to `COMPLETED` unless manually overridden.
5. **Calendar Sync**: Any `Goal` with a non-null `deadline`, `GoalMilestone` with a non-null `target_date`, `ProjectTask` with a non-null `deadline`, or `EventItem` with non-null `start_time`/`end_time` is automatically projected into the Calendar layer styled with the respective entity's color.
6. **Event Date Ordering**: An event's `end_time` must be equal to or greater than its `start_time`.
7. **Event Lifecycle Transitions**: Events start in `PROGRAMMED` and can transition to `COMPLETED` or `CANCELED`. A canceled or completed event can be reactivated back to `PROGRAMMED`.
8. **Chronological Time Block Classification**:
   - **Hoy**: $T_{\text{start}} \le \text{today } 23:59:59 \land T_{\text{end}} \ge \text{today } 00:00:00$ and $T_{\text{end}} \ge \text{now}$.
   - **Esta semana**: $T_{\text{start}} > \text{today } 23:59:59$ and $T_{\text{start}} \le \text{end of current week}$.
   - **Próximos**: $T_{\text{start}} > \text{end of current week}$.
   - **Pasados**: $T_{\text{end}} < \text{now}$.
9. **Multi-device Push Constraints**:
   - Unique together constraint on `('user', 'endpoint')` prevents duplicate registrations per browser/device.
   - A single user can hold multiple concurrent subscriptions (e.g. Chrome on Windows Laptop and Safari on iOS PWA).
10. **Push Endpoint Pruning**: When attempting delivery via `pywebpush`, if the remote push service responds with HTTP status 410 (Gone) or 404 (Not Found), the corresponding `PushSubscription` row MUST be automatically deleted from the database.
11. **Registration Credential Validation**:
    - `username`: Minimum 3 characters, alphanumeric plus underscores, must be unique across all users.
    - `email`: Valid RFC 5322 email syntax, must be unique.
    - `password`: Minimum 6 characters; `password_confirm` must match `password` identically.
12. **Login Credential Evaluation**:
    - Allows identifier as either valid `username` or registered `email`.
    - Returns standardized session token and user profile object.
13. **Session Persistence**:
    - Client persists auth token and user profile in browser storage.
    - Returning to the app with active session automatically displays the welcome hero interface with direct one-click entry ("Entrar a Aura") without re-prompting for passwords.
    - Logout explicitly purges the local session and restores unauthenticated login/signup tabs.
14. **Learning Progress Calculation**:
    - `TOPICS` mode: $\text{Progress} = (\text{completed topics} / \text{total topics}) \times 100$. If 0 topics, defaults to `0%`. All completed $\rightarrow 100\%$.
    - `MANUAL` mode: If `total_units > 0`, $\text{Progress} = (\text{current_unit} / \text{total_units}) \times 100$. Otherwise user enters raw percentage.
15. **Learning Status Transitions**:
    - Setting status to `COMPLETED` automatically sets `progress_percentage = 100`.
    - If in `TOPICS` mode and all topics are completed, status transitions to `COMPLETED`.
16. **Dormancy Evaluation**:
    - An item is dormant when `status == 'IN_PROGRESS'` and `(now - last_activity_at).days >= dormancy_alert_days`.
    - Dormant items trigger an in-app notification and Web Push alert once per 48h cycle.
17. **Calendar Study Block Projection**:
    - Scheduling a study session creates an `EventItem` with `category='Estudio'`, start/end time, meeting URL pointing to `platform_url`, and `reminder_minutes=15`.
18. **Non-Destructive Daily Check-in & Reversibility (Fase 1)**:
    - Toggling `ActivityCheckIn` for today's date MUST NOT alter the parent `EventItem` status or `LearningItem` status.
    - Toggling is reversible: re-clicking removes the record or sets `is_completed=False` and adjusts the active streak counter.
19. **Dual Consistency Streak Engine (Fase 1)**:
    - **Consecutive streak (🔥)**: Evaluates unbroken preceding days where check-ins occurred.
    - **Weekly Frequency Target**: Sum of unique checked-in days within the current Monday-Sunday calendar week.
20. **Goal Horizon & Smart Deadline Suggestion (Fase 3)**:
    - If `deadline` is $\le 30$ days from creation/update date, suggest `time_horizon = 'SHORT_TERM'`.
    - If `deadline` is $> 30$ days from creation/update date, suggest `time_horizon = 'LONG_TERM'`.
    - The user can explicitly override this suggestion at any time.
21. **Equitable Multi-Component Goal Progress (Fase 4)**:
    - A Goal calculates its progress percentage as the unweighted mean across all present categories:
      $$\text{Progress} = \text{round}\left( \frac{\bar{P}_{\text{projects}} + \bar{P}_{\text{learning}} + \bar{P}_{\text{milestones}}}{N_{\text{present}}} \right)$$
    - Categories with 0 linked items are omitted from $N_{\text{present}}$ without penalty.
22. **100% Celebration & Explicit Conclusion (Fase 4)**:
    - When a Goal reaches 100% progress, it displays a celebratory banner and button `"Concluir y archivar objetivo"`.
    - The goal remains in `ACTIVE` state until the user explicitly confirms the conclusion.

---

## Frontend Domain Models (TypeScript Interfaces)

```typescript
// src/domain/types.ts

export type ActiveTab = 'CALENDARIO' | 'OBJETIVOS' | 'PROYECTOS' | 'EVENTOS' | 'APRENDIZAJE';

export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED';

export type TimeHorizon = 'SHORT_TERM' | 'LONG_TERM';

export type ProgressMode = 'MANUAL' | 'MILESTONES' | 'CONNECTED';

export type ViewMode = 'CARDS' | 'LIST';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  themePreference: 'light' | 'dark';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface GoalMilestone {
  id: string;
  goalId?: string;
  title: string;
  isCompleted: boolean;
  weight?: number; // Custom weight if configured
  targetDate?: string | null;
  order: number;
}

export interface LinkedProjectSummary {
  id: string;
  title: string;
  colorHex: string;
  status: string;
  progressPercentage: number;
}

export interface LinkedLearningSummary {
  id: string;
  title: string;
  resourceType: string;
  status: string;
  progressPercentage: number;
  platformUrl?: string | null;
}

export interface GoalProgressBreakdown {
  projectsAvg?: number | null;
  coursesAvg?: number | null;
  milestonesAvg?: number | null;
  presentCount: number;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: string;
  colorHex: string;
  startDate?: string | null;
  deadline?: string | null;
  reminderMinutes?: number;
  timeHorizon: TimeHorizon;
  parentGoalId?: string | null;
  parentGoalTitle?: string | null;
  progressMode: ProgressMode;
  progressPercentage: number; // 0 to 100
  status: GoalStatus;
  milestones: GoalMilestone[];
  linkedProjects?: LinkedProjectSummary[];
  linkedCourses?: LinkedLearningSummary[];
  breakdown?: GoalProgressBreakdown;
  isAchieved100?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GoalFilterCriteria {
  status: 'ALL' | GoalStatus;
  category: string; // 'ALL' or specific category
  timeHorizon: 'ALL' | TimeHorizon;
  searchQuery: string;
}

export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TaskSubtask {
  id: string;
  taskId?: string;
  title: string;
  isCompleted: boolean;
  order: number;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline?: string | null;
  reminderMinutes?: number;
  order: number;
  subtasks: TaskSubtask[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  colorHex: string;
  status: ProjectStatus;
  progressPercentage: number; // 0 to 100
  goalId?: string | null; // Optional linked Goal
  tasks?: ProjectTask[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFilterCriteria {
  status: 'ALL' | ProjectStatus;
  searchQuery: string;
}

export type EventStatus = 'PROGRAMMED' | 'COMPLETED' | 'CANCELED';

export type TimeBlock = 'TODAY' | 'THIS_WEEK' | 'UPCOMING' | 'PAST';

export interface EventItem {
  id: string;
  title: string;
  description?: string;
  startTime: string; // ISO 8601 string
  endTime: string;   // ISO 8601 string
  location?: string | null;
  meetingUrl?: string | null;
  category: string;
  colorHex: string;
  status: EventStatus;
  reminderMinutes?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventFilterCriteria {
  status: 'ALL' | EventStatus;
  category: string; // 'ALL' or specific category
  searchQuery: string;
}

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionDTO {
  id: string;
  endpoint: string;
  keys: PushSubscriptionKeys;
  userAgent?: string;
  createdAt: string;
}

export interface WebPushStatus {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  isStandalone: boolean; // True if running as installed PWA (essential for iOS)
}

export type AuthMode = 'LOGIN' | 'REGISTER';

export interface LoginCredentials {
  identifier: string; // username or email
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

export interface AuthSessionUser {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  themePreference: 'light' | 'dark';
}

export interface AuthResponse {
  token: string;
  user: AuthSessionUser;
  message?: string;
}

export interface AuthState {
  user: AuthSessionUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isWelcomeOnly: boolean; // True when user has active session and sees welcome screen
  activeTab: AuthMode;
  isLoading: boolean;
  error: string | null;
}

// --- Aprendizaje (Learning & Knowledge) Domain Models ---

export type ResourceType = 'COURSE' | 'BOOK' | 'ARTICLE' | 'TECH_DOC';

export type LearningStatus = 'BACKLOG' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';

export type LearningProgressMode = 'MANUAL' | 'TOPICS';

export interface LearningTopic {
  id: string;
  learningItemId?: string;
  title: string;
  isCompleted: boolean;
  order: number;
  sectionName?: string | null;
}

export interface LearningItem {
  id: string;
  title: string;
  description?: string;
  resourceType: ResourceType;
  platformName?: string;
  platformUrl?: string;
  colorHex: string;
  status: LearningStatus;
  progressMode: LearningProgressMode;
  progressPercentage: number; // 0 to 100
  currentUnit: number;
  totalUnits: number;
  lastPointReached?: string;
  takeawaysMarkdown?: string;
  goalId?: string | null;
  projectId?: string | null;
  lastActivityAt: string;
  dormancyDays?: number;
  isDormant?: boolean;
  dormancyAlertDays?: number;
  topics?: LearningTopic[];
  createdAt?: string;
  updatedAt?: string;
}

export interface LearningFilterCriteria {
  status: 'ALL' | LearningStatus;
  resourceType: 'ALL' | ResourceType;
  searchQuery: string;
}

// --- Constancia y Matriz de Progreso (Fases 1 y 2) ---

export type StreakMode = 'CONSECUTIVE' | 'WEEKLY_TARGET';

export interface ActivityCheckIn {
  id: string;
  userId?: string;
  date: string; // YYYY-MM-DD
  learningItemId?: string | null;
  eventItemId?: string | null;
  isCompleted: boolean;
  streakCount: number;
  createdAt?: string;
}

export interface WeeklyAttendanceDay {
  date: string; // YYYY-MM-DD
  dayLetter: string; // 'L', 'M', 'X', 'J', 'V', 'S', 'D'
  isToday: boolean;
  isChecked: boolean;
}

export interface ProgressMatrixRow {
  id: string;
  title: string;
  itemType: 'LEARNING' | 'EVENT';
  platformName?: string;
  colorHex: string;
  currentStreak: number;
  weeklyAttendance: WeeklyAttendanceDay[];
  progressPercentage: number;
  progressMode: 'TOPICS' | 'MANUAL';
  currentUnit?: number;
  totalUnits?: number;
  nextTopicTitle?: string;
  isCheckedToday: boolean;
  rawLearningItem?: LearningItem;
  rawEventItem?: EventItem;
}
```
