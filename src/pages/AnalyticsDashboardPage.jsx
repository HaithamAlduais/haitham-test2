import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiGet } from "@/utils/apiClient";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, FileText, Trophy, Star } from "lucide-react";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from "recharts";

function StatCard({ label, value, icon: Icon, color = "text-main" }) {
  const animated = useAnimatedNumber(value);
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase mb-1">
          <Icon className={`h-3.5 w-3.5 ${color}`} /> {label}
        </div>
        <p className="text-2xl font-black text-foreground">{animated}</p>
      </CardContent>
    </Card>
  );
}

const COLORS = ["#4f46e5", "#06b6d4", "#f59e0b", "#ef4444", "#10b981", "#8b5cf6"];

export default function AnalyticsDashboardPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [hackathon, setHackathon] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [teams, setTeams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [h, regs, t, subs] = await Promise.all([
        apiGet(`/api/hackathons/${id}`),
        apiGet(`/api/hackathons/${id}/registrations`).catch(() => ({ data: [] })),
        apiGet(`/api/hackathons/${id}/teams/admin/all`).catch(() => ({ data: [] })),
        apiGet(`/api/hackathons/${id}/submissions`).catch(() => ({ data: [] })),
      ]);
      setHackathon(h);
      setRegistrations(regs.data || []);
      setTeams(t.data || []);
      setSubmissions(subs.data || []);
    } catch {
      navigate("/hackathons");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading || !hackathon) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Compute analytics
  const regByStatus = ["pending", "accepted", "rejected", "waitlisted"].map((s) => ({
    name: s,
    value: registrations.filter((r) => r.status === s).length,
  })).filter((d) => d.value > 0);

  const teamByStatus = ["forming", "complete", "submitted", "accepted"].map((s) => ({
    name: s,
    value: teams.filter((t) => t.status === s).length,
  })).filter((d) => d.value > 0);

  const subByStatus = ["draft", "submitted", "under_review", "evaluated"].map((s) => ({
    name: s,
    value: submissions.filter((sub) => sub.status === s).length,
  })).filter((d) => d.value > 0);

  const topProjects = [...submissions]
    .filter((s) => s.totalScore != null)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 5)
    .map((s) => ({ name: s.projectName?.substring(0, 20) || "Untitled", score: Math.round(s.totalScore) }));

  const acceptedCount = registrations.filter((r) => r.status === "accepted").length;
  const submissionRate = acceptedCount > 0
    ? Math.round((submissions.length / acceptedCount) * 100)
    : 0;

  return (
    <DashboardLayout activePath="/hackathons">
      <button
        onClick={() => navigate(`/hackathons/${id}`)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to {hackathon.title}
      </button>

      <h1 className="font-heading text-2xl font-black text-foreground mb-6">
        Analytics — {hackathon.title}
      </h1>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <StatCard label="Registrations" value={registrations.length} icon={FileText} />
        <StatCard label="Accepted" value={acceptedCount} icon={Users} color="text-green-600" />
        <StatCard label="Teams" value={teams.length} icon={Users} />
        <StatCard label="Submissions" value={submissions.length} icon={Trophy} />
        <StatCard label="Submit Rate" value={submissionRate} icon={Star} color="text-amber-500" />
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Registration status */}
        {regByStatus.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Registration Status</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[200px]">
                <PieChart>
                  <Pie data={regByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={(e) => `${e.name}: ${e.value}`}>
                    {regByStatus.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Top projects */}
        {topProjects.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Top Projects by Score</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[200px]">
                <BarChart data={topProjects}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="score" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Submission status */}
        {subByStatus.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Submission Status</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {subByStatus.map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm capitalize">{s.name.replace("_", " ")}</span>
                    </div>
                    <span className="text-sm font-bold">{s.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team status */}
        {teamByStatus.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Team Status</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {teamByStatus.map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm capitalize">{s.name}</span>
                    </div>
                    <span className="text-sm font-bold">{s.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
