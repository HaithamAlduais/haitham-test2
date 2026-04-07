const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const requireRole = require('../middleware/requireRole');

// Provide pre-signed URL to upload directly to R2 from the client
router.post('/presigned-url', requireRole('Organizer', 'Admin'), uploadController.generatePresignedUrl);

router.post('/delete-file', requireRole('Organizer', 'Admin'), uploadController.deleteFile);

module.exports = router;
