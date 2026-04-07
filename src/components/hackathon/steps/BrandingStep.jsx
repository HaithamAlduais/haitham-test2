import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";

const DEFAULT_BRANDING = {
  logoUrl: "",
  bannerUrl: "",
  primaryColor: "#7C3AED",
  secondaryColor: "#F59E0B",
  hashtag: "",
};

export default function BrandingStep({ data, onChange, onNext, onBack }) {
  const branding = { ...DEFAULT_BRANDING, ...data.branding };

  const updateBranding = (partial) => {
    onChange({ branding: { ...branding, ...partial } });
  };

  const handleHashtagChange = (value) => {
    // Auto-prefix # if missing
    const cleaned = value.replace(/^#+/, "");
    updateBranding({ hashtag: cleaned ? `#${cleaned}` : "" });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-foreground">Branding</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Customize the look and feel of your hackathon with logos, colors, and marketing details.
        </p>
      </div>

      <div className="space-y-5">
        {/* Logo and Banner */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              value={branding.logoUrl}
              onChange={(e) => updateBranding({ logoUrl: e.target.value })}
              placeholder="https://example.com/logo.png"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bannerUrl">Banner URL</Label>
            <Input
              id="bannerUrl"
              value={branding.bannerUrl}
              onChange={(e) => updateBranding({ bannerUrl: e.target.value })}
              placeholder="https://example.com/banner.png"
            />
          </div>
        </div>

        {/* Colors */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                id="primaryColor"
                value={branding.primaryColor}
                onChange={(e) => updateBranding({ primaryColor: e.target.value })}
                placeholder="#7C3AED"
                className="flex-1"
              />
              <div
                className="h-10 w-10 shrink-0 rounded-base border-2 border-border"
                style={{ backgroundColor: branding.primaryColor }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondaryColor">Secondary Color</Label>
            <div className="flex gap-2">
              <Input
                id="secondaryColor"
                value={branding.secondaryColor}
                onChange={(e) => updateBranding({ secondaryColor: e.target.value })}
                placeholder="#F59E0B"
                className="flex-1"
              />
              <div
                className="h-10 w-10 shrink-0 rounded-base border-2 border-border"
                style={{ backgroundColor: branding.secondaryColor }}
              />
            </div>
          </div>
        </div>

        {/* Hashtag */}
        <div className="space-y-2">
          <Label htmlFor="hashtag">Hashtag</Label>
          <Input
            id="hashtag"
            value={branding.hashtag}
            onChange={(e) => handleHashtagChange(e.target.value)}
            placeholder="#HackathonName2026"
          />
        </div>
      </div>

      {/* Preview section */}
      {(branding.primaryColor || branding.secondaryColor) && (
        <div className="rounded-base border-2 border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-main" />
            <p className="font-bold text-foreground">Color Preview</p>
          </div>
          <div className="flex gap-4">
            <div className="space-y-1 text-center">
              <div
                className="h-16 w-16 rounded-base border-2 border-border"
                style={{ backgroundColor: branding.primaryColor }}
              />
              <p className="text-xs text-muted-foreground">Primary</p>
              <p className="text-xs font-bold text-foreground">
                {branding.primaryColor}
              </p>
            </div>
            <div className="space-y-1 text-center">
              <div
                className="h-16 w-16 rounded-base border-2 border-border"
                style={{ backgroundColor: branding.secondaryColor }}
              />
              <p className="text-xs text-muted-foreground">Secondary</p>
              <p className="text-xs font-bold text-foreground">
                {branding.secondaryColor}
              </p>
            </div>
            <div className="space-y-1 flex flex-col items-center justify-center">
              <div
                className="h-16 flex-1 w-32 rounded-base border-2 border-border"
                style={{
                  background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})`,
                }}
              />
              <p className="text-xs text-muted-foreground">Gradient</p>
            </div>
          </div>
          {branding.hashtag && (
            <p className="text-sm font-bold text-main">{branding.hashtag}</p>
          )}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="neutral" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onNext}>Next: Review →</Button>
      </div>
    </div>
  );
}
