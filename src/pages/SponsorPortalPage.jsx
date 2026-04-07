import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiGet } from "@/utils/apiClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function ParticipantsTab({ eventId }) {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skillsFilter, setSkillsFilter] = useState("");
  const [error, setError] = useState(null);

  const fetchParticipants = (skills = "") => {
    setLoading(true);
    const query = skills ? `?skills=${encodeURIComponent(skills)}` : "";
    apiGet(`/api/sponsor/${eventId}/participants${query}`)
      .then((data) => setParticipants(data.participants || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchParticipants();
  }, [eventId]);

  const handleFilter = () => {
    fetchParticipants(skillsFilter);
  };

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Filter by skills (comma-separated, e.g. python,react)"
          value={skillsFilter}
          onChange={(e) => setSkillsFilter(e.target.value)}
          className="border-2 border-border"
        />
        <Button onClick={handleFilter} className="font-black">
          Filter
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-base border-2 border-red-400 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading participants...</p>
      ) : participants.length === 0 ? (
        <p className="text-sm text-muted-foreground">No consented participants found.</p>
      ) : (
        <div className="overflow-x-auto rounded-base border-2 border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b-2 border-border bg-muted">
              <tr>
                <th className="px-4 py-3 font-black">Name</th>
                <th className="px-4 py-3 font-black">Email</th>
                <th className="px-4 py-3 font-black">Skills</th>
                <th className="px-4 py-3 font-black">Experience</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => (
                <tr key={p.uid} className="border-b border-border">
                  <td className="px-4 py-3">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.skills.map((s) => (
                        <Badge key={s} variant="outline" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">{p.experienceLevel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatsTab({ eventId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet(`/api/sponsor/${eventId}/stats`)
      .then((data) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading stats...</p>;
  if (!stats) return <p className="text-sm text-muted-foreground">Failed to load stats.</p>;

  const maxSkillCount = Math.max(...Object.values(stats.skillDistribution || {}), 1);
  const maxExpCount = Math.max(...Object.values(stats.experienceLevels || {}), 1);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Registrants", value: stats.totalRegistrants },
          { label: "Teams", value: stats.totalTeams },
          { label: "Submissions", value: stats.totalSubmissions },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-base border-2 border-border bg-card p-4 text-center shadow-neo-sm"
          >
            <p className="text-2xl font-black text-foreground">{item.value}</p>
            <p className="text-sm text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Skill distribution */}
      <div className="rounded-base border-2 border-border bg-card p-4 shadow-neo-sm">
        <h3 className="mb-3 text-lg font-black">Skill Distribution</h3>
        {Object.keys(stats.skillDistribution || {}).length === 0 ? (
          <p className="text-sm text-muted-foreground">No skill data available.</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(stats.skillDistribution)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 15)
              .map(([skill, count]) => (
                <div key={skill} className="flex items-center gap-2">
                  <span className="w-24 truncate text-sm font-medium">{skill}</span>
                  <div className="flex-1 rounded-base border border-border bg-muted">
                    <div
                      className="h-5 rounded-base bg-primary"
                      style={{ width: `${(count / maxSkillCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm text-muted-foreground">{count}</span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Experience levels */}
      <div className="rounded-base border-2 border-border bg-card p-4 shadow-neo-sm">
        <h3 className="mb-3 text-lg font-black">Experience Levels</h3>
        {Object.keys(stats.experienceLevels || {}).length === 0 ? (
          <p className="text-sm text-muted-foreground">No experience data available.</p>
        ) : (
          <div className="flex items-end gap-3">
            {Object.entries(stats.experienceLevels)
              .sort(([, a], [, b]) => b - a)
              .map(([level, count]) => (
                <div key={level} className="flex flex-1 flex-col items-center">
                  <span className="mb-1 text-xs font-black">{count}</span>
                  <div
                    className="w-full rounded-t-base bg-primary"
                    style={{
                      height: `${Math.max((count / maxExpCount) * 120, 8)}px`,
                    }}
                  />
                  <span className="mt-1 text-xs text-muted-foreground">{level}</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SponsorPortalPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("participants");

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-3xl font-black text-foreground">Sponsor Portal</h1>

        {/* Tab bar */}
        <div className="mb-6 flex gap-2">
          {["participants", "stats"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-base border-2 border-border px-4 py-2 text-sm font-black capitalize transition-colors ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground shadow-neo-sm"
                  : "bg-card text-foreground hover:bg-muted"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "participants" && <ParticipantsTab eventId={id} />}
        {activeTab === "stats" && <StatsTab eventId={id} />}
      </div>
    </div>
  );
}
