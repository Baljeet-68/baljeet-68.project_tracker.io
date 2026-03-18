// Use live API only
// LIVE API BASE (must include /server)
const API_URL = import.meta.env.PROD
  ? import.meta.env.VITE_API_URL
  : 'https://mmfinfotech.website/Project_Tracker_Tool/server/api';

if (import.meta.env.PROD && !API_URL) {
  throw new Error('VITE_API_URL is not set in production environment');
}

export const API_BASE_URL = API_URL;
