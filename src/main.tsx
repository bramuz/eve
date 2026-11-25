import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
// Se registra al inicio para no perder el aviso de instalación de Chrome.
import './utils/installPrompt'

// Mount React app
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
