import React, { useState, useMemo } from 'react';
import { X, User, Briefcase, MapPin, Settings, LayoutGrid } from 'lucide-react';

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

// Define categorization rules
const CATEGORIES = [
    { id: 'general', label: 'General Info', icon: User, keys: ['name', 'username', 'email', 'mobile', 'phone', 'dob', 'anniversary'] },
    { id: 'professional', label: 'Professional', icon: Briefcase, keys: ['role', 'designation', 'staffType', 'monthlyPay', 'reportingTo', 'code', 'speciality', 'class', 'frequency', 'routeFrom', 'routeTo', 'employeeStrength', 'managerStrength', 'transitDays', 'contactPerson', 'contact'] },
    { id: 'location', label: 'Location Details', icon: MapPin, keys: ['address', 'clinicAddress', 'residentialAddress', 'hq', 'state', 'division', 'areas', 'location'] },
    { id: 'system', label: 'System Info', icon: Settings, keys: ['_id', 'approvalStatus', 'createdAt', 'updatedAt', 'createdBy', 'resignationDate'] },
    { id: 'other', label: 'Other Details', icon: LayoutGrid, keys: [] } // Catch-all
];

const formatLabel = (key: string): string =>
    LABEL_MAP[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());

const formatValue = (value: any): string => {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.map(v => formatValue(v)).join(', ');
    if (typeof value === 'object') {
        if (value.name) return value.name;
        if (value.type === 'Point' && value.coordinates) {
            return `Lat: ${value.coordinates[1]}, Lng: ${value.coordinates[0]}`;
        }
        return JSON.stringify(value);
    }
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
        return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    return String(value);
};

const RecordDetailModal: React.FC<RecordDetailModalProps> = ({ record, title = 'Record Details', onClose }) => {
    // 1. Filter out skipped fields
    const validEntries = Object.entries(record ?? {}).filter(([key]) => !SKIP_FIELDS.has(key));

    // 2. Group fields into categories
    const groupedFields = useMemo(() => {
        const groups: Record<string, [string, any][]> = {
            general: [], professional: [], location: [], system: [], other: []
        };

        const assignedKeys = new Set<string>();

        CATEGORIES.forEach(cat => {
            if (cat.id !== 'other') {
                cat.keys.forEach(catKey => {
                    const match = validEntries.find(([k]) => k === catKey);
                    if (match) {
                        groups[cat.id].push(match);
                        assignedKeys.add(match[0]);
                    }
                });
            }
        });

        // Assign unmapped keys to 'Other'
        validEntries.forEach(entry => {
            if (!assignedKeys.has(entry[0])) {
                groups.other.push(entry);
            }
        });

        return groups;
    }, [record]);

    // 3. Determine active categories (only show tabs that have fields)
    const activeCategories = CATEGORIES.filter(cat => groupedFields[cat.id].length > 0);

    const [activeTab, setActiveTab] = useState(activeCategories[0]?.id || 'other');

    if (!record) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6 transition-all">
            <div className="bg-background border border-border sm:rounded-2xl rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header (Mobile & Desktop) */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50">
                    <h2 className="text-xl font-bold text-foreground tracking-tight">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 rounded-full hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Main Content Area - Dual Pane */}
                <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">

                    {/* Left Sidebar - Navigation */}
                    <div className="w-full sm:w-64 border-r border-border bg-slate-50/50 dark:bg-muted/10 p-4 sm:p-6 space-y-1 overflow-x-auto sm:overflow-y-auto flex sm:flex-col flex-row gap-2 sm:gap-0 shrink-0 hide-scrollbar">
                        {activeCategories.map((cat) => {
                            const Icon = cat.icon;
                            const isActive = activeTab === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveTab(cat.id)}
                                    className={`flex items-center sm:w-full px-4 sm:px-3 py-2.5 sm:py-2 rounded-lg text-sm font-medium transition-all ${isActive
                                            ? 'bg-white dark:bg-card text-primary shadow-sm ring-1 ring-border whitespace-nowrap'
                                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground whitespace-nowrap'
                                        }`}
                                >
                                    <Icon className={`h-4 w-4 sm:mr-3 mr-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                                    {cat.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Right Content - Form Fields */}
                    <div className="flex-1 p-6 sm:p-8 overflow-y-auto bg-background">
                        <div className="max-w-xl mx-auto space-y-6">

                            {/* Animated Tab Content Title */}
                            <div className="pb-4 border-b border-border/50">
                                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                    {activeCategories.find(c => c.id === activeTab)?.label}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    View detailed information associated with this record.
                                </p>
                            </div>

                            {/* Form Fields Mapping */}
                            <div className="space-y-5">
                                {groupedFields[activeTab]?.map(([key, value]) => (
                                    <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 group">
                                        <label className="sm:w-1/3 text-sm font-medium text-slate-600 dark:text-slate-400">
                                            {formatLabel(key)}
                                        </label>
                                        <div className="flex-1">
                                            <div className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-muted/40 border border-slate-200 dark:border-border rounded-lg text-sm text-foreground break-words min-h-[42px] flex items-center shadow-sm">
                                                {formatValue(value)}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {groupedFields[activeTab]?.length === 0 && (
                                    <p className="text-sm text-muted-foreground italic py-4">No data available in this category.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t border-border bg-slate-50/50 dark:bg-muted/10 flex justify-end shrink-0">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-white dark:bg-card border border-border hover:bg-muted text-foreground transition-all shadow-sm"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecordDetailModal;
