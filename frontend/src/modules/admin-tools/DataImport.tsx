import React, { useState, useRef } from 'react';
import { FileSpreadsheet, Upload, ArrowRight, ArrowLeft, CheckCircle, AlertCircle, Loader2, Eye } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

// ── DB Schema field definitions per database ──────────────────────────────────
const DB_FIELDS: Record<string, string[]> = {
    doctors: ['name', 'code', 'speciality', 'class', 'frequency', 'dob', 'anniversary', 'mobile', 'email', 'address', 'clinicAddress', 'residentialAddress', 'hq', 'routeFrom', 'routeTo', 'area', 'latitude', 'longitude'],
    employees: ['name', 'username', 'password', 'role', 'designation', 'state', 'division', 'salaryDetails.basicPay', 'salaryDetails.hra', 'allowanceRates.hqAllowance', 'allowanceRates.xStationAllowance', 'allowanceRates.offStationAllowance', 'staffType', 'mobile', 'email', 'address', 'hq', 'reportingTo', 'joiningDate', 'resignationDate'],
    chemists: ['name', 'contactPerson', 'mobile', 'phone', 'email', 'address', 'hq', 'latitude', 'longitude'],
    stockists: ['name', 'contact', 'mobile', 'email', 'address', 'hq', 'latitude', 'longitude'],
    hqs: ['name', 'location', 'employeeStrength', 'managerStrength', 'transitDays'],
    routes: ['name', 'code', 'areas', 'hq'],
    products: ['slNo', 'name', 'code', 'mrp', 'ptr', 'pts'],
};

const DB_LABELS: Record<string, string> = {
    doctors: 'Doctors',
    employees: 'Employees',
    chemists: 'Chemists',
    stockists: 'Stockists',
    hqs: 'Headquarters (HQs)',
    routes: 'Routes',
    products: 'Products',
};

const SPECIAL_OPTIONS = [
    { value: '__skip__', label: '⊘ Don\'t Import (Skip)' },
    { value: '__null__', label: '∅ Store as NULL' },
];

const STEPS = ['Select Database', 'Upload & Preview', 'Map Fields', 'Import'];

interface PreviewResult {
    headers: string[];
    autoSuggest: Record<string, string | null>;
    sampleRows: Record<string, any>[];
    totalRows: number;
}

interface ImportResult {
    count: number;
    message: string;
    errors: any[];
}

