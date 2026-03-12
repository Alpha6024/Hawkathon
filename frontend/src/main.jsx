import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import Hero from './components/hero'
import DoctorConsultation from './components/DocterConsultation'
import VideoCall from './components/videocall'
import DoctorDashboard from './components/dr'
import SymptomChecker from './components/SymptomChecker'
import HealthRecords from './components/HealthRecords'

const router = createBrowserRouter([
  { path: "/",                 element: <Hero /> },
  { path: "/consult",          element: <DoctorConsultation /> },
  { path: "/call/:bookingId",  element: <VideoCall /> },
  { path: "/doctor",           element: <DoctorDashboard /> },
  { path: "/symptoms",         element: <SymptomChecker /> },
  { path: "/records",          element: <HealthRecords /> },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)