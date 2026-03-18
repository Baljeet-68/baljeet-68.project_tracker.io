// Simple auth helpers (client-side)
export function saveToken(token) {
  localStorage.setItem('token', token);
}

export function getToken() {
  return localStorage.getItem('token');
}

export function clearToken() {
  localStorage.removeItem('token');
}

export async function authFetch(url, options = {}) {
  const token = getToken();
  const headers = options.headers || {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (options.method && options.method !== 'GET' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    clearToken();
    clearUser();
    
    // Centralized redirect to login if not already there
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login?expired=true';
    }
    
    throw new Error('Unauthorized: Token expired or invalid');
  }

  return response;
}

export function saveUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user'))
  } catch (e) { return null }
}

export function clearUser() {
  localStorage.removeItem('user')
}
