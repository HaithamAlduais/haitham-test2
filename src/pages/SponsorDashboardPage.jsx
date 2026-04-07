import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "@/utils/apiClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function SponsorDashboardPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiGet("/api/sponsor/events")
      .then((data) => setEvents(data.events || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading sponsored events...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-3xl font-black text-foreground">Sponsor Dashboard</h1>

        {error && (
          <div className="mb-4 rounded-base border-2 border-red-400 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {events.length === 0 && !error ? (
          <div className="rounded-base border-2 border-border bg-card p-8 text-center shadow-neo-sm">
            <p className="text-muted-foreground">You are not listed as a sponsor for any events yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex flex-col rounded-base border-2 border-border bg-card p-5 shadow-neo-sm"
              >
                <h2 className="mb-2 text-lg font-black text-foreground">{event.title}</h2>
                <Badge className="mb-3 w-fit" variant="outline">
                  {event.status}
                </Badge>
                <p className="mb-4 text-sm text-muted-foreground">
                  {event.registrantCount} registrant{event.registrantCount !== 1 ? "s" : ""}
                </p>
                <div className="mt-auto">
                  <Link to={`/sponsor/${event.id}`}>
                    <Button className="w-full font-black">Browse Participants</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
