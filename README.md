# Project Tracker Tool by Baljeet Singh

A comprehensive project management and bug tracking system built with the MERN stack (MySQL, Express, React, Node.js). This tool helps teams manage projects, track bugs, monitor milestones, and handle administrative tasks like attendance and recruitment.

## 🚀 Features

- **Dashboard**: Real-time project overview with interactive charts and statistics.
- **Project Management**: Detailed project tracking including screens, tasks, and milestones.
- **Bug Tracker**: Robust bug reporting and management system with status and priority filtering.
- **User Management**: Role-based access control for developers and administrators.
- **Attendance & Leaves**: Track employee attendance and manage leave requests.
- **Careers**: Manage job postings and recruitment processes.
- **Announcements & Notifications**: Internal communication system for team updates.
- **Settings**: System-wide configurations and user profile management.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Lucide React (Icons), ApexCharts (Data Visualization).
- **Backend**: Node.js, Express.
- **Database**: MySQL (using `mysql2` driver).
- **Authentication**: JWT (JSON Web Tokens).

## 📁 Project Structure

```text
Project_Tracker_Tool/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages/routes
│   │   ├── assets/         # Static assets
│   │   └── apiConfig.js    # API connection settings
├── server/                 # Express backend
│   ├── routes/             # API route definitions
│   ├── middleware/         # Custom Express middleware
│   ├── utils/              # Helper functions
│   ├── db.js               # Database connection
│   └── server.js           # Main entry point
└── README.md               # Main project documentation
```

## ⚙️ Setup Instructions

### Prerequisites

- Node.js (v16+ recommended)
- MySQL Database
- npm or yarn

### Server Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `server` directory and add your configurations:
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
4. Start the server:
   ```bash
   npm start
   ```

### Client Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure the API URL in `src/apiConfig.js` if necessary.
4. Start the development server:
   ```bash
   npm run dev
   ```

## 📝 Scripts

### Server
- `npm start`: Runs the production server using Node.js.

### Client
- `npm run dev`: Starts the Vite development server.
- `npm run build`: Builds the application for production.
- `npm run preview`: Previews the production build locally.

## 📄 License

This project is private and for internal use only.
