import { useLanguage } from "../../context/LanguageContext";

/**
 * Ramsha — PublishDecisionStep
 *
 * Step 3 of the event creation flow.
 * Provider chooses to publish publicly or save as private.
 * Each option card has its own CTA button.
 */
const PublishDecisionStep = ({ onPublish, onPrivate, onBack, submitting, submitAction, error }) => {
  const { t } = useLanguage();

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-heading font-black text-xl text-foreground">{t("publishDecisionTitle")}</h2>
        <p className="text-muted-foreground font-mono text-sm">{t("publishDecisionSubtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Publish card */}
        <div className="border-2 border-border bg-secondary-background p-6 flex flex-col gap-4 hover:border-main transition-colors duration-100">
          <div className="text-4xl">🌐</div>
          <div className="space-y-2 flex-1">
            <h3 className="font-heading font-black text-base text-foreground">{t("publishTitle")}</h3>
            <p className="font-mono text-xs text-muted-foreground leading-relaxed">{t("publishDescription")}</p>
          </div>
          <button
            onClick={onPublish}
            disabled={submitting}
            className="w-full border-2 border-main bg-main text-main-foreground text-xs font-bold uppercase px-4 py-2 hover:bg-transparent hover:text-main transition-colors duration-100 disabled:opacity-50"
          >
            {submitting && submitAction === "publish" ? t("publishingEvent") : t("publishCta")}
          </button>
        </div>

        {/* Private card */}
        <div className="border-2 border-border bg-secondary-background p-6 flex flex-col gap-4 hover:border-foreground transition-colors duration-100">
          <div className="text-4xl">🔒</div>
          <div className="space-y-2 flex-1">
            <h3 className="font-heading font-black text-base text-foreground">{t("privateTitle")}</h3>
            <p className="font-mono text-xs text-muted-foreground leading-relaxed">{t("privateDescription")}</p>
          </div>
          <button
            onClick={onPrivate}
            disabled={submitting}
            className="w-full border-2 border-border text-foreground text-xs font-bold uppercase px-4 py-2 hover:border-foreground transition-colors duration-100 disabled:opacity-50"
          >
            {submitting && submitAction === "private" ? t("savingEvent") : t("privateCta")}
          </button>
        </div>
      </div>

      {error && (
        <div className="border-2 border-destructive bg-destructive/10 px-4 py-3 font-mono text-xs text-destructive">
          {error}
        </div>
      )}

      <button
        onClick={onBack}
        disabled={submitting}
        className="inline-flex items-center gap-1.5 border-2 border-border bg-secondary-background px-4 py-2 text-xs font-bold uppercase text-foreground hover:bg-secondary-background hover:border-foreground transition-colors duration-100 disabled:opacity-50"
      >
        ← {t("back")}
      </button>
    </section>
  );
};

export default PublishDecisionStep;
