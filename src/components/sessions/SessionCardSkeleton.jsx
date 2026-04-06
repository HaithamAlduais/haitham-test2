/**
 * Loading skeleton placeholder for a SessionCard in the Ramsha platform.
 * Displays an animated pulse block that mimics the card layout while the
 * Provider's sessions are being fetched.
 */
const SessionCardSkeleton = () => (
  <div className="border-2 border-border bg-background p-5 border-l-[5px] animate-pulse">
    {/* Title */}
    <div className="h-5 w-3/4 bg-border mb-4" />

    {/* Status badge + type */}
    <div className="flex items-center gap-3 mb-4">
      <div className="h-5 w-16 bg-border" />
      <div className="h-5 w-24 bg-border" />
    </div>

    {/* Notes placeholder */}
    <div className="space-y-2 mb-4">
      <div className="h-3 w-full bg-border" />
      <div className="h-3 w-2/3 bg-border" />
    </div>

    {/* Date */}
    <div className="h-3 w-28 bg-border" />
  </div>
);

export default SessionCardSkeleton;
