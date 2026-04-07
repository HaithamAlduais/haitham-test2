import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Monitor, MapPin, ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function BasicInfoStep({ data, onChange, onNext }) {
  const { t, language } = useLanguage();
  const canProceed = data.title.trim().length > 0;
  const isRTL = language === "ar";

  const location = data.location || { name: "", address: "" };
  const updateLocation = (field, value) => {
    onChange({ location: { ...location, [field]: value } });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-foreground">{t("basicInfoTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("basicInfoDesc")}</p>
      </div>

      <div className="space-y-5">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">{t("hackathonTitleLabel")}</Label>
          <Input id="title" value={data.title} onChange={(e) => onChange({ title: e.target.value })} placeholder={t("hackathonTitlePlaceholder")} />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">{t("descriptionLabel2")}</Label>
          <Textarea id="description" value={data.description} onChange={(e) => onChange({ description: e.target.value })} placeholder={t("descriptionPlaceholder2")} rows={5} />
        </div>

        {/* Target Audience */}
        <div className="space-y-2">
          <Label htmlFor="targetAudience">{t("targetAudienceLabel")}</Label>
          <Textarea id="targetAudience" value={data.targetAudience || ""} onChange={(e) => onChange({ targetAudience: e.target.value })} placeholder={t("targetAudiencePlaceholder")} rows={3} />
        </div>

        {/* Format */}
        <div className="space-y-2">
          <Label>{t("formatLabel")}</Label>
          <div className="flex gap-2">
            {[
              { value: "online", label: t("formatOnline"), icon: Monitor },
              { value: "in-person", label: t("formatInPerson"), icon: MapPin },
            ].map(({ value, label, icon: Icon }) => (
              <button key={value} type="button" onClick={() => onChange({ format: value })}
                className={`flex items-center gap-2 rounded-base border-2 px-4 py-2 text-sm font-bold transition-colors ${
                  (data.format || "online") === value ? "border-border bg-main text-main-foreground shadow-neo-sm" : "border-border bg-card text-foreground hover:bg-muted"
                }`}>
                <Icon className="h-4 w-4" />{label}
              </button>
            ))}
          </div>
        </div>

        {/* In-person: location */}
        {(data.format || "online") === "in-person" && (
          <div className="space-y-4 rounded-base border-2 border-border bg-card p-4">
            <div className="space-y-2">
              <Label>{t("locationNameLabel")}</Label>
              <Input value={location.name} onChange={(e) => updateLocation("name", e.target.value)} placeholder={t("locationNamePlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label>{t("locationAddressLabel")}</Label>
              <Input value={location.address} onChange={(e) => updateLocation("address", e.target.value)} placeholder={t("locationAddressPlaceholder")} />
            </div>
            <div className="flex items-center justify-center rounded-base border-2 border-dashed border-border bg-muted/50 p-8 text-muted-foreground">
              <MapPin className="h-5 w-5 mr-2" />{t("mapPlaceholder")}
            </div>
          </div>
        )}

        {(data.format || "online") === "online" && (
          <div className="rounded-base border-2 border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">{t("discordAutoCreate")}</p>
          </div>
        )}

        {/* Contact Email */}
        <div className="space-y-2">
          <Label htmlFor="contactEmail">{t("contactEmailLabel")}</Label>
          <Input id="contactEmail" type="email" value={data.contactEmail || ""} onChange={(e) => onChange({ contactEmail: e.target.value })} placeholder={t("contactEmailPlaceholder")} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!canProceed} size="lg" className="gap-2">
          {t("nextSchedule")}
          {isRTL ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
