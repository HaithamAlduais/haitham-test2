import { useEffect, useState } from "react";
import { apiGet, apiPatch } from "@/utils/apiClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";

function TagInput({ value = [], onChange, placeholder }) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const tag = input.trim();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setInput("");
  };

  const removeTag = (idx) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map((tag, i) => (
          <Badge key={i} variant="outline" className="gap-1">
            {tag}
            <button onClick={() => removeTag(i)} className="hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
          placeholder={placeholder}
        />
        <Button type="button" variant="neutral" size="sm" onClick={addTag} disabled={!input.trim()}>
          Add
        </Button>
      </div>
    </div>
  );
}

export default function ExtendedProfileSection({ showToast }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState([]);
  const [interests, setInterests] = useState([]);
  const [education, setEducation] = useState({ institution: "", degree: "", field: "", graduationYear: "" });
  const [professional, setProfessional] = useState({ company: "", title: "", yearsExp: "" });
  const [social, setSocial] = useState({ github: "", linkedin: "", twitter: "", portfolio: "" });

  useEffect(() => {
    apiGet("/api/users/profile")
      .then((data) => {
        setProfile(data);
        setBio(data.bio || "");
        setPhone(data.phone || "");
        setLocation(data.location || "");
        setSkills(data.skills || []);
        setInterests(data.interests || []);
        setEducation(data.education || { institution: "", degree: "", field: "", graduationYear: "" });
        setProfessional(data.professional || { company: "", title: "", yearsExp: "" });
        setSocial(data.social || { github: "", linkedin: "", twitter: "", portfolio: "" });
      })
      .catch(() => showToast("Failed to load profile", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await apiPatch("/api/users/profile", {
        bio, phone, location, skills, interests, education, professional, social,
      });
      setProfile((prev) => ({ ...prev, profileCompleteness: result.profileCompleteness }));
      showToast("Profile updated!");
    } catch (err) {
      showToast(err.message || "Update failed", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="rounded-base border-2 border-border bg-secondary-background p-6 mb-6 shadow-shadow">
        <div className="h-48 animate-pulse rounded-base bg-muted" />
      </section>
    );
  }

  return (
    <section className="rounded-base border-2 border-border bg-secondary-background p-6 mb-6 shadow-shadow space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-black text-foreground">Extended Profile</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-muted-foreground">
            {profile?.profileCompleteness || 0}% complete
          </span>
          <Progress value={profile?.profileCompleteness || 0} className="w-24 h-2" />
        </div>
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Label>Bio</Label>
        <Textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell us about yourself..."
          rows={3}
        />
      </div>

      {/* Contact */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+966 5XX XXX XXXX" />
        </div>
        <div className="space-y-2">
          <Label>Location</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Riyadh, Saudi Arabia" />
        </div>
      </div>

      <Separator />

      {/* Skills & Interests */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Skills</Label>
          <TagInput value={skills} onChange={setSkills} placeholder="Add a skill (e.g. Python, React)" />
        </div>
        <div className="space-y-2">
          <Label>Interests</Label>
          <TagInput value={interests} onChange={setInterests} placeholder="Add an interest (e.g. AI, Design)" />
        </div>
      </div>

      <Separator />

      {/* Education */}
      <div className="space-y-3">
        <h3 className="font-bold text-foreground text-sm">Education</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Institution</Label>
            <Input value={education.institution} onChange={(e) => setEducation({ ...education, institution: e.target.value })} placeholder="University name" />
          </div>
          <div className="space-y-1">
            <Label>Degree</Label>
            <Input value={education.degree} onChange={(e) => setEducation({ ...education, degree: e.target.value })} placeholder="B.Sc, M.Sc, etc." />
          </div>
          <div className="space-y-1">
            <Label>Field of Study</Label>
            <Input value={education.field} onChange={(e) => setEducation({ ...education, field: e.target.value })} placeholder="Computer Science" />
          </div>
          <div className="space-y-1">
            <Label>Graduation Year</Label>
            <Input value={education.graduationYear} onChange={(e) => setEducation({ ...education, graduationYear: e.target.value })} placeholder="2025" />
          </div>
        </div>
      </div>

      <Separator />

      {/* Professional */}
      <div className="space-y-3">
        <h3 className="font-bold text-foreground text-sm">Professional</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label>Company</Label>
            <Input value={professional.company} onChange={(e) => setProfessional({ ...professional, company: e.target.value })} placeholder="Company name" />
          </div>
          <div className="space-y-1">
            <Label>Title / Position</Label>
            <Input value={professional.title} onChange={(e) => setProfessional({ ...professional, title: e.target.value })} placeholder="Software Engineer" />
          </div>
          <div className="space-y-1">
            <Label>Years Experience</Label>
            <Input type="number" value={professional.yearsExp} onChange={(e) => setProfessional({ ...professional, yearsExp: e.target.value })} placeholder="3" />
          </div>
        </div>
      </div>

      <Separator />

      {/* Social Links */}
      <div className="space-y-3">
        <h3 className="font-bold text-foreground text-sm">Social Links</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>GitHub</Label>
            <Input value={social.github} onChange={(e) => setSocial({ ...social, github: e.target.value })} placeholder="https://github.com/username" />
          </div>
          <div className="space-y-1">
            <Label>LinkedIn</Label>
            <Input value={social.linkedin} onChange={(e) => setSocial({ ...social, linkedin: e.target.value })} placeholder="https://linkedin.com/in/username" />
          </div>
          <div className="space-y-1">
            <Label>Twitter / X</Label>
            <Input value={social.twitter} onChange={(e) => setSocial({ ...social, twitter: e.target.value })} placeholder="https://x.com/username" />
          </div>
          <div className="space-y-1">
            <Label>Portfolio</Label>
            <Input value={social.portfolio} onChange={(e) => setSocial({ ...social, portfolio: e.target.value })} placeholder="https://yoursite.com" />
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Extended Profile"}
      </Button>
    </section>
  );
}
