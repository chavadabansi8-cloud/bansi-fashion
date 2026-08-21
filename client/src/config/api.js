const getApiUrl = () => {
  let baseUrl = import.meta.env.VITE_API_URL || '';
  
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    baseUrl = 'http://localhost:5000/api';
  }

  if (!baseUrl) {
    baseUrl = 'https://bansi-fashion.onrender.com/api';
  }

  const clean = baseUrl.replace(/\/$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

export const API = getApiUrl();

