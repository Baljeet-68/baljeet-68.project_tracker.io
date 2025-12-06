// Toggle this to switch between local and live API
const USE_LIVE_API = true; // true = Supabase, false = local
let BASE_URL= import.meta.env.VITE_API_URL
console.log('BASE_URL',BASE_URL);


export const API_BASE_URL = USE_LIVE_API
    ?  BASE_URL
    : 'https://mmfinfotech.website/bug_tracker/server/auth/api'; // Local backend

export { USE_LIVE_API };