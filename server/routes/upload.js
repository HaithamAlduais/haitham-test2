const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const requireRole = require('../middleware/requireRole');

// Provide pre-signed URL to upload directly to R2 from the client
// E.g., required roles could be "Provider" or "Admin", but adjust to match your App rules
router.post('/presigned-url', requireRole('Provider', 'Admin'), uploadController.generatePresignedUrl);

router.post('/delete-file', requireRole('Provider', 'Admin'), uploadController.deleteFile);

module.exports = router;
