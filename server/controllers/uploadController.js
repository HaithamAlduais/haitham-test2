const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

// Initialize S3 client for Cloudflare R2
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_BUCKET = process.env.R2_BUCKET;

const s3Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

exports.generatePresignedUrl = async (req, res) => {
  try {
    const { fileName, contentType, fileType, fileId } = req.body;
    if (!fileName) {
      return res.status(400).json({ error: "fileName is required" });
    }

    const key = `${fileType}/${fileId}/${Date.now()}_${fileName}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: contentType,
      ContentDisposition: `attachment; filename="${fileName}"`,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    
    // Also build the public URL according to environment var R2_URL if present
    const publicUrlBase = process.env.R2_URL || R2_ENDPOINT;
    const downloadURL = process.env.R2_URL 
      ? `${publicUrlBase}/${key}` 
      : `${R2_ENDPOINT}/${R2_BUCKET}/${key}`;

    res.json({
      uploadUrl: url,
      downloadURL: downloadURL,
      storagePath: key
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    res.status(500).json({ error: "Failed to generate presigned URL" });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const { storagePath } = req.body;
    if (!storagePath) {
      return res.status(400).json({ error: "storagePath is required" });
    }

    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: storagePath,
    });

    await s3Client.send(command);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ error: "Failed to delete file" });
  }
};
