# Project Tracker - Client

This is the frontend of the Project Tracker Tool, built with React and Vite. It provides a modern, responsive user interface for managing projects and tracking bugs.

## 🚀 Getting Started

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Start development server**:
    ```bash
    npm run dev
    ```
3.  **Build for production**:
    ```bash
    npm run build
    ```

## 🛠️ Tech Stack

- **React**: Frontend library.
- **Vite**: Build tool and development server.
- **Tailwind CSS**: Utility-first CSS framework.
- **React Router**: For client-side routing.
- **ApexCharts**: For interactive data visualization.
- **Lucide React**: Icon library.

## 📁 Directory Structure

- `src/components/`: Reusable UI components like charts, forms, and layout elements.
- `src/pages/`: Main application views (Dashboard, Projects, Login, etc.).
- `src/assets/`: Static images and animations (Lottie JSON).
- `src/apiConfig.js`: Centralized configuration for API endpoints.
- `src/auth.js`: Authentication helper functions.

## 🌐 API Configuration

The client connects to the backend API defined in `src/apiConfig.js`. You can toggle between local and live API endpoints by modifying the `USE_LIVE_API` constant.

```javascript
const USE_LIVE_API = false; // Set to true for production
```

## 📝 Scripts

- `dev`: Starts the development server at `http://localhost:5173`.
- `build`: Generates a production-ready build in the `dist/` directory.
- `preview`: Serves the production build locally for testing.
