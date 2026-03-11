// Use live API only
// LIVE API BASE (must include /server)
const LIVE_API_URL =
  import.meta.env.VITE_API_URL || "https://mmfinfotech.website/Project_Tracker_Tool/server/api";

// FINAL BASE URL - Always use LIVE API
export const API_BASE_URL = LIVE_API_URL;
