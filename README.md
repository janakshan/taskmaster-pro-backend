# TaskMaster Pro Backend

This is the backend implementation for the TaskMaster Pro application, a comprehensive task management system.

## Features

- User authentication with JWT
- Task management with CRUD operations
- Categories and Tags for task organization
- Filtering and sorting tasks by various criteria
- Default categories and tags for new users

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository
   ```
   git clone https://github.com/your-repo/taskmaster-pro.git
   cd taskmaster-pro/backend
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create environment variables
   ```
   cp .env.example .env
   ```
   Edit the `.env` file with your own values.

4. Start the development server
   ```
   npm run dev
   ```

### Running in Production

```
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get user profile
- `PUT /api/auth/me` - Update user profile
- `PUT /api/auth/password` - Change password

### Tasks

- `GET /api/tasks` - Get all tasks (with filtering)
- `POST /api/tasks` - Create a new task
- `GET /api/tasks/:id` - Get a specific task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task
- `DELETE /api/tasks/:id/force` - Force delete a task with all its subtasks
- `PATCH /api/tasks/:id/tags` - Add or remove tag from task

### Subtasks

- `GET /api/tasks/:id/subtasks` - Get all subtasks for a task
- `POST /api/tasks/:id/subtasks` - Create a subtask
- `GET /api/tasks/:id/subtasks/:subtaskId` - Get a specific subtask
- `PUT /api/tasks/:id/subtasks/:subtaskId` - Update a subtask
- `DELETE /api/tasks/:id/subtasks/:subtaskId` - Delete a subtask
- `GET /api/tasks/:id/subtasks/status` - Get subtask completion status
- `PATCH /api/tasks/:id/subtasks/complete-all` - Complete all subtasks

### Categories

- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create a new category
- `GET /api/categories/:id` - Get a specific category
- `PUT /api/categories/:id` - Update a category
- `DELETE /api/categories/:id` - Delete a category
- `GET /api/categories/:id/tasks` - Get tasks for a category

### Tags

- `GET /api/tags` - Get all tags
- `POST /api/tags` - Create a new tag
- `GET /api/tags/:id` - Get a specific tag
- `PUT /api/tags/:id` - Update a tag
- `DELETE /api/tags/:id` - Delete a tag
- `GET /api/tags/:id/tasks` - Get tasks for a tag

## Project Structure

```
backend/
├── src/
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Express middleware
│   ├── models/           # Mongoose models
│   ├── routes/           # Express routes
│   ├── utils/            # Utility functions
│   ├── app.js            # Express app
│   └── server.js         # Entry point
└── .env                  # Environment variables
```

## Testing API Endpoints

You can use tools like [Postman](https://www.postman.com/) or [Insomnia](https://insomnia.rest/) to test the API endpoints.

Example request:
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

## License

[MIT](LICENSE)
