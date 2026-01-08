# Project Tracker - Server

This is the backend of the Project Tracker Tool, built with Node.js and Express. It provides a RESTful API for project management, bug tracking, and user administration.

## 🚀 Getting Started

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Database Setup**:
    - Ensure MySQL is installed and running.
    - Create a database and import the required schema (refer to `import_sql.js` or migration scripts).
    - Update the `.env` file with your database credentials.
3.  **Start the server**:
    ```bash
    npm start
    ```

## 🛠️ Tech Stack

- **Node.js**: Runtime environment.
- **Express**: Web framework.
- **MySQL**: Relational database.
- **mysql2**: MySQL client for Node.js.
- **JWT**: For secure user authentication.
- **CORS**: Cross-Origin Resource Sharing.

## 📁 API Routes

The server provides several API endpoints categorized by functionality:

- **Auth** (`/api/auth`): User login, registration, and session management.
- **Projects** (`/api/projects`): CRUD operations for projects.
- **Bugs** (`/api/bugs`): Bug reporting, status updates, and tracking.
- **Screens** (`/api/screens`): Manage project screens and associated tasks.
- **Milestones** (`/api/milestones`): Track project milestones.
- **Users** (`/api/users`): Manage user profiles and team members.
- **Attendance & Leaves** (`/api/leaves`): Employee leave management.
- **Careers** (`/api/careers`): Job posting and recruitment API.
- **Announcements** (`/api/announcements`): System-wide announcements.
- **Notifications** (`/api/notifications`): User-specific notifications.

## ⚙️ Environment Variables

Create a `.env` file in the root of the `server` directory:

```env
PORT=4000
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database_name
JWT_SECRET=your_jwt_secret
MODE=local
BASE_URL=/api
```

## 📝 Maintenance Scripts

The server directory contains several utility scripts for database management and migrations:
- `import_sql.js`: Import initial database schema.
- `create_admin.js`: Create an initial administrator account.
- `migrate_*.js`: Various scripts for data migration and table updates.
