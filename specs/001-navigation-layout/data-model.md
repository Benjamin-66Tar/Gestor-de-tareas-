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
| `deadline` | DateTimeField | Nullable, Blank, DB Index | Target completion date. |
| `progress_mode` | CharField | Choices: `['MANUAL', 'MILESTONES']`, Default: `'MILESTONES'` | Calculation mode for progress. |
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

## Validation & Business Rules

1. **Progress Range**: `progress_percentage` must always be between 0 and 100 inclusive.
2. **Milestone Weight**: When specified, `weight` must be $>0$. If no weights are specified, milestones default to equal weight (1).
3. **Status Transitions**:
   - Marking a goal status as `COMPLETED` automatically sets `progress_percentage = 100`.
   - In `MILESTONES` mode, when all milestones are completed, `status` automatically transitions to `COMPLETED` unless manually overridden.
4. **Calendar Sync**: Any `Goal` with a non-null `deadline` or `GoalMilestone` with a non-null `target_date` is projected as an event into the Calendar layer.

---

## Frontend Domain Models (TypeScript Interfaces)

```typescript
// src/domain/types.ts

export type ActiveTab = 'CALENDARIO' | 'OBJETIVOS' | 'PROYECTOS' | 'EVENTOS';

export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED';

export type ProgressMode = 'MANUAL' | 'MILESTONES';

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

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: string;
  colorHex: string;
  deadline?: string | null;
  progressMode: ProgressMode;
  progressPercentage: number; // 0 to 100
  status: GoalStatus;
  milestones: GoalMilestone[];
  createdAt: string;
  updatedAt: string;
}

export interface GoalFilterCriteria {
  status: 'ALL' | GoalStatus;
  category: string; // 'ALL' or specific category
  searchQuery: string;
}
```
