import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function Section({ title, children }) {
  return (
    <div className="rounded-base border-2 border-border bg-card p-4 space-y-2">
      <h3 className="text-sm font-bold uppercase text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

export default function ReviewPublishStep({ data, onBack, onPublish, onSaveDraft, submitting, error }) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-foreground">Review & Publish</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Review your hackathon settings before creating it.
        </p>
      </div>

      <div className="space-y-4">
        <Section title="Basic Info">
          <p className="text-lg font-black text-foreground">{data.title || "Untitled"}</p>
          {data.tagline && <p className="text-sm text-muted-foreground">{data.tagline}</p>}
          {data.description && <p className="text-sm text-foreground mt-2">{data.description}</p>}
        </Section>

        <Section title="Schedule">
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
            <p className="text-sm text-muted-foreground italic">No dates set</p>
          )}
        </Section>

        <Section title={`Tracks (${(data.tracks || []).length})`}>
          {(data.tracks || []).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.tracks.map((t, i) => (
                <Badge key={i} variant="outline">{t.name}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No tracks defined</p>
          )}
        </Section>

        <Section title={`Judging Criteria (${(data.judgingCriteria || []).length})`}>
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
            <p className="text-sm text-muted-foreground italic">No criteria defined</p>
          )}
        </Section>

        <Section title={`Prizes (${(data.prizes || []).length})`}>
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
            <p className="text-sm text-muted-foreground italic">No prizes defined</p>
          )}
        </Section>

        <Section title="Team Settings">
          <div className="text-sm space-y-1">
            <p>Team size: {data.settings?.teamSizeMin || 2}–{data.settings?.teamSizeMax || 5} members</p>
            <p>Solo allowed: {data.settings?.allowSolo ? "Yes" : "No"}</p>
            <p>Max registrants: {data.settings?.maxRegistrants || 500}</p>
            <p>Approval required: {data.registrationSettings?.requireApproval !== false ? "Yes" : "No"}</p>
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
          ← Back
        </Button>
        <div className="flex gap-3">
          <Button variant="neutral" onClick={onSaveDraft} disabled={submitting}>
            {submitting ? "Saving..." : "Save as Draft"}
          </Button>
          <Button onClick={onPublish} disabled={submitting}>
            {submitting ? "Publishing..." : "Publish Hackathon"}
          </Button>
        </div>
      </div>
    </div>
  );
}
