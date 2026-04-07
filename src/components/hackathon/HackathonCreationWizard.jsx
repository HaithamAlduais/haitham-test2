import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { apiPost } from "@/utils/apiClient";
import { useLanguage } from "@/context/LanguageContext";
import BasicInfoStep from "./steps/BasicInfoStep";
import ScheduleStep from "./steps/ScheduleStep";
import AIScreeningStep from "./steps/AIScreeningStep";
import TracksStep from "./steps/TracksStep";
import JudgingCriteriaStep from "./steps/JudgingCriteriaStep";
import PrizesStep from "./steps/PrizesStep";
import WorkbackScheduleStep from "./steps/WorkbackScheduleStep";
import ResourcesStep from "./steps/ResourcesStep";
import BrandingStep from "./steps/BrandingStep";
import SponsorsStep from "./steps/SponsorsStep";
import TeamSettingsStep from "./steps/TeamSettingsStep";
import ReviewPublishStep from "./steps/ReviewPublishStep";

const STEP_KEYS = [
  { key: "basic", labelKey: "stepBasics" },
  { key: "schedule", labelKey: "stepSchedule" },
  { key: "screening", labelKey: "stepAIScreening" },
  { key: "tracks", labelKey: "stepTracks" },
  { key: "judging", labelKey: "stepJudging" },
  { key: "prizes", labelKey: "stepPrizes" },
  { key: "teams", labelKey: "stepTeams" },
  { key: "workback", labelKey: "stepPlanning" },
  { key: "resources", labelKey: "stepResources" },
  { key: "branding", labelKey: "stepBranding" },
  { key: "sponsors", labelKey: "stepSponsors" },
  { key: "review", labelKey: "stepReview" },
];

const INITIAL_DATA = {
  title: "",
  tagline: "",
  description: "",
  rules: "",
  format: "online",
  location: { name: "", address: "", lat: null, lng: null },
  targetAudience: "",
  whyParticipate: "",
  howItWorks: "",
  contactEmail: "",
  schedule: {
    registrationOpen: "",
    registrationClose: "",
    submissionDeadline: "",
    judgingStart: "",
    judgingEnd: "",
  },
  aiScreeningConfig: {
    enabled: false,
    criteria: [],
    autoAcceptThreshold: 80,
    autoRejectThreshold: 30,
    language: "both",
  },
  tracks: [],
  judgingCriteria: [],
  prizes: [],
  settings: { maxRegistrants: 500, teamSizeMin: 2, teamSizeMax: 5, allowSolo: false },
  registrationSettings: { requireApproval: true, customFields: [] },
  workbackSchedule: [],
  resources: [],
  branding: { logoUrl: "", bannerUrl: "", primaryColor: "#7C3AED", secondaryColor: "#00D4AA", hashtag: "" },
  sponsors: [],
  faq: [],
  enablePopularVote: false,
  isPublic: true,
};

export default function HackathonCreationWizard({ onClose }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState(INITIAL_DATA);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const updateData = (partial) => setData((prev) => ({ ...prev, ...partial }));
  const next = () => setStep((s) => Math.min(s + 1, STEP_KEYS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async (publish) => {
    setError(null);
    setSubmitting(true);
    try {
      const result = await apiPost("/api/hackathons", {
        ...data,
        isPublic: publish,
      });
      setSuccess({ id: result.id, slug: result.slug, isPublic: publish });
    } catch (err) {
      setError(err.message || "Failed to create hackathon.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    const shareUrl = `${window.location.origin}/hackathon/${success.slug}`;
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
        <header className="h-16 border-b-2 border-border bg-secondary-background flex items-center justify-between px-6 md:px-12 shrink-0">
          <h1 className="font-heading font-black text-lg text-foreground">{t("hackathonCreated")}</h1>
        </header>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-md space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full border-2 border-border bg-main flex items-center justify-center shadow-neo-sm">
              <span className="text-2xl text-main-foreground font-black">✓</span>
            </div>
            <h2 className="text-2xl font-black text-foreground">{data.title}</h2>
            <p className="text-muted-foreground">
              {success.isPublic
                ? t("hackathonLive")
                : t("savedAsDraft")}
            </p>
            {success.isPublic && (
              <div className="rounded-base border-2 border-border bg-card p-3">
                <p className="text-xs text-muted-foreground mb-1">{t("shareLink")}</p>
                <p className="text-sm font-bold text-main break-all">{shareUrl}</p>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <Button variant="neutral" onClick={() => { navigator.clipboard?.writeText(shareUrl); }}>
                {t("copyLink")}
              </Button>
              <Button onClick={() => { onClose?.(); navigate("/dashboard"); }}>
                {t("goToDashboardHack")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stepComponents = [
    <BasicInfoStep data={data} onChange={updateData} onNext={next} />,
    <ScheduleStep data={data} onChange={updateData} onNext={next} onBack={back} />,
    <AIScreeningStep data={data} onChange={updateData} onNext={next} onBack={back} />,
    <TracksStep data={data} onChange={updateData} onNext={next} onBack={back} />,
    <JudgingCriteriaStep data={data} onChange={updateData} onNext={next} onBack={back} />,
    <PrizesStep data={data} onChange={updateData} onNext={next} onBack={back} />,
    <TeamSettingsStep data={data} onChange={updateData} onNext={next} onBack={back} />,
    <WorkbackScheduleStep data={data} onChange={updateData} onNext={next} onBack={back} />,
    <ResourcesStep data={data} onChange={updateData} onNext={next} onBack={back} />,
    <BrandingStep data={data} onChange={updateData} onNext={next} onBack={back} />,
    <SponsorsStep data={data} onChange={updateData} onNext={next} onBack={back} />,
    <ReviewPublishStep
      data={data}
      onBack={back}
      onPublish={() => handleSubmit(true)}
      onSaveDraft={() => handleSubmit(false)}
      submitting={submitting}
      error={error}
    />,
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b-2 border-border bg-secondary-background flex items-center justify-between px-6 md:px-12 shrink-0">
        <h1 className="font-heading font-black text-lg text-foreground">{t("createHackathon")}</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-muted-foreground">
            {t("stepXofY").replace("{x}", step + 1).replace("{y}", STEP_KEYS.length)}
          </span>
          <button
            onClick={onClose}
            className="font-mono font-bold text-lg text-muted-foreground hover:text-destructive transition-colors"
          >
            ✕
          </button>
        </div>
      </header>

      {/* Step indicator */}
      <div className="border-b-2 border-border bg-secondary-background px-6 md:px-12 py-3 shrink-0">
        <div className="max-w-5xl mx-auto flex gap-1 overflow-x-auto">
          {STEP_KEYS.map((s, i) => (
            <button
              key={s.key}
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              className={`px-2.5 py-1.5 rounded-base text-xs font-bold border-2 transition-colors whitespace-nowrap ${
                i === step
                  ? "bg-main text-main-foreground border-border shadow-neo-sm"
                  : i < step
                  ? "bg-card text-foreground border-border cursor-pointer hover:bg-muted"
                  : "bg-background text-muted-foreground border-transparent cursor-not-allowed"
              }`}
            >
              {i + 1}. {t(s.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-main transition-all duration-300"
          style={{ width: `${((step + 1) / STEP_KEYS.length) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 md:px-12 py-8">
        <div className="max-w-3xl mx-auto">
          {stepComponents[step]}
        </div>
      </div>
    </div>
  );
}
