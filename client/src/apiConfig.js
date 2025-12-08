// Toggle this to switch between local and live API
const USE_LIVE_API = false; // true = Supabase/Live, false = local Node.js server
const LOCAL_API_URL = 'http://localhost:4000'; // Local Node.js server
const LIVE_API_URL = import.meta.env.VITE_API_URL || 'https://mmfingotech.website/Project_Tracker_Tool/server/api'; // Live API fallback

export const API_BASE_URL = USE_LIVE_API ? LIVE_API_URL : LOCAL_API_URL;

console.log('API_BASE_URL:', API_BASE_URL, '| Mode:', USE_LIVE_API ? 'LIVE' : 'LOCAL');

export { USE_LIVE_API };