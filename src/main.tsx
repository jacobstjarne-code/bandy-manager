import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/global.css'

if (import.meta.env.DEV || import.meta.env.VITE_AUDIT_ENABLED === 'true') {
  import('./debug/designAudit').then(m => {
    ;(window as any).__designAudit = m.runAudit
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
