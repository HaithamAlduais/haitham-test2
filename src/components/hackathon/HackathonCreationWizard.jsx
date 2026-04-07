import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { apiPost } from "@/utils/apiClient";
import { useLanguage } from "@/context/LanguageContext";
import BasicInfoStep from "./steps/BasicInfoStep";
import ScheduleStep from "./steps/ScheduleStep";
import TracksStep from "./steps/TracksStep";
import JudgingCriteriaStep from "./steps/JudgingCriteriaStep";
import PrizesStep from "./steps/PrizesStep";
import TeamSettingsStep from "./steps/TeamSettingsStep";
import ReviewPublishStep from "./steps/ReviewPublishStep";

const STEPS = [
  { key: "basic", label: "Basic Info" },
  { key: "schedule", label: "Schedule" },
  { key: "tracks", label: "Tracks" },
  { key: "judging", label: "Judging" },
  { key: "prizes", label: "Prizes" },
  { key: "teams", label: "Teams" },
  { key: "review", label: "Review" },
];

const INITIAL_DATA = {
  title: "",
  tagline: "",
  description: "",
  rules: "",
  schedule: {
    registrationOpen: "",
    registrationClose: "",
    submissionDeadline: "",
    judgingStart: "",
    judgingEnd: "",
  },
  tracks: [],
  judgingCriteria: [],
  prizes: [],
  settings: { maxRegistrants: 500, teamSizeMin: 2, teamSizeMax: 5, allowSolo: false },
  registrationSettings: { requireApproval: true, customFields: [] },
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
  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
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
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
        <header className="h-16 border-b-2 border-border bg-secondary-background flex items-center justify-between px-6 md:px-12 shrink-0">
          <h1 className="font-heading font-black text-lg text-foreground">Hackathon Created</h1>
        </header>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-md space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full border-2 border-border bg-main flex items-center justify-center shadow-neo-sm">
              <span className="text-2xl text-main-foreground font-black">✓</span>
            </div>
            <h2 className="text-2xl font-black text-foreground">
              {data.title}
            </h2>
            <p className="text-muted-foreground">
              {success.isPublic
                ? "Your hackathon has been created and is now publicly visible."
                : "Your hackathon has been saved as a draft."}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => { onClose?.(); navigate("/dashboard"); }}>
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b-2 border-border bg-secondary-background flex items-center justify-between px-6 md:px-12 shrink-0">
        <h1 className="font-heading font-black text-lg text-foreground">Create Hackathon</h1>
        <button
          onClick={onClose}
          className="font-mono font-bold text-lg text-muted-foreground hover:text-destructive transition-colors"
        >
          ✕
        </button>
      </header>

      {/* Step indicator */}
      <div className="border-b-2 border-border bg-secondary-background px-6 md:px-12 py-3 shrink-0">
        <div className="max-w-4xl mx-auto flex gap-1 overflow-x-auto">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              className={`px-3 py-1.5 rounded-base text-xs font-bold border-2 transition-colors whitespace-nowrap ${
                i === step
                  ? "bg-main text-main-foreground border-border shadow-neo-sm"
                  : i < step
                  ? "bg-card text-foreground border-border cursor-pointer hover:bg-muted"
                  : "bg-background text-muted-foreground border-transparent cursor-not-allowed"
              }`}
            >
              {i + 1}. {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 md:px-12 py-8">
        <div className="max-w-3xl mx-auto">
          {step === 0 && (
            <BasicInfoStep data={data} onChange={updateData} onNext={next} />
          )}
          {step === 1 && (
            <ScheduleStep data={data} onChange={updateData} onNext={next} onBack={back} />
          )}
          {step === 2 && (
            <TracksStep data={data} onChange={updateData} onNext={next} onBack={back} />
          )}
          {step === 3 && (
            <JudgingCriteriaStep data={data} onChange={updateData} onNext={next} onBack={back} />
          )}
          {step === 4 && (
            <PrizesStep data={data} onChange={updateData} onNext={next} onBack={back} />
          )}
          {step === 5 && (
            <TeamSettingsStep data={data} onChange={updateData} onNext={next} onBack={back} />
          )}
          {step === 6 && (
            <ReviewPublishStep
              data={data}
              onBack={back}
              onPublish={() => handleSubmit(true)}
              onSaveDraft={() => handleSubmit(false)}
              submitting={submitting}
              error={error}
            />
          )}
        </div>
      </div>
    </div>
  );
}
