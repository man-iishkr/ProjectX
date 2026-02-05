import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Upload, FileCheck, Users, TrendingUp } from 'lucide-react';

const ReportCall: React.FC = () => {
    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Report Call</CardTitle>
                    <Button size="sm">
                        <Upload className="h-4 w-4 mr-1" />
                        Upload Report
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Upload Section */}
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium mb-1">Upload and Merge Reports</p>
                    <p className="text-xs text-muted-foreground mb-3">
                        Upload data and approve representative assignments
                    </p>
                    <Button variant="outline" size="sm">
                        Select Files
                    </Button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <FileCheck className="h-4 w-4 text-blue-600" />
                            <span className="text-xs text-muted-foreground">Pending</span>
                        </div>
                        <div className="text-xl font-bold text-blue-600">12</div>
                    </div>

                    <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <FileCheck className="h-4 w-4 text-green-600" />
                            <span className="text-xs text-muted-foreground">Approved</span>
                        </div>
                        <div className="text-xl font-bold text-green-600">148</div>
                    </div>

                    <div className="bg-purple-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="h-4 w-4 text-purple-600" />
                            <span className="text-xs text-muted-foreground">This Month</span>
                        </div>
                        <div className="text-xl font-bold text-purple-600">160</div>
                    </div>
                </div>

                {/* Recent Reports */}
                <div>
                    <h4 className="font-semibold text-sm mb-3">Recent Reports</h4>
                    <div className="space-y-2">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                        <Users className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Doctor Visit Report #{item}</p>
                                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm">
                                    Review
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Representative Assignment */}
                <div className="border-t pt-4">
                    <h4 className="font-semibold text-sm mb-3">Representative Assignments</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Pending Approval</span>
                            <span className="font-medium text-amber-600">5 requests</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Active Representatives</span>
                            <span className="font-medium">24 members</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ReportCall;
