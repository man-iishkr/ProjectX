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

// Helper to normalize header keys (used for auto-suggest)
const normalizeKey = (key) => {
    return key.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
};

// Auto-suggest mapping (used by frontend for initial suggestion, not enforced server-side)
const FIELD_MAPPINGS = {
    'hq': 'hq', 'hqname': 'hq', 'headquarter': 'hq',
    'lat': 'latitude', 'latitude': 'latitude', 'locationlat': 'latitude',
    'lng': 'longitude', 'longitude': 'longitude', 'locationlng': 'longitude',
    'mobileno': 'mobile', 'mobile': 'mobile', 'phone': 'phone',
    'email': 'email', 'emailid': 'email',
    'address': 'address', 'location': 'address',
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
    'chemistname': 'name', 'shopname': 'name',
    'contactperson': 'contactPerson', 'ownername': 'contactPerson',
    'employeename': 'name', 'empname': 'name',
    'username': 'username', 'employeeid': 'username', 'empid': 'username',
    'password': 'password',
    'designation': 'designation', 'role': 'role',
    'state': 'state', 'division': 'division',
    'monthlypay': 'monthlyPay', 'salary': 'monthlyPay',
    'stafftype': 'staffType',
    'employeestrength': 'employeeStrength',
    'managerstrength': 'managerStrength',
    'transitdays': 'transitDays',
    'routename': 'name',
    'routecode': 'code',
    'areas': 'areas',
    'stockistname': 'name',
    'contact': 'contact',
    'joiningdate': 'joiningDate',
    'resignationdate': 'resignationDate',
    'monthlypay': 'monthlyPay',
    'aadharcard': 'aadharCard',
    'pancard': 'panCard',
    'pincode': 'pincode',
    'city': 'city',
    'mobile': 'mobile',
};

// ── Role Normalization ─────────────────────────────────────────────────────────
// Maps any free-text role string from Excel → valid enum value
const ROLE_MAP = {
    // BDE
    'bde': 'bde', 'business development executive': 'bde', 'marketing representative': 'bde',
    'field executive': 'bde', 'sales executive': 'bde', 'mr': 'bde', 'medical representative': 'bde',
    'field rep': 'bde', 'territory manager': 'bde', 'territory executive': 'bde',
    // ASM
    'asm': 'asm', 'area sales manager': 'asm', 'area manager': 'asm',
    // RSM
    'rsm': 'rsm', 'regional sales manager': 'rsm', 'regional manager': 'rsm',
    // SM
    'sm': 'sm', 'sales manager': 'sm', 'state manager': 'sm',
    // Admin
    'admin': 'admin', 'super admin': 'admin', 'administrator': 'admin',
};

const normalizeRole = (value) => {
    if (!value) return 'bde';
    const key = value.toString().trim().toLowerCase();
    return ROLE_MAP[key] || 'bde'; // default to bde if not found
};

// ── Date Normalization ─────────────────────────────────────────────────────────
// Handles: DD/MM/YYYY, DD-MM-YYYY, MM/DD/YYYY, ISO strings, Excel serial numbers
const parseFlexibleDate = (value) => {
    if (!value && value !== 0) return null;

    // If already a Date object
    if (value instanceof Date) return value;

    const str = value.toString().trim();
    if (!str) return null;

    // Excel serial number (number type)
    if (!isNaN(value) && typeof value === 'number') {
        // Excel date serial (days since 1900-01-01)
        const excelEpoch = new Date(1900, 0, 1);
        const date = new Date(excelEpoch.getTime() + (value - 2) * 86400000);
        return isNaN(date.getTime()) ? null : date;
    }

    // DD/MM/YYYY or DD-MM-YYYY
    const ddmmyyyy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (ddmmyyyy) {
        const [, day, month, year] = ddmmyyyy;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return isNaN(date.getTime()) ? null : date;
    }

    // ISO or standard parseable format
    const date = new Date(str);
    return isNaN(date.getTime()) ? null : date;
};

// ── Doctor Class Normalization ──────────────────────────────────────────────────
const CLASS_MAP = {
    'a+': 'Super Core', 'super core': 'Super Core',
    'a': 'Core', 'core': 'Core',
    'b': 'Important', 'important': 'Important',
    'd': 'Important',
    'c': 'General', 'general': 'General'
};

const normalizeDoctorClass = (value) => {
    if (!value) return 'General';
    const key = value.toString().trim().toLowerCase();
    return CLASS_MAP[key] || 'General';
};

