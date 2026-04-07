import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/LanguageContext";

function Section({ title, children }) {
  return (
    <div className="rounded-base border-2 border-border bg-card p-4 space-y-2">
      <h3 className="text-sm font-bold uppercase text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

export default function ReviewPublishStep({ data, onBack, onPublish, onSaveDraft, submitting, error }) {
  const { t } = useLanguage();
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-foreground">{t("reviewTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("reviewDesc")}
        </p>
      </div>

      <div className="space-y-4">
        <Section title={t("sectionBasicInfo")}>
          <p className="text-lg font-black text-foreground">{data.title || "Untitled"}</p>
          {data.tagline && <p className="text-sm text-muted-foreground">{data.tagline}</p>}
          {data.description && <p className="text-sm text-foreground mt-2">{data.description}</p>}
        </Section>

        <Section title={t("sectionSchedule")}>
          {Object.entries(data.schedule || {}).map(([key, val]) => (
            val ? (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                <span className="font-medium text-foreground">
                  {new Date(val).toLocaleString()}
                </span>
              </div>
            ) : null
          ))}
          {!Object.values(data.schedule || {}).some(Boolean) && (
            <p className="text-sm text-muted-foreground italic">{t("noDatesSet")}</p>
          )}
        </Section>

        <Section title={`${t("sectionTracks")} (${(data.tracks || []).length})`}>
          {(data.tracks || []).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.tracks.map((t, i) => (
                <Badge key={i} variant="outline">{t.name}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">{t("noTracksDefined")}</p>
          )}
        </Section>

        <Section title={`${t("sectionJudging")} (${(data.judgingCriteria || []).length})`}>
          {(data.judgingCriteria || []).length > 0 ? (
            <div className="space-y-1">
              {data.judgingCriteria.map((c, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-foreground">{c.name}</span>
                  <span className="text-muted-foreground">{c.weight}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">{t("noCriteriaDefined")}</p>
          )}
        </Section>

        <Section title={`${t("sectionPrizes")} (${(data.prizes || []).length})`}>
          {(data.prizes || []).length > 0 ? (
            <div className="space-y-1">
              {data.prizes.map((p, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-foreground">{p.place && `${p.place}: `}{p.title}</span>
                  {p.value && <span className="font-bold text-main">{p.value}</span>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">{t("noPrizesDefined")}</p>
          )}
        </Section>

        <Section title={t("sectionTeamSettings")}>
          <div className="text-sm space-y-1">
            <p>{t("teamSizeRange")}: {data.settings?.teamSizeMin || 2}–{data.settings?.teamSizeMax || 5}</p>
            <p>{t("soloAllowed")}: {data.settings?.allowSolo ? t("yesLabel") : t("noLabel")}</p>
            <p>{t("maxRegistrants")}: {data.settings?.maxRegistrants || 500}</p>
            <p>{t("approvalRequired")}: {data.registrationSettings?.requireApproval !== false ? t("yesLabel") : t("noLabel")}</p>
          </div>
        </Section>
      </div>

      {error && (
        <div className="rounded-base border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <Button variant="neutral" onClick={onBack} disabled={submitting}>
          {t("backBtn")}
        </Button>
        <div className="flex gap-3">
          <Button variant="neutral" onClick={onSaveDraft} disabled={submitting}>
            {submitting ? t("savingDraft") : t("saveDraft")}
          </Button>
          <Button onClick={onPublish} disabled={submitting}>
            {submitting ? t("publishing") : t("publishHackathon")}
          </Button>
        </div>
      </div>
    </div>
  );
}
