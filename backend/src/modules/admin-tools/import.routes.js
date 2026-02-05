const express = require('express');
const multer = require('multer');
const { importData } = require('./import.controller');
const { protect, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

// Configure Multer for memory storage (we process buffer directly)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.use(protect);
router.use(authorize('admin')); // Restrict all import tools to Admin

router.post('/import', upload.single('file'), importData);

module.exports = router;