// ── Field-level Value Normalizer ───────────────────────────────────────────────
// Numeric DB fields
const NUMBER_FIELDS = new Set(['monthlyPay', 'employeeStrength', 'managerStrength', 'transitDays', 'frequency', 'latitude', 'longitude']);
// Date DB fields
const DATE_FIELDS = new Set(['joiningDate', 'resignationDate', 'dob', 'anniversary', 'date', 'createdAt']);

const normalizeFieldValue = (dbField, rawValue) => {
    // Empty values
    if (rawValue === '' || rawValue === null || rawValue === undefined) return rawValue;

    if (dbField === 'role') return normalizeRole(rawValue);
    if (dbField === 'class') return normalizeDoctorClass(rawValue);

    if (DATE_FIELDS.has(dbField)) return parseFlexibleDate(rawValue);

    if (NUMBER_FIELDS.has(dbField)) {
        const n = parseFloat(rawValue);
        return isNaN(n) ? rawValue : n;
    }

    // Default: convert to string and trim
    return typeof rawValue === 'string' ? rawValue.trim() : rawValue;
};

// @desc    Preview Excel headers from a specified row
// @route   POST /api/v1/admin/preview-headers
// @access  Private (Admin)
exports.previewHeaders = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Please upload an Excel file' });
        }

        const headerRow = parseInt(req.body.headerRow) || 1;

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Read raw as array of arrays
        const rawRows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!rawRows || rawRows.length < headerRow) {
            return res.status(400).json({ success: false, error: `Header row ${headerRow} not found in Excel file` });
        }

        // Zero-indexed: headerRow 1 = index 0
        const headers = rawRows[headerRow - 1]
            .map(h => h ? h.toString().trim() : '')
            .filter(h => h !== '');

        // Build auto-suggest mapping
        const autoSuggest = {};
        headers.forEach(header => {
            const normKey = normalizeKey(header);
            autoSuggest[header] = FIELD_MAPPINGS[normKey] || null;
        });

        // Get up to 3 sample rows after the header row
        const sampleRows = rawRows.slice(headerRow, headerRow + 3).map(row =>
            headers.reduce((acc, header, idx) => {
                acc[header] = row[idx] !== undefined ? row[idx] : '';
                return acc;
            }, {})
        );

        res.status(200).json({
            success: true,
            headers,
            autoSuggest,
            sampleRows,
            totalRows: rawRows.length - headerRow
        });

    } catch (err) {
        console.error('Preview Headers Error:', err);
        next(err);
    }
};

