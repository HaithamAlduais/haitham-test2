import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

/**
 * ParticipantHomePage — landing page for Participant users in Ramsha.
 *
 * Provides session join functionality and account overview.
 * This is a placeholder that will be expanded with full Participant features.
 */
const ParticipantHomePage = () => {
  const { currentUser, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
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
            Participant
          </span>
          <button
            onClick={handleLogout}
            className="font-mono font-bold text-xs uppercase tracking-[0.08em] border-2 border-destructive text-destructive px-3 py-1.5 hover:bg-destructive hover:text-background transition-colors duration-100"
          >
            {t('logOut')}
          </button>
        </div>
      </header>

      {/* ───── Main Content ───── */}
      <main className="flex-grow flex items-center justify-center px-6 py-12">
        <div className="border-2 border-border bg-secondary-background p-12 text-center max-w-lg w-full">
          <h1 className="font-heading font-black text-3xl text-foreground mb-4">
            {t('welcomeParticipant')}
          </h1>
          <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-6">
            {t('signedInAs')}{" "}
            <span className="text-foreground font-bold">
              {currentUser?.email}
            </span>
            . {t('participantJoinHint')}
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            {t('participantComingSoon')}
          </p>
        </div>
      </main>

      {/* ───── Footer ───── */}
      <footer className="mt-auto py-6 pb-20 md:pb-6 text-center">
        <p className="font-mono text-xs text-muted-foreground">
          &copy; {t('copyright')}
        </p>
      </footer>

      {/* ───── Mobile Bottom Nav ───── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t-2 border-border bg-secondary-background flex">
        <button
          className="flex-1 min-h-[44px] py-2 font-mono font-bold text-xs uppercase tracking-[0.08em] text-center text-main border-t-[3px] border-t-main -mt-[2px]"
        >
          {t('dashboard')}
        </button>
        <button
          onClick={() => navigate('/settings')}
          className="flex-1 min-h-[44px] py-2 font-mono font-bold text-xs uppercase tracking-[0.08em] text-center text-muted-foreground"
        >
          {t('settingsNav')}
        </button>
      </nav>
    </div>
  );
};

export default ParticipantHomePage;
