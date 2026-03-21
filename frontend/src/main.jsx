import { registerSW } from 'virtual:pwa-register'
registerSW({ immediate: true })
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import Layout from './components/Layout'
import Hero from './components/hero'
import DoctorConsultation from './components/DocterConsultation'
import VideoCall from './components/videocall'
import DoctorDashboard from './components/dr'
import SymptomChecker from './components/SymptomChecker'
import HealthRecords from './components/HealthRecords'
import PatientAuth from './components/Patientauth'
import DoctorAuth from './components/Docterauth'
import NearbyMedicals from './components/Nearbymedicals'
import BlockchainDashboard from './components/Blockchaindashboard'
import Prescription from './components/Prescription'

function ErrorFallback() {
  return (
    <div style={{ minHeight: "100vh", background: "#020617", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px" }}>
      <div style={{ fontSize: "48px" }}>⚠️</div>
      <p style={{ color: "#94a3b8", fontSize: "14px" }}>Something went wrong. Please refresh the page.</p>
      <button onClick={() => window.location.href = "/"} style={{ background: "#059669", color: "white", border: "none", padding: "10px 24px", borderRadius: "12px", cursor: "pointer", fontSize: "14px" }}>
        Go Home
      </button>
    </div>
  )
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <ErrorFallback />,
    children: [
      { path: "/",                      element: <Hero /> },
      { path: "/patient-auth",          element: <PatientAuth /> },
      { path: "/doctor-auth",           element: <DoctorAuth /> },
      { path: "/consult",               element: <DoctorConsultation /> },
      { path: "/call/:bookingId",       element: <VideoCall /> },
      { path: "/doctor",                element: <DoctorDashboard /> },
      { path: "/prescription/:bookingId", element: <Prescription /> },
      { path: "/symptoms",              element: <SymptomChecker /> },
      { path: "/records",               element: <HealthRecords /> },
      { path: "/medical-stores",        element: <NearbyMedicals /> },
      { path: "/blockchain",            element: <BlockchainDashboard /> },
    ]
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)