import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProgressBar from "./ProgressBar";
import EventTypeStep from "./EventTypeStep";
import EventSuccessScreen from "./EventSuccessScreen";
import PlaceholderSection from "./PlaceholderSection";
import PublishDecisionStep from "./PublishDecisionStep";
import HackathonCreationWizard from "../hackathon/HackathonCreationWizard";
import WorkshopWizard from "./wizards/WorkshopWizard";
import SeminarWizard from "./wizards/SeminarWizard";
import TrainingWizard from "./wizards/TrainingWizard";
import ConferenceWizard from "./wizards/ConferenceWizard";
import { apiPost } from "../../utils/apiClient";
import { useLanguage } from "../../context/LanguageContext";
import GeneralEventForm from "./GeneralEventForm";

const FORM_EVENT_TYPES = ["other", "workshop", "seminar", "training", "conference"];

/**
 * Ramsha — EventCreationFlow
 *
 * 3-step event creation wizard:
 *   Step 1: Select Event Type
 *   Step 2: Fill in Event Details (form specific to type)
 *   Step 3: Publishing Decision (Publish or Keep Private)
 */

const EventCreationFlow = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // ── Flow state ──────────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(1);
  const [eventType, setEventType] = useState(null);

  // Step 2: form data
  const [pendingGeneralData, setPendingGeneralData] = useState(null); // { name, description }

  // Step 3: submission
  const [submitting, setSubmitting] = useState(false);
  const [submitAction, setSubmitAction] = useState(null); // "publish" | "private"
  const [submitError, setSubmitError] = useState(null);

  // Success state — set after successful API call
  const [successState, setSuccessState] = useState(null);
  // { visibility, eventType, slug?, id?, name? }

  // ── Reset ────────────────────────────────────────────────────────────────────
  const resetFlow = () => {
    setCurrentStep(1);
    setEventType(null);
    setPendingGeneralData(null);
    setSubmitting(false);
    setSubmitAction(null);
    setSubmitError(null);
    setSuccessState(null);
  };

  const handleClose = () => { resetFlow(); onClose(); };
  const handleGoToDashboard = () => { handleClose(); navigate("/dashboard"); };

  // ── Step 1 → Step 2 ──────────────────────────────────────────────────────────
  const handleSelectEventType = (type) => {
    setEventType(type);
    setCurrentStep(2);
  };

  // ── Step 2: form next → Step 3 ───────────────────────────────────────
  const handleGeneralFormNext = (data) => {
    setPendingGeneralData(data);
    setCurrentStep(3);
  };

  const handleGeneralFormBack = () => {
    setCurrentStep(1);
    setEventType(null);
    setPendingGeneralData(null);
  };

  // ── Step 3 → Step 2 (Back) ───────────────────────────────────────────────────
  const handlePublishBack = () => {
    setSubmitError(null);
    setCurrentStep(2);
  };

  // ── Step 3: Publish ──────────────────────────────────────────────────────────
  const handlePublish = async () => {
    setSubmitError(null);
    setSubmitting(true);
    setSubmitAction("publish");
    try {
      const result = await apiPost("/api/events", {
        ...pendingGeneralData,
        eventType,
        visibility: "public",
      });

      setSuccessState({
        visibility: "public",
        eventType,
        id: result.id,
        name: pendingGeneralData?.name,
      });
    } catch (err) {
      setSubmitError(err.message || t("generatePageFailed"));
    } finally {
      setSubmitting(false);
      setSubmitAction(null);
    }
  };

  // ── Step 3: Keep Private ─────────────────────────────────────────────────────
  const handlePrivate = async () => {
    setSubmitError(null);
    setSubmitting(true);
    setSubmitAction("private");
    try {
      const result = await apiPost("/api/events", {
        ...pendingGeneralData,
        eventType,
        visibility: "private",
      });

      setSuccessState({
        visibility: "private",
        eventType,
        id: result.id,
        name: pendingGeneralData?.name,
      });
    } catch (err) {
      setSubmitError(err.message || t("eventCreateFailed"));
    } finally {
      setSubmitting(false);
      setSubmitAction(null);
    }
  };

  // ── Derived label ─────────────────────────────────────────────────────────────
  const eventTypeLabel = eventType
    ? eventType.charAt(0).toUpperCase() + eventType.slice(1)
    : "";

  if (!isOpen) return null;

  // Type-specific full-screen wizards
  if (eventType === "hackathon") return <HackathonCreationWizard onClose={handleClose} />;
  if (eventType === "workshop") return <WorkshopWizard onClose={handleClose} />;
  if (eventType === "seminar") return <SeminarWizard onClose={handleClose} />;
  if (eventType === "training") return <TrainingWizard onClose={handleClose} />;
  if (eventType === "conference") return <ConferenceWizard onClose={handleClose} />;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b-2 border-border bg-secondary-background flex items-center justify-between px-6 md:px-12 shrink-0">
        <h1 className="font-heading font-black text-lg text-foreground">{t("createEventTitle")}</h1>
        <button
          onClick={handleClose}
          className="font-mono font-bold text-lg text-muted-foreground hover:text-destructive transition-colors duration-100"
        >
          ✕
        </button>
      </header>

      {/* Progress Bar — hidden after success */}
      {!successState && <ProgressBar currentStep={currentStep} />}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 md:px-12 py-8 md:py-12">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* ── Success screen ── */}
          {successState && (
            <EventSuccessScreen
              visibility={successState.visibility}
              eventId={successState.id}
              onDashboard={handleGoToDashboard}
            />
          )}

          {/* ── Flow steps (only when no success yet) ── */}
          {!successState && (
            <>
              {/* Step 1: Event Type Selection */}
              {currentStep === 1 && (
                <EventTypeStep
                  selectedType={eventType}
                  onSelectType={handleSelectEventType}
                />
              )}

              {/* Step 2: General Event Form for supported non-hackathon types */}
              {currentStep === 2 && FORM_EVENT_TYPES.includes(eventType) && (
                <GeneralEventForm
                  onBack={handleGeneralFormBack}
                  onNext={handleGeneralFormNext}
                  initialData={pendingGeneralData}
                  eventType={eventType}
                />
              )}

              {/* Step 2: Placeholder for unbuilt types */}
              {currentStep === 2 && !FORM_EVENT_TYPES.includes(eventType) && (
                <PlaceholderSection
                  title={`${eventTypeLabel} ${t("eventSetup")}`}
                  subtitle={t("comingSoon")}
                  message={t("eventTypeDev")}
                  onBack={() => { setCurrentStep(1); setEventType(null); }}
                />
              )}

              {/* Step 3: Publishing Decision */}
              {currentStep === 3 && (
                <PublishDecisionStep
                  onPublish={handlePublish}
                  onPrivate={handlePrivate}
                  onBack={handlePublishBack}
                  submitting={submitting}
                  submitAction={submitAction}
                  error={submitError}
                />
              )}
            </>
          )}
        </div>
      </div>

    </div>
  );
};

export default EventCreationFlow;
