import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { apiGet, apiPost } from "@/utils/apiClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Star, Upload } from "lucide-react";

export default function RegistrationFormPage() {
  const { slug, id: eventId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { dir, language } = useLanguage();

  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [existing, setExisting] = useState(null);
  const [formResponses, setFormResponses] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    const fetchUrl = eventId ? `/api/events/public/${eventId}` : `/api/hackathons/public/${slug}`;
    fetch(fetchUrl)
      .then((res) => res.json())
      .then(async (h) => {
        setHackathon(h);
        try {
          const reg = await apiGet(`/api/events/${h.id}/registrations/mine`);
          if (reg.registered) setExisting(reg);
        } catch { /* Not registered yet */ }
      })
      .catch(() => setError("Hackathon not found."))
      .finally(() => setLoading(false));
  }, [slug, currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hackathon) return;
    setError(null);
    setSubmitting(true);
    try {
      await apiPost(`/api/events/${hackathon.id}/registrations`, { formResponses });
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateResponse = (fieldId, value) => {
    setFormResponses((prev) => ({ ...prev, [fieldId]: value }));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">{language === "ar" ? "جاري التحميل..." : "Loading..."}</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" dir={dir}>
        <div className="text-center max-w-md space-y-6">
          <CheckCircle className="h-16 w-16 text-main mx-auto" />
          <h1 className="text-2xl font-black text-foreground">
            {language === "ar" ? "تم إرسال التسجيل!" : "Registration Submitted!"}
          </h1>
          <p className="text-muted-foreground">
            {hackathon?.registrationSettings?.requireApproval !== false
              ? (language === "ar" ? "طلبك قيد المراجعة. سيتم إشعارك عند القبول." : "Your application is pending review. You'll be notified once it's approved.")
              : (language === "ar" ? "تم تسجيلك! تحقق من لوحة التحكم للخطوات التالية." : "You're registered! Check your dashboard for next steps.")}
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate("/home")} className="gap-2">
              {language === "ar" ? "الذهاب للوحة التحكم" : "Go to Dashboard"}
            </Button>
            <Button variant="neutral" onClick={() => navigate(`/hackathon/${slug}`)}>
              {language === "ar" ? "العودة للهاكاثون" : "Back to Hackathon"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (existing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" dir={dir}>
        <div className="text-center max-w-md space-y-6">
          <h1 className="text-2xl font-black text-foreground">
            {language === "ar" ? "مسجل مسبقاً" : "Already Registered"}
          </h1>
          <p className="text-muted-foreground">
            {language === "ar" ? "حالة التسجيل:" : "Your registration status:"}{" "}
            <strong className="capitalize">{existing.status}</strong>
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate("/home")}>
              {language === "ar" ? "الذهاب للوحة التحكم" : "Go to Dashboard"}
            </Button>
            <Button variant="neutral" onClick={() => navigate(`/hackathon/${slug}`)}>
              {language === "ar" ? "العودة للهاكاثون" : "Back to Hackathon"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Get custom form fields from the form builder (Step 2 of wizard)
  const formBuilderFields = hackathon?.registrationForm?.fields || [];
  const hasCustomForm = formBuilderFields.length > 0;

  return (
    <div className="min-h-screen bg-background text-foreground" dir={dir}>
      <div className="max-w-2xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate(`/hackathon/${slug}`)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          {language === "ar" ? `العودة إلى ${hackathon?.title}` : `Back to ${hackathon?.title}`}
        </button>

        <h1 className="text-2xl font-black text-foreground mb-2">
          {language === "ar" ? `التسجيل في ${hackathon?.title}` : `Register for ${hackathon?.title}`}
        </h1>
        <p className="text-muted-foreground mb-8">
          {language === "ar" ? "أكمل النموذج أدناه للتسجيل." : "Fill out the form below to apply."}
        </p>

        {error && (
          <div className="mb-6 rounded-base border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email (always shown) */}
          <div className="space-y-2">
            <Label>{language === "ar" ? "البريد الإلكتروني" : "Email"}</Label>
            <Input value={currentUser?.email || ""} disabled />
          </div>

          {/* ── Render form builder fields (custom form from wizard Step 2) ── */}
          {hasCustomForm && formBuilderFields.map((field) => (
            <DynamicFormField
              key={field.id}
              field={field}
              value={formResponses[field.id]}
              onChange={(val) => updateResponse(field.id, val)}
              language={language}
            />
          ))}

          {/* ── Fallback: default fields if no custom form was built ── */}
          {!hasCustomForm && (
            <>
              <div className="space-y-2">
                <Label htmlFor="motivation">
                  {language === "ar" ? "لماذا تريد المشاركة؟" : "Why do you want to participate?"}
                </Label>
                <Textarea
                  id="motivation"
                  value={formResponses.motivation || ""}
                  onChange={(e) => updateResponse("motivation", e.target.value)}
                  placeholder={language === "ar" ? "أخبرنا عن دافعك..." : "Tell us about your motivation..."}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">
                  {language === "ar" ? "مستوى الخبرة" : "Experience Level"}
                </Label>
                <select
                  id="experience"
                  value={formResponses.experienceLevel || ""}
                  onChange={(e) => updateResponse("experienceLevel", e.target.value)}
                  className="flex h-10 w-full rounded-base border-2 border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main"
                >
                  <option value="">{language === "ar" ? "اختر..." : "Select..."}</option>
                  <option value="beginner">{language === "ar" ? "مبتدئ" : "Beginner"}</option>
                  <option value="intermediate">{language === "ar" ? "متوسط" : "Intermediate"}</option>
                  <option value="advanced">{language === "ar" ? "متقدم" : "Advanced"}</option>
                </select>
              </div>
            </>
          )}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting
              ? (language === "ar" ? "جاري الإرسال..." : "Submitting...")
              : (language === "ar" ? "إرسال التسجيل" : "Submit Registration")}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ── Dynamic field renderer for form builder fields ──────────────────────────
function DynamicFormField({ field, value, onChange, language }) {
  const label = language === "ar" && field.labelAr ? field.labelAr : field.label;
  const description = language === "ar" && field.descriptionAr ? field.descriptionAr : field.description;
  const config = field.config || {};

  const renderField = () => {
    switch (field.type) {
      case "openText":
        return (
          <Input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={config.placeholder || ""}
            type={config.inputType || "text"}
            required={field.required}
          />
        );

      case "openTextLong":
        return (
          <Textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={config.placeholder || ""}
            rows={4}
            required={field.required}
          />
        );

      case "multipleChoiceSingle":
        return (
          <div className="space-y-2">
            {(config.choices || []).map((choice) => {
              const choiceLabel = language === "ar" && choice.labelAr ? choice.labelAr : choice.label;
              return (
                <label key={choice.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name={`field-${field.id}`}
                    value={choice.id}
                    checked={value === choice.id}
                    onChange={() => onChange(choice.id)}
                    required={field.required}
                    className="h-4 w-4 accent-main"
                  />
                  <span className="text-sm text-foreground">{choiceLabel}</span>
                </label>
              );
            })}
            {config.allowOther && (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name={`field-${field.id}`}
                  value="__other__"
                  checked={value?.startsWith?.("__other__:")}
                  onChange={() => onChange("__other__:")}
                  className="h-4 w-4 accent-main"
                />
                <Input
                  placeholder={language === "ar" ? "أخرى..." : "Other..."}
                  value={value?.startsWith?.("__other__:") ? value.replace("__other__:", "") : ""}
                  onChange={(e) => onChange(`__other__:${e.target.value}`)}
                  className="flex-1"
                />
              </label>
            )}
          </div>
        );

      case "multipleChoiceMulti": {
        const selected = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {(config.choices || []).map((choice) => {
              const choiceLabel = language === "ar" && choice.labelAr ? choice.labelAr : choice.label;
              const isChecked = selected.includes(choice.id);
              return (
                <label key={choice.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      onChange(isChecked ? selected.filter((s) => s !== choice.id) : [...selected, choice.id]);
                    }}
                    className="h-4 w-4 rounded accent-main"
                  />
                  <span className="text-sm text-foreground">{choiceLabel}</span>
                </label>
              );
            })}
          </div>
        );
      }

      case "rating": {
        const range = config.range || 5;
        const scale = config.scale || "star";
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: range }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onChange(n)}
                  className={`p-1 transition-colors ${value >= n ? "text-yellow-500" : "text-muted-foreground/30"}`}
                >
                  {scale === "star" ? <Star className={`h-7 w-7 ${value >= n ? "fill-yellow-500" : ""}`} /> : (
                    <span className="text-xl font-bold">{n}</span>
                  )}
                </button>
              ))}
            </div>
            {(config.lowerLabel || config.upperLabel) && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{config.lowerLabel}</span>
                <span>{config.upperLabel}</span>
              </div>
            )}
          </div>
        );
      }

      case "date":
        return (
          <Input
            type="date"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
          />
        );

      case "fileUpload":
        return (
          <div className="rounded-base border-2 border-dashed border-border p-6 text-center">
            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {language === "ar" ? "رفع ملف (قريباً)" : "File upload (coming soon)"}
            </p>
          </div>
        );

      case "matrix": {
        const rows = config.rows || [];
        const columns = config.columns || [];
        const matrixVal = typeof value === "object" && value ? value : {};
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-2 border-border rounded-base">
              <thead>
                <tr>
                  <th className="p-2 text-start border-b-2 border-border" />
                  {columns.map((col) => (
                    <th key={col.id} className="p-2 text-center border-b-2 border-border font-bold">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="p-2 font-bold">{row.label}</td>
                    {columns.map((col) => (
                      <td key={col.id} className="p-2 text-center">
                        <input
                          type="radio"
                          name={`matrix-${field.id}-${row.id}`}
                          checked={matrixVal[row.id] === col.id}
                          onChange={() => onChange({ ...matrixVal, [row.id]: col.id })}
                          className="h-4 w-4 accent-main"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case "ranking": {
        const choices = config.choices || [];
        const ranked = Array.isArray(value) ? value : choices.map((c) => c.id);
        return (
          <div className="space-y-2">
            {ranked.map((choiceId, idx) => {
              const choice = choices.find((c) => c.id === choiceId);
              if (!choice) return null;
              return (
                <div key={choiceId} className="flex items-center gap-3 rounded-base border-2 border-border bg-card px-4 py-3">
                  <span className="text-sm font-black text-main w-6">{idx + 1}</span>
                  <span className="text-sm font-bold text-foreground">{choice.label}</span>
                </div>
              );
            })}
            <p className="text-xs text-muted-foreground">
              {language === "ar" ? "سحب وإفلات لإعادة الترتيب (قريباً)" : "Drag to reorder (coming soon)"}
            </p>
          </div>
        );
      }

      case "consent":
        return (
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              required={field.required}
              className="mt-1 h-4 w-4 rounded accent-main"
            />
            <span className="text-sm text-foreground">
              {language === "ar" && config.consentTextAr ? config.consentTextAr : config.consentText || label}
            </span>
          </label>
        );

      default:
        return (
          <Input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      {field.type !== "consent" && (
        <Label>
          {label || (language === "ar" ? "سؤال" : "Question")}
          {field.required && <span className="text-destructive ms-1">*</span>}
        </Label>
      )}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {renderField()}
    </div>
  );
}
