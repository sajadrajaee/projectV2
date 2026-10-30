// import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
//  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  // /* </React.StrictMode>, // check if strictmode actually cause double request to the endpoint */
)