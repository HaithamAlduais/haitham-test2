import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LandingPage from './landing/LandingPage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import OrganizerHomePage from './pages/OrganizerHomePage'
import ParticipantHomePage from './pages/ParticipantHomePage'
import SessionsPage from './pages/SessionsPage'
import EventsPage from './pages/EventsPage'
import CreateEventPage from './pages/CreateEventPage'
import LiveMonitoringPage from './pages/LiveMonitoringPage'
import EventDetailPage from './pages/EventDetailPage'
import EmailVerifiedPage from './pages/EmailVerifiedPage'
import VerifyEmailHoldingPage from './pages/VerifyEmailHoldingPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import ProfileSettingsPage from './pages/ProfileSettingsPage'
import HackathonPublicPage from './pages/HackathonPublicPage'
import RegistrationFormPage from './pages/RegistrationFormPage'
import TeamFormationPage from './pages/TeamFormationPage'

/**
 * Protects routes by authentication and optionally by role(s).
 * Accepts `requiredRole` (string) or `requiredRoles` (array).
 */
const PrivateRoute = ({ children, requiredRole, requiredRoles }) => {
  const { currentUser, userRole, hasRole, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-sm font-medium text-muted-foreground">Loading…</p>
      </div>
    )
  }
  if (!currentUser) return <Navigate to="/login" replace />

  // Check role access
  const allowed = requiredRoles || (requiredRole ? [requiredRole] : null)
  if (allowed && userRole) {
    const hasAccess = allowed.some((r) => hasRole(r))
    if (!hasAccess) {
      if (userRole === 'Organizer') return <Navigate to="/dashboard" replace />
      if (userRole === 'Judge') return <Navigate to="/dashboard/judge" replace />
      return <Navigate to="/home" replace />
    }
  }

  return children
}

/** Role-aware default redirect for authenticated users. */
const DefaultRedirect = () => {
  const { currentUser, userRole, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-sm font-medium text-muted-foreground">Loading…</p>
      </div>
    )
  }
  if (!currentUser) return <Navigate to="/" replace />
  if (userRole === 'Participant') return <Navigate to="/home" replace />
  if (userRole === 'Judge') return <Navigate to="/dashboard/judge" replace />
  return <Navigate to="/dashboard" replace />
}

function App() {
  return (
    <Routes>
      {/* Landing page — unified organizer + participant marketplace */}
      <Route path="/" element={<LandingPage />} />

      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Login />} />
      <Route path="/email-verified" element={<EmailVerifiedPage />} />
      <Route path="/verify-email" element={<VerifyEmailHoldingPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Participant routes */}
      <Route
        path="/home"
        element={
          <PrivateRoute requiredRole="Participant">
            <ParticipantHomePage />
          </PrivateRoute>
        }
      />

      {/* Organizer routes */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute requiredRole="Organizer">
            <OrganizerHomePage />
          </PrivateRoute>
        }
      />

      <Route
        path="/sessions"
        element={
          <PrivateRoute requiredRole="Organizer">
            <SessionsPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/sessions/:id"
        element={
          <PrivateRoute requiredRole="Organizer">
            <LiveMonitoringPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/events"
        element={
          <PrivateRoute requiredRole="Organizer">
            <EventsPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/events/create"
        element={
          <PrivateRoute requiredRole="Organizer">
            <CreateEventPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/events/:eventId"
        element={
          <PrivateRoute requiredRole="Organizer">
            <EventDetailPage />
          </PrivateRoute>
        }
      />

      {/* Public hackathon pages */}
      <Route path="/hackathon/:slug" element={<HackathonPublicPage />} />
      <Route path="/hackathon/:slug/register" element={<RegistrationFormPage />} />
      <Route path="/hackathon/:slug/teams" element={<TeamFormationPage />} />

      {/* Shared routes (all roles) */}
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <ProfileSettingsPage />
          </PrivateRoute>
        }
      />

      {/* Legacy redirects */}
      <Route path="/organizer" element={<Navigate to="/" replace />} />

      {/* Default redirect */}
      <Route path="*" element={<DefaultRedirect />} />
    </Routes>
  )
}

export default App
