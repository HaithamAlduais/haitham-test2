import { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { apiGet, apiPost } from '../utils/apiClient';
import useHomepageStats from '../hooks/useHomepageStats';
import NewSessionModal from '../components/sessions/NewSessionModal';
import { DashboardLayout } from '../components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Plus, ArrowUpRight, TrendingUp } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

const ProviderHomePage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { activeSessionCount, totalEventCount, refetchActiveSessions } = useHomepageStats();
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [toast, setToast] = useState(null);

  const fetchEvents = useCallback(async () => {
    try { const data = await apiGet('/api/events'); setEvents(data.data ?? []); } catch { /* optional */ }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleCreateSession = async (data) => {
    try {
      await apiPost('/api/sessions', data);
      setIsNewSessionModalOpen(false);
      refetchActiveSessions();
      showToast(t('sessionCreated'));
    } catch (err) { showToast(err.message || t('sessionCreateFailed'), 'error'); throw err; }
  };

  const handleOpenNewSessionModal = () => { fetchEvents(); setIsNewSessionModalOpen(true); };

  return (
    <DashboardLayout activePath="/dashboard">
      {/* Title row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-black text-foreground">{t('heroTitle')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('heroSubtitle')}</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleOpenNewSessionModal}><Plus className="h-4 w-4" /> {t('newSession')}</Button>
          <Button variant="neutral" onClick={() => navigate('/events?new=true')}>{t('newEvent')}</Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label={t('sessions')} value={activeSessionCount ?? '-'} accent live={activeSessionCount > 0 && activeSessionCount !== '-'} />
        <StatCard label={t('events')} value={totalEventCount ?? '-'} />
        <StatCard label={t('account')} value="—" small />
        <StatCard label={t('settingsNav')} value="—" />
      </div>

      {/* Chart */}
      <DashboardChart t={t} />

      {/* Two-column */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 flex flex-col gap-4">
          <FeatureCard to="/sessions" title={t('sessions')} desc={t('sessionsDescription')} cta={t('goToSessions')} live={activeSessionCount > 0 && activeSessionCount !== '-'} />
          <FeatureCard to="/events" title={t('events')} desc={t('eventsDescription')} cta={t('goToEvents')} count={totalEventCount} />
          <FeatureCard to="/settings" title={t('account')} desc={t('accountDescription')} cta={t('goToAccount')} />
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-sm font-black uppercase text-foreground">{t('events')}</h3>
              <Link to="/events" className="text-xs font-bold text-main hover:underline">{t('goToEvents')} →</Link>
            </div>
            {events.length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">{t('noEventsYet')}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {events.slice(0, 6).map((ev) => (
                  <Link key={ev.id} to={`/events/${ev.id}`} className="flex items-center justify-between rounded-base border-2 border-border bg-background px-3 py-2.5 hover:shadow-shadow transition-shadow duration-100 group">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate group-hover:text-main transition-colors">{ev.title || ev.name}</p>
                      <p className="text-[10px] text-muted-foreground">{ev.eventType || ev.type || '—'}</p>
                    </div>
                    <span className={`shrink-0 rounded-base border-2 px-2 py-0.5 text-[10px] font-bold uppercase ${ev.status === 'active' || ev.status === 'published' ? 'border-main bg-main/10 text-main' : 'border-border text-muted-foreground'}`}>
                      {ev.status || 'draft'}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {isNewSessionModalOpen && (
        <NewSessionModal isOpen={isNewSessionModalOpen} onClose={() => setIsNewSessionModalOpen(false)} onSubmit={handleCreateSession} events={events} />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 end-6 z-[60] rounded-base border-2 px-5 py-3 text-sm font-bold shadow-shadow ${toast.type === 'error' ? 'border-destructive bg-background text-destructive' : 'border-main bg-background text-foreground'}`}>
          {toast.message}
        </div>
      )}
    </DashboardLayout>
  );
};

function StatCard({ label, value, accent, live, small }) {
  return (
    <div className={`rounded-base border-2 border-border p-4 shadow-shadow ${accent ? 'bg-main text-main-foreground' : 'bg-secondary-background'}`}>
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-bold uppercase tracking-widest ${accent ? 'text-main-foreground/70' : 'text-muted-foreground'}`}>{label}</span>
        <div className={`flex h-7 w-7 items-center justify-center rounded-base ${accent ? 'bg-main-foreground/15' : 'border border-border'}`}>
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
        </div>
      </div>
      <span className={`block mt-2 font-heading font-black leading-none ${small ? 'text-xl' : 'text-4xl'} ${accent ? '' : 'text-foreground'}`}>{value}</span>
      {live && <span className={`mt-1 inline-block text-[11px] font-bold ${accent ? 'text-main-foreground/80' : 'text-main'}`}>● LIVE</span>}
    </div>
  );
}

function FeatureCard({ to, title, desc, cta, live, count }) {
  return (
    <Link to={to} className="rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none active:translate-x-boxShadowX active:translate-y-boxShadowY active:shadow-none transition-all duration-100 group">
      <div className="flex items-start justify-between mb-3">
        <span className="font-heading text-base font-black text-foreground group-hover:text-main transition-colors">{title}</span>
        {live && <span className="relative flex h-2.5 w-2.5 mt-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-main opacity-40" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-main" /></span>}
        {count !== undefined && count !== null && <span className="rounded-base border-2 border-border bg-background px-2 py-0.5 text-xs font-bold text-muted-foreground">{count}</span>}
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{desc}</p>
      <span className="text-xs font-bold uppercase text-main">{cta} →</span>
    </Link>
  );
}

const chartData = [
  { month: "January", sessions: 186, events: 80 },
  { month: "February", sessions: 305, events: 200 },
  { month: "March", sessions: 237, events: 120 },
  { month: "April", sessions: 73, events: 190 },
  { month: "May", sessions: 209, events: 130 },
  { month: "June", sessions: 214, events: 140 },
];

function DashboardChart({ t }) {
  const chartConfig = {
    sessions: { label: t('chartSessions'), color: "var(--chart-1)" },
    events: { label: t('chartEvents'), color: "var(--chart-2)" },
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{t('chartTitle')}</CardTitle>
        <CardDescription>{t('chartDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 3)} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
            <Area dataKey="events" type="natural" fill="var(--color-events)" stroke="var(--color-events)" fillOpacity={0.4} stackId="a" />
            <Area dataKey="sessions" type="natural" fill="var(--color-sessions)" stroke="var(--color-sessions)" fillOpacity={0.4} stackId="a" />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-bold text-foreground">
              {t('chartTrendingUp')} <TrendingUp className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              {t('chartDateRange')}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

export default ProviderHomePage;
