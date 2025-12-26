// Toggle between local & live
const USE_LIVE_API = true; //for live = true & local = false

// LOCAL API BASE (backend routes start with /login, /api/projects etc.)
const LOCAL_API_URL = "http://localhost:4000/api";

// LIVE API BASE (must include /server)
const LIVE_API_URL =
  import.meta.env.VITE_API_URL || "https://mmfinfotech.website/Project_Tracker_Tool/server/api";

// FINAL BASE URL
export const API_BASE_URL = USE_LIVE_API ? LIVE_API_URL : LOCAL_API_URL;

console.log("API_BASE_URL:", API_BASE_URL, "| Mode:", USE_LIVE_API ? "LIVE" : "LOCAL");
