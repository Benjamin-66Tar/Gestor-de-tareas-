# API Contracts: Navigation Layout

All REST API endpoints are prefixed with `/api/v1`. All requests and responses MUST use `application/json` format.

---

## 1. Get User Profile

Retrieve profile details for the currently authenticated user.

- **URL**: `/api/v1/profile/`
- **Method**: `GET`
- **Authentication Required**: Yes (Session or Token)

### Response (200 OK)
```json
{
  "id": "a6b9c78d-1234-5678-abcd-ef1234567890",
  "username": "aurasuer",
  "email": "user@aura.app",
  "avatar_url": "https://api.dicebear.com/7.x/adventurer/svg?seed=aura",
  "theme_preference": "dark"
}
```

### Response (401 Unauthorized)
```json
{
  "detail": "Authentication credentials were not provided."
}
```

---

## 2. Get Unread Notifications Count

Retrieve the count of unread notifications for the badge indicator in the Navbar.

- **URL**: `/api/v1/notifications/unread-count/`
- **Method**: `GET`
- **Authentication Required**: Yes

### Response (200 OK)
```json
{
  "unread_count": 5
}
```

---

## 3. Get Notifications List

Retrieve the list of recent notifications for the logged-in user.

- **URL**: `/api/v1/notifications/`
- **Method**: `GET`
- **Authentication Required**: Yes
- **Query Parameters**:
  - `page` (optional): Page number for pagination. Default: 1
  - `page_size` (optional): Items per page. Default: 10

### Response (200 OK)
```json
{
  "count": 12,
  "next": "/api/v1/notifications/?page=2",
  "previous": null,
  "results": [
    {
      "id": "e4f321ba-5678-1234-abcd-ef0987654321",
      "title": "Nuevo Objetivo",
      "message": "Se ha creado el objetivo 'Implementar UI Layout'.",
      "is_read": false,
      "created_at": "2026-07-03T18:00:00Z"
    },
    {
      "id": "f5e432cb-1234-5678-abcd-fe1092837465",
      "title": "Reunión de Sincronización",
      "message": "Tu evento de calendario comenzará en 15 minutos.",
      "is_read": true,
      "created_at": "2026-07-03T17:45:00Z"
    }
  ]
}
```

---

## 4. Mark Notification as Read

Mark a specific notification as read.

- **URL**: `/api/v1/notifications/{id}/read/`
- **Method**: `POST`
- **Authentication Required**: Yes
- **Path Parameters**:
  - `id` (UUID): The unique identifier of the notification.

### Response (200 OK)
```json
{
  "id": "e4f321ba-5678-1234-abcd-ef0987654321",
  "is_read": true
}
```

### Response (404 Not Found)
```json
{
  "detail": "Notification not found."
}
```
