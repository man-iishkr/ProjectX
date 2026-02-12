const xlsx = require('xlsx');
const Doctor = require('../doctor/doctor.model');
const Employee = require('../auth/auth.model');
const Chemist = require('../chemist/chemist.model');
const HQ = require('../hq/hq.model');
const Route = require('../route/route.model');
const Stockist = require('../stockist/stockist.model');

// Map of dropdown values to Mongoose Models
const MODEL_MAP = {
    'doctors': Doctor,
    'employees': Employee,
    'chemists': Chemist,
    'hqs': HQ,
    'routes': Route,
    'stockists': Stockist
};

// Field Mapping Configuration (Normalized Key -> Schema Field)
const FIELD_MAPPINGS = {
    // Common
    'hq': 'hq', 'hqname': 'hq', 'headquarter': 'hq',
    'lat': 'latitude', 'latitude': 'latitude', 'locationlat': 'latitude',
    'lng': 'longitude', 'longitude': 'longitude', 'locationlng': 'longitude',
    'mobileno': 'mobile', 'mobile': 'mobile', 'phone': 'phone',
    'email': 'email', 'emailid': 'email',
    'address': 'address', 'location': 'address',

    // Doctors
    'drname': 'name', 'doctorname': 'name', 'name': 'name',
    'drcode': 'code', 'code': 'code',
    'routefrom': 'routeFrom', 'routeto': 'routeTo',
    'clinicaddress': 'clinicAddress',
    'residentialaddress': 'residentialAddress',
    'speciality': 'speciality', 'specialization': 'speciality',
    'class': 'class', 'category': 'class',
    'frequency': 'frequency', 'visitfreq': 'frequency',
    'dob': 'dob', 'dateofbirth': 'dob',
    'anniversary': 'anniversary',

    // Chemists
    'chemistname': 'name', 'shopname': 'name',
    'contactperson': 'contactPerson', 'ownername': 'contactPerson',

    // Employees
    'employeename': 'name', 'empname': 'name',
    'username': 'username', 'employeeid': 'username', 'empid': 'username',
    'password': 'password',
    'designation': 'designation', 'role': 'designation',
    'state': 'state', 'division': 'division',
    'monthlypay': 'monthlyPay', 'salary': 'monthlyPay',
    'stafftype': 'staffType',

    // HQs
    'hqname': 'name',
    'employeestrength': 'employeeStrength',
    'managerstrength': 'managerStrength',
    'transitdays': 'transitDays',

    // Routes
    'routename': 'name',
    'routecode': 'code',
    'areas': 'areas', // Comma separated?

    // Stockists
    'stockistname': 'name',
    'contact': 'contact'
};

// Helper to normalize header keys
const normalizeKey = (key) => {
    return key.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
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

        // Convert to JSON with raw headers
        const rawData = xlsx.utils.sheet_to_json(worksheet, { defval: "" });

        if (!rawData || rawData.length === 0) {
            return res.status(400).json({ success: false, error: 'Excel file is empty' });
        }

        // 1. Pre-fetch HQs for lookup (Name -> _id)
        const allHQs = await HQ.find().select('name _id');
        const hqMap = new Map();
        allHQs.forEach(hq => {
            hqMap.set(normalizeKey(hq.name), hq._id);
        });

        const successRows = [];
        const errorRows = [];

        // 2. Process each row
        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            const mappedData = {};
            let isRowValid = true;
            let rowError = '';

            // Map fields
            Object.keys(row).forEach(originalKey => {
                const normKey = normalizeKey(originalKey);
                const schemaField = FIELD_MAPPINGS[normKey];

                if (schemaField) {
                    mappedData[schemaField] = row[originalKey];
                }
            });

            // --- Specific Logic based on Type ---

            // HQ Lookup
            if (mappedData['hq']) {
                const hqNameNorm = normalizeKey(mappedData['hq']);
                if (hqMap.has(hqNameNorm)) {
                    mappedData['hq'] = hqMap.get(hqNameNorm);
                } else if (type === 'hqs') {
                    // Importing HQs themselves, so 'hq' field might not be relevant or it's self-reference?
                    // Usually HQs don't have a parent HQ in this schema, so skip.
                } else {
                    // If HQ not found for other entities, it's a critical error usually
                    isRowValid = false;
                    rowError = `HQ '${row['HQ'] || row['hq']}' not found`;
                }
            } else if (type !== 'hqs' && type !== 'admin') {
                // HQ is mandatory for most, except maybe Admin/Routes(if optional)/HQs themselves
                // Let's assume it's required for Doctors, Chemists, Stockists, Employees
                if (type === 'doctors' || type === 'chemists' || type === 'stockists' || type === 'employees') {
                    // Allow if admin? But data ownership needs HQ usually.
                    // Actually schema says HQ required for details.
                    // Let's check schema reqs later or fail here.
                    // For now, if missing in Excel, we might fallback to current user's HQ if not Admin?
                    if (req.user.role !== 'admin') {
                        mappedData['hq'] = req.user.hq;
                    } else {
                        // Admin importing without HQ column?
                        // isRowValid = false;
                        // rowError = 'HQ column missing';
                    }
                }
            }

            // GeoJSON Transformation
            if (mappedData['latitude'] && mappedData['longitude']) {
                mappedData.location = {
                    type: 'Point',
                    coordinates: [parseFloat(mappedData['longitude']), parseFloat(mappedData['latitude'])]
                };
                // Remove flat lat/lng to avoid schema conflict if strict
                delete mappedData['latitude'];
                delete mappedData['longitude'];
            }

            // CreatedBy Metadata
            mappedData.createdBy = req.user.id;

            // Arrays (Routes -> areas)
            if (type === 'routes' && mappedData['areas'] && typeof mappedData['areas'] === 'string') {
                mappedData['areas'] = mappedData['areas'].split(',').map(s => s.trim());
            }

            // Route From/To Validation (Optional enhancement: verify strings or auto-create routes)

            // --- End Specific Logic ---

            if (isRowValid) {
                successRows.push(mappedData);
            } else {
                errorRows.push({ row: i + 2, error: rowError, data: row });
            }
        }

        if (successRows.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid rows found to import.',
                details: errorRows
            });
        }

        // 3. Insert Data
        let savedCount = 0;
        let insertionErrors = [];

        if (type === 'employees') {
            // Must use create/save for password hashing
            for (const docData of successRows) {
                try {
                    // Default password if missing
                    if (!docData.password) docData.password = '123456';
                    await Employee.create(docData);
                    savedCount++;
                } catch (err) {
                    insertionErrors.push({ error: err.message, data: docData.username || docData.name });
                }
            }
        } else {
            // Bulk Insert for performance
            try {
                // ordered: false continues even if some fail
                const result = await Model.insertMany(successRows, { ordered: false });
                savedCount = result.length;
            } catch (err) {
                if (err.writeErrors) {
                    savedCount = err.result.nInserted;
                    err.writeErrors.forEach(e => {
                        insertionErrors.push({
                            row: e.index + 2,
                            error: e.errmsg
                        });
                    });
                } else {
                    throw err;
                }
            }
        }

        res.status(200).json({
            success: true,
            count: savedCount,
            message: `Imported ${savedCount} records. ${insertionErrors.length + errorRows.length} failed.`,
            errors: [...errorRows, ...insertionErrors]
        });

    } catch (err) {
        console.error('Import Error:', err);
        next(err);
    }
};
