import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Zap, Globe, Moon, Sun, LayoutDashboard, CalendarDays, Settings, LogOut, Bell, Search, Users, Trophy } from 'lucide-react';

/**
 * Shared dashboard shell: sidebar + top bar + mobile bottom nav.
 * Used by ProviderHomePage, SessionsPage, EventsPage, ProfileSettingsPage.
 */
export function DashboardLayout({ children, activePath }) {
  const { currentUser, userRole, logout } = useAuth();
  const { t, lang, setLang, dir } = useLanguage();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const active = activePath || location.pathname;
  const handleSignOut = async () => { await logout(); navigate('/login'); };
  const userInitial = currentUser?.email?.[0]?.toUpperCase() ?? '?';
  const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || '';

  const navItems = [
    { icon: LayoutDashboard, label: t('dashboard'), path: '/dashboard' },
    { icon: Trophy, label: 'Hackathons', path: '/hackathons' },
    { icon: CalendarDays, label: t('sessions'), path: '/sessions' },
    { icon: Users, label: t('events'), path: '/events' },
    { icon: Settings, label: t('settingsNav'), path: '/settings' },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground" dir={dir}>
      {/* ═══════ Sidebar ═══════ */}
      <aside className="hidden md:flex md:flex-col w-60 shrink-0 border-e-2 border-border bg-secondary-background">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-base border-2 border-border bg-main shadow-neo-sm">
            <Zap className="h-4 w-4 text-main-foreground" strokeWidth={3} />
          </div>
          <span className="font-heading text-xl font-black tracking-tight">Ramsha</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 px-3 flex-1">
          {navItems.map((item) => {
            const isActive = active === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 rounded-base px-3.5 py-2.5 text-start text-sm transition-colors duration-100 ${
                  isActive
                    ? 'bg-main text-main-foreground font-bold border-2 border-border shadow-neo-sm'
                    : 'text-muted-foreground hover:bg-card font-medium'
                }`}
              >
                <item.icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.5 : 1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="mt-4 border-t border-border pt-4">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 rounded-base px-3.5 py-2.5 text-start text-sm text-muted-foreground hover:bg-card font-medium w-full transition-colors duration-100"
            >
              <LogOut className="h-[18px] w-[18px]" strokeWidth={1.8} />
              <span>{t('logOut')}</span>
            </button>
          </div>
        </nav>

        {/* User card */}
        <div className="border-t-2 border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-base border-2 border-border bg-main text-sm font-black text-main-foreground shadow-neo-sm">
              {userInitial}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{userName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{currentUser?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ═══════ Main column ═══════ */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* ── Top bar ── */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b-2 border-border bg-secondary-background px-6">
          <div className="hidden sm:flex items-center gap-2 rounded-base border-2 border-border bg-background px-3 py-2 w-72">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t('dashboard')}...</span>
          </div>

          <div className="flex items-center gap-2 ms-auto">
            <Button variant="nav" size="icon" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} aria-label={t('nav.language')}>
              <Globe className="h-4 w-4" />
            </Button>
            <Button variant="nav" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="nav" size="icon">
              <Bell className="h-4 w-4" />
            </Button>
            <div className="hidden sm:flex items-center gap-2.5 ms-2">
              <div className="flex flex-col items-end text-end">
                <span className="text-sm font-bold text-foreground">{userName}</span>
                <span className="text-[11px] text-muted-foreground">{currentUser?.email}</span>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-base border-2 border-border bg-main text-sm font-black text-main-foreground shadow-neo-sm">
                {userInitial}
              </div>
            </div>
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 overflow-y-auto px-6 md:px-8 py-6 md:py-8 pb-20 md:pb-8">
          {children}
        </main>
      </div>

      {/* ═══════ Mobile bottom nav ═══════ */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t-2 border-border bg-secondary-background flex">
        {navItems.map((item) => {
          const isActive = active === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex-1 min-h-[44px] py-2 text-xs font-bold uppercase tracking-wide text-center ${
                isActive ? 'text-main border-t-[3px] border-t-main -mt-[2px]' : 'text-muted-foreground'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
