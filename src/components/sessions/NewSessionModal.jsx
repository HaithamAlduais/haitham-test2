import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const NewSessionModal = ({ isOpen, onClose, onSubmit, events = [], eventId: lockedEventId, eventTitle }) => {
  const { t } = useLanguage();
  const isEventLocked = Boolean(lockedEventId);

  const initialState = {
    title: "", sessionType: "qr_code", notes: "",
    allowedLatenessMinutes: 15, durationMinutes: "",
    radiusMeters: 100, eventId: lockedEventId || "",
  };

  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const titleRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setForm({ ...initialState, eventId: lockedEventId || "" });
      setErrors({});
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [isOpen, lockedEventId]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape" && isOpen) onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = t('titleRequired');
    if (!form.sessionType) next.sessionType = t('sessionTypeRequired');
    if (form.allowedLatenessMinutes === "" || Number(form.allowedLatenessMinutes) < 0) next.allowedLatenessMinutes = t('mustBeZeroOrGreater');
    if (form.sessionType === "f2f" && (form.radiusMeters === "" || Number(form.radiusMeters) <= 0)) next.radiusMeters = t('radiusMustBePositive');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      title: form.title.trim(), sessionType: form.sessionType,
      notes: form.notes.trim() || undefined,
      allowedLatenessMinutes: Number(form.allowedLatenessMinutes),
      durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
      eventId: form.eventId || undefined,
    };
    if (form.sessionType === "f2f") payload.radiusMeters = Number(form.radiusMeters);
    setSubmitting(true);
    try { await onSubmit(payload); } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay" onClick={onClose}>
      <div
        className="w-full max-w-lg mx-4 rounded-base border-2 border-border bg-secondary-background p-6 max-h-[90vh] overflow-y-auto shadow-shadow"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-xl font-black text-foreground">{t('newSessionTitle')}</h2>
          <Button variant="nav" size="icon" onClick={onClose} className="text-muted-foreground hover:text-destructive">
            <span className="text-lg font-bold">X</span>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="session-title">{t('titleField')}</Label>
            <Input ref={titleRef} id="session-title" type="text" value={form.title} onChange={(e) => handleChange("title", e.target.value)} placeholder={t('titlePlaceholder')} className={errors.title ? "border-destructive" : ""} />
            {errors.title && <p className="text-xs text-destructive font-bold">{errors.title}</p>}
          </div>

          {/* Session Type toggle */}
          <div className="flex flex-col gap-2">
            <Label>{t('sessionTypeField')}</Label>
            <div dir="ltr" className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 w-fit">
              <span className="text-xs font-semibold text-muted-foreground">{t('qrCode')}</span>
              <Switch
                aria-label={t('sessionTypeField')}
                checked={form.sessionType === "f2f"}
                onCheckedChange={(checked) => handleChange("sessionType", checked ? "f2f" : "qr_code")}
              />
              <span className="text-xs font-semibold text-muted-foreground">{t('faceToFace')}</span>
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="session-notes">{t('notesField')}</Label>
            <textarea
              id="session-notes"
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder={t('notesPlaceholder')}
              rows={3}
              className="flex w-full rounded-base border-2 border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main resize-none"
            />
          </div>

          {/* Allowed Lateness */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="session-lateness">{t('allowedLateness')}</Label>
            <Input id="session-lateness" type="number" min="0" value={form.allowedLatenessMinutes} onChange={(e) => handleChange("allowedLatenessMinutes", e.target.value)} className={errors.allowedLatenessMinutes ? "border-destructive" : ""} />
            {errors.allowedLatenessMinutes && <p className="text-xs text-destructive font-bold">{errors.allowedLatenessMinutes}</p>}
          </div>

          {/* Duration */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="session-duration">{t('sessionDuration')}</Label>
            <Input id="session-duration" type="number" min="1" value={form.durationMinutes} onChange={(e) => handleChange("durationMinutes", e.target.value)} placeholder={t('optional')} />
            <p className="text-xs text-muted-foreground">{t('autoCloseHint')}</p>
          </div>

          {/* Proximity Radius — F2F only */}
          {form.sessionType === "f2f" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="session-radius">{t('proximityRadiusMeters')}</Label>
              <Input id="session-radius" type="number" min="1" value={form.radiusMeters} onChange={(e) => handleChange("radiusMeters", e.target.value)} className={errors.radiusMeters ? "border-destructive" : ""} />
              {errors.radiusMeters && <p className="text-xs text-destructive font-bold">{errors.radiusMeters}</p>}
            </div>
          )}

          {/* Link to Event */}
          {isEventLocked ? (
            <div className="flex flex-col gap-2">
              <Label>{t('linkedEvent')}</Label>
              <div className="flex h-10 w-full items-center rounded-base border-2 border-border bg-background px-3 text-sm text-muted-foreground">
                {eventTitle || lockedEventId}
              </div>
              <p className="text-xs text-main font-bold">{t('linkedToEvent')} {eventTitle || "this event"}</p>
            </div>
          ) : events.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="session-event">{t('linkToEvent')}</Label>
              <select
                id="session-event"
                value={form.eventId}
                onChange={(e) => handleChange("eventId", e.target.value)}
                className="flex h-10 w-full rounded-base border-2 border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main"
              >
                <option value="">{t('none')}</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.name || ev.title}</option>
                ))}
              </select>
            </div>
          )}

          {/* Submit */}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? t('creating') : `+ ${t('createSession')}`}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default NewSessionModal;
