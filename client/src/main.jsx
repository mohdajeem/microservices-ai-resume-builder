// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import App from './App.jsx'

// createRoot(document.getElementById('root')).render(
//   // <StrictMode>
//   //   <App />
//   // </StrictMode>,
// )

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
// ✅ IMPORT YOUR AUTH PROVIDER
import { AuthProvider } from './context/AuthContext' 
import { ToastProvider } from './context/ToastContext'; // <--- Import this


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* ✅ WRAP APP WITH AUTH PROVIDER HERE */}
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>

    </BrowserRouter>
  </React.StrictMode>,
)