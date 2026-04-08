import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost, apiPatch } from "@/utils/apiClient";
import { useLanguage } from "@/context/LanguageContext";
import { X } from "lucide-react";

import WizardStepper from "@/components/hackathon/WizardStepper";
import FileUploadPreStep from "@/components/hackathon/steps/FileUploadPreStep";
import HackathonDetailsStep, { INITIAL_DATA } from "@/components/hackathon/steps/HackathonDetailsStep";
import RegistrationFormStep from "@/components/hackathon/steps/RegistrationFormStep";
import LandingPageStep from "@/components/hackathon/steps/LandingPageStep";

// ══════════════════════════════════════════════════════════════════════════════
// HackathonCreationWizard — thin orchestrator
//
// Flow:
//   showUpload === true  →  FileUploadPreStep (pre-step)
//   step === 1           →  HackathonDetailsStep
//   step === 2           →  RegistrationFormStep (placeholder)
//   step === 3           →  LandingPageStep
// ══════════════════════════════════════════════════════════════════════════════
export default function HackathonCreationWizard({ onClose, initialData, hackathonId }) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const isEditMode = Boolean(initialData && hackathonId);

  // ── Navigation state ───────────────────────────────────────────────────────
  const [showUpload, setShowUpload] = useState(!isEditMode);
  const [step, setStep] = useState(1);

  // ── Form data ──────────────────────────────────────────────────────────────
  const [data, setData] = useState(isEditMode ? initialData : INITIAL_DATA);
  const updateData = (partial) => setData((prev) => ({ ...prev, ...partial }));

  // ── Registration form (Phase 2) ────────────────────────────────────────────
  const [registrationForm, setRegistrationForm] = useState(
    isEditMode && initialData?.registrationForm
      ? initialData.registrationForm
      : { fields: [] }
  );

  // ── Submission state ───────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // ── Save hackathon (draft or publish) ──────────────────────────────────────
  const saveHackathon = async (isPublic) => {
    setError(null);
    setSubmitting(true);
    try {
      if (isEditMode) {
        await apiPatch(`/api/hackathons/${hackathonId}`, { ...data, registrationForm, isPublic });
        return { id: hackathonId, slug: initialData.slug || hackathonId };
      }
      const result = await apiPost("/api/hackathons", { ...data, registrationForm, isPublic });
      return result; // { id, slug }
    } catch (err) {
      setError(err.message || (isEditMode ? "Failed to update hackathon." : "Failed to create hackathon."));
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async (pageHtml) => {
    // Include page HTML in the main save if available
    if (pageHtml) {
      data.customPageHtml = pageHtml;
      data.hasCustomPage = true;
    }
    const result = await saveHackathon(false);
    if (result) {
      navigate(`/hackathons/${result.slug || result.id}`);
      onClose?.();
    }
  };

  // ── File upload callbacks ──────────────────────────────────────────────────
  const handleDataExtracted = (mergedData) => {
    setData(mergedData);
    setShowUpload(false);
  };

  const handleSkipUpload = () => {
    setShowUpload(false);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: Pre-step (file upload)
  // ══════════════════════════════════════════════════════════════════════════
  if (showUpload) {
    return (
      <FileUploadPreStep
        onDataExtracted={handleDataExtracted}
        onSkip={handleSkipUpload}
        onClose={onClose}
        initialData={INITIAL_DATA}
      />
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: Main wizard with stepper
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b-2 border-border bg-secondary-background flex items-center justify-between px-6 md:px-12 shrink-0">
        <h1 className="font-heading font-black text-lg text-foreground">{t("createHackathon")}</h1>
        <button
          onClick={onClose}
          className="font-mono font-bold text-lg text-muted-foreground hover:text-destructive transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      {/* Stepper */}
      <WizardStepper currentStep={step} />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 md:px-12 py-8">
        {/* Error banner */}
        {error && (
          <div className="max-w-3xl mx-auto mb-6 rounded-base border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Step 1: Hackathon Details */}
        {step === 1 && (
          <HackathonDetailsStep
            data={data}
            onChange={updateData}
            onNext={() => setStep(2)}
            onBack={() => setShowUpload(true)}
          />
        )}

        {/* Step 2: Registration Form (placeholder) */}
        {step === 2 && (
          <RegistrationFormStep
            fields={registrationForm.fields}
            onChange={(fields) => setRegistrationForm({ fields })}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {/* Step 3: Landing Page */}
        {step === 3 && (
          <LandingPageStep
            hackathonData={data}
            registrationForm={registrationForm}
            onSaveDraft={handleSaveDraft}
            onBack={() => setStep(2)}
          />
        )}
      </div>
    </div>
  );
}
