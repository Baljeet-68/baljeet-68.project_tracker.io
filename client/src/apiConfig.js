// Toggle between local & live
const USE_LIVE_API = true;
const BASE_PATH = "/Project_Tracker_Tool/server";


// LOCAL API BASE (backend routes start with /login, /api/projects etc.)
const LOCAL_API_URL = "http://localhost:4000";

// LIVE API BASE (must include /server/api)
const LIVE_API_URL =
  import.meta.env.VITE_API_URL ||
  "https://mmfinfotech.website/Project_Tracker_Tool/server";

// FINAL BASE URL
export const API_BASE_URL = USE_LIVE_API ? LIVE_API_URL : LOCAL_API_URL;

console.log("API_BASE_URL:", API_BASE_URL, "| Mode:", USE_LIVE_API ? "LIVE" : "LOCAL");
