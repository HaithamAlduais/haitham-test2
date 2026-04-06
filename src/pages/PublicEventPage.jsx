import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

/**
 * Ramsha — Public Event Page
 *
 * Fetches the generated HTML for an event by slug and renders it
 * in a full-screen iframe sandbox. No authentication required.
 *
 * Note: This page is public and does not use useLanguage/useTheme
 * since it renders a standalone generated HTML page.
 */
const PublicEventPage = () => {
  const { slug } = useParams();
  const [html, setHtml] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || "";
        const res = await fetch(`${baseUrl}/api/events/page/${slug}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Event not found.");
        }
        const data = await res.json();
        setHtml(data.html);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-main border-t-transparent mx-auto mb-4" />
          <p className="text-foreground font-mono text-sm">Loading event page...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="font-heading font-black text-2xl text-foreground">
            Event Not Found
          </h1>
          <p className="font-mono text-sm text-muted-foreground">{error}</p>
          <a
            href="/"
            className="inline-block font-mono font-bold text-sm border-2 border-border px-4 py-2 text-foreground hover:border-main transition-colors duration-100"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <iframe
      title="Event Page"
      srcDoc={html}
      sandbox="allow-scripts allow-same-origin"
      className="fixed inset-0 w-full h-full border-0"
    />
  );
};

export default PublicEventPage;
