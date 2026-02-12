import React from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { FileSpreadsheet, Construction } from 'lucide-react';

const DataImport: React.FC = () => {
    return (
        <div className="max-w-2xl mx-auto py-16">
            <Card className="text-center shadow-lg border-2 border-dashed border-yellow-400 bg-yellow-50/50">
                <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center space-y-4">
                    <div className="bg-yellow-100 p-4 rounded-full">
                        <Construction className="h-16 w-16 text-yellow-600" />
                    </div>

                    <h2 className="text-3xl font-bold text-gray-800">
                        Under Active Construction
                    </h2>

                    <p className="text-gray-600 max-w-md text-lg">
                        We are currently upgrading the Excel Import module to support smarter data mapping and validation.
                    </p>

                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-4 bg-white px-4 py-2 rounded-full border">
                        <FileSpreadsheet className="h-4 w-4" />
                        <span>This feature will be back shortly</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default DataImport;