const DataImport: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const isHQ = user?.role === 'hq';
    const hasFullAccess = isAdmin || isHQ;

    // Filter labels so employees only see Doctors
    const availableLabels = hasFullAccess ? DB_LABELS : { doctors: 'Doctors' };

    const [step, setStep] = useState(0);
    const [dbType, setDbType] = useState('doctors');
    const [file, setFile] = useState<File | null>(null);
    const [headerRow, setHeaderRow] = useState(1);
    const [preview, setPreview] = useState<PreviewResult | null>(null);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Step navigation helpers ────────────────────────────────────────────────
    const next = () => setStep(s => Math.min(s + 1, 3));
    const prev = () => setStep(s => Math.max(s - 1, 0));

    // ── Step 2: Preview headers ────────────────────────────────────────────────
    const handlePreview = async () => {
        if (!file) { setError('Please upload an Excel file.'); return; }
        setLoading(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('headerRow', headerRow.toString());

            const res = await api.post('/admin/preview-headers', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setPreview(res.data);
            // Init mapping with auto-suggest (fall back to __skip__)
            const initialMapping: Record<string, string> = {};
            res.data.headers.forEach((h: string) => {
                initialMapping[h] = res.data.autoSuggest[h] ?? '__skip__';
            });
            setMapping(initialMapping);
        } catch (e: any) {
            setError(e.response?.data?.error || 'Failed to preview file.');
        } finally {
            setLoading(false);
        }
    };

    // ── Step 4: Import ─────────────────────────────────────────────────────────
    const handleImport = async () => {
        if (!file || !preview) return;
        setLoading(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', dbType);
            formData.append('headerRow', headerRow.toString());
            formData.append('mapping', JSON.stringify(mapping));

            const res = await api.post('/admin/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setImportResult(res.data);
        } catch (e: any) {
            setError(e.response?.data?.error || 'Import failed. Check the data and try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Renders ────────────────────────────────────────────────────────────────
    const renderStep1 = () => (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-foreground mb-2">Select Target Database</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(availableLabels).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setDbType(key)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${dbType === key
                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                                : 'border-border bg-card text-foreground hover:border-blue-300 hover:bg-muted/50'
                                }`}
                        >
                            <FileSpreadsheet className={`h-5 w-5 mb-2 ${dbType === key ? 'text-blue-600' : 'text-muted-foreground'}`} />
                            <p className="text-sm font-semibold">{label}</p>
                            <p className="text-xs text-muted-foreground mt-1">{DB_FIELDS[key].length} fields</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            {/* File Upload */}
            <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-muted/30 transition-all"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files[0];
                    if (f) setFile(f);
                }}
            >
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                {file ? (
                    <>
                        <p className="font-semibold text-foreground">{file.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                    </>
                ) : (
                    <>
                        <p className="font-medium text-foreground">Drop Excel file here or click to browse</p>
                        <p className="text-sm text-muted-foreground mt-1">Supports .xlsx and .xls files</p>
                    </>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
            </div>

            {/* Header Row */}
            <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-foreground whitespace-nowrap">Header Row Number:</label>
                <input
                    type="number"
                    min={1}
                    value={headerRow}
                    onChange={(e) => setHeaderRow(parseInt(e.target.value) || 1)}
                    className="w-24 border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs text-muted-foreground">Which row contains the column names?</span>
            </div>

            {/* Preview Button */}
            <button
                onClick={handlePreview}
                disabled={!file || loading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                {loading ? 'Previewing...' : 'Preview Headers'}
            </button>

            {/* Preview Result */}
            {preview && (
                <div className="border border-border rounded-xl overflow-hidden">
                    <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                            {preview.headers.length} columns detected · {preview.totalRows} data rows
                        </span>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    {preview.sampleRows.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="text-xs w-full">
                                <thead className="bg-muted text-muted-foreground">
                                    <tr>
                                        {preview.headers.map(h => (
                                            <th key={h} className="px-3 py-2 text-left font-medium border-b border-border">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.sampleRows.map((row, i) => (
                                        <tr key={i} className="border-b border-border last:border-0">
                                            {preview.headers.map(h => (
                                                <td key={h} className="px-3 py-2 text-foreground">{String(row[h] ?? '')}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    const renderStep3 = () => {
        if (!preview) return <p className="text-muted-foreground">Please preview the file first.</p>;
        const dbFields = DB_FIELDS[dbType] || [];

        return (
            <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">
                    Map each Excel column to the corresponding <strong>{DB_LABELS[dbType]}</strong> database field.
                </p>
                <div className="border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium w-1/2">Excel Column</th>
                                <th className="px-4 py-3 text-left font-medium w-1/2">Database Field</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {preview.headers.map((header) => (
                                <tr key={header} className="bg-card hover:bg-muted/30">
                                    <td className="px-4 py-3">
                                        <span className="font-medium text-foreground">{header}</span>
                                        {preview.sampleRows[0]?.[header] !== undefined && (
                                            <span className="ml-2 text-xs text-muted-foreground">
                                                e.g. &quot;{String(preview.sampleRows[0][header]).substring(0, 30)}&quot;
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <select
                                            value={mapping[header] ?? '__skip__'}
                                            onChange={(e) => setMapping(m => ({ ...m, [header]: e.target.value }))}
                                            className="w-full border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {SPECIAL_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                            <optgroup label={`${DB_LABELS[dbType]} Fields`}>
                                                {dbFields.map(field => (
                                                    <option key={field} value={field}>{field}</option>
                                                ))}
                                            </optgroup>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="text-xs text-muted-foreground">
                    <strong>Don't Import (Skip)</strong> — column ignored. <strong>Store as NULL</strong> — field saved as null in database.
                </p>
            </div>
        );
    };

    const renderStep4 = () => {
        const mappedCount = Object.values(mapping).filter(v => v !== '__skip__' && v !== '__null__').length;
        return (
            <div className="space-y-6">
                {!importResult ? (
                    <>
                        {/* Summary */}
                        <div className="border border-border rounded-xl p-5 bg-card space-y-3">
                            <h3 className="font-semibold text-foreground">Import Summary</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Target Database</p>
                                    <p className="font-medium text-foreground">{DB_LABELS[dbType]}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">File</p>
                                    <p className="font-medium text-foreground">{file?.name}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Data Rows</p>
                                    <p className="font-medium text-foreground">{preview?.totalRows ?? 0}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Mapped Fields</p>
                                    <p className="font-medium text-foreground">{mappedCount} of {preview?.headers.length ?? 0} columns</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleImport}
                            disabled={loading || mappedCount === 0}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 text-base"
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                            {loading ? 'Importing...' : 'Import Now'}
                        </button>
                    </>
                ) : (
                    <>
                        {/* Result */}
                        <div className={`border rounded-xl p-5 ${importResult.count > 0 ? 'border-green-500 bg-green-50 dark:bg-green-950/30' : 'border-red-500 bg-red-50 dark:bg-red-950/30'}`}>
                            <div className="flex items-center gap-3 mb-2">
                                {importResult.count > 0
                                    ? <CheckCircle className="h-6 w-6 text-green-600" />
                                    : <AlertCircle className="h-6 w-6 text-red-600" />
                                }
                                <h3 className="font-semibold text-lg text-foreground">{importResult.message}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Successfully imported <strong className="text-green-600">{importResult.count}</strong> records into <strong>{DB_LABELS[dbType]}</strong>.
                            </p>
                        </div>

                        {importResult.errors && importResult.errors.length > 0 && (
                            <div className="border border-red-200 dark:border-red-800 rounded-xl overflow-hidden">
                                <div className="bg-red-50 dark:bg-red-950/30 px-4 py-3 border-b border-red-200 dark:border-red-800">
                                    <p className="text-sm font-medium text-red-700 dark:text-red-400">
                                        {importResult.errors.length} row(s) failed
                                    </p>
                                </div>
                                <div className="max-h-48 overflow-y-auto divide-y divide-red-100 dark:divide-red-900">
                                    {importResult.errors.slice(0, 50).map((err, i) => (
                                        <div key={i} className="px-4 py-2 text-xs text-foreground">
                                            <span className="font-medium text-red-600">Row {err.row}:</span> {err.error}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Start Over */}
                        <button
                            onClick={() => {
                                setStep(0); setFile(null); setPreview(null);
                                setMapping({}); setImportResult(null); setError('');
                            }}
                            className="px-5 py-2.5 rounded-lg border border-border text-foreground hover:bg-muted transition-colors text-sm font-medium"
                        >
                            Start New Import
                        </button>
                    </>
                )}
            </div>
        );
    };

    const canGoNext = () => {
        if (step === 0) return true;
        if (step === 1) return !!preview;
        if (step === 2) return Object.values(mapping).some(v => v !== '__skip__' && v !== '__null__');
        return false;
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-950/40 rounded-lg">
                        <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Excel Data Import</h1>
                </div>
                <p className="text-muted-foreground text-sm">Import structured data from Excel into any database with flexible field mapping.</p>
            </div>

            {/* Stepper */}
            <div className="flex items-center mb-8">
                {STEPS.map((label, idx) => (
                    <React.Fragment key={label}>
                        <div className="flex flex-col items-center">
                            <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${step > idx ? 'bg-blue-600 border-blue-600 text-white'
                                : step === idx ? 'border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-950/30'
                                    : 'border-border text-muted-foreground bg-card'
                                }`}>
                                {step > idx ? <CheckCircle className="h-4 w-4" /> : idx + 1}
                            </div>
                            <span className={`text-xs mt-1.5 font-medium hidden sm:block ${step === idx ? 'text-blue-600' : 'text-muted-foreground'}`}>
                                {label}
                            </span>
                        </div>
                        {idx < STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-2 mb-5 ${step > idx ? 'bg-blue-600' : 'bg-border'}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Step Content */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm min-h-64">
                <h2 className="text-base font-semibold text-foreground mb-5">{STEPS[step]}</h2>
                {error && (
                    <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 mb-4 text-sm text-red-700 dark:text-red-400">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        {error}
                    </div>
                )}
                {step === 0 && renderStep1()}
                {step === 1 && renderStep2()}
                {step === 2 && renderStep3()}
                {step === 3 && renderStep4()}
            </div>

            {/* Navigation */}
            {!importResult && (
                <div className="flex justify-between mt-6">
                    <button
                        onClick={prev}
                        disabled={step === 0}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-40 font-medium"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>
                    {step < 3 && (
                        <button
                            onClick={next}
                            disabled={!canGoNext()}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-40 font-medium"
                        >
                            Next
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default DataImport;
