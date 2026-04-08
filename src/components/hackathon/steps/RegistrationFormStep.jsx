import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import FormBuilder from "@/components/hackathon/form-builder/FormBuilder";
import FormPreview from "@/components/hackathon/form-builder/FormPreview";

/**
 * RegistrationFormStep — Full form builder for hackathon registration forms.
 *
 * Props:
 *   fields          — array of form field definitions
 *   onChange(fields) — update the fields array
 *   onNext()        — advance to next step
 *   onBack()        — go back to previous step
 */
export default function RegistrationFormStep({ fields, onChange, onNext, onBack }) {
  const { t } = useLanguage();
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header with preview toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-foreground">
            {t("registrationFormTitle") || "Registration Form"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("registrationFormSubtitle") ||
              "Build the form participants will fill out to register."}
          </p>
        </div>
        <Button
          type="button"
          variant="noShadow"
          size="sm"
          onClick={() => setShowPreview((prev) => !prev)}
          className="gap-1"
        >
          {showPreview ? (
            <>
              <EyeOff className="h-3.5 w-3.5" />
              {t("hidePreview") || "Hide Preview"}
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5" />
              {t("showPreview") || "Preview"}
            </>
          )}
        </Button>
      </div>

      {/* Preview panel */}
      {showPreview && (
        <div className="rounded-base border-2 border-border bg-card p-6 shadow-shadow">
          <h3 className="text-sm font-black text-foreground mb-4">
            {t("formPreview") || "Form Preview"}
          </h3>
          <FormPreview fields={fields} />
        </div>
      )}

      {/* Form Builder */}
      <FormBuilder fields={fields} onChange={onChange} />

      {/* Field count */}
      <p className="text-xs text-muted-foreground text-center">
        {t("registrationFormFieldCount") || "Fields:"} {fields?.length || 0}
      </p>

      {/* Navigation buttons */}
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
