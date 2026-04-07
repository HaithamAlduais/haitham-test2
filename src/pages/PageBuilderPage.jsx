import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { apiGet, apiPatch } from "@/utils/apiClient";
import PageBuilder from "@/components/hackathon/PageBuilder";

export default function PageBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) { navigate("/login"); return; }

    // Try events first, then hackathons
    apiGet(`/api/events/${id}`)
      .then(setHackathon)
      .catch(() => apiGet(`/api/hackathons/${id}`).then(setHackathon))
      .catch(() => navigate("/dashboard"))
      .finally(() => setLoading(false));
  }, [id, currentUser, navigate]);

  const handleSave = async (pageData) => {
    try {
      await apiPatch(`/api/hackathons/${id}`, pageData);
      // Also update events collection
      await apiPatch(`/api/events/${id}`, pageData).catch(() => {});
      alert("Page saved!");
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <PageBuilder
      hackathonData={hackathon}
      onSave={handleSave}
      onClose={() => navigate(`/hackathons/${id}`)}
    />
  );
}
