import { useState } from "react";
import { apiPatch, apiPost } from "../../utils/api";

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
  const [materials, setMaterials] = useState(initialMaterials || []);

  const [loading, setLoading] = useState(false);
  const [errorMSG, setErrorMSG] = useState("");

  const [linkUrl, setLinkUrl] = useState("");
  const [linkName, setLinkName] = useState("");

  const saveMaterials = async (newMaterials) => {
    setLoading(true);
    setErrorMSG("");
    try {
      await apiPatch(`/api/${entityType}/${entityId}`, { materials: newMaterials });
      setMaterials(newMaterials);
      if (onUpdate) onUpdate(newMaterials);
    } catch (err) {
      console.error(err);
      setErrorMSG("Failed to update materials.");
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
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setErrorMSG("");

    try {
      // 1) Get pre-signed URL from backend
      const res = await apiPost('/api/upload/presigned-url', {
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        fileType: entityType,
        fileId: entityId
      });

      const { uploadUrl, downloadURL, storagePath } = res;

      // 2) Upload file directly to Cloudflare R2
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          "Content-Disposition": `attachment; filename="${file.name}"`,
        },
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload file to Cloudflare storage");
      }

      // 3) Create new material object
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
      setErrorMSG("Failed to upload file. Please check storage permissions.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (mat) => {
    if (!window.confirm("Are you sure you want to remove this material?")) return;

    setLoading(true);
    try {
      if (mat.type === "file" && mat.storagePath) {
        try {
          await apiPost('/api/upload/delete-file', { storagePath: mat.storagePath });
        } catch (storageErr) {
          console.warn("Could not delete from storage (maybe already deleted):", storageErr);
        }
      }
      const newMaterials = materials.filter(m => m.id !== mat.id);
      await saveMaterials(newMaterials);
    } catch (err) {
      console.error(err);
      setErrorMSG("Failed to remove material.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-2 border-border bg-secondary-background p-6 mt-6">
      <h2 className="font-display font-bold text-lg text-foreground mb-4">
        Materials & Links
      </h2>

      <div>
        {errorMSG && (
          <div className="border-2 border-destructive bg-destructive/10 p-3 mb-4">
            <p className="font-mono text-sm text-destructive">{errorMSG}</p>
          </div>
        )}

        {/* List Materials */}
        {materials.length > 0 ? (
          <ul className="space-y-3 mb-6">
            {materials.map((mat) => (
              <li key={mat.id} className="flex items-center justify-between p-3 border-2 border-border bg-background">
                <a
                  href={mat.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={mat.name || true}
                  className="flex items-center gap-3 text-main hover:underline flex-1 truncate font-mono text-sm"
                >
                  {mat.type === "file" ? (
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                  ) : (
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                  )}
                  <span className="font-bold truncate">{mat.name}</span>
                </a>

                {canEdit && (
                  <button onClick={() => handleDelete(mat)} className="text-destructive hover:text-destructive/80 ml-4 p-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-mono text-sm text-muted-foreground mb-6">No materials added yet.</p>
        )}

        {/* Add Controls */}
        {canEdit && (
          <div className="border-t-2 border-border pt-5 flex flex-col gap-4">
            {/* Add Link */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Link Name (e.g. Doc)"
                value={linkName}
                onChange={e => setLinkName(e.target.value)}
                className="flex-1 px-4 py-2 border-2 border-border bg-background text-foreground font-mono text-sm focus:outline-none focus:border-main"
              />
              <input
                type="url"
                placeholder="URL (https://...)"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                className="flex-1 px-4 py-2 border-2 border-border bg-background text-foreground font-mono text-sm focus:outline-none focus:border-main"
              />
              <button
                onClick={handleAddLink}
                disabled={loading || !linkName || !linkUrl}
                className="bg-black text-white px-6 py-2 border-2 border-black hover:bg-card hover:text-black font-mono font-bold text-sm uppercase tracking-[0.12em] transition-colors disabled:opacity-50"
              >
                Add Link
              </button>
            </div>

            {/* Upload File */}
            <div className="mt-2 text-right">
              <label className={`inline-flex items-center gap-2 cursor-pointer bg-card text-foreground px-6 py-2 border-2 border-border hover:bg-secondary-background font-mono font-bold text-sm uppercase tracking-[0.12em] transition-colors ${loading ? "opacity-50" : ""}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                {loading ? "Uploading..." : "Upload File"}
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={loading}
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterialManager;
