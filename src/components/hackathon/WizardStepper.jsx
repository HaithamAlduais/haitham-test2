import { useLanguage } from "@/context/LanguageContext";

/**
 * WizardStepper — 3-step progress indicator for the Hackathon Creation Wizard.
 * Steps: تفاصيل الهاكاثون (Details) → نموذج التسجيل (Registration Form) → صفحة الهاكاثون (Landing Page)
 *
 * Adapted from src/components/events/ProgressBar.jsx
 */
const WizardStepper = ({ currentStep }) => {
  const { t } = useLanguage();

  const { language } = useLanguage();
  const steps = [
    { number: 1, label: language === "ar" ? "تفاصيل الهاكاثون" : "Hackathon Details" },
    { number: 2, label: language === "ar" ? "نموذج التسجيل" : "Registration Form" },
    { number: 3, label: language === "ar" ? "صفحة الهاكاثون" : "Landing Page" },
  ];

  return (
    <div className="w-full bg-secondary-background border-b border-border py-4 px-6 md:px-12">
      <div className="max-w-4xl mx-auto flex items-center justify-between relative">
        {/* Connector Line */}
        <div className="absolute left-0 top-1/2 w-full h-0.5 bg-border -z-10 transform -translate-y-1/2 md:mx-12" />

        {steps.map((step) => {
          const isCompleted = currentStep > step.number;
          const isActive = currentStep === step.number;

          return (
            <div key={step.number} className="flex flex-col items-center gap-2 bg-secondary-background px-2">
              <div
                className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-mono font-bold text-sm border-2 transition-colors duration-200 ${
                  isCompleted
                    ? "bg-main border-main text-foreground"
                    : isActive
                    ? "bg-secondary-background border-main text-main"
                    : "bg-secondary-background border-border text-muted-foreground"
                }`}
              >
                {isCompleted ? "\u2713" : step.number}
              </div>
              <span
                className={`hidden md:block font-heading font-black text-xs uppercase tracking-wider ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile Current Step Label */}
      <div className="md:hidden text-center mt-3 font-mono text-xs text-muted-foreground">
        {t("stepLabel") || "خطوة"} {currentStep}:{" "}
        <span className="text-foreground font-bold uppercase">
          {steps[currentStep - 1]?.label}
        </span>
      </div>
    </div>
  );
};

export default WizardStepper;
