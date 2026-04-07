/**
 * Ramsha — Upload Controller (Firebase Storage)
 *
 * Handles file uploads using Firebase Storage (replaces Cloudflare R2).
 * Uses Firebase Admin SDK to generate signed URLs for direct upload.
 */

const admin = require("firebase-admin");

function getBucket() {
  return admin.storage().bucket();
}

exports.generatePresignedUrl = async (req, res) => {
  try {
    const { fileName, contentType, fileType, fileId } = req.body;
    if (!fileName) {
      return res.status(400).json({ error: "fileName is required" });
    }

    const key = `${fileType || "uploads"}/${fileId || "general"}/${Date.now()}_${fileName}`;
    const bucket = getBucket();
    const file = bucket.file(key);

    // Generate a signed URL for uploading (PUT)
    const [uploadUrl] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
      contentType: contentType || "application/octet-stream",
    });

    // Generate a signed URL for reading (GET) — long-lived for public access
    const [downloadURL] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
    });

    res.json({
      uploadUrl,
      downloadURL,
      storagePath: key,
    });
  } catch (error) {
    console.error("Error generating upload URL:", error);
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const { storagePath } = req.body;
    if (!storagePath) {
      return res.status(400).json({ error: "storagePath is required" });
    }

    const bucket = getBucket();
    await bucket.file(storagePath).delete();
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ error: "Failed to delete file" });
  }
};
