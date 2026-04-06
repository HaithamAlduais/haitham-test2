import { useRef, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";

/**
 * Ramsha — GeneralEventForm
 *
 * General event creation form. Validates input and calls onNext(formData)
 * to pass data up to EventCreationFlow, which handles the actual submission
 * after the publishing decision step.
 */
const GeneralEventForm = ({ onBack, onNext, initialData, eventType = "other" }) => {
  const { t } = useLanguage();
  const nameInputRef = useRef(null);

  const isWorkshop = eventType === "workshop";
  const isSeminar = eventType === "seminar";
  const isTraining = eventType === "training";
  const isConference = eventType === "conference";

  const [form, setForm] = useState(
    initialData ?? {
      name: "",
      description: "",
      ...(isWorkshop
        ? {
            workshopData: {
              instructor: "",
              startDate: "",
              durationMinutes: "",
              capacity: "",
              location: "",
            },
          }
        : {}),
      ...(isSeminar
        ? {
            seminarData: {
              speaker: "",
              startDate: "",
              durationMinutes: "",
              topic: "",
              location: "",
            },
          }
        : {}),
      ...(isTraining
        ? {
            trainingData: {
              coordinator: "",
              startDate: "",
              sessionCount: "",
              capacity: "",
              location: "",
            },
          }
        : {}),
      ...(isConference
        ? {
            conferenceData: {
              organizer: "",
              startDate: "",
              trackCount: "",
              venue: "",
            },
          }
        : {}),
    }
  );
  const [errors, setErrors] = useState({});

  const workshopData = form.workshopData ?? {
    instructor: "",
    startDate: "",
    durationMinutes: "",
    capacity: "",
    location: "",
  };

  const updateWorkshopData = (key, value) => {
    setForm((current) => ({
      ...current,
      workshopData: {
        ...(current.workshopData ?? workshopData),
        [key]: value,
      },
    }));
  };

  const seminarData = form.seminarData ?? {
    speaker: "",
    startDate: "",
    durationMinutes: "",
    topic: "",
    location: "",
  };

  const trainingData = form.trainingData ?? {
    coordinator: "",
    startDate: "",
    sessionCount: "",
    capacity: "",
    location: "",
  };

  const conferenceData = form.conferenceData ?? {
    organizer: "",
    startDate: "",
    trackCount: "",
    venue: "",
  };

  const updateSeminarData = (key, value) => {
    setForm((current) => ({
      ...current,
      seminarData: {
        ...(current.seminarData ?? seminarData),
        [key]: value,
      },
    }));
  };

  const updateTrainingData = (key, value) => {
    setForm((current) => ({
      ...current,
      trainingData: {
        ...(current.trainingData ?? trainingData),
        [key]: value,
      },
    }));
  };

  const updateConferenceData = (key, value) => {
    setForm((current) => ({
      ...current,
      conferenceData: {
        ...(current.conferenceData ?? conferenceData),
        [key]: value,
      },
    }));
  };

  const handleContinue = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = t("nameRequired");
    if (isWorkshop) {
      if (!workshopData.instructor.trim()) errs.instructor = t("workshopInstructorRequired");
      if (!workshopData.startDate) errs.startDate = t("workshopStartDateRequired");
      if (!workshopData.durationMinutes || Number(workshopData.durationMinutes) <= 0) {
        errs.durationMinutes = t("workshopDurationRequired");
      }
    }

    if (isSeminar) {
      if (!seminarData.speaker.trim()) errs.speaker = t("seminarSpeakerRequired");
      if (!seminarData.startDate) errs.seminarStartDate = t("seminarStartDateRequired");
      if (!seminarData.durationMinutes || Number(seminarData.durationMinutes) <= 0) {
        errs.seminarDuration = t("seminarDurationRequired");
      }
    }

    if (isTraining) {
      if (!trainingData.coordinator.trim()) errs.coordinator = t("trainingCoordinatorRequired");
      if (!trainingData.startDate) errs.trainingStartDate = t("trainingStartDateRequired");
      if (!trainingData.sessionCount || Number(trainingData.sessionCount) <= 0) {
        errs.sessionCount = t("trainingSessionCountRequired");
      }
    }

    if (isConference) {
      if (!conferenceData.organizer.trim()) errs.organizer = t("conferenceOrganizerRequired");
      if (!conferenceData.startDate) errs.conferenceStartDate = t("conferenceStartDateRequired");
      if (!conferenceData.trackCount || Number(conferenceData.trackCount) <= 0) {
        errs.trackCount = t("conferenceTrackCountRequired");
      }
    }

    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    const payload = {
      ...form,
      name: form.name.trim(),
      description: form.description?.trim() ?? "",
    };

    if (isWorkshop) {
      payload.workshopData = {
        instructor: workshopData.instructor.trim(),
        startDate: workshopData.startDate,
        durationMinutes: Number(workshopData.durationMinutes),
        capacity: workshopData.capacity ? Number(workshopData.capacity) : null,
        location: workshopData.location?.trim() ?? "",
      };
    }

    if (isSeminar) {
      payload.seminarData = {
        speaker: seminarData.speaker.trim(),
        startDate: seminarData.startDate,
        durationMinutes: Number(seminarData.durationMinutes),
        topic: seminarData.topic?.trim() ?? "",
        location: seminarData.location?.trim() ?? "",
      };
    }

    if (isTraining) {
      payload.trainingData = {
        coordinator: trainingData.coordinator.trim(),
        startDate: trainingData.startDate,
        sessionCount: Number(trainingData.sessionCount),
        capacity: trainingData.capacity ? Number(trainingData.capacity) : null,
        location: trainingData.location?.trim() ?? "",
      };
    }

    if (isConference) {
      payload.conferenceData = {
        organizer: conferenceData.organizer.trim(),
        startDate: conferenceData.startDate,
        trackCount: Number(conferenceData.trackCount),
        venue: conferenceData.venue?.trim() ?? "",
      };
    }

    onNext(payload);
  };

  return (
    <section className="space-y-6 max-w-md">
      <div className="space-y-1">
        <h2 className="font-heading font-black text-xl text-foreground">{t("newEventTitle")}</h2>
      </div>

      {/* Name */}
      <div>
        <label className="block font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground mb-1">
          {t("eventNameLabel")}
        </label>
        <input
          ref={nameInputRef}
          type="text"
          value={form.name}
          onChange={(e) => {
            setForm((f) => ({ ...f, name: e.target.value }));
            if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
          }}
          className={`w-full border-2 ${
            errors.name ? "border-destructive" : "border-border"
          } bg-secondary-background px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-main`}
          placeholder={t("eventNamePlaceholder")}
        />
        {errors.name && (
          <p className="font-mono text-xs text-destructive mt-1">{errors.name}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground mb-1">
          {t("descriptionLabel")}
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
          className="w-full border-2 border-border bg-secondary-background px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-main resize-none"
          placeholder={t("descriptionPlaceholder")}
        />
      </div>

      {/* Workshop Details */}
      {isWorkshop && (
        <>
          <div>
            <label className="block font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground mb-1">
              {t("workshopInstructorLabel")}
            </label>
            <input
              type="text"
              value={workshopData.instructor}
              onChange={(e) => {
                updateWorkshopData("instructor", e.target.value);
                if (errors.instructor) setErrors((prev) => ({ ...prev, instructor: null }));
              }}
              className={`w-full border-2 ${
                errors.instructor ? "border-destructive" : "border-border"
              } bg-secondary-background px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-main`}
              placeholder={t("workshopInstructorPlaceholder")}
            />
            {errors.instructor && (
              <p className="font-mono text-xs text-destructive mt-1">{errors.instructor}</p>
            )}
          </div>

          <div>
            <label className="block font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground mb-1">
              {t("workshopStartDateLabel")}
            </label>
            <input
              type="datetime-local"
              value={workshopData.startDate}
              onChange={(e) => {
                updateWorkshopData("startDate", e.target.value);
                if (errors.startDate) setErrors((prev) => ({ ...prev, startDate: null }));
              }}
              className={`w-full border-2 ${
                errors.startDate ? "border-destructive" : "border-border"
              } bg-secondary-background px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-main`}
            />
            {errors.startDate && (
              <p className="font-mono text-xs text-destructive mt-1">{errors.startDate}</p>
            )}
          </div>

          <div>
            <label className="block font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground mb-1">
              {t("workshopDurationLabel")}
            </label>
            <input
              type="number"
              min="1"
              value={workshopData.durationMinutes}
              onChange={(e) => {
                updateWorkshopData("durationMinutes", e.target.value);
                if (errors.durationMinutes) setErrors((prev) => ({ ...prev, durationMinutes: null }));
              }}
              className={`w-full border-2 ${
                errors.durationMinutes ? "border-destructive" : "border-border"
              } bg-secondary-background px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-main`}
              placeholder={t("workshopDurationPlaceholder")}
            />
            {errors.durationMinutes && (
              <p className="font-mono text-xs text-destructive mt-1">{errors.durationMinutes}</p>
            )}
          </div>

          <div>
            <label className="block font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground mb-1">
              {t("workshopCapacityLabel")}
            </label>
            <input
              type="number"
              min="1"
              value={workshopData.capacity}
              onChange={(e) => updateWorkshopData("capacity", e.target.value)}
              className="w-full border-2 border-border bg-secondary-background px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-main"
              placeholder={t("workshopCapacityPlaceholder")}
            />
          </div>

          <div>
            <label className="block font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground mb-1">
              {t("workshopLocationLabel")}
            </label>
            <input
              type="text"
              value={workshopData.location}
              onChange={(e) => updateWorkshopData("location", e.target.value)}
              className="w-full border-2 border-border bg-secondary-background px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-main"
              placeholder={t("workshopLocationPlaceholder")}
            />
          </div>
        </>
      )}

      {isSeminar && (
        <>
          <div>
            <label className="block font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground mb-1">
              {t("seminarSpeakerLabel")}
            </label>
            <input
              type="text"
              value={seminarData.speaker}
              onChange={(e) => {
                updateSeminarData("speaker", e.target.value);
                if (errors.speaker) setErrors((prev) => ({ ...prev, speaker: null }));
              }}
              className={`w-full border-2 ${errors.speaker ? "border-destructive" : "border-border"} bg-secondary-background px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-main`}
              placeholder={t("seminarSpeakerPlaceholder")}
            />
            {errors.speaker && <p className="font-mono text-xs text-destructive mt-1">{errors.speaker}</p>}
          </div>

          <div>
            <label className="block font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground mb-1">
              {t("seminarStartDateLabel")}
            </label>
            <input
              type="datetime-local"
              value={seminarData.startDate}
              onChange={(e) => {
                updateSeminarData("startDate", e.target.value);
                if (errors.seminarStartDate) setErrors((prev) => ({ ...prev, seminarStartDate: null }));
              }}
              className={`w-full border-2 ${errors.seminarStartDate ? "border-destructive" : "border-border"} bg-secondary-background px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-main`}
            />
            {errors.seminarStartDate && <p className="font-mono text-xs text-destructive mt-1">{errors.seminarStartDate}</p>}
          </div>

          <div>
            <label className="block font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground mb-1">
              {t("seminarDurationLabel")}
            </label>
            <input
              type="number"
              min="1"
              value={seminarData.durationMinutes}
              onChange={(e) => {
                updateSeminarData("durationMinutes", e.target.value);
                if (errors.seminarDuration) setErrors((prev) => ({ ...prev, seminarDuration: null }));
              }}
              className={`w-full border-2 ${errors.seminarDuration ? "border-destructive" : "border-border"} bg-secondary-background px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-main`}
              placeholder={t("seminarDurationPlaceholder")}
            />
            {errors.seminarDuration && <p className="font-mono text-xs text-destructive mt-1">{errors.seminarDuration}</p>}
          </div>

          <div>
            <label className="block font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground mb-1">
              {t("seminarTopicLabel")}
            </label>
            <input
              type="text"
              value={seminarData.topic}
              onChange={(e) => updateSeminarData("topic", e.target.value)}
              className="w-full border-2 border-border bg-secondary-background px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-main"
              placeholder={t("seminarTopicPlaceholder")}
            />
          </div>

          <div>
            <label className="block font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground mb-1">
              {t("seminarLocationLabel")}
            </label>
            <input
              type="text"
              value={seminarData.location}
              onChange={(e) => updateSeminarData("location", e.target.value)}
              className="w-full border-2 border-border bg-secondary-background px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-main"
              placeholder={t("seminarLocationPlaceholder")}
            />
          </div>
        </>
      )}

      {isTraining && (
        <>
          <div>
            <label className="block font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground mb-1">
              {t("trainingCoordinatorLabel")}
            </label>
            <input
              type="text"
              value={trainingData.coordinator}
              onChange={(e) => {
                updateTrainingData("coordinator", e.target.value);
                if (errors.coordinator) setErrors((prev) => ({ ...prev, coordinator: null }));
              }}
              className={`w-full border-2 ${errors.coordinator ? "border-destructive" : "border-border"} bg-secondary-background px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-main`}
              placeholder={t("trainingCoordinatorPlaceholder")}
            />
            {errors.coordinator && <p className="font-mono text-xs text-destructive mt-1">{errors.coordinator}</p>}
          </div>

          <div>
            <label className="block font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground mb-1">
              {t("trainingStartDateLabel")}
            </label>
            <input
              type="datetime-local"
              value={trainingData.startDate}
              onChange={(e) => {
                updateTrainingData("startDate", e.target.value);
                if (errors.trainingStartDate) setErrors((prev) => ({ ...prev, trainingStartDate: null }));
              }}
              className={`w-full border-2 ${errors.trainingStartDate ? "border-destructive" : "border-border"} bg-secondary-background px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-main`}
            />
            {errors.trainingStartDate && <p className="font-mono text-xs text-destructive mt-1">{errors.trainingStartDate}</p>}
          </div>

          <div>
            <label className="block font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground mb-1">
              {t("trainingSessionCountLabel")}
            </label>
            <input
              type="number"
              min="1"
              value={trainingData.sessionCount}
              onChange={(e) => {
                updateTrainingData("sessionCount", e.target.value);
                if (errors.sessionCount) setErrors((prev) => ({ ...prev, sessionCount: null }));
              }}
              className={`w-full border-2 ${errors.sessionCount ? "border-destructive" : "border-border"} bg-secondary-background px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-main`}
              placeholder={t("trainingSessionCountPlaceholder")}
            />
            {errors.sessionCount && <p className="font-mono text-xs text-destructive mt-1">{errors.sessionCount}</p>}
          </div>

          <div>
            <label className="block font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground mb-1">
              {t("trainingCapacityLabel")}
            </label>
            <input
              type="number"
              min="1"
              value={trainingData.capacity}
              onChange={(e) => updateTrainingData("capacity", e.target.value)}
              className="w-full border-2 border-border bg-secondary-background px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-main"
              placeholder={t("trainingCapacityPlaceholder")}
            />
          </div>

          <div>
            <label className="block font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground mb-1">
              {t("trainingLocationLabel")}
            </label>
            <input
              type="text"
              value={trainingData.location}
              onChange={(e) => updateTrainingData("location", e.target.value)}
              className="w-full border-2 border-border bg-secondary-background px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-main"
              placeholder={t("trainingLocationPlaceholder")}
            />
          </div>
        </>
      )}

      {isConference && (
        <>
          <div>
            <label className="block font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground mb-1">
              {t("conferenceOrganizerLabel")}
            </label>
            <input
              type="text"
              value={conferenceData.organizer}
              onChange={(e) => {
                updateConferenceData("organizer", e.target.value);
                if (errors.organizer) setErrors((prev) => ({ ...prev, organizer: null }));
              }}
              className={`w-full border-2 ${errors.organizer ? "border-destructive" : "border-border"} bg-secondary-background px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-main`}
              placeholder={t("conferenceOrganizerPlaceholder")}
            />
            {errors.organizer && <p className="font-mono text-xs text-destructive mt-1">{errors.organizer}</p>}
          </div>

          <div>
            <label className="block font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground mb-1">
              {t("conferenceStartDateLabel")}
            </label>
            <input
              type="datetime-local"
              value={conferenceData.startDate}
              onChange={(e) => {
                updateConferenceData("startDate", e.target.value);
                if (errors.conferenceStartDate) setErrors((prev) => ({ ...prev, conferenceStartDate: null }));
              }}
              className={`w-full border-2 ${errors.conferenceStartDate ? "border-destructive" : "border-border"} bg-secondary-background px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-main`}
            />
            {errors.conferenceStartDate && <p className="font-mono text-xs text-destructive mt-1">{errors.conferenceStartDate}</p>}
          </div>

          <div>
            <label className="block font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground mb-1">
              {t("conferenceTrackCountLabel")}
            </label>
            <input
              type="number"
              min="1"
              value={conferenceData.trackCount}
              onChange={(e) => {
                updateConferenceData("trackCount", e.target.value);
                if (errors.trackCount) setErrors((prev) => ({ ...prev, trackCount: null }));
              }}
              className={`w-full border-2 ${errors.trackCount ? "border-destructive" : "border-border"} bg-secondary-background px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-main`}
              placeholder={t("conferenceTrackCountPlaceholder")}
            />
            {errors.trackCount && <p className="font-mono text-xs text-destructive mt-1">{errors.trackCount}</p>}
          </div>

          <div>
            <label className="block font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground mb-1">
              {t("conferenceVenueLabel")}
            </label>
            <input
              type="text"
              value={conferenceData.venue}
              onChange={(e) => updateConferenceData("venue", e.target.value)}
              className="w-full border-2 border-border bg-secondary-background px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-main"
              placeholder={t("conferenceVenuePlaceholder")}
            />
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 border-2 border-border bg-secondary-background text-foreground text-xs font-bold uppercase px-4 py-2 hover:border-foreground hover:bg-secondary-background transition-colors duration-100"
        >
          ← {t("back")}
        </button>
        <button
          onClick={handleContinue}
          className="border-2 border-main bg-main text-main-foreground text-xs font-bold uppercase px-4 py-2 hover:bg-transparent hover:text-main transition-colors duration-100"
        >
          {t("continueToPublish")} →
        </button>
      </div>
    </section>
  );
};

export default GeneralEventForm;
