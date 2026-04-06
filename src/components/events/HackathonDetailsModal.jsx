import { useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import HackathonFormBody from "./HackathonFormBody";

/**
 * Ramsha — HackathonDetailsModal
 *
 * Modal form for hackathon event details.
 * Form state is lifted to the parent (EventCreationFlow) so it persists
 * if the user closes and reopens the modal.
 * On submit, calls onSubmit(form) — the parent decides what to do next.
 */
const HackathonDetailsModal = ({
  isOpen,
  onClose,
  onSubmit,
  form,
  onFormChange,
}) => {
  const { t } = useLanguage();
  const [attempted, setAttempted] = useState(false);

  const handleListChange = (key, idx, field, value) => {
    onFormChange((prev) => ({
      ...prev,
      [key]: prev[key].map((item, i) =>
        i === idx ? { ...item, [field]: value } : item
      ),
    }));
  };
  const handleAddRow = (key, row) => {
    onFormChange((prev) => ({ ...prev, [key]: [...prev[key], row] }));
  };
  const handleRemoveRow = (key, idx) => {
    onFormChange((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== idx),
    }));
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    onFormChange((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitClick = () => {
    setAttempted(true);
    if (!form.name) return;
    onSubmit(form);
  };

  if (!isOpen) return null;

  const showNameError = attempted && !form.name;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-overlay">
      <div
        className="w-full max-w-2xl max-h-[90vh] bg-background border-2 border-border flex flex-col overflow-hidden shadow-shadow"
      >
        {/* Header */}
        <div className="border-b-2 border-border px-6 py-4 bg-secondary-background flex items-center justify-between">
          <div>
            <h2 className="font-heading font-black text-lg text-foreground">
              {t("hackathonDetails")}
            </h2>
            <p className="text-muted-foreground font-mono text-xs mt-1">
              {t("hackathonDetailsSubtitle")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="font-mono text-muted-foreground text-xl hover:text-destructive transition-colors duration-100"
          >
            ✕
          </button>
        </div>

        {/* Form body */}
        <HackathonFormBody
          form={form}
          showNameError={showNameError}
          onFieldChange={handleChange}
          onListChange={handleListChange}
          onAddRow={handleAddRow}
          onRemoveRow={handleRemoveRow}
        />

        {/* Footer */}
        <div className="border-t-2 border-border px-6 py-4 bg-secondary-background">
          <div className="flex items-center justify-between">
            <span className="text-sm font-heading leading-none text-muted-foreground">
              {t("poweredByGemini")}
            </span>
            <button
              onClick={handleSubmitClick}
              className="font-mono font-bold text-sm px-6 py-2 border-[3px] bg-main text-main-foreground border-ink hover:border-main transition-colors duration-100"
            >
              {t("hackathonContinue")} →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HackathonDetailsModal;
