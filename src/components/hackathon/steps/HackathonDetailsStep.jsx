import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import GoogleMapPicker from "@/components/GoogleMapPicker";
import {
  ChevronDown,
  ChevronUp,
  Monitor,
  MapPin,
  Plus,
  Trash2,
  Trophy,
  Award,
  Star,
  Users,
  Heart,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

// ── Constants ────────────────────────────────────────────────────────────────
export const INITIAL_DATA = {
  title: "",
  description: "",
  rules: "",
  format: "online",
  location: { name: "", address: "", lat: null, lng: null },
  targetAudience: "",
  contactEmail: "",
  schedule: {
    registrationOpen: "",
    registrationClose: "",
    judgingStart: "",
    judgingEnd: "",
  },
  hackathonStart: "",
  hackathonEnd: "",
  sessionsStart: "",
  sessionsEnd: "",
  judgingMode: "during",
  tracks: [],
  judgingCriteria: [],
  prizes: [],
  settings: { maxRegistrants: 500, teamSizeMin: 2, teamSizeMax: 5, allowSolo: false },
  branding: { logoUrl: "", bannerUrl: "", primaryColor: "#7C3AED", secondaryColor: "#00D4AA", hashtag: "" },
  sponsors: [],
  faq: [],
  isPublic: true,
};

export const EMPTY_PRIZE = {
  place: "",
  title: "",
  description: "",
  value: "",
  category: "overall",
  type: "cash",
  trackId: "",
  sponsorName: "",
};

export const EMPTY_SPONSOR = {
  name: "",
  tier: "gold",
  logoUrl: "",
  websiteUrl: "",
  description: "",
};

export const TIERS = ["platinum", "gold", "silver", "bronze", "partner"];
export const TIER_COLORS = {
  platinum: "bg-slate-100 text-slate-800",
  gold: "bg-yellow-100 text-yellow-800",
  silver: "bg-gray-100 text-gray-700",
  bronze: "bg-orange-100 text-orange-800",
  partner: "bg-blue-100 text-blue-800",
};

// ── Collapsible section ──────────────────────────────────────────────────────
function Section({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-base border-2 border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-start hover:bg-muted/50 transition-colors"
      >
        <h3 className="text-lg font-black text-foreground">{title}</h3>
        {open ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
      {open && <div className="px-5 pb-5 space-y-5 border-t-2 border-border pt-5">{children}</div>}
    </div>
  );
}

/**
 * HackathonDetailsStep — all 6 collapsible sections
 * (Basic Info, Schedule, Tracks, Prizes, Sponsors, FAQ)
 *
 * Props:
 *   data           — the hackathon form data object
 *   onChange(partial) — merges partial into data
 *   onNext()       — advance to next step
 *   onBack()       — go back (to file upload)
 */
export default function HackathonDetailsStep({ data, onChange, onNext, onBack }) {
  const { t } = useLanguage();

  // ── Shorthand helpers ──────────────────────────────────────────────────────
  const updateData = (partial) => onChange(partial);

  const schedule = data.schedule || {};
  const updateSchedule = (key, value) => updateData({ schedule: { ...schedule, [key]: value } });
  const location = data.location || { name: "", address: "" };
  const updateLocation = (field, value) => updateData({ location: { ...location, [field]: value } });

  const tracks = data.tracks || [];
  const prizes = data.prizes || [];
  const sponsors = data.sponsors || [];

  // ── Inline add-form state ──────────────────────────────────────────────────
  const [newTrack, setNewTrack] = useState({ name: "", description: "" });
  const [newPrize, setNewPrize] = useState({ ...EMPTY_PRIZE });
  const [newSponsor, setNewSponsor] = useState({ ...EMPTY_SPONSOR });
  const [newFaqQuestion, setNewFaqQuestion] = useState("");
  const [newFaqAnswer, setNewFaqAnswer] = useState("");

  // Prize categories & types
  const CATEGORIES = [
    { value: "overall", label: t("catOverall") || "\u0639\u0627\u0645", icon: Trophy, color: "text-yellow-500" },
    { value: "per_track", label: t("catPerTrack") || "\u0644\u0643\u0644 \u0645\u0633\u0627\u0631", icon: Award, color: "text-blue-500" },
    { value: "special", label: t("catSpecial") || "\u062e\u0627\u0635", icon: Star, color: "text-purple-500" },
    { value: "sponsor", label: t("catSponsor") || "\u0631\u0627\u0639\u064a", icon: Users, color: "text-green-500" },
    { value: "popular_choice", label: t("catPopularChoice") || "\u0627\u062e\u062a\u064a\u0627\u0631 \u0627\u0644\u062c\u0645\u0647\u0648\u0631", icon: Heart, color: "text-red-500" },
  ];

  const TYPES = [
    { value: "cash", label: t("typeCash") || "\u0646\u0642\u062f\u064a" },
    { value: "credits", label: t("typeCredits") || "\u0631\u0635\u064a\u062f" },
    { value: "access", label: t("typeAccess") || "\u0648\u0635\u0648\u0644" },
    { value: "badges", label: t("typeBadges") || "\u0634\u0627\u0631\u0627\u062a" },
    { value: "physical", label: t("typePhysical") || "\u0645\u0627\u062f\u064a" },
  ];

  const TIER_LABELS = {
    platinum: t("tierPlatinum") || "Platinum",
    gold: t("tierGold") || "Gold",
    silver: t("tierSilver") || "Silver",
    bronze: t("tierBronze") || "Bronze",
    partner: t("tierPartner") || "Partner",
  };

  // ── Track add/remove ───────────────────────────────────────────────────────
  const addTrack = () => {
    if (!newTrack.name.trim()) return;
    updateData({ tracks: [...tracks, { ...newTrack, id: crypto.randomUUID() }] });
    setNewTrack({ name: "", description: "" });
  };
  const removeTrack = (idx) => updateData({ tracks: tracks.filter((_, i) => i !== idx) });

  // ── Prize add/remove ───────────────────────────────────────────────────────
  const addPrize = () => {
    if (!newPrize.title.trim()) return;
    updateData({
      prizes: [...prizes, { ...newPrize, id: crypto.randomUUID(), fulfillment: "pending", awardedTo: null }],
    });
    setNewPrize({ ...EMPTY_PRIZE });
  };
  const removePrize = (idx) => updateData({ prizes: prizes.filter((_, i) => i !== idx) });

  // ── Sponsor add/remove ─────────────────────────────────────────────────────
  const addSponsor = () => {
    if (!newSponsor.name.trim()) return;
    updateData({ sponsors: [...sponsors, { ...newSponsor, id: crypto.randomUUID() }] });
    setNewSponsor({ ...EMPTY_SPONSOR });
  };
  const removeSponsor = (idx) => updateData({ sponsors: sponsors.filter((_, i) => i !== idx) });
  const updateSponsor = (idx, field, value) => {
    const updated = [...sponsors];
    updated[idx] = { ...updated[idx], [field]: value };
    updateData({ sponsors: updated });
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* ────────────────── Section 1: Basic Info ────────────────── */}
      <Section title={t("basicInfoTitle") || "\u0627\u0644\u0623\u0633\u0627\u0633\u064a\u0627\u062a"} defaultOpen={true}>
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">
            {t("hackathonTitleLabel") || "\u0627\u0644\u0639\u0646\u0648\u0627\u0646"} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            value={data.title}
            onChange={(e) => updateData({ title: e.target.value })}
            placeholder={t("hackathonTitlePlaceholder") || "\u0627\u0633\u0645 \u0627\u0644\u0647\u0627\u0643\u0627\u062b\u0648\u0646"}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">{t("descriptionLabel2") || "\u0627\u0644\u0648\u0635\u0641"}</Label>
          <Textarea
            id="description"
            value={data.description}
            onChange={(e) => updateData({ description: e.target.value })}
            placeholder={t("descriptionPlaceholder2") || "\u0648\u0635\u0641 \u0627\u0644\u0647\u0627\u0643\u0627\u062b\u0648\u0646"}
            rows={4}
          />
        </div>

        {/* Target Audience */}
        <div className="space-y-2">
          <Label htmlFor="targetAudience">{t("targetAudienceLabel") || "\u0627\u0644\u0641\u0626\u0629 \u0627\u0644\u0645\u0633\u062a\u0647\u062f\u0641\u0629"}</Label>
          <Textarea
            id="targetAudience"
            value={data.targetAudience || ""}
            onChange={(e) => updateData({ targetAudience: e.target.value })}
            placeholder={t("targetAudiencePlaceholder") || "\u0645\u0646 \u0647\u0645 \u0627\u0644\u0645\u0634\u0627\u0631\u0643\u0648\u0646 \u0627\u0644\u0645\u0633\u062a\u0647\u062f\u0641\u0648\u0646\u061f"}
            rows={2}
          />
        </div>

        {/* Format */}
        <div className="space-y-2">
          <Label>{t("formatLabel") || "\u0627\u0644\u0635\u064a\u063a\u0629"}</Label>
          <div className="flex gap-2">
            {[
              { value: "online", label: t("formatOnline") || "\u0639\u0646 \u0628\u0639\u062f", icon: Monitor },
              { value: "in-person", label: t("formatInPerson") || "\u062d\u0636\u0648\u0631\u064a", icon: MapPin },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => updateData({ format: value })}
                className={`flex items-center gap-2 rounded-base border-2 px-4 py-2 text-sm font-bold transition-colors ${
                  (data.format || "online") === value
                    ? "border-border bg-main text-main-foreground shadow-neo-sm"
                    : "border-border bg-card text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* In-person location with Google Maps */}
        {(data.format || "online") === "in-person" && (
          <div className="space-y-4 rounded-base border-2 border-border bg-muted/30 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("locationNameLabel") || "\u0627\u0633\u0645 \u0627\u0644\u0645\u0643\u0627\u0646"}</Label>
                <Input
                  value={location.name}
                  onChange={(e) => updateLocation("name", e.target.value)}
                  placeholder={t("locationNamePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("locationAddressLabel") || "\u0627\u0644\u0639\u0646\u0648\u0627\u0646"}</Label>
                <Input
                  value={location.address}
                  onChange={(e) => updateLocation("address", e.target.value)}
                  placeholder={t("locationAddressPlaceholder")}
                />
              </div>
            </div>
            <GoogleMapPicker
              location={location}
              onLocationChange={(loc) => updateData({ location: loc })}
              placeholder={t("searchLocation") || "\u0627\u0628\u062d\u062b \u0639\u0646 \u0627\u0644\u0645\u0648\u0642\u0639..."}
            />
          </div>
        )}

        {/* Discord auto-create note */}
        <div className="rounded-base border-2 border-border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">
            {t("discordAutoCreate") || "\u0633\u064a\u062a\u0645 \u0625\u0646\u0634\u0627\u0621 \u0633\u064a\u0631\u0641\u0631 Discord \u062a\u0644\u0642\u0627\u0626\u064a\u0627\u064b \u0639\u0646\u062f \u0646\u0634\u0631 \u0627\u0644\u0647\u0627\u0643\u0627\u062b\u0648\u0646"}
          </p>
        </div>

        {/* Contact Email */}
        <div className="space-y-2">
          <Label htmlFor="contactEmail">{t("contactEmailLabel") || "\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a"}</Label>
          <Input
            id="contactEmail"
            type="email"
            value={data.contactEmail || ""}
            onChange={(e) => updateData({ contactEmail: e.target.value })}
            placeholder={t("contactEmailPlaceholder") || "email@example.com"}
          />
        </div>
      </Section>

      {/* ────────────────── Section 2: Schedule ────────────────── */}
      <Section title={t("scheduleTitle") || "\u0627\u0644\u062c\u062f\u0648\u0644 \u0627\u0644\u0632\u0645\u0646\u064a"} defaultOpen={true}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("regOpen") || "\u0641\u062a\u062d \u0627\u0644\u062a\u0633\u062c\u064a\u0644"}</Label>
            <Input type="datetime-local" value={schedule.registrationOpen || ""} onChange={(e) => updateSchedule("registrationOpen", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("regClose") || "\u0625\u063a\u0644\u0627\u0642 \u0627\u0644\u062a\u0633\u062c\u064a\u0644"}</Label>
            <Input type="datetime-local" value={schedule.registrationClose || ""} onChange={(e) => updateSchedule("registrationClose", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("hackathonStartLabel") || "\u0628\u062f\u0627\u064a\u0629 \u0627\u0644\u0647\u0627\u0643\u0627\u062b\u0648\u0646"}</Label>
            <Input type="datetime-local" value={data.hackathonStart || ""} onChange={(e) => updateData({ hackathonStart: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>{t("hackathonEndLabel") || "\u0646\u0647\u0627\u064a\u0629 \u0627\u0644\u0647\u0627\u0643\u0627\u062b\u0648\u0646"}</Label>
            <Input type="datetime-local" value={data.hackathonEnd || ""} onChange={(e) => updateData({ hackathonEnd: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>{t("sessionsStartLabel") || "\u0628\u062f\u0627\u064a\u0629 \u0627\u0644\u062c\u0644\u0633\u0627\u062a"}</Label>
            <Input type="datetime-local" value={data.sessionsStart || ""} onChange={(e) => updateData({ sessionsStart: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>{t("sessionsEndLabel") || "\u0646\u0647\u0627\u064a\u0629 \u0627\u0644\u062c\u0644\u0633\u0627\u062a"}</Label>
            <Input type="datetime-local" value={data.sessionsEnd || ""} onChange={(e) => updateData({ sessionsEnd: e.target.value })} />
          </div>
        </div>

        {/* Judging mode */}
        <div className="space-y-3 pt-2">
          <Label>{t("judgingTimeLabel") || "\u0645\u0648\u0639\u062f \u0627\u0644\u062a\u062d\u0643\u064a\u0645"}</Label>
          <div className="flex gap-3">
            {[
              { value: "during", label: t("judgingDuring") || "\u0623\u062b\u0646\u0627\u0621 \u0627\u0644\u0647\u0627\u0643\u0627\u062b\u0648\u0646" },
              { value: "custom", label: t("judgingCustom") || "\u0627\u062e\u062a\u0631 \u062a\u0627\u0631\u064a\u062e" },
            ].map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => updateData({ judgingMode: value })}
                className={`rounded-base border-2 px-4 py-2 text-sm font-bold transition-colors ${
                  (data.judgingMode || "during") === value
                    ? "border-border bg-main text-main-foreground shadow-neo-sm"
                    : "border-border bg-card text-foreground hover:bg-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {(data.judgingMode || "during") === "custom" && (
            <div className="grid gap-5 sm:grid-cols-2 rounded-base border-2 border-border bg-muted/30 p-4">
              <div className="space-y-2">
                <Label>{t("judgingStart") || "\u0628\u062f\u0627\u064a\u0629 \u0627\u0644\u062a\u062d\u0643\u064a\u0645"}</Label>
                <Input type="datetime-local" value={schedule.judgingStart || ""} onChange={(e) => updateSchedule("judgingStart", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("judgingEnd") || "\u0646\u0647\u0627\u064a\u0629 \u0627\u0644\u062a\u062d\u0643\u064a\u0645"}</Label>
                <Input type="datetime-local" value={schedule.judgingEnd || ""} onChange={(e) => updateSchedule("judgingEnd", e.target.value)} />
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* ────────────────── Section 3: Tracks ────────────────── */}
      <Section title={t("tracksTitle") || "\u0627\u0644\u0645\u0633\u0627\u0631\u0627\u062a"} defaultOpen={false}>
        {tracks.length > 0 && (
          <div className="space-y-3">
            {tracks.map((track, idx) => (
              <div key={track.id || idx} className="flex items-start gap-3 rounded-base border-2 border-border bg-muted/30 p-4">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground">{track.name}</p>
                  {track.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{track.description}</p>}
                </div>
                <button onClick={() => removeTrack(idx)} className="shrink-0 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-base border-2 border-dashed border-border p-4 space-y-3">
          <div className="space-y-2">
            <Label>{t("trackNameLabel") || "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u0627\u0631"}</Label>
            <Input value={newTrack.name} onChange={(e) => setNewTrack({ ...newTrack, name: e.target.value })} placeholder="e.g. AI & Machine Learning" />
          </div>
          <div className="space-y-2">
            <Label>{t("trackDescLabel") || "\u0648\u0635\u0641 \u0627\u0644\u0645\u0633\u0627\u0631"}</Label>
            <Textarea value={newTrack.description} onChange={(e) => setNewTrack({ ...newTrack, description: e.target.value })} placeholder={t("trackDescPlaceholder")} rows={2} />
          </div>
          <Button variant="neutral" size="sm" onClick={addTrack} disabled={!newTrack.name.trim()}>
            <Plus className="h-4 w-4" /> {t("addTrackBtn") || "\u0623\u0636\u0641 \u0645\u0633\u0627\u0631"}
          </Button>
        </div>
      </Section>

      {/* ────────────────── Section 4: Prizes ────────────────── */}
      <Section title={t("prizesTitle") || "\u0627\u0644\u062c\u0648\u0627\u0626\u0632"} defaultOpen={false}>
        {prizes.length > 0 && (
          <div className="space-y-3">
            {prizes.map((prize, idx) => {
              const catInfo = CATEGORIES.find((c) => c.value === prize.category) || CATEGORIES[0];
              const CatIcon = catInfo.icon;
              return (
                <div key={prize.id || idx} className="flex items-start gap-3 rounded-base border-2 border-border bg-muted/30 p-3">
                  <CatIcon className={`h-4 w-4 mt-1 shrink-0 ${catInfo.color}`} />
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
                        {TYPES.find((tp) => tp.value === prize.type)?.label || prize.type}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => removePrize(idx)} className="shrink-0 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="rounded-base border-2 border-dashed border-border p-4 space-y-4">
          {/* Category selector */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
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
              <Label>{t("prizePlace") || "\u0627\u0644\u0645\u0631\u0643\u0632"}</Label>
              <Input value={newPrize.place} onChange={(e) => setNewPrize({ ...newPrize, place: e.target.value })} placeholder="1st Place" />
            </div>
            <div className="space-y-1">
              <Label>{t("prizeTitleLabel") || "\u0627\u0633\u0645 \u0627\u0644\u062c\u0627\u0626\u0632\u0629"}</Label>
              <Input value={newPrize.title} onChange={(e) => setNewPrize({ ...newPrize, title: e.target.value })} placeholder="Grand Prize" />
            </div>
            <div className="space-y-1">
              <Label>{t("prizeValueLabel") || "\u0627\u0644\u0642\u064a\u0645\u0629"}</Label>
              <Input value={newPrize.value} onChange={(e) => setNewPrize({ ...newPrize, value: e.target.value })} placeholder="$5,000" />
            </div>
            <div className="space-y-1">
              <Label>{t("prizeType") || "\u0627\u0644\u0646\u0648\u0639"}</Label>
              <select
                value={newPrize.type}
                onChange={(e) => setNewPrize({ ...newPrize, type: e.target.value })}
                className="flex h-10 w-full rounded-base border-2 border-border bg-background px-3 py-2 text-sm font-medium"
              >
                {TYPES.map((tp) => (
                  <option key={tp.value} value={tp.value}>
                    {tp.label}
                  </option>
                ))}
              </select>
            </div>

            {newPrize.category === "per_track" && tracks.length > 0 && (
              <div className="space-y-1 sm:col-span-2">
                <Label>{t("trackLabel") || "Track"}</Label>
                <select
                  value={newPrize.trackId}
                  onChange={(e) => setNewPrize({ ...newPrize, trackId: e.target.value })}
                  className="flex h-10 w-full rounded-base border-2 border-border bg-background px-3 py-2 text-sm font-medium"
                >
                  <option value="">{t("selectTrack") || "\u0627\u062e\u062a\u0631 \u0645\u0633\u0627\u0631..."}</option>
                  {tracks.map((tk) => (
                    <option key={tk.id} value={tk.id}>
                      {tk.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {newPrize.category === "sponsor" && (
              <div className="space-y-1 sm:col-span-2">
                <Label>{t("sponsorNameLabel") || "\u0627\u0633\u0645 \u0627\u0644\u0631\u0627\u0639\u064a"}</Label>
                <Input
                  value={newPrize.sponsorName}
                  onChange={(e) => setNewPrize({ ...newPrize, sponsorName: e.target.value })}
                  placeholder={t("sponsorNamePlaceholder") || "\u0627\u0633\u0645 \u0627\u0644\u0634\u0631\u0643\u0629"}
                />
              </div>
            )}
          </div>

          <Button variant="neutral" size="sm" onClick={addPrize} disabled={!newPrize.title.trim()}>
            <Plus className="h-4 w-4" /> {t("addPrizeBtn") || "\u0623\u0636\u0641 \u062c\u0627\u0626\u0632\u0629"}
          </Button>
        </div>
      </Section>

      {/* ────────────────── Section 5: Sponsors ────────────────── */}
      <Section title={t("sponsorsTitle") || "\u0627\u0644\u0631\u0639\u0627\u0629"} defaultOpen={false}>
        {sponsors.length > 0 && (
          <div className="space-y-3">
            {sponsors.map((sponsor, idx) => (
              <div key={sponsor.id || idx} className="rounded-base border-2 border-border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">{sponsor.name || t("sponsorName") || "\u0631\u0627\u0639\u064a \u062c\u062f\u064a\u062f"}</span>
                  <button onClick={() => removeSponsor(idx)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">{t("sponsorName") || "\u0627\u0633\u0645 \u0627\u0644\u0631\u0627\u0639\u064a"}</Label>
                    <Input value={sponsor.name || ""} onChange={(e) => updateSponsor(idx, "name", e.target.value)} placeholder="\u0645\u062b\u0627\u0644: STC" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("sponsorTier") || "\u0627\u0644\u0645\u0633\u062a\u0648\u0649"}</Label>
                    <select
                      value={sponsor.tier || "gold"}
                      onChange={(e) => updateSponsor(idx, "tier", e.target.value)}
                      className="flex h-10 w-full rounded-base border-2 border-border bg-background px-3 py-2 text-sm"
                    >
                      <option value="strategic">\u0634\u0631\u064a\u0643 \u0627\u0633\u062a\u0631\u0627\u062a\u064a\u062c\u064a</option>
                      <option value="platinum">\u0628\u0644\u0627\u062a\u064a\u0646\u064a</option>
                      <option value="gold">\u0630\u0647\u0628\u064a</option>
                      <option value="silver">\u0641\u0636\u064a</option>
                      <option value="bronze">\u0628\u0631\u0648\u0646\u0632\u064a</option>
                      <option value="tech">\u0631\u0627\u0639\u064a \u062a\u0642\u0646\u064a</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("sponsorWebsite") || "\u0627\u0644\u0645\u0648\u0642\u0639"}</Label>
                    <Input
                      value={sponsor.website || sponsor.websiteUrl || ""}
                      onChange={(e) => updateSponsor(idx, "website", e.target.value)}
                      placeholder="https://example.com"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("sponsorLogo") || "\u0631\u0627\u0628\u0637 \u0627\u0644\u0634\u0639\u0627\u0631"}</Label>
                    <Input
                      value={sponsor.logoUrl || ""}
                      onChange={(e) => updateSponsor(idx, "logoUrl", e.target.value)}
                      placeholder="https://example.com/logo.png"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">{t("description") || "\u0627\u0644\u0648\u0635\u0641"}</Label>
                    <Input
                      value={sponsor.description || ""}
                      onChange={(e) => updateSponsor(idx, "description", e.target.value)}
                      placeholder="\u0646\u0628\u0630\u0629 \u0639\u0646 \u0627\u0644\u0631\u0627\u0639\u064a..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-base border-2 border-dashed border-border p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t("sponsorNameLabel") || "\u0627\u0633\u0645 \u0627\u0644\u0631\u0627\u0639\u064a"}</Label>
              <Input value={newSponsor.name} onChange={(e) => setNewSponsor({ ...newSponsor, name: e.target.value })} placeholder="Acme Corp" />
            </div>
            <div className="space-y-1">
              <Label>{t("tierLabel") || "\u0627\u0644\u0641\u0626\u0629"}</Label>
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
              <Label>{t("sponsorLogoLabel") || "\u0631\u0627\u0628\u0637 \u0627\u0644\u0634\u0639\u0627\u0631"}</Label>
              <Input value={newSponsor.logoUrl} onChange={(e) => setNewSponsor({ ...newSponsor, logoUrl: e.target.value })} placeholder="https://example.com/logo.png" />
            </div>
            <div className="space-y-1">
              <Label>{t("sponsorWebsiteLabel") || "\u0627\u0644\u0645\u0648\u0642\u0639"}</Label>
              <Input value={newSponsor.websiteUrl} onChange={(e) => setNewSponsor({ ...newSponsor, websiteUrl: e.target.value })} placeholder="https://example.com" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>{t("sponsorDescLabel") || "\u0648\u0635\u0641"}</Label>
            <Textarea
              value={newSponsor.description}
              onChange={(e) => setNewSponsor({ ...newSponsor, description: e.target.value })}
              placeholder={t("sponsorDescPlaceholder") || "\u0648\u0635\u0641 \u0645\u062e\u062a\u0635\u0631 \u0644\u0644\u0631\u0627\u0639\u064a"}
              rows={2}
            />
          </div>
          <Button variant="neutral" size="sm" onClick={addSponsor} disabled={!newSponsor.name.trim()}>
            <Plus className="h-4 w-4" /> {t("addSponsor") || "\u0623\u0636\u0641 \u0631\u0627\u0639\u064a"}
          </Button>
        </div>
      </Section>

      {/* ────────────────── Section 6: FAQ ────────────────── */}
      <Section title={t("faqTitle") || "\u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0634\u0627\u0626\u0639\u0629"} defaultOpen={false}>
        {(data.faq || []).length > 0 && (
          <div className="space-y-3">
            {(data.faq || []).map((item, idx) => (
              <div key={item.id || idx} className="rounded-base border-2 border-border bg-muted/30 p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={item.question || ""}
                      onChange={(e) => {
                        const updated = [...(data.faq || [])];
                        updated[idx] = { ...updated[idx], question: e.target.value };
                        updateData({ faq: updated });
                      }}
                      placeholder={t("faqQuestionPlaceholder") || "\u0627\u0644\u0633\u0624\u0627\u0644"}
                    />
                    <Textarea
                      value={item.answer || ""}
                      onChange={(e) => {
                        const updated = [...(data.faq || [])];
                        updated[idx] = { ...updated[idx], answer: e.target.value };
                        updateData({ faq: updated });
                      }}
                      placeholder={t("faqAnswerPlaceholder") || "\u0627\u0644\u062c\u0648\u0627\u0628"}
                      rows={2}
                    />
                  </div>
                  <button
                    onClick={() => updateData({ faq: (data.faq || []).filter((_, i) => i !== idx) })}
                    className="shrink-0 text-muted-foreground hover:text-destructive mt-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-base border-2 border-dashed border-border p-4 space-y-3">
          <div className="space-y-2">
            <Input
              value={newFaqQuestion}
              onChange={(e) => setNewFaqQuestion(e.target.value)}
              placeholder={t("faqQuestionPlaceholder") || "\u0627\u0644\u0633\u0624\u0627\u0644"}
            />
            <Textarea
              value={newFaqAnswer}
              onChange={(e) => setNewFaqAnswer(e.target.value)}
              placeholder={t("faqAnswerPlaceholder") || "\u0627\u0644\u062c\u0648\u0627\u0628"}
              rows={2}
            />
          </div>
          <Button
            variant="neutral"
            size="sm"
            onClick={() => {
              if (!newFaqQuestion.trim()) return;
              updateData({ faq: [...(data.faq || []), { id: crypto.randomUUID(), question: newFaqQuestion, answer: newFaqAnswer }] });
              setNewFaqQuestion("");
              setNewFaqAnswer("");
            }}
            disabled={!newFaqQuestion.trim()}
          >
            <Plus className="h-4 w-4" /> {t("addFaq") || "\u0625\u0636\u0627\u0641\u0629 \u0633\u0624\u0627\u0644"}
          </Button>
        </div>
      </Section>

      {/* ────────────────── Navigation buttons ────────────────── */}
      <div className="flex justify-between pt-4 border-t-2 border-border">
        <Button variant="neutral" size="lg" onClick={onBack} className="gap-2">
          <ArrowRight className="h-4 w-4" />
          {t("backBtn") || "\u0631\u062c\u0648\u0639"}
        </Button>
        <Button size="lg" onClick={onNext} className="gap-2">
          {t("nextBtn") || "\u0627\u0644\u062a\u0627\u0644\u064a"}
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
