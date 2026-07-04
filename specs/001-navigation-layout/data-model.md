# Data Model: Navigation Layout & Shell

This document defines the Django models for the backend database and the TypeScript interfaces for the React frontend.

## Backend Models (Django)

### 1. `UserProfile`
Represents the user's profile and settings.

| Field Name | Type | Constraints | Description |
|------------|------|-------------|-------------|
| `id` | UUID | Primary Key | Unique identifier. |
| `user` | OneToOneField (User) | On Delete: Cascade | Relationship with Django's core User model. |
| `avatar_url` | URLField | Max Length: 500, Nullable | URL to the user's profile image/avatar. |
| `theme_preference` | CharField | Max Length: 20, Default: "dark" | Theme mode ("light" or "dark"). |

---

### 2. `Notification`
Represents alerts or messages sent to the user.

| Field Name | Type | Constraints | Description |
|------------|------|-------------|-------------|
| `id` | UUID | Primary Key | Unique identifier. |
| `user` | ForeignKey (User) | On Delete: Cascade | Recipient of the notification. |
| `title` | CharField | Max Length: 100 | Short summary of the notification. |
| `message` | TextField | Max Length: 500 | Detailed message content. |
| `is_read` | BooleanField | Default: False | Indicates whether the user has viewed the notification. |
| `created_at` | DateTimeField | Auto Now Add | Date and time the notification was sent. |

**Validation Rules**:
- `title` cannot be empty.
- `message` cannot be empty.

---

## Frontend Types (TypeScript)

### 1. `UserProfile`
```typescript
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  themePreference: 'light' | 'dark';
}
```

### 2. `Notification`
```typescript
export interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string; // ISO DateTime string
}
```

### 3. `ActiveTab`
```typescript
export type ActiveTab = 'calendario' | 'objetivos' | 'proyectos' | 'eventos';
```
