# Subtask Functionality Documentation

This document provides comprehensive information on how to use the subtask functionality in TaskMaster Pro.

## Overview

Subtasks allow users to break down complex tasks into smaller, manageable components. A task can have multiple subtasks, and the system tracks progress on the parent task based on subtask completion.

## API Endpoints

### Get All Subtasks for a Task
```
GET /api/tasks/:id/subtasks
```

**Response (200 OK):**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "60d21e5067d0d8992e610c99",
      "title": "Research component libraries",
      "description": "Find the best UI library for our project",
      "status": "completed",
      "priority": "medium",
      "dueDate": "2023-09-18T00:00:00.000Z",
      "completedAt": "2023-09-17T15:30:20.123Z",
      "user": "60d21b4667d0d8992e610c85",
      "parent": "60d21d1067d0d8992e610c98",
      "category": {
        "_id": "60d21c1067d0d8992e610c87",
        "name": "Work",
        "color": "#e74c3c",
        "icon": "briefcase"
      },
      "tags": [
        {
          "_id": "60d21c3067d0d8992e610c93",
          "name": "Later",
          "color": "#3498db"
        }
      ],
      "createdAt": "2023-09-15T17:10:30.123Z",
      "updatedAt": "2023-09-17T15:30:20.123Z"
    },
    {
      "_id": "60d21e5067d0d8992e610c9a",
      "title": "Create wireframes",
      "description": "Design basic wireframes for homepage",
      "status": "in_progress",
      "priority": "high",
      "dueDate": "2023-09-20T00:00:00.000Z",
      "user": "60d21b4667d0d8992e610c85",
      "parent": "60d21d1067d0d8992e610c98",
      "category": {
        "_id": "60d21c1067d0d8992e610c87",
        "name": "Work",
        "color": "#e74c3c",
        "icon": "briefcase"
      },
      "tags": [],
      "createdAt": "2023-09-15T17:15:30.123Z",
      "updatedAt": "2023-09-15T17:15:30.123Z"
    },
    {
      "_id": "60d21e5067d0d8992e610c9b",
      "title": "Get client feedback",
      "description": "Schedule meeting to review designs",
      "status": "todo",
      "priority": "medium",
      "dueDate": "2023-09-22T00:00:00.000Z",
      "user": "60d21b4667d0d8992e610c85",
      "parent": "60d21d1067d0d8992e610c98",
      "category": {
        "_id": "60d21c1067d0d8992e610c87",
        "name": "Work",
        "color": "#e74c3c",
        "icon": "briefcase"
      },
      "tags": [],
      "createdAt": "2023-09-15T17:20:30.123Z",
      "updatedAt": "2023-09-15T17:20:30.123Z"
    }
  ]
}
```

### Create a Subtask
```
POST /api/tasks/:id/subtasks
```

**Request:**
```json
{
  "title": "Create logo options",
  "description": "Design 3 logo variants for client selection",
  "status": "todo",
  "priority": "high",
  "dueDate": "2023-09-21T00:00:00.000Z",
  "tags": ["60d21c7067d0d8992e610c94"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "60d21e5067d0d8992e610c9c",
    "title": "Create logo options",
    "description": "Design 3 logo variants for client selection",
    "status": "todo",
    "priority": "high",
    "dueDate": "2023-09-21T00:00:00.000Z",
    "user": "60d21b4667d0d8992e610c85",
    "parent": "60d21d1067d0d8992e610c98",
    "category": {
      "_id": "60d21c1067d0d8992e610c87",
      "name": "Work",
      "color": "#e74c3c",
      "icon": "briefcase"
    },
    "tags": [
      {
        "_id": "60d21c7067d0d8992e610c94",
        "name": "Client Work",
        "color": "#d35400"
      }
    ],
    "createdAt": "2023-09-15T17:30:30.123Z",
    "updatedAt": "2023-09-15T17:30:30.123Z"
  }
}
```

### Get a Single Subtask
```
GET /api/tasks/:id/subtasks/:subtaskId
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "60d21e5067d0d8992e610c9c",
    "title": "Create logo options",
    "description": "Design 3 logo variants for client selection",
    "status": "todo",
    "priority": "high",
    "dueDate": "2023-09-21T00:00:00.000Z",
    "user": "60d21b4667d0d8992e610c85",
    "parent": "60d21d1067d0d8992e610c98",
    "category": {
      "_id": "60d21c1067d0d8992e610c87",
      "name": "Work",
      "color": "#e74c3c",
      "icon": "briefcase"
    },
    "tags": [
      {
        "_id": "60d21c7067d0d8992e610c94",
        "name": "Client Work",
        "color": "#d35400"
      }
    ],
    "createdAt": "2023-09-15T17:30:30.123Z",
    "updatedAt": "2023-09-15T17:30:30.123Z"
  }
}
```

### Update a Subtask
```
PUT /api/tasks/:id/subtasks/:subtaskId
```

**Request:**
```json
{
  "status": "in_progress",
  "description": "Design 4 logo variants for client selection"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "60d21e5067d0d8992e610c9c",
    "title": "Create logo options",
    "description": "Design 4 logo variants for client selection",
    "status": "in_progress",
    "priority": "high",
    "dueDate": "2023-09-21T00:00:00.000Z",
    "user": "60d21b4667d0d8992e610c85",
    "parent": "60d21d1067d0d8992e610c98",
    "category": {
      "_id": "60d21c1067d0d8992e610c87",
      "name": "Work",
      "color": "#e74c3c",
      "icon": "briefcase"
    },
    "tags": [
      {
        "_id": "60d21c7067d0d8992e610c94",
        "name": "Client Work",
        "color": "#d35400"
      }
    ],
    "createdAt": "2023-09-15T17:30:30.123Z",
    "updatedAt": "2023-09-15T17:45:15.123Z"
  }
}
```

### Delete a Subtask
```
DELETE /api/tasks/:id/subtasks/:subtaskId
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {}
}
```

### Get Subtask Status (Completion Progress)
```
GET /api/tasks/:id/subtasks/status
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total": 4,
    "completed": 1,
    "progress": 25
  }
}
```

### Complete All Subtasks
```
PATCH /api/tasks/:id/subtasks/complete-all
```

**Response (200 OK):**
```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "_id": "60d21e5067d0d8992e610c99",
      "title": "Research component libraries",
      "status": "completed",
      "priority": "medium",
      "dueDate": "2023-09-18T00:00:00.000Z",
      "completedAt": "2023-09-17T15:30:20.123Z",
      "tags": [
        {
          "_id": "60d21c3067d0d8992e610c93",
          "name": "Later",
          "color": "#3498db"
        }
      ]
    },
    {
      "_id": "60d21e5067d0d8992e610c9a",
      "title": "Create wireframes",
      "status": "completed",
      "priority": "high",
      "dueDate": "2023-09-20T00:00:00.000Z",
      "completedAt": "2023-09-17T16:45:10.123Z",
      "tags": []
    },
    {
      "_id": "60d21e5067d0d8992e610c9b",
      "title": "Get client feedback",
      "status": "completed",
      "priority": "medium",
      "dueDate": "2023-09-22T00:00:00.000Z",
      "completedAt": "2023-09-17T16:45:10.123Z",
      "tags": []
    },
    {
      "_id": "60d21e5067d0d8992e610c9c",
      "title": "Create logo options",
      "status": "completed",
      "priority": "high",
      "dueDate": "2023-09-21T00:00:00.000Z",
      "completedAt": "2023-09-17T16:45:10.123Z",
      "tags": [
        {
          "_id": "60d21c7067d0d8992e610c94",
          "name": "Client Work",
          "color": "#d35400"
        }
      ]
    }
  ]
}
```

## Task Endpoints with Subtask Information

### Get Task with Subtasks
```
GET /api/tasks/:id
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "60d21d1067d0d8992e610c98",
    "title": "Web Design Project",
    "description": "Create mockups for client website redesign",
    "status": "in_progress",
    "priority": "high",
    "dueDate": "2023-09-25T00:00:00.000Z",
    "user": "60d21b4667d0d8992e610c85",
    "category": {
      "_id": "60d21c1067d0d8992e610c87",
      "name": "Work",
      "color": "#e74c3c",
      "icon": "briefcase"
    },
    "tags": [
      {
        "_id": "60d21c3067d0d8992e610c91",
        "name": "Important",
        "color": "#e74c3c"
      },
      {
        "_id": "60d21c7067d0d8992e610c94",
        "name": "Client Work",
        "color": "#d35400"
      }
    ],
    "subtasks": [
      {
        "_id": "60d21e5067d0d8992e610c99",
        "title": "Research component libraries",
        "status": "completed",
        "priority": "medium",
        "dueDate": "2023-09-18T00:00:00.000Z",
        "completedAt": "2023-09-17T15:30:20.123Z"
      },
      {
        "_id": "60d21e5067d0d8992e610c9a",
        "title": "Create wireframes",
        "status": "in_progress",
        "priority": "high",
        "dueDate": "2023-09-20T00:00:00.000Z"
      },
      {
        "_id": "60d21e5067d0d8992e610c9b",
        "title": "Get client feedback",
        "status": "todo",
        "priority": "medium",
        "dueDate": "2023-09-22T00:00:00.000Z"
      },
      {
        "_id": "60d21e5067d0d8992e610c9c",
        "title": "Create logo options",
        "status": "in_progress",
        "priority": "high",
        "dueDate": "2023-09-21T00:00:00.000Z"
      }
    ],
    "subtaskProgress": 25,
    "createdAt": "2023-09-15T16:45:30.123Z",
    "updatedAt": "2023-09-15T17:00:15.123Z"
  }
}
```

### Create Task with Parent (as a Subtask)
```
POST /api/tasks
```

**Request:**
```json
{
  "title": "Add animations to homepage",
  "description": "Implement smooth transitions between sections",
  "priority": "medium",
  "dueDate": "2023-09-23T00:00:00.000Z",
  "parent": "60d21d1067d0d8992e610c98"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "60d21e5067d0d8992e610c9d",
    "title": "Add animations to homepage",
    "description": "Implement smooth transitions between sections",
    "status": "todo",
    "priority": "medium",
    "dueDate": "2023-09-23T00:00:00.000Z",
    "user": "60d21b4667d0d8992e610c85",
    "parent": "60d21d1067d0d8992e610c98",
    "category": {
      "_id": "60d21c1067d0d8992e610c87",
      "name": "Work",
      "color": "#e74c3c",
      "icon": "briefcase"
    },
    "tags": [],
    "createdAt": "2023-09-15T18:00:30.123Z",
    "updatedAt": "2023-09-15T18:00:30.123Z"
  }
}
```

### Get All Top-Level Tasks (no parent)
```
GET /api/tasks?parent=null
```

### Get All Subtasks of a Parent
```
GET /api/tasks?parent=60d21d1067d0d8992e610c98
```

### Force Delete a Task with Subtasks
```
DELETE /api/tasks/:id/force
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {}
}
```

## Task Hierarchy Rules

1. A task can have multiple subtasks
2. A subtask can have its own subtasks (multi-level nesting)
3. Circular references are prevented (a task cannot be its own ancestor)
4. Deleting a task with subtasks requires either:
   - Deleting all subtasks first, then the parent
   - Using the force delete endpoint to delete the parent and all subtasks

## Subtask Progress Calculation

- The system automatically calculates progress on parent tasks based on the completion status of subtasks
- Progress is shown as a percentage: `(completed subtasks / total subtasks) * 100`
- When viewing a task with subtasks, the response includes:
  - A `subtasks` array with basic information about each subtask
  - A `subtaskProgress` value showing the percentage of completed subtasks
  - A `subtaskCount` value showing the total number of subtasks

## Best Practices

1. **Plan Your Task Hierarchy**: Think about how to break down complex tasks into manageable subtasks
2. **Use Consistent Naming**: Keep task and subtask names clear and consistent
3. **Manage Task Depth**: While multi-level nesting is supported, it's best to limit nesting to 2-3 levels for usability
4. **Consider Due Dates**: Set realistic due dates for subtasks that lead up to the parent task's due date
5. **Track Progress**: Use the subtask status endpoints to monitor completion progress

## Implementation Notes

- When a subtask is marked as complete, the `completedAt` field is automatically populated
- Categories and tags from the parent task can be inherited by subtasks if not specified
- Subtasks appear in regular task queries but can be filtered using the `parent` parameter