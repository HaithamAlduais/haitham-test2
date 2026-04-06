import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import EventCreationFlow from "../components/events/EventCreationFlow";

/**
 * Ramsha — CreateEventPage
 *
 * Landing page that triggers the event creation flow.
 * Can be accessed directly via /events/create or opened as a modal from EventsPage.
 */
const CreateEventPage = () => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [flowOpen, setFlowOpen] = useState(true); // Auto-open on mount

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleFlowClose = () => {
    setFlowOpen(false);
    navigate("/events");
  };

  return (
    <div className="flex flex-col min-h-screen bg-background bg-grid">
      {/* ───── Navbar ───── */}
      <header className="h-16 border-b-2 border-border bg-secondary-background flex items-center justify-between px-6 md:px-12 sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-foreground text-background font-heading font-black text-sm flex items-center justify-center">
            R
          </div>
          <span className="font-heading font-black text-foreground">Ramsha</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline font-mono text-sm text-muted-foreground">
            {currentUser?.email}
          </span>
          <span className="border border-main text-main font-mono font-bold text-xs uppercase tracking-[0.12em] px-2 py-0.5">
            {userRole ?? "..."}
          </span>
          <button
            onClick={handleLogout}
            className="font-mono font-bold text-xs uppercase tracking-[0.08em] border-2 border-destructive text-destructive px-3 py-1.5 hover:bg-destructive hover:text-background transition-colors duration-100"
          >
            LOG OUT
          </button>
        </div>
      </header>

      {/* Event Creation Flow Modal */}
      <EventCreationFlow isOpen={flowOpen} onClose={handleFlowClose} />
    </div>
  );
};

export default CreateEventPage;
