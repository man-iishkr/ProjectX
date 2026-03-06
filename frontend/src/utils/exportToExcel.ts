import * as xlsx from 'xlsx';

/**
 * Strips internal and sensitive fields from a data object.
 */
const cleanDataForExport = (data: any[]) => {
    return data.map(item => {
        // Create a shallow copy to avoid mutating original state
        const cleaned = { ...item };

        // Remove common MongoDB and System fields
        delete cleaned._id;
        delete cleaned.__v;
        delete cleaned.password;
        delete cleaned.token;
        delete cleaned.resetPasswordToken;
        delete cleaned.resetPasswordExpire;

        // Flatten populated references if necessary
        if (cleaned.createdBy && typeof cleaned.createdBy === 'object') {
            cleaned.createdBy = cleaned.createdBy.name || cleaned.createdBy._id || 'System';
        }

        if (cleaned.hq && typeof cleaned.hq === 'object') {
            cleaned.hq = cleaned.hq.name || cleaned.hq._id || cleaned.hq;
        }

        if (cleaned.reportingTo && typeof cleaned.reportingTo === 'object') {
            cleaned.reportingTo = cleaned.reportingTo.name || cleaned.reportingTo._id;
        }

        // Stringify complex arrays/objects to prevent [object Object] in Excel
        Object.keys(cleaned).forEach(key => {
            if (Array.isArray(cleaned[key])) {
                cleaned[key] = cleaned[key].join(', ');
            } else if (cleaned[key] !== null && typeof cleaned[key] === 'object') {
                cleaned[key] = JSON.stringify(cleaned[key]);
            }
        });

        return cleaned;
    });
};

/**
 * Converts an array of objects to an Excel file and triggers a download.
 * @param data Array of objects to export
 * @param filename Custom filename without extension
 */
export const exportToExcel = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
        alert("No data available to export.");
        return;
    }

    const cleanedData = cleanDataForExport(data);

    // Create a new workbook and a worksheet
    const worksheet = xlsx.utils.json_to_sheet(cleanedData);
    const workbook = xlsx.utils.book_new();

    // Append worksheet to workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Data');

    // Generate Excel file and trigger download
    xlsx.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};
