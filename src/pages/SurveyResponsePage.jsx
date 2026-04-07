import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiGet, apiPost } from "@/utils/apiClient";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

function RatingInput({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`flex h-10 w-10 items-center justify-center rounded-base border-2 text-sm font-black transition-colors ${
            value === n
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card hover:bg-muted"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function YesNoInput({ value, onChange }) {
  return (
    <div className="flex gap-3">
      {["Yes", "No"].map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`rounded-base border-2 px-6 py-2 text-sm font-black transition-colors ${
            value === opt
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card hover:bg-muted"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function MultipleChoiceInput({ options, value, onChange }) {
  return (
    <div className="space-y-2">
      {(options || []).map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`flex w-full items-center gap-3 rounded-base border-2 px-4 py-2 text-left text-sm transition-colors ${
            value === opt
              ? "border-primary bg-primary/10 font-black"
              : "border-border bg-card hover:bg-muted"
          }`}
        >
          <div
            className={`h-4 w-4 rounded-full border-2 ${
              value === opt ? "border-primary bg-primary" : "border-border"
            }`}
          />
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function SurveyResponsePage() {
  const { id, surveyId } = useParams();
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiGet(`/api/hackathons/${id}/surveys`)
      .then((data) => {
        const found = (data.surveys || []).find((s) => s.id === surveyId);
        if (found) {
          setSurvey(found);
        } else {
          setError("Survey not found.");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, surveyId]);

  const setAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    setError(null);

    // Validate all questions answered
    if (survey) {
      for (const q of survey.questions) {
        if (!answers[q.id] && answers[q.id] !== 0) {
          setError(`Please answer: "${q.text}"`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      await apiPost(`/api/hackathons/${id}/surveys/${surveyId}/respond`, { answers });
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading survey...</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="rounded-base border-2 border-green-400 bg-card p-8 text-center shadow-neo-sm">
          <h2 className="mb-2 text-2xl font-black text-foreground">Thank You!</h2>
          <p className="text-muted-foreground">Your response has been submitted successfully.</p>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-red-600">{error || "Survey not found."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-3xl font-black text-foreground">{survey.title}</h1>

        {error && (
          <div className="mb-4 rounded-base border-2 border-red-400 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {survey.questions.map((q, idx) => (
            <div
              key={q.id}
              className="rounded-base border-2 border-border bg-card p-4 shadow-neo-sm"
            >
              <p className="mb-3 font-black">
                {idx + 1}. {q.text}
              </p>

              {q.type === "text" && (
                <Textarea
                  value={answers[q.id] || ""}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  placeholder="Type your answer..."
                  className="border-2 border-border"
                  rows={3}
                />
              )}

              {q.type === "rating" && (
                <RatingInput
                  value={answers[q.id]}
                  onChange={(val) => setAnswer(q.id, val)}
                />
              )}

              {q.type === "multiple_choice" && (
                <MultipleChoiceInput
                  options={q.options}
                  value={answers[q.id]}
                  onChange={(val) => setAnswer(q.id, val)}
                />
              )}

              {q.type === "yes_no" && (
                <YesNoInput
                  value={answers[q.id]}
                  onChange={(val) => setAnswer(q.id, val)}
                />
              )}
            </div>
          ))}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-6 w-full font-black"
        >
          {submitting ? "Submitting..." : "Submit Response"}
        </Button>
      </div>
    </div>
  );
}
