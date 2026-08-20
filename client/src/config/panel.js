export const APP_PANEL = import.meta.env.VITE_APP_PANEL || 'all';

export const isAdminPanel = APP_PANEL === 'admin';
export const isWorkerPanel = APP_PANEL === 'worker';

export const PANEL_HOME = isAdminPanel ? '/admin' : '/dashboard';
export const PANEL_ROLE = isAdminPanel ? 'admin' : 'worker';
