const API_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' ? window.location.origin + '/api' : '/api');

export const API_BASE_URL = API_URL;
