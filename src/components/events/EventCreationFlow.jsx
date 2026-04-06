import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProgressBar from "./ProgressBar";
import EventTypeStep from "./EventTypeStep";
import HackathonDetailsModal from "./HackathonDetailsModal";
import HackathonSuccessScreen from "./HackathonSuccessScreen";
import EventSuccessScreen from "./EventSuccessScreen";
import PlaceholderSection from "./PlaceholderSection";
import PublishDecisionStep from "./PublishDecisionStep";
import { generateHackathonPage, toSlug } from "../../utils/gemini";
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

const INITIAL_HACKATHON_FORM = {
  name: "",
  tagline: "",
  description: "",
  startDate: "",
  endDate: "",
  regDeadline: "",
  location: "",
  format: "In-Person",
  maxTeamSize: "",
  tracks: [{ name: "", description: "" }],
  prizes: [{ label: "", value: "" }],
  schedule: [{ time: "", activity: "" }],
  judges: [{ name: "", title: "", role: "Judge" }],
  primaryColor: "#7C3AED",
  accentColor: "#00D4AA",
  sponsors: "",
  regLink: "",
};

const EventCreationFlow = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // ── Flow state ──────────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(1);
  const [eventType, setEventType] = useState(null);

  // Step 2: form data
  const [hackathonForm, setHackathonForm] = useState(INITIAL_HACKATHON_FORM);
  const [showHackathonModal, setShowHackathonModal] = useState(false);
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
    setShowHackathonModal(false);
    setPendingGeneralData(null);
    setSubmitting(false);
    setSubmitAction(null);
    setSubmitError(null);
    setSuccessState(null);
    setHackathonForm(INITIAL_HACKATHON_FORM);
  };

  const handleClose = () => { resetFlow(); onClose(); };
  const handleGoToDashboard = () => { handleClose(); navigate("/dashboard"); };

  // ── Step 1 → Step 2 ──────────────────────────────────────────────────────────
  const handleSelectEventType = (type) => {
    setEventType(type);
    setCurrentStep(2);
    if (type === "hackathon") setShowHackathonModal(true);
  };

  // ── Step 2 (Hackathon): modal done → Step 3 ──────────────────────────────────
  const handleHackathonFormDone = (submittedForm) => {
    setHackathonForm(submittedForm);
    setShowHackathonModal(false);
    setCurrentStep(3);
  };

  const handleHackathonModalClose = () => {
    setShowHackathonModal(false);
    // stay on step 2, user can re-open via the placeholder button
  };

  // ── Step 2 (Other): form next → Step 3 ───────────────────────────────────────
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
    if (eventType === "hackathon") setShowHackathonModal(true);
  };

  // ── Step 3: Publish ──────────────────────────────────────────────────────────
  const handlePublish = async () => {
    setSubmitError(null);
    setSubmitting(true);
    setSubmitAction("publish");
    try {
      if (eventType === "hackathon") {
        // Generate landing page via Gemini, then publish
        const html = await generateHackathonPage(hackathonForm);
        if (!html || !html.trim()) throw new Error(t("generationFailed"));

        const result = await apiPost("/api/events/hackathon", {
          name: hackathonForm.name,
          generatedHtml: html,
          hackathonData: hackathonForm,
          visibility: "public",
        });

        setSuccessState({
          visibility: "public",
          eventType: "hackathon",
          slug: result.slug || toSlug(hackathonForm.name),
          id: result.id,
          name: hackathonForm.name,
        });
      } else {
        // General event — publish
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
      }
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
      if (eventType === "hackathon") {
        const result = await apiPost("/api/events/hackathon", {
          name: hackathonForm.name,
          hackathonData: hackathonForm,
          visibility: "private",
        });

        setSuccessState({
          visibility: "private",
          eventType: "hackathon",
          slug: result.slug,
          id: result.id,
          name: hackathonForm.name,
        });
      } else {
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
      }
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

          {/* ── Success screens ── */}
          {successState?.visibility === "public" && successState?.eventType === "hackathon" && (
            <HackathonSuccessScreen
              slug={successState.slug}
              onDashboard={handleGoToDashboard}
            />
          )}

          {successState && !(successState.visibility === "public" && successState.eventType === "hackathon") && (
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

              {/* Step 2: Hackathon placeholder (modal is open on top) */}
              {currentStep === 2 && eventType === "hackathon" && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground font-mono">{t("hackathonModalOpen") || "Configuring Hackathon..."}</p>
                  <button
                    onClick={() => setShowHackathonModal(true)}
                    className="mt-4 font-mono font-bold text-main hover:underline"
                  >
                    {t("reopenModal") || "Re-open Configuration"}
                  </button>
                  <button
                    onClick={() => { setCurrentStep(1); setEventType(null); }}
                    className="mt-4 mx-auto inline-flex items-center gap-1.5 border-2 border-border bg-secondary-background px-4 py-2 text-xs font-bold uppercase text-foreground hover:bg-secondary-background hover:border-foreground transition-colors duration-100"
                  >
                    ← {t("back") || "Back"}
                  </button>
                </div>
              )}

              {/* Step 2: Placeholder for other unbuilt types */}
              {currentStep === 2 && eventType !== "hackathon" && !FORM_EVENT_TYPES.includes(eventType) && (
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

      {/* Hackathon modal (overlays Step 2) */}
      <HackathonDetailsModal
        isOpen={showHackathonModal}
        onClose={handleHackathonModalClose}
        onSubmit={handleHackathonFormDone}
        form={hackathonForm}
        onFormChange={setHackathonForm}
      />
    </div>
  );
};

export default EventCreationFlow;
