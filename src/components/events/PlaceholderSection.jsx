/**
 * Ramsha — PlaceholderSection
 *
 * Generic placeholder for event types not yet built.
 * Used in the event creation flow for non-hackathon types.
 */
const PlaceholderSection = ({ title, subtitle, message, onBack }) => (
  <div className="space-y-6">
    <div className="space-y-2">
      <h2 className="font-heading font-black text-xl text-foreground">{title}</h2>
      <p className="text-muted-foreground font-mono text-sm">{subtitle}</p>
    </div>
    <div className="border-2 border-border p-6 bg-secondary-background">
      <p className="font-mono text-sm text-muted-foreground">{message}</p>
    </div>
    {onBack && (
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 border-2 border-border bg-secondary-background px-4 py-2 text-xs font-bold uppercase text-foreground hover:bg-secondary-background hover:border-foreground transition-colors duration-100"
      >
        ← Back
      </button>
    )}
  </div>
);

export default PlaceholderSection;
