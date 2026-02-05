import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { importAPI } from '../../api/import.api';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';

const DataImport: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [moduleType, setModuleType] = useState('doctors');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
            setError(null);
        }
    };

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a file');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', moduleType);

        try {
            setLoading(true);
            setError(null);
            setResult(null);

            const res = await importAPI.uploadExcel(formData);
            setResult(res);
            setFile(null); // Clear file after success

            // Reset file input visually
            const fileInput = document.getElementById('file-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

        } catch (err: any) {
            console.error(err);
            setError(err?.response?.data?.error || 'Failed to import data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="text-green-600" />
                        Import Data from Excel
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleImport} className="space-y-6">

                        {/* Module Selection */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Select Target Module</label>
                            <select
                                value={moduleType}
                                onChange={(e) => setModuleType(e.target.value)}
                                className="w-full p-2 border rounded-md bg-background"
                            >
                                <option value="doctors">Doctors</option>
                                <option value="chemists">Chemists</option>
                                <option value="employees">Employees</option>
                                <option value="hqs">HQs</option>
                                <option value="routes">Routes</option>
                                <option value="stockists">Stockists</option>
                            </select>
                            <p className="text-xs text-muted-foreground mt-1">
                                Ensure your Excel file headers match the database fields for the selected module.
                            </p>
                        </div>

                        {/* File Upload */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors">
                            <input
                                id="file-upload"
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                                <Upload className="h-10 w-10 text-gray-400 mb-2" />
                                <span className="text-sm font-medium">
                                    {file ? file.name : "Click to Upload Excel File"}
                                </span>
                                <span className="text-xs text-gray-500 mt-1">
                                    Supports .xlsx, .xls
                                </span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading || !file}
                        >
                            {loading ? 'Importing...' : 'Start Import'}
                        </Button>

                        {/* Feedback Messages */}
                        {error && (
                            <div className="bg-red-50 text-red-700 p-4 rounded-md flex items-center gap-2">
                                <AlertCircle className="h-5 w-5" />
                                <div>{error}</div>
                            </div>
                        )}

                        {result && (
                            <div className="bg-green-50 text-green-700 p-4 rounded-md">
                                <div className="flex items-center gap-2 font-semibold mb-1">
                                    <CheckCircle className="h-5 w-5" />
                                    Import Successful!
                                </div>
                                <p>{result.message}</p>
                                {result.details && (
                                    <p className="text-sm mt-1 opacity-80">{result.details}</p>
                                )}
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default DataImport;
