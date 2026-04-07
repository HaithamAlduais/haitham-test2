import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { apiGet, apiPost } from "@/utils/apiClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Plus, Copy } from "lucide-react";

function TeamCard({ team, hackathonId, onRefresh }) {
  const maxSize = team.memberCount >= 5 ? team.memberCount : 5;
  const spotsLeft = maxSize - (team.memberCount || 1);
  const [requesting, setRequesting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const handleRequestJoin = async () => {
    setRequesting(true);
    try {
      await apiPost(`/api/events/${hackathonId}/teams/${team.id}/request`, { role: "member" });
      setRequestSent(true);
    } catch (err) {
      console.error(err);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="rounded-base border-2 border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between">
        <h3 className="font-bold text-foreground">{team.name}</h3>
        <Badge variant={spotsLeft > 0 ? "outline" : "secondary"}>
          {spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft > 1 ? "s" : ""} left` : "Full"}
        </Badge>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        {team.memberCount || 1} member{(team.memberCount || 1) > 1 ? "s" : ""}
      </div>
      {/* Role status indicators */}
      {team.roleCounts && (
        <div className="flex flex-wrap gap-1.5">
          {[
            { key: "pm", label: "PM", icon: "📋" },
            { key: "developer", label: "Dev", icon: "💻" },
            { key: "designer", label: "Design", icon: "🎨" },
          ].map((r) => {
            const filled = (team.roleCounts?.[r.key] || 0) > 0;
            return (
              <span
                key={r.key}
                className={`inline-flex items-center gap-1 rounded-base border px-2 py-0.5 text-xs font-bold ${
                  filled ? "border-main bg-main/10 text-main" : "border-border bg-muted text-muted-foreground"
                }`}
              >
                {r.icon} {r.label} {filled ? "✓" : "—"}
              </span>
            );
          })}
        </div>
      )}
      {team.track && <Badge variant="outline">{team.track}</Badge>}
      {/* Request to Join button */}
      {spotsLeft > 0 && team.isOpen && (
        <div>
          {requestSent ? (
            <p className="text-xs text-main font-bold">Request sent! Waiting for captain.</p>
          ) : (
            <Button size="sm" variant="neutral" onClick={handleRequestJoin} disabled={requesting}>
              {requesting ? "Sending..." : "Request to Join"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

const ROLE_OPTIONS = [
  { value: "pm", label: "Product Manager", icon: "📋" },
  { value: "developer", label: "Developer", icon: "💻" },
  { value: "designer", label: "Designer", icon: "🎨" },
];

function RoleSelector({ value, onChange }) {
  return (
    <div className="space-y-2">
      <Label>Your Role</Label>
      <div className="flex flex-wrap gap-2">
        {ROLE_OPTIONS.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => onChange(r.value)}
            className={`flex items-center gap-1.5 rounded-base border-2 px-3 py-1.5 text-sm font-bold transition-colors ${
              value === r.value
                ? "bg-main text-main-foreground border-border shadow-neo-sm"
                : "bg-card text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            <span>{r.icon}</span> {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function TeamFormationPage() {
  const { slug, id: eventId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { dir } = useLanguage();

  const [hackathon, setHackathon] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [createRole, setCreateRole] = useState("pm");
  const [joinRole, setJoinRole] = useState("developer");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const refreshTeams = async (hId) => {
    try {
      const data = await apiGet(`/api/events/${hId}/teams`);
      setTeams(data.data || []);
    } catch {
      /* no teams yet */
    }
  };

  useEffect(() => {
    if (!currentUser) { navigate("/login"); return; }

    fetch(eventId ? `/api/events/public/${eventId}` : `/api/hackathons/public/${slug}`)
      .then((res) => res.json())
      .then(async (h) => {
        setHackathon(h);
        await refreshTeams(h.id);
      })
      .catch(() => setError("Hackathon not found."))
      .finally(() => setLoading(false));
  }, [slug, currentUser, navigate]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!hackathon || !newTeamName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await apiPost(`/api/events/${hackathon.id}/teams`, { name: newTeamName, role: createRole });
      setMessage(`Team created! Share code: ${result.code}`);
      setShowCreateForm(false);
      setNewTeamName("");
      await refreshTeams(hackathon.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    if (!hackathon || !joinCode.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await apiPost(`/api/events/${hackathon.id}/teams/join`, { code: joinCode, role: joinRole });
      setMessage(`Joined team: ${result.teamName}`);
      setShowJoinForm(false);
      setJoinCode("");
      await refreshTeams(hackathon.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground" dir={dir}>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate(`/hackathon/${slug}`)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to {hackathon?.title}
        </button>

        <h1 className="text-2xl font-black text-foreground mb-2">Team Formation</h1>
        <p className="text-muted-foreground mb-8">Create a new team or join an existing one.</p>

        {error && (
          <div className="mb-6 rounded-base border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-6 rounded-base border border-main bg-main/10 p-3 text-sm text-foreground font-bold">
            {message}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mb-8">
          <Button onClick={() => { setShowCreateForm(true); setShowJoinForm(false); }}>
            <Plus className="h-4 w-4" /> Create Team
          </Button>
          <Button variant="neutral" onClick={() => { setShowJoinForm(true); setShowCreateForm(false); }}>
            Join with Code
          </Button>
        </div>

        {/* Create form */}
        {showCreateForm && (
          <form onSubmit={handleCreateTeam} className="mb-8 rounded-base border-2 border-border p-4 space-y-4">
            <h3 className="font-bold text-foreground">Create a New Team</h3>
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Enter team name"
              />
            </div>
            <RoleSelector value={createRole} onChange={setCreateRole} />
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting || !newTeamName.trim()}>
                {submitting ? "Creating..." : "Create"}
              </Button>
              <Button type="button" variant="neutral" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Join form */}
        {showJoinForm && (
          <form onSubmit={handleJoinTeam} className="mb-8 rounded-base border-2 border-border p-4 space-y-4">
            <h3 className="font-bold text-foreground">Join a Team</h3>
            <div className="space-y-2">
              <Label htmlFor="join-code">Team Invite Code</Label>
              <Input
                id="join-code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Enter 6-character code"
                maxLength={6}
              />
            </div>
            <RoleSelector value={joinRole} onChange={setJoinRole} />
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting || !joinCode.trim()}>
                {submitting ? "Joining..." : "Join"}
              </Button>
              <Button type="button" variant="neutral" onClick={() => setShowJoinForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Teams list */}
        <h2 className="text-xl font-black text-foreground mb-4">Teams ({teams.length})</h2>
        {teams.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <TeamCard key={team.id} team={team} hackathonId={hackathon?.id} onRefresh={() => refreshTeams(hackathon?.id)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 rounded-base border-2 border-dashed border-border">
            <p className="text-muted-foreground">No teams yet. Be the first to create one!</p>
          </div>
        )}
      </div>
    </div>
  );
}
