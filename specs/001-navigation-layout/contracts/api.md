# API Contracts: Navigation Shell & Objetivos

All endpoints are served under the `/api/v1` namespace and expect/return `application/json`.

---

## 1. User Profile & Navigation Shell

### Get User Profile
- **Method**: `GET`
- **URL**: `/api/v1/profile/`
- **Response (200 OK)**:
```json
{
  "id": "a6b9c78d-1234-5678-abcd-ef1234567890",
  "username": "aurasuer",
  "email": "user@aura.app",
  "avatar_url": "https://api.dicebear.com/7.x/adventurer/svg?seed=aura",
  "theme_preference": "dark"
}
```

---

## 2. Notifications

### Get Unread Notifications Count
- **Method**: `GET`
- **URL**: `/api/v1/notifications/unread-count/`
- **Response (200 OK)**:
```json
{
  "unread_count": 3
}
```

### List Notifications
- **Method**: `GET`
- **URL**: `/api/v1/notifications/`
- **Query Params**: `page` (int), `page_size` (int)
- **Response (200 OK)**:
```json
{
  "count": 1,
  "results": [
    {
      "id": "e4f321ba-5678-1234-abcd-ef0987654321",
      "title": "Meta próxima a vencer",
      "message": "El objetivo 'Lanzar MVP' vence en menos de 48 horas.",
      "is_read": false,
      "created_at": "2026-09-03T18:00:00Z"
    }
  ]
}
```

### Mark Notification as Read
- **Method**: `POST`
- **URL**: `/api/v1/notifications/{id}/read/`
- **Response (200 OK)**:
```json
{
  "id": "e4f321ba-5678-1234-abcd-ef0987654321",
  "is_read": true
}
```

---

## 3. Goals (Objetivos)

### List Goals
- **Method**: `GET`
- **URL**: `/api/v1/goals/`
- **Query Params**:
  - `status`: `ACTIVE`, `COMPLETED`, `PAUSED` (optional)
  - `category`: Category name (optional)
  - `search`: Text search on title/description (optional)
- **Response (200 OK)**:
```json
[
  {
    "id": "b1c2d3e4-1111-2222-3333-444455556666",
    "title": "Aprender TypeScript Avanzado",
    "description": "Dominar genéricos, decoradores y tipos condicionales.",
    "category": "Aprendizaje",
    "color_hex": "#10B981",
    "deadline": "2026-10-15T23:59:59Z",
    "progress_mode": "MILESTONES",
    "progress_percentage": 60,
    "status": "ACTIVE",
    "milestones": [
      {
        "id": "m1-1111-2222-3333",
        "title": "Completar curso teórico",
        "is_completed": true,
        "weight": 1,
        "target_date": "2026-09-10",
        "order": 1
      },
      {
        "id": "m2-1111-2222-3333",
        "title": "Implementar mini proyecto",
        "is_completed": true,
        "weight": 2,
        "target_date": "2026-09-25",
        "order": 2
      },
      {
        "id": "m3-1111-2222-3333",
        "title": "Aprobar examen de certificación",
        "is_completed": false,
        "weight": 2,
        "target_date": "2026-10-15",
        "order": 3
      }
    ],
    "created_at": "2026-09-01T10:00:00Z",
    "updated_at": "2026-09-03T12:00:00Z"
  }
]
```

### Create Goal
- **Method**: `POST`
- **URL**: `/api/v1/goals/`
- **Request Body**:
```json
{
  "title": "Correr medio maratón",
  "description": "Entrenar 4 días a la semana",
  "category": "Salud",
  "color_hex": "#EC4899",
  "deadline": "2026-12-01T08:00:00Z",
  "progress_mode": "MILESTONES",
  "status": "ACTIVE",
  "milestones": [
    { "title": "Correr 5 km sin parar", "weight": 1, "order": 1 },
    { "title": "Correr 10 km a ritmo objetivo", "weight": 2, "order": 2 },
    { "title": "Completar carrera de 21 km", "weight": 3, "order": 3 }
  ]
}
```
- **Response (201 Created)**: Created Goal object with generated IDs and initial calculated `progress_percentage`.

### Update Goal
- **Method**: `PUT` / `PATCH`
- **URL**: `/api/v1/goals/{id}/`
- **Request Body**: Partial or full fields. If `progress_mode === 'MANUAL'`, `progress_percentage` is accepted directly. If `progress_mode === 'MILESTONES'`, the service recalculates progress automatically.
- **Response (200 OK)**: Updated Goal object.

### Delete Goal
- **Method**: `DELETE`
- **URL**: `/api/v1/goals/{id}/`
- **Response (204 No Content)**

---

## 4. Milestones (Hitos)

### Toggle Milestone Completion
- **Method**: `POST`
- **URL**: `/api/v1/goals/{goal_id}/milestones/{milestone_id}/toggle/`
- **Response (200 OK)**:
```json
{
  "milestone_id": "m1-1111-2222-3333",
  "is_completed": true,
  "goal_progress_percentage": 60,
  "goal_status": "ACTIVE"
}
```

---

## 5. Calendar Synchronization

### Get Calendar Events with Synchronized Deadlines
- **Method**: `GET`
- **URL**: `/api/v1/calendar/events/`
- **Query Params**: `start_date` (ISO Date), `end_date` (ISO Date)
- **Response (200 OK)**:
```json
[
  {
    "id": "goal-b1c2d3e4-deadline",
    "title": "🎯 Meta: Aprender TypeScript Avanzado",
    "type": "GOAL_DEADLINE",
    "date": "2026-10-15T23:59:59Z",
    "color_hex": "#10B981",
    "source_id": "b1c2d3e4-1111-2222-3333-444455556666",
    "status": "ACTIVE"
  },
  {
    "id": "milestone-m2-deadline",
    "title": "📌 Hito: Implementar mini proyecto",
    "type": "MILESTONE_DEADLINE",
    "date": "2026-09-25T00:00:00Z",
    "color_hex": "#10B981",
    "source_id": "m2-1111-2222-3333",
    "status": "COMPLETED"
  }
]
```
