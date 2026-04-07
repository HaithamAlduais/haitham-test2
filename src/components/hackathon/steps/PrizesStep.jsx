import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Trophy, Award, Star, Users, Heart } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const EMPTY_PRIZE = {
  place: "", title: "", description: "", value: "",
  category: "overall", type: "cash", trackId: "", sponsorName: "",
};

export default function PrizesStep({ data, onChange, onNext, onBack }) {
  const { t } = useLanguage();
  const prizes = data.prizes || [];
  const tracks = data.tracks || [];
  const sponsors = data.sponsors || [];
  const [newPrize, setNewPrize] = useState(EMPTY_PRIZE);

  const CATEGORIES = [
    { value: "overall", label: t("catOverall"), icon: Trophy, color: "text-yellow-500" },
    { value: "per_track", label: t("catPerTrack"), icon: Award, color: "text-blue-500" },
    { value: "special", label: t("catSpecial"), icon: Star, color: "text-purple-500" },
    { value: "sponsor", label: t("catSponsor"), icon: Users, color: "text-green-500" },
    { value: "popular_choice", label: t("catPopularChoice"), icon: Heart, color: "text-red-500" },
  ];

  const TYPES = [
    { value: "cash", label: t("typeCash") },
    { value: "credits", label: t("typeCredits") },
    { value: "access", label: t("typeAccess") },
    { value: "badges", label: t("typeBadges") },
    { value: "physical", label: t("typePhysical") },
  ];

  const addPrize = () => {
    if (!newPrize.title.trim()) return;
    onChange({
      prizes: [...prizes, {
        ...newPrize,
        id: crypto.randomUUID(),
        fulfillment: "pending",
        awardedTo: null,
      }],
    });
    setNewPrize(EMPTY_PRIZE);
  };

  const removePrize = (idx) => {
    onChange({ prizes: prizes.filter((_, i) => i !== idx) });
  };

  const getCatInfo = (cat) => CATEGORIES.find((c) => c.value === cat) || CATEGORIES[0];

  // Group prizes by category for display
  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    items: prizes.filter((p) => p.category === cat.value),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-foreground">{t("prizesTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("prizesDesc")}
        </p>
      </div>

      {/* Existing prizes grouped by category */}
      {grouped.length > 0 && (
        <div className="space-y-5">
          {grouped.map((group) => (
            <div key={group.value}>
              <div className="flex items-center gap-2 mb-2">
                <group.icon className={`h-4 w-4 ${group.color}`} />
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">{group.label}</h3>
                <span className="text-xs text-muted-foreground">({group.items.length})</span>
              </div>
              <div className="space-y-2">
                {group.items.map((prize) => {
                  const globalIdx = prizes.indexOf(prize);
                  return (
                    <div
                      key={prize.id || globalIdx}
                      className="flex items-start gap-3 rounded-base border-2 border-border bg-card p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground text-sm">
                          {prize.place && <span className="text-main">{prize.place} — </span>}
                          {prize.title}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {prize.value && (
                            <span className="inline-flex items-center rounded-base border border-border bg-main/10 px-2 py-0.5 text-xs font-bold text-main">
                              {prize.value}
                            </span>
                          )}
                          <span className="inline-flex items-center rounded-base border border-border px-2 py-0.5 text-xs text-muted-foreground">
                            {TYPES.find((t) => t.value === prize.type)?.label || prize.type}
                          </span>
                          {prize.trackId && (
                            <span className="inline-flex items-center rounded-base border border-border px-2 py-0.5 text-xs text-muted-foreground">
                              Track: {tracks.find((t) => t.id === prize.trackId)?.name || prize.trackId}
                            </span>
                          )}
                          {prize.sponsorName && (
                            <span className="inline-flex items-center rounded-base border border-border px-2 py-0.5 text-xs text-muted-foreground">
                              Sponsor: {prize.sponsorName}
                            </span>
                          )}
                        </div>
                        {prize.description && (
                          <p className="mt-1 text-xs text-muted-foreground">{prize.description}</p>
                        )}
                      </div>
                      <button onClick={() => removePrize(globalIdx)} className="shrink-0 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new prize form */}
      <div className="rounded-base border-2 border-dashed border-border p-4 space-y-4">
        <p className="text-sm font-bold text-foreground">{t("addPrize2")}</p>

        {/* Category selector */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setNewPrize({ ...newPrize, category: cat.value })}
              className={`flex items-center gap-1.5 rounded-base border-2 px-3 py-1.5 text-xs font-bold transition-colors ${
                newPrize.category === cat.value
                  ? "bg-main text-main-foreground border-border shadow-neo-sm"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              <cat.icon className="h-3.5 w-3.5" />
              {cat.label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>{t("prizePlace")}</Label>
            <Input value={newPrize.place} onChange={(e) => setNewPrize({ ...newPrize, place: e.target.value })} placeholder="1st Place" />
          </div>
          <div className="space-y-1">
            <Label>{t("prizeTitleLabel")}</Label>
            <Input value={newPrize.title} onChange={(e) => setNewPrize({ ...newPrize, title: e.target.value })} placeholder="Grand Prize" />
          </div>
          <div className="space-y-1">
            <Label>{t("prizeValueLabel")}</Label>
            <Input value={newPrize.value} onChange={(e) => setNewPrize({ ...newPrize, value: e.target.value })} placeholder="$5,000" />
          </div>
          <div className="space-y-1">
            <Label>{t("prizeType")}</Label>
            <select
              value={newPrize.type}
              onChange={(e) => setNewPrize({ ...newPrize, type: e.target.value })}
              className="flex h-10 w-full rounded-base border-2 border-border bg-background px-3 py-2 text-sm font-medium"
            >
              {TYPES.map((tp) => <option key={tp.value} value={tp.value}>{tp.label}</option>)}
            </select>
          </div>

          {newPrize.category === "per_track" && tracks.length > 0 && (
            <div className="space-y-1 sm:col-span-2">
              <Label>Track</Label>
              <select
                value={newPrize.trackId}
                onChange={(e) => setNewPrize({ ...newPrize, trackId: e.target.value })}
                className="flex h-10 w-full rounded-base border-2 border-border bg-background px-3 py-2 text-sm font-medium"
              >
                <option value="">Select track...</option>
                {tracks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}

          {newPrize.category === "sponsor" && (
            <div className="space-y-1 sm:col-span-2">
              <Label>Sponsor Name</Label>
              <Input value={newPrize.sponsorName} onChange={(e) => setNewPrize({ ...newPrize, sponsorName: e.target.value })} placeholder="Sponsor company name" />
            </div>
          )}

          <div className="space-y-1 sm:col-span-2">
            <Label>Description</Label>
            <Input value={newPrize.description} onChange={(e) => setNewPrize({ ...newPrize, description: e.target.value })} placeholder="Brief description" />
          </div>
        </div>

        <Button variant="neutral" size="sm" onClick={addPrize} disabled={!newPrize.title.trim()}>
          <Plus className="h-4 w-4" /> {t("addPrizeBtn")}
        </Button>
      </div>

      <div className="flex justify-between">
        <Button variant="neutral" onClick={onBack}>{t("backBtn")}</Button>
        <Button onClick={onNext}>{t("nextTeams")}</Button>
      </div>
    </div>
  );
}
