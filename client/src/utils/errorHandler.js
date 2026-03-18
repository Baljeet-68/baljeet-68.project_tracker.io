import toast from 'react-hot-toast';

/**
 * Centralized error handler for API and Validation errors
 */
export const handleError = (error, type = 'api') => {
  if (error.name === 'AbortError') return;

  if (import.meta.env.DEV) {
    console.error(`[${type.toUpperCase()} Error]:`, error);
  }

  const message = error.message || 'An unexpected error occurred. Please try again.';

  if (type === 'api') {
    toast.error(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#fff',
        color: '#334155',
        borderRadius: '16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        padding: '16px',
        fontSize: '14px',
        fontWeight: '500',
        border: '1px solid #fee2e2',
      },
      iconTheme: {
        primary: '#ef4444',
        secondary: '#fff',
      },
    });
  }

  return message;
};

/**
 * Specialized handler for API responses
 */
export const handleApiResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = 'Network response was not ok';
    try {
      const data = await response.json();
      errorMessage = data.error || data.message || errorMessage;
    } catch (e) {
      // Fallback if response is not JSON
      if (response.status === 401) errorMessage = 'Unauthorized access. Please login again.';
      if (response.status === 403) errorMessage = 'You do not have permission to perform this action.';
      if (response.status === 404) errorMessage = 'Requested resource not found.';
      if (response.status >= 500) errorMessage = 'Server error. Please try again later.';
    }
    
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }
  return response.json();
};

/**
 * Validation utility for common fields
 */
export const validateField = (name, value) => {
  switch (name) {
    case 'email':
      if (!value) return 'Email is required';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return 'Please enter a valid email address';
      return '';
    case 'password':
      if (!value) return 'Password is required';
      if (value.length < 6) return 'Password must be at least 6 characters';
      return '';
    default:
      return '';
  }
};
