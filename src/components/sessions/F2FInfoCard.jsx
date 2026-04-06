import { useLanguage } from "../../context/LanguageContext";

/**
 * Ramsha — F2FInfoCard
 *
 * Displays the proximity radius and instructor coordinates for an active
 * Face to Face session. Shown to the Provider on the Live Monitoring page
 * so they can see the geofence parameters.
 *
 * @param {{ radiusMeters: number, instructorLocation: { latitude: number, longitude: number } }} props
 */
const F2FInfoCard = ({ radiusMeters, instructorLocation }) => {
  const { t } = useLanguage();

  if (!instructorLocation) return null;

  return (
    <div className="border-2 border-border bg-secondary-background p-6">
      <p className="font-mono font-bold text-xs uppercase tracking-[0.12em] text-muted-foreground mb-4">
        {t('f2fProximityInfo')}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Radius */}
        <div className="border-2 border-border bg-card p-4">
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-[0.08em] mb-1">
            {t('proximityRadius')}
          </p>
          <p className="font-display font-black text-2xl text-foreground">
            {radiusMeters}
            <span className="text-sm font-mono font-bold text-muted-foreground ml-1">m</span>
          </p>
        </div>

        {/* Coordinates */}
        <div className="border-2 border-border bg-card p-4">
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-[0.08em] mb-1">
            {t('instructorCoordinates')}
          </p>
          <p className="font-mono text-sm text-foreground leading-relaxed">
            {instructorLocation.latitude.toFixed(6)},{" "}
            {instructorLocation.longitude.toFixed(6)}
          </p>
        </div>
      </div>

      <p className="font-mono text-sm text-muted-foreground mt-4">
        {t('withinRadiusToCheckIn')}
      </p>
    </div>
  );
};

export default F2FInfoCard;
