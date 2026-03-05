import React from 'react';
import { X } from 'lucide-react';

interface RecordDetailModalProps {
    record: any;
    title?: string;
    onClose: () => void;
}

// Fields to skip entirely (sensitive or internal)
const SKIP_FIELDS = new Set(['__v', 'password', 'token', 'resetPasswordToken', 'resetPasswordExpire']);

// Fields to display as plain text even if ObjectId-like
const LABEL_MAP: Record<string, string> = {
    _id: 'ID',
    name: 'Name',
    username: 'Username',
    role: 'Role',
    designation: 'Designation',
    email: 'Email',
    mobile: 'Mobile',
    phone: 'Phone',
    address: 'Address',
    clinicAddress: 'Clinic Address',
    residentialAddress: 'Residential Address',
    hq: 'HQ',
    reportingTo: 'Reporting To',
    state: 'State',
    division: 'Division',
    monthlyPay: 'Monthly Pay',
    staffType: 'Staff Type',
    code: 'Code',
    speciality: 'Speciality',
    class: 'Class',
    frequency: 'Frequency',
    dob: 'Date of Birth',
    anniversary: 'Anniversary',
    routeFrom: 'Route From',
    routeTo: 'Route To',
    approvalStatus: 'Approval Status',
    createdAt: 'Created At',
    updatedAt: 'Updated At',
    createdBy: 'Created By',
    resignationDate: 'Resignation Date',
    contactPerson: 'Contact Person',
    contact: 'Contact',
    areas: 'Areas',
    employeeStrength: 'Employee Strength',
    managerStrength: 'Manager Strength',
    transitDays: 'Transit Days',
    location: 'Location',
};

const formatLabel = (key: string): string =>
    LABEL_MAP[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());

const formatValue = (value: any): string => {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.map(v => formatValue(v)).join(', ');
    if (typeof value === 'object') {
        // Populated reference — try common name fields
        if (value.name) return value.name;
        if (value.type === 'Point' && value.coordinates) {
            return `Lat: ${value.coordinates[1]}, Lng: ${value.coordinates[0]}`;
        }
        return JSON.stringify(value);
    }
    // ISO date string
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
        return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    return String(value);
};

const RecordDetailModal: React.FC<RecordDetailModalProps> = ({ record, title = 'Record Details', onClose }) => {
    const entries = Object.entries(record ?? {}).filter(([key]) => !SKIP_FIELDS.has(key));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto px-6 py-4 flex-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                        {entries.map(([key, value]) => (
                            <div key={key} className="space-y-0.5">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    {formatLabel(key)}
                                </p>
                                <p className="text-sm text-foreground break-words">
                                    {formatValue(value)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-border flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm rounded-lg bg-muted hover:bg-muted/70 text-foreground transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecordDetailModal;
