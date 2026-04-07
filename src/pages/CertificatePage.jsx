import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { apiGet } from "@/utils/apiClient";
import { Button } from "@/components/ui/button";
import { Award, Download, Share2 } from "lucide-react";

const CERT_STYLES = {
  participation: { bg: "from-indigo-500 to-purple-600", label: "Certificate of Participation", icon: "\uD83C\uDFAF" },
  winner_gold: { bg: "from-yellow-400 to-amber-600", label: "1st Place Winner", icon: "\uD83E\uDD47" },
  winner_silver: { bg: "from-gray-300 to-gray-500", label: "2nd Place Winner", icon: "\uD83E\uDD48" },
  winner_bronze: { bg: "from-orange-400 to-orange-700", label: "3rd Place Winner", icon: "\uD83E\uDD49" },
};

export default function CertificatePage() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const { dir } = useLanguage();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    apiGet(`/api/hackathons/${id}/certificates/mine`)
      .then(setCert)
      .catch(() => setError("No certificate found for this event."))
      .finally(() => setLoading(false));
  }, [id, currentUser]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading certificate...</p>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" dir={dir}>
        <div className="text-center">
          <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{error || "Certificate not available yet."}</p>
        </div>
      </div>
    );
  }

  const style = CERT_STYLES[cert.type] || CERT_STYLES.participation;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6" dir={dir}>
      {/* Certificate Card */}
      <div className="w-full max-w-2xl">
        <div className={`rounded-2xl border-4 border-border bg-gradient-to-br ${style.bg} p-1 shadow-neo`}>
          <div className="rounded-xl bg-white dark:bg-gray-900 p-8 md:p-12 text-center space-y-6">
            <div className="text-5xl">{style.icon}</div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Ramsha Platform</p>
              <h1 className="text-2xl md:text-3xl font-black text-foreground mt-2">{style.label}</h1>
            </div>
            <div className="border-t border-b border-border py-4 my-4">
              <p className="text-sm text-muted-foreground">This certifies that</p>
              <p className="text-xl md:text-2xl font-black text-foreground mt-1">
                {cert.recipientName || cert.recipientEmail}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              has successfully participated in
            </p>
            <p className="text-lg font-bold text-foreground">{cert.eventTitle}</p>
            {cert.issuedAt && (
              <p className="text-xs text-muted-foreground">
                Issued: {new Date(cert.issuedAt?._seconds ? cert.issuedAt._seconds * 1000 : cert.issuedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-3 mt-6">
          <Button variant="neutral" onClick={() => window.print()} className="gap-1.5">
            <Download className="h-4 w-4" /> Print / Save PDF
          </Button>
          <Button onClick={() => {
            const url = window.location.href;
            navigator.clipboard?.writeText(url);
          }} className="gap-1.5">
            <Share2 className="h-4 w-4" /> Share
          </Button>
        </div>
      </div>
    </div>
  );
}
