import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Building2 } from "lucide-react";

const TIERS = ["platinum", "gold", "silver", "bronze", "partner"];

const TIER_LABELS = {
  platinum: "Platinum",
  gold: "Gold",
  silver: "Silver",
  bronze: "Bronze",
  partner: "Partner",
};

const TIER_COLORS = {
  platinum: "bg-slate-100 text-slate-800",
  gold: "bg-yellow-100 text-yellow-800",
  silver: "bg-gray-100 text-gray-700",
  bronze: "bg-orange-100 text-orange-800",
  partner: "bg-blue-100 text-blue-800",
};

const EMPTY_SPONSOR = {
  name: "",
  tier: "gold",
  logoUrl: "",
  websiteUrl: "",
  description: "",
};

export default function SponsorsStep({ data, onChange, onNext, onBack }) {
  const sponsors = data.sponsors || [];
  const [newSponsor, setNewSponsor] = useState({ ...EMPTY_SPONSOR });

  const addSponsor = () => {
    if (!newSponsor.name.trim()) return;
    onChange({
      sponsors: [
        ...sponsors,
        { ...newSponsor, id: crypto.randomUUID() },
      ],
    });
    setNewSponsor({ ...EMPTY_SPONSOR });
  };

  const removeSponsor = (idx) => {
    onChange({ sponsors: sponsors.filter((_, i) => i !== idx) });
  };

  // Group sponsors by tier for the preview
  const grouped = TIERS.reduce((acc, tier) => {
    const tierSponsors = sponsors.filter((s) => s.tier === tier);
    if (tierSponsors.length > 0) acc[tier] = tierSponsors;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-foreground">Sponsors</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add sponsors and partners supporting this hackathon. This is optional.
        </p>
      </div>

      {/* Existing sponsors list */}
      {sponsors.length > 0 && (
        <div className="space-y-3">
          {sponsors.map((sponsor, idx) => (
            <div
              key={sponsor.id || idx}
              className="flex items-start gap-3 rounded-base border-2 border-border bg-card p-4 shadow-neo-sm"
            >
              {sponsor.logoUrl ? (
                <img
                  src={sponsor.logoUrl}
                  alt={sponsor.name}
                  className="h-10 w-10 shrink-0 rounded-base border-2 border-border object-contain"
                />
              ) : (
                <Building2 className="h-5 w-5 shrink-0 text-main mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-foreground">{sponsor.name}</p>
                  <span
                    className={`inline-block rounded-base px-2 py-0.5 text-xs font-bold ${TIER_COLORS[sponsor.tier] || ""}`}
                  >
                    {TIER_LABELS[sponsor.tier] || sponsor.tier}
                  </span>
                </div>
                {sponsor.websiteUrl && (
                  <p className="text-sm text-main font-bold truncate">{sponsor.websiteUrl}</p>
                )}
                {sponsor.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{sponsor.description}</p>
                )}
              </div>
              <button
                onClick={() => removeSponsor(idx)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add sponsor form */}
      <div className="rounded-base border-2 border-dashed border-border p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Sponsor Name *</Label>
            <Input
              value={newSponsor.name}
              onChange={(e) => setNewSponsor({ ...newSponsor, name: e.target.value })}
              placeholder="Acme Corp"
            />
          </div>
          <div className="space-y-1">
            <Label>Tier</Label>
            <select
              value={newSponsor.tier}
              onChange={(e) => setNewSponsor({ ...newSponsor, tier: e.target.value })}
              className="flex h-10 w-full rounded-base border-2 border-border bg-background px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-main"
            >
              {TIERS.map((tier) => (
                <option key={tier} value={tier}>
                  {TIER_LABELS[tier]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Logo URL</Label>
            <Input
              value={newSponsor.logoUrl}
              onChange={(e) => setNewSponsor({ ...newSponsor, logoUrl: e.target.value })}
              placeholder="https://example.com/logo.png"
            />
          </div>
          <div className="space-y-1">
            <Label>Website URL</Label>
            <Input
              value={newSponsor.websiteUrl}
              onChange={(e) => setNewSponsor({ ...newSponsor, websiteUrl: e.target.value })}
              placeholder="https://example.com"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Description</Label>
          <Textarea
            value={newSponsor.description}
            onChange={(e) => setNewSponsor({ ...newSponsor, description: e.target.value })}
            placeholder="Brief description of the sponsor"
            rows={2}
          />
        </div>
        <Button variant="neutral" size="sm" onClick={addSponsor} disabled={!newSponsor.name.trim()}>
          <Plus className="h-4 w-4" /> Add Sponsor
        </Button>
      </div>

      {/* Preview grouped by tier */}
      {Object.keys(grouped).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-black text-foreground">Preview</h3>
          {TIERS.map((tier) => {
            const tierSponsors = grouped[tier];
            if (!tierSponsors) return null;
            return (
              <div key={tier}>
                <p className="text-sm font-bold text-muted-foreground mb-2">
                  {TIER_LABELS[tier]} Sponsors
                </p>
                <div className="flex flex-wrap gap-3">
                  {tierSponsors.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-2 rounded-base border-2 border-border bg-card px-3 py-2 shadow-neo-sm"
                    >
                      {s.logoUrl ? (
                        <img
                          src={s.logoUrl}
                          alt={s.name}
                          className="h-8 w-8 rounded-base object-contain"
                        />
                      ) : (
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span className="text-sm font-bold">{s.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="neutral" onClick={onBack}>
          &larr; Back
        </Button>
        <Button onClick={onNext}>Next: Review &rarr;</Button>
      </div>
    </div>
  );
}
