import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { API } from './config/api'

// Instantly warm up API connection on app boot
try {
  fetch(`${API}/health`).catch(() => {});
} catch {}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
