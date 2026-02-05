const xlsx = require('xlsx');
const Doctor = require('../doctor/doctor.model');
const Employee = require('../auth/auth.model');
const Chemist = require('../chemist/chemist.model');
const HQ = require('../hq/hq.model');
const Route = require('../route/route.model');
const Stockist = require('../stockist/stockist.model');
// Add other models as needed

// Map of dropdown values to Mongoose Models
const MODEL_MAP = {
    'doctors': Doctor,
    'employees': Employee,
    'chemists': Chemist,
    'hqs': HQ,
    'routes': Route,
    'stockists': Stockist
};

// @desc    Import data from Excel
// @route   POST /api/v1/admin/import
// @access  Private (Admin)
exports.importData = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Please upload an Excel file' });
        }

        const { type } = req.body;
        const Model = MODEL_MAP[type];

        if (!Model) {
            return res.status(400).json({ success: false, error: 'Invalid import type selected' });
        }

        // Read the uploaded file
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const rawData = xlsx.utils.sheet_to_json(worksheet);

        if (!rawData || rawData.length === 0) {
            return res.status(400).json({ success: false, error: 'Excel file is empty' });
        }

        // Optional: Pre-process data if needed (e.g., date formats, trimming strings)
        // For now, we rely on Mongoose schema defaults for missing fields.
        // Mongoose will ignore fields in the JSON that are not in the Schema if strict: true (default).

        // Use insertMany with ordered: false to continue correctly inserting even if some fail (e.g. duplicates)
        // However, if we want strict all-or-nothing, use default (ordered: true).
        // Let's use ordered: false to allow partial success and report errors? 
        // Or standard flow. Let's try standard flow first.

        try {
            const result = await Model.insertMany(rawData, { ordered: false });

            res.status(200).json({
                success: true,
                count: result.length,
                message: `Successfully imported ${result.length} records into ${type}`
            });
        } catch (insertError) {
            // Handle bulk write errors (e.g. some duplicates)
            if (insertError.name === 'BulkWriteError' || insertError.code === 11000) {
                return res.status(200).json({
                    success: true,
                    message: `Imported with some errors (e.g. duplicates skipped).`,
                    details: insertError.message
                });
            }
            throw insertError;
        }

    } catch (err) {
        next(err);
    }
};
