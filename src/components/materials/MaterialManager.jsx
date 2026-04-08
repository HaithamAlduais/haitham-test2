import { useState, useRef } from "react";
import { apiPatch, apiPost } from "../../utils/apiClient";
import { useLanguage } from "@/context/LanguageContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileText, Link2, Upload, Trash2, Plus, ExternalLink } from "lucide-react";

/**
 * MaterialManager
 * A reusable component to manage "Materials" (Files & Links) for an Event or Session.
 *
 * @param {string} entityType - "events" or "sessions"
 * @param {string} entityId - The ID of the event or session
 * @param {Array} initialMaterials - The starting materials array
 * @param {boolean} canEdit - Can the current user add/remove materials?
 * @param {Function} onUpdate - Callback when materials change
 */
const MaterialManager = ({ entityType, entityId, initialMaterials, canEdit, onUpdate }) => {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const [materials, setMaterials] = useState(initialMaterials || []);
  const [loading, setLoading] = useState(false);
  const [errorMSG, setErrorMSG] = useState("");

  const [linkUrl, setLinkUrl] = useState("");
  const [linkName, setLinkName] = useState("");
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const saveMaterials = async (newMaterials) => {
    setLoading(true);
    setErrorMSG("");
    try {
      await apiPatch(`/api/${entityType}/${entityId}`, { materials: newMaterials });
      setMaterials(newMaterials);
      if (onUpdate) onUpdate(newMaterials);
    } catch (err) {
      console.error(err);
      setErrorMSG(isAr ? "فشل تحديث المواد." : "Failed to update materials.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddLink = async () => {
    if (!linkUrl.trim() || !linkName.trim()) return;

    let formattedUrl = linkUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const newMaterial = {
      id: Date.now().toString(),
      type: "link",
      name: linkName.trim(),
      url: formattedUrl,
    };
    await saveMaterials([...materials, newMaterial]);
    setLinkName("");
    setLinkUrl("");
    setShowLinkForm(false);
  };

  const uploadFile = async (file) => {
    if (!file) return;
    setLoading(true);
    setErrorMSG("");

    try {
      const res = await apiPost("/api/upload/presigned-url", {
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        fileType: entityType,
        fileId: entityId,
      });

      const { uploadUrl, downloadURL, storagePath } = res;

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          "Content-Disposition": `attachment; filename="${file.name}"`,
        },
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload file to storage");
      }

      const newMaterial = {
        id: Date.now().toString(),
        type: "file",
        name: file.name,
        url: downloadURL,
        storagePath: storagePath,
      };

      await saveMaterials([...materials, newMaterial]);
    } catch (err) {
      console.error(err);
      setErrorMSG(isAr ? "فشل رفع الملف." : "Failed to upload file. Please check storage permissions.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    uploadFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    uploadFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDelete = async (mat) => {
    const confirmMsg = isAr
      ? "هل أنت متأكد من حذف هذه المادة؟"
      : "Are you sure you want to remove this material?";
    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    try {
      if (mat.type === "file" && mat.storagePath) {
        try {
          await apiPost("/api/upload/delete-file", { storagePath: mat.storagePath });
        } catch (storageErr) {
          console.warn("Could not delete from storage (maybe already deleted):", storageErr);
        }
      }
      const newMaterials = materials.filter((m) => m.id !== mat.id);
      await saveMaterials(newMaterials);
    } catch (err) {
      console.error(err);
      setErrorMSG(isAr ? "فشل حذف المادة." : "Failed to remove material.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-base border-2 border-border bg-card p-6 mt-6 shadow-shadow" dir={isAr ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {isAr ? "المواد والروابط" : "Materials & Links"}
        </h2>
        {canEdit && (
          <div className="flex gap-2">
            <Button
              variant="neutral"
              size="sm"
              onClick={() => setShowLinkForm(!showLinkForm)}
            >
              <Link2 className="h-4 w-4" />
              {isAr ? "رابط" : "Link"}
            </Button>
            <Button
              variant="neutral"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              <Upload className="h-4 w-4" />
              {isAr ? "رفع" : "Upload"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              disabled={loading}
            />
          </div>
        )}
      </div>

      {/* Error */}
      {errorMSG && (
        <div className="rounded-base border-2 border-destructive bg-destructive/10 p-3 mb-4">
          <p className="text-sm font-bold text-destructive">{errorMSG}</p>
        </div>
      )}

      {/* Add Link Form */}
      {showLinkForm && canEdit && (
        <div className="rounded-base border-2 border-border bg-secondary-background p-4 mb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="font-bold text-sm">
                {isAr ? "اسم الرابط" : "Link Name"}
              </Label>
              <Input
                placeholder={isAr ? "مثال: المستندات" : "e.g. Documentation"}
                value={linkName}
                onChange={(e) => setLinkName(e.target.value)}
              />
            </div>
            <div>
              <Label className="font-bold text-sm">
                {isAr ? "الرابط" : "URL"}
              </Label>
              <Input
                type="url"
                placeholder="https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="neutral"
              size="sm"
              onClick={() => {
                setShowLinkForm(false);
                setLinkName("");
                setLinkUrl("");
              }}
            >
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              size="sm"
              onClick={handleAddLink}
              disabled={loading || !linkName || !linkUrl}
            >
              <Plus className="h-4 w-4" />
              {isAr ? "إضافة" : "Add"}
            </Button>
          </div>
        </div>
      )}

      {/* Drop Zone (visible when editable and no materials yet, or always as upload area) */}
      {canEdit && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`rounded-base border-2 border-dashed cursor-pointer transition-colors mb-4 p-6 text-center ${
            dragOver
              ? "border-main bg-main/10"
              : "border-border bg-secondary-background hover:border-main/50"
          } ${loading ? "opacity-50 pointer-events-none" : ""}`}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-bold text-muted-foreground">
            {loading
              ? isAr
                ? "جاري الرفع..."
                : "Uploading..."
              : isAr
              ? "اسحب الملف هنا أو اضغط للرفع"
              : "Drag & drop a file here, or click to upload"}
          </p>
        </div>
      )}

      {/* Materials List */}
      {materials.length > 0 ? (
        <div className="space-y-2">
          {materials.map((mat) => (
            <div
              key={mat.id}
              className="rounded-base border-2 border-border bg-background p-3 flex items-center justify-between gap-3 hover:shadow-shadow transition-shadow"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 w-9 h-9 rounded-base border-2 border-border bg-secondary-background flex items-center justify-center">
                  {mat.type === "file" ? (
                    <FileText className="h-4 w-4 text-foreground" />
                  ) : (
                    <Link2 className="h-4 w-4 text-main" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{mat.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {mat.type === "file"
                      ? isAr
                        ? "ملف"
                        : "File"
                      : mat.url}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <a
                  href={mat.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={mat.type === "file" ? mat.name : undefined}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-base border-2 border-border bg-card hover:bg-secondary-background transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-foreground" />
                </a>
                {canEdit && (
                  <button
                    onClick={() => handleDelete(mat)}
                    disabled={loading}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-base border-2 border-border bg-card hover:bg-destructive/10 hover:border-destructive transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        !canEdit && (
          <p className="text-sm text-muted-foreground text-center py-6">
            {isAr ? "لا توجد مواد مضافة بعد." : "No materials added yet."}
          </p>
        )
      )}
    </div>
  );
};

export default MaterialManager;
