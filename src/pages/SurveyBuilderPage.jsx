import { useState } from "react";
import { useParams } from "react-router-dom";
import { apiPost } from "@/utils/apiClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const QUESTION_TYPES = [
  { value: "text", label: "Text" },
  { value: "rating", label: "Rating (1-10)" },
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "yes_no", label: "Yes / No" },
];

function QuestionEditor({ question, onUpdate, onRemove }) {
  const updateField = (field, value) => {
    onUpdate({ ...question, [field]: value });
  };

  const addOption = () => {
    updateField("options", [...(question.options || []), ""]);
  };

  const updateOption = (idx, value) => {
    const opts = [...(question.options || [])];
    opts[idx] = value;
    updateField("options", opts);
  };

  const removeOption = (idx) => {
    const opts = (question.options || []).filter((_, i) => i !== idx);
    updateField("options", opts);
  };

  return (
    <div className="rounded-base border-2 border-border bg-card p-4 shadow-neo-sm">
      <div className="mb-3 flex items-start justify-between">
        <span className="text-xs font-black uppercase text-muted-foreground">
          Question #{question._index + 1}
        </span>
        <button
          onClick={onRemove}
          className="text-xs font-black text-red-500 hover:text-red-700"
        >
          Remove
        </button>
      </div>

      <div className="mb-3 space-y-2">
        <Label className="font-black">Question Text</Label>
        <Input
          value={question.text}
          onChange={(e) => updateField("text", e.target.value)}
          placeholder="Enter your question..."
          className="border-2 border-border"
        />
      </div>

      <div className="mb-3 space-y-2">
        <Label className="font-black">Type</Label>
        <select
          value={question.type}
          onChange={(e) => updateField("type", e.target.value)}
          className="w-full rounded-base border-2 border-border bg-background px-3 py-2 text-sm"
        >
          {QUESTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {question.type === "multiple_choice" && (
        <div className="space-y-2">
          <Label className="font-black">Options</Label>
          {(question.options || []).map((opt, idx) => (
            <div key={idx} className="flex gap-2">
              <Input
                value={opt}
                onChange={(e) => updateOption(idx, e.target.value)}
                placeholder={`Option ${idx + 1}`}
                className="border-2 border-border"
              />
              <button
                onClick={() => removeOption(idx)}
                className="text-xs font-black text-red-500"
              >
                X
              </button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addOption} className="font-black">
            + Add Option
          </Button>
        </div>
      )}
    </div>
  );
}

function SurveyPreview({ title, questions }) {
  return (
    <div className="rounded-base border-2 border-border bg-muted p-4">
      <h3 className="mb-3 text-lg font-black">{title || "Untitled Survey"}</h3>
      {questions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No questions added yet.</p>
      ) : (
        <div className="space-y-3">
          {questions.map((q, idx) => (
            <div key={q.id} className="rounded-base border border-border bg-background p-3">
              <p className="mb-2 text-sm font-black">
                {idx + 1}. {q.text || "Untitled question"}
              </p>
              {q.type === "text" && (
                <div className="h-16 rounded-base border border-border bg-muted" />
              )}
              {q.type === "rating" && (
                <div className="flex gap-1">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div
                      key={i}
                      className="flex h-8 w-8 items-center justify-center rounded-base border border-border text-xs"
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
              )}
              {q.type === "multiple_choice" &&
                (q.options || []).map((opt, oi) => (
                  <div key={oi} className="mb-1 flex items-center gap-2 text-sm">
                    <div className="h-4 w-4 rounded-full border-2 border-border" />
                    {opt || `Option ${oi + 1}`}
                  </div>
                ))}
              {q.type === "yes_no" && (
                <div className="flex gap-2">
                  <div className="rounded-base border border-border px-3 py-1 text-sm">Yes</div>
                  <div className="rounded-base border border-border px-3 py-1 text-sm">No</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SurveyBuilderPage() {
  const { id } = useParams();
  const [title, setTitle] = useState("");
  const [triggerAfter, setTriggerAfter] = useState("event_end");
  const [questions, setQuestions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  let nextId = questions.length + 1;

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: `q_${Date.now()}_${nextId}`,
        type: "text",
        text: "",
        options: [],
      },
    ]);
  };

  const updateQuestion = (idx, updated) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? updated : q)));
  };

  const removeQuestion = (idx) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setError(null);
    if (!title.trim()) {
      setError("Survey title is required.");
      return;
    }
    if (questions.length === 0) {
      setError("Add at least one question.");
      return;
    }
    for (const q of questions) {
      if (!q.text.trim()) {
        setError("All questions must have text.");
        return;
      }
      if (q.type === "multiple_choice" && (!q.options || q.options.filter(Boolean).length < 2)) {
        setError("Multiple choice questions need at least 2 options.");
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        triggerAfter,
        questions: questions.map((q) => ({
          id: q.id,
          type: q.type,
          text: q.text.trim(),
          ...(q.type === "multiple_choice" ? { options: q.options.filter(Boolean) } : {}),
        })),
      };
      await apiPost(`/api/hackathons/${id}/surveys`, payload);
      setSuccess(true);
      setTitle("");
      setQuestions([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-black text-foreground">Survey Builder</h1>

        {success && (
          <div className="mb-4 rounded-base border-2 border-green-400 bg-green-50 p-3 text-sm text-green-700">
            Survey created successfully!
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-base border-2 border-red-400 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Editor side */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-black">Survey Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Post-Hackathon Feedback"
                className="border-2 border-border"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-black">Trigger</Label>
              <select
                value={triggerAfter}
                onChange={(e) => setTriggerAfter(e.target.value)}
                className="w-full rounded-base border-2 border-border bg-background px-3 py-2 text-sm"
              >
                <option value="event_end">After Event Ends</option>
                <option value="registration">After Registration</option>
              </select>
            </div>

            <h2 className="text-lg font-black">Questions</h2>
            {questions.map((q, idx) => (
              <QuestionEditor
                key={q.id}
                question={{ ...q, _index: idx }}
                onUpdate={(updated) => updateQuestion(idx, updated)}
                onRemove={() => removeQuestion(idx)}
              />
            ))}

            <Button variant="outline" onClick={addQuestion} className="w-full font-black">
              + Add Question
            </Button>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full font-black"
            >
              {saving ? "Saving..." : "Save Survey"}
            </Button>
          </div>

          {/* Preview side */}
          <div>
            <h2 className="mb-3 text-lg font-black">Preview</h2>
            <SurveyPreview title={title} questions={questions} />
          </div>
        </div>
      </div>
    </div>
  );
}
