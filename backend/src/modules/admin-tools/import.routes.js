const express = require('express');
const multer = require('multer');
const { importData, previewHeaders } = require('./import.controller');
const { protect, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

// Configure Multer for memory storage (we process buffer directly)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.use(protect);

router.post('/preview-headers', authorize('admin', 'sm', 'rsm', 'asm', 'bde'), upload.single('file'), previewHeaders);
router.post('/import', authorize('admin', 'sm', 'rsm', 'asm', 'bde'), upload.single('file'), importData);

module.exports = router;
