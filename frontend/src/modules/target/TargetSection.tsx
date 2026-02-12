import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Target as TargetIcon, Plus, MapPin, Building2 } from 'lucide-react';

const TargetSection: React.FC = () => {
    return (
        <Card className="col-span-2">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Target Management</CardTitle>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                            <Plus className="h-4 w-4 mr-1" />
                            Add Doctor
                        </Button>
                        <Button size="sm" variant="outline">
                            <Plus className="h-4 w-4 mr-1" />
                            Add Chemist
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Target Overview */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/10 p-4 rounded-lg border border-blue-200 dark:border-blue-900/50">
                        <div className="flex items-center gap-2 mb-2">
                            <TargetIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <span className="text-xs font-medium text-blue-900 dark:text-blue-200">Monthly Target</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">₹5,00,000</div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Target set for current month</div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/10 p-4 rounded-lg border border-green-200 dark:border-green-900/50">
                        <div className="flex items-center gap-2 mb-2">
                            <TargetIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                            <span className="text-xs font-medium text-green-900 dark:text-green-200">Achieved</span>
                        </div>
                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">₹3,75,000</div>
                        <div className="text-xs text-green-600 dark:text-green-400 mt-1">75% of target achieved</div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-900/10 p-4 rounded-lg border border-purple-200 dark:border-purple-900/50">
                        <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            <span className="text-xs font-medium text-purple-900 dark:text-purple-200">Regions</span>
                        </div>
                        <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">8/10</div>
                        <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">Regions covered</div>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-900/10 p-4 rounded-lg border border-amber-200 dark:border-amber-900/50">
                        <div className="flex items-center gap-2 mb-2">
                            <Building2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            <span className="text-xs font-medium text-amber-900 dark:text-amber-200">Factories</span>
                        </div>
                        <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">4</div>
                        <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">Factory assignments</div>
                    </div>
                </div>

                {/* Target List */}
                <div className="border rounded-lg">
                    <div className="p-3 bg-muted/50 border-b">
                        <h4 className="font-semibold text-sm">Target List</h4>
                    </div>
                    <div className="divide-y">
                        {[
                            { category: 'Doctor Visits', target: 50, achieved: 38, percentage: 76 },
                            { category: 'Chemist Visits', target: 30, achieved: 22, percentage: 73 },
                            { category: 'Product Sales', target: 100, achieved: 75, percentage: 75 },
                            { category: 'New Registrations', target: 10, achieved: 7, percentage: 70 }
                        ].map((item, index) => (
                            <div key={index} className="p-3 hover:bg-muted/50 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-sm">{item.category}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {item.achieved} / {item.target}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 bg-slate-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${item.percentage >= 80 ? 'bg-green-500' :
                                                item.percentage >= 60 ? 'bg-blue-500' :
                                                    'bg-amber-500'
                                                }`}
                                            style={{ width: `${item.percentage}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-xs font-medium w-12 text-right">{item.percentage}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Personal Region & Pricing */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Personal Region
                        </h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Primary Zone:</span>
                                <span className="font-medium">Mumbai West</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Assigned Doctors:</span>
                                <span className="font-medium">45</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Assigned Chemists:</span>
                                <span className="font-medium">28</span>
                            </div>
                        </div>
                    </div>

                    <div className="border rounded-lg p-4">
                        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Factory & Pricing
                        </h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Factory Code:</span>
                                <span className="font-medium">F-001</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Products:</span>
                                <span className="font-medium">12 SKUs</span>
                            </div>
                            <Button variant="outline" size="sm" className="w-full mt-2">
                                Check Pricing
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Check Expenses Button */}
                <div className="border-t pt-4">
                    <Button variant="default" className="w-full">
                        <TargetIcon className="h-4 w-4 mr-2" />
                        Check Expenses & Reports
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default TargetSection;
