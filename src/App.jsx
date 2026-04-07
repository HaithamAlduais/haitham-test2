import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LandingPage from './landing/LandingPage'
import LandingOrganizerPage from './landing/LandingOrganizerPage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ProviderHomePage from './pages/ProviderHomePage'
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

// Protects routes by authentication and optionally by role.
// If not authenticated, redirects to /login.
// If requiredRole is set and the user's role doesn't match,
// redirects to the appropriate home page for their role.
const PrivateRoute = ({ children, requiredRole }) => {
  const { currentUser, userRole, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-sm font-medium text-muted-foreground">Loading…</p>
      </div>
    )
  }
  if (!currentUser) return <Navigate to="/login" replace />
  if (requiredRole && userRole && userRole !== requiredRole) {
    return <Navigate to={userRole === 'Provider' ? '/dashboard' : '/home'} replace />
  }
  return children
}

// Role-aware default redirect for authenticated users.
// Authenticated Providers go to /dashboard, Participants to /home.
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
  return <Navigate to="/dashboard" replace />
}

function App() {
  return (
    <Routes>
      {/* Landing page as default route */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/organizer" element={<LandingOrganizerPage />} />
      
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

      {/* Provider routes */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute requiredRole="Provider">
            <ProviderHomePage />
          </PrivateRoute>
        }
      />

      <Route
        path="/sessions"
        element={
          <PrivateRoute requiredRole="Provider">
            <SessionsPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/sessions/:id"
        element={
          <PrivateRoute requiredRole="Provider">
            <LiveMonitoringPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/events"
        element={
          <PrivateRoute requiredRole="Provider">
            <EventsPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/events/create"
        element={
          <PrivateRoute requiredRole="Provider">
            <CreateEventPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/events/:eventId"
        element={
          <PrivateRoute requiredRole="Provider">
            <EventDetailPage />
          </PrivateRoute>
        }
      />

      {/* Shared routes (both roles) */}
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <ProfileSettingsPage />
          </PrivateRoute>
        }
      />

      {/* Default redirect */}
      <Route path="*" element={<DefaultRedirect />} />
    </Routes>
  )
}

export default App
