// Use centralized API configuration
const API_URL =
  import.meta.env.VITE_API_URL || "https://project-tracker-tool.vercel.app/api"; // Old fallback URL: http://localhost:5000/api

export const API_BASE_URL = API_URL;
