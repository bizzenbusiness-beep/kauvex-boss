import React from 'react'
import ReactDOM from 'react-dom/client'
import KauvexOps from './App.jsx'
import { RegistrationForm } from './App.jsx'

const isRegisterPage = window.location.pathname.replace(/\/+$/, "") === "/register";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isRegisterPage ? <RegistrationForm /> : <KauvexOps />}
  </React.StrictMode>,
)
