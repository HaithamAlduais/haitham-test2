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
import HackathonsPage from './pages/HackathonsPage'
import ManageHackathonPage from './pages/ManageHackathonPage'
import HackathonPublicPage from './pages/HackathonPublicPage'
import EventPublicPage from './pages/EventPublicPage'
import RegistrationFormPage from './pages/RegistrationFormPage'
import TeamFormationPage from './pages/TeamFormationPage'
import SubmissionFormPage from './pages/SubmissionFormPage'
import JudgePortalPage from './pages/JudgePortalPage'
import ExplorePage from './pages/ExplorePage'
import ProjectGalleryPage from './pages/ProjectGalleryPage'
import AnalyticsDashboardPage from './pages/AnalyticsDashboardPage'
import WorkshopsListPage from './pages/WorkshopsPage'
import WinnerAnnouncementPage from './pages/WinnerAnnouncementPage'
import VotingPage from './pages/VotingPage'
import CertificatePage from './pages/CertificatePage'
import SponsorDashboardPage from './pages/SponsorDashboardPage'
import SponsorPortalPage from './pages/SponsorPortalPage'
import SurveyBuilderPage from './pages/SurveyBuilderPage'
import SurveyResponsePage from './pages/SurveyResponsePage'
import EventLegacyPage from './pages/EventLegacyPage'
import WorkbackDashboardPage from './pages/WorkbackDashboardPage'
import OfficeHoursPage from './pages/OfficeHoursPage'
import PageBuilderPage from './pages/PageBuilderPage'
import AdminTestPage from './pages/AdminTestPage'

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

      {/* Organizer hackathon management */}
      <Route
        path="/hackathons"
        element={
          <PrivateRoute requiredRole="Organizer">
            <HackathonsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/hackathons/:id"
        element={
          <PrivateRoute requiredRole="Organizer">
            <ManageHackathonPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/hackathons/:id/page-builder"
        element={
          <PrivateRoute requiredRole="Organizer">
            <PageBuilderPage />
          </PrivateRoute>
        }
      />

      {/* Public pages — unified event routes */}
      <Route path="/explore" element={<ExplorePage />} />
      <Route path="/event/:id" element={<EventPublicPage />} />
      <Route path="/event/:id/register" element={<RegistrationFormPage />} />
      <Route path="/event/:id/teams" element={<TeamFormationPage />} />
      <Route path="/event/:id/submit" element={<SubmissionFormPage />} />
      <Route path="/event/:id/gallery" element={<ProjectGalleryPage />} />
      <Route path="/event/:id/workshops" element={<WorkshopsListPage />} />
      <Route path="/event/:id/winners" element={<WinnerAnnouncementPage />} />
      <Route path="/event/:id/vote" element={<VotingPage />} />
      <Route path="/event/:id/certificate" element={<CertificatePage />} />
      <Route path="/event/:id/survey/:surveyId" element={<SurveyResponsePage />} />
      <Route path="/event/:id/legacy" element={<EventLegacyPage />} />
      <Route path="/event/:id/office-hours" element={<OfficeHoursPage />} />

      {/* Legacy hackathon routes (backward compat) */}
      <Route path="/hackathon/:slug" element={<HackathonPublicPage />} />
      <Route path="/hackathon/:slug/register" element={<RegistrationFormPage />} />
      <Route path="/hackathon/:slug/teams" element={<TeamFormationPage />} />
      <Route path="/hackathon/:slug/submit" element={<SubmissionFormPage />} />
      <Route path="/hackathon/:slug/gallery" element={<ProjectGalleryPage />} />
      <Route path="/hackathon/:slug/workshops" element={<WorkshopsListPage />} />

      {/* Sponsor routes */}
      <Route
        path="/sponsor/dashboard"
        element={
          <PrivateRoute requiredRoles={["Sponsor", "Organizer"]}>
            <SponsorDashboardPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/sponsor/:id"
        element={
          <PrivateRoute requiredRoles={["Sponsor", "Organizer"]}>
            <SponsorPortalPage />
          </PrivateRoute>
        }
      />

      {/* Survey builder (organizer) */}
      <Route
        path="/hackathons/:id/surveys"
        element={
          <PrivateRoute requiredRole="Organizer">
            <SurveyBuilderPage />
          </PrivateRoute>
        }
      />

      {/* Workback dashboard */}
      <Route
        path="/hackathons/:id/workback"
        element={
          <PrivateRoute requiredRole="Organizer">
            <WorkbackDashboardPage />
          </PrivateRoute>
        }
      />

      {/* Analytics */}
      <Route
        path="/hackathons/:id/analytics"
        element={
          <PrivateRoute requiredRole="Organizer">
            <AnalyticsDashboardPage />
          </PrivateRoute>
        }
      />

      {/* Judge routes */}
      <Route
        path="/dashboard/judge/:hackathonId"
        element={
          <PrivateRoute requiredRoles={["Judge", "Organizer"]}>
            <JudgePortalPage />
          </PrivateRoute>
        }
      />

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

      {/* Admin test page */}
      <Route path="/admin/test" element={<AdminTestPage />} />

      {/* Default redirect */}
      <Route path="*" element={<DefaultRedirect />} />
    </Routes>
  )
}

export default App
