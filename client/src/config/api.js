const getApiUrl = () => {
  let baseUrl = import.meta.env.VITE_API_URL || '';

  if (!baseUrl && typeof window !== 'undefined') {
    const isCapacitorApp = !!window.Capacitor || window.location.protocol === 'capacitor:';
    const host = window.location.hostname;
    const isLocal =
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host.startsWith('172.') ||
      window.location.port === '5173' ||
      window.location.port === '3000';

    if (isCapacitorApp) {
      baseUrl = 'https://bansi-fashion.onrender.com/api';
    } else if (isLocal) {
      baseUrl = `http://${host}:5000/api`;
    }
  }

  if (!baseUrl) {
    baseUrl = 'https://bansi-fashion.onrender.com/api';
  }

  const clean = baseUrl.replace(/\/$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

export const API = getApiUrl();