// @desc    Import data from Excel with user-defined field mapping
// @route   POST /api/v1/admin/import
// @access  Private (Admin)
exports.importData = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Please upload an Excel file' });
        }

        const { type, headerRow: headerRowStr, mapping: mappingStr } = req.body;
        const headerRow = parseInt(headerRowStr) || 1;

        const Model = MODEL_MAP[type];
        if (!Model) {
            return res.status(400).json({ success: false, error: 'Invalid import type selected' });
        }

        // Parse user-defined mapping: { excelColumn: dbField | '__null__' | '__skip__' }
        let mapping = {};
        if (mappingStr) {
            try {
                mapping = JSON.parse(mappingStr);
            } catch (e) {
                return res.status(400).json({ success: false, error: 'Invalid mapping JSON' });
            }
        }

        // Read the uploaded file as array of arrays
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawRows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!rawRows || rawRows.length <= headerRow) {
            return res.status(400).json({ success: false, error: 'Excel file has no data rows after header row' });
        }

        const headers = rawRows[headerRow - 1].map(h => h ? h.toString().trim() : '');
        const dataRows = rawRows.slice(headerRow);

        // Pre-fetch HQs for lookup (Name -> _id)
        const allHQs = await HQ.find().select('name _id');
        const hqMap = new Map();
        allHQs.forEach(hq => {
            hqMap.set(hq.name.toLowerCase().trim(), hq._id);
            // Also index by partial names (handle SAHARSA HQ → SAHARSA)
            const shortName = hq.name.toLowerCase().trim().replace(/\s*hq\s*$/i, '').trim();
            if (shortName !== hq.name.toLowerCase().trim()) {
                hqMap.set(shortName, hq._id);
            }
        });

        // Pre-fetch Employees for reportingTo lookup (username/name -> _id)
        const allEmployees = await Employee.find().select('name username _id');
        const employeeMap = new Map();
        allEmployees.forEach(emp => {
            if (emp.username) employeeMap.set(emp.username.toLowerCase().trim(), emp._id);
            if (emp.name) employeeMap.set(emp.name.toLowerCase().trim(), emp._id);
        });

        const successRows = [];
        const errorRows = [];

        for (let i = 0; i < dataRows.length; i++) {
            const row = dataRows[i];
            // Skip completely empty rows
            if (row.every(cell => cell === '' || cell === null || cell === undefined)) continue;

            const mappedData = {};
            let rowWarnings = [];

            headers.forEach((header, idx) => {
                if (!header) return;
                const dbField = mapping[header];
                if (!dbField || dbField === '__skip__') return;
                if (dbField === '__null__') {
                    mappedData[dbField] = null;
                    return;
                }
                const cellValue = row[idx] !== undefined ? row[idx] : '';
                mappedData[dbField] = normalizeFieldValue(dbField, cellValue);
            });

            // HQ Lookup: resolve HQ name string -> ObjectId (soft-fail: keep string if not found)
            if (mappedData['hq'] && typeof mappedData['hq'] === 'string') {
                const hqNameNorm = mappedData['hq'].toLowerCase().trim();
                if (hqMap.has(hqNameNorm)) {
                    mappedData['hq'] = hqMap.get(hqNameNorm);
                } else {
                    // Soft-fail: store as string, warn but don't block
                    rowWarnings.push(`HQ '${mappedData['hq']}' not found in DB — stored as text`);
                }
            }

            // reportingTo Lookup: resolve manager username/name -> ObjectId (soft-fail)
            if (mappedData['reportingTo'] && typeof mappedData['reportingTo'] === 'string') {
                const rtNorm = mappedData['reportingTo'].toLowerCase().trim();
                if (employeeMap.has(rtNorm)) {
                    mappedData['reportingTo'] = employeeMap.get(rtNorm);
                } else {
                    delete mappedData['reportingTo']; // Remove invalid value
                    rowWarnings.push(`ReportingTo '${mappedData['reportingTo']}' not found — skipped`);
                }
            }

            // GeoJSON Transformation: store under 'coordinates' field (matches schema)
            // This avoids collision with HQ's string 'location' field
            if (mappedData['latitude'] && mappedData['longitude']) {
                mappedData.coordinates = {
                    type: 'Point',
                    coordinates: [parseFloat(mappedData['longitude']), parseFloat(mappedData['latitude'])]
                };
                delete mappedData['latitude'];
                delete mappedData['longitude'];
            }

            // Arrays (Routes -> areas)
            if (type === 'routes' && mappedData['areas'] && typeof mappedData['areas'] === 'string') {
                mappedData['areas'] = mappedData['areas'].split(',').map(s => s.trim());
            }

            // Add fallbacks for doctors if omitted in Excel to pass strict validation
            if (type === 'doctors') {
                if (!mappedData.routeFrom) mappedData.routeFrom = 'N/A';
                if (!mappedData.routeTo) mappedData.routeTo = 'N/A';
                if (!mappedData.clinicAddress) mappedData.clinicAddress = 'N/A';
                if (!mappedData.mobile) mappedData.mobile = '0000000000';
                if (!mappedData.area) mappedData.area = 'N/A';
                if (!mappedData.speciality) mappedData.speciality = 'N/A';
            }

            // Set metadata
            mappedData.createdBy = req.user.id;

            successRows.push(mappedData);
            if (rowWarnings.length > 0) {
                errorRows.push({ row: i + headerRow + 1, error: 'Warnings: ' + rowWarnings.join('; '), data: 'Imported with warnings' });
            }
        }

        if (successRows.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid rows found to import.',
                details: errorRows
            });
        }

        // --- Enforce Role-based restrictions ---
        const isEmployeeRole = req.user.role !== 'admin';
        if (isEmployeeRole && type !== 'doctors') {
            return res.status(403).json({ success: false, error: 'Employees can only import doctors' });
        }

        successRows.forEach(row => {
            row.createdBy = req.user.id;
            if (isEmployeeRole && type === 'doctors') {
                row.hq = req.user.hq;
                row.approvalStatus = 'Pending';
            }
        });
        // ----------------------------------------

        // Insert Data
        let savedCount = 0;
        let insertionErrors = [];

        if (type === 'employees') {
            for (const docData of successRows) {
                try {
                    if (!docData.password) docData.password = '123456';
                    await Employee.create(docData);
                    savedCount++;
                } catch (err) {
                    insertionErrors.push({ error: err.message, data: docData.username || docData.name });
                }
            }
        } else {
            for (const docData of successRows) {
                try {
                    const doc = new Model(docData);
                    await doc.save();
                    savedCount++;
                } catch (err) {
                    insertionErrors.push({ error: err.message.substring(0, 200), data: docData.name || docData.code });
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
