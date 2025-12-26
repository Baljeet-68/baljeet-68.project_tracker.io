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
  headers['Content-Type'] = 'application/json';
  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    clearToken();
    clearUser();
    // Optionally, you could redirect here if auth.js had access to history/navigate
    // For now, we'll let the calling component handle the redirect.
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
