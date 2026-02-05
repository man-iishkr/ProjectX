import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { analyticsAPI, type Analytics as AnalyticsType } from '../../api/analytics.api';
import { TrendingUp, Target, Users, Calendar } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const Analytics: React.FC = () => {
    const [analytics, setAnalytics] = useState<AnalyticsType | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;

            const data = await analyticsAPI.getAll({ year, month });
            if (data.length > 0) {
                setAnalytics(data[0]);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="py-8 text-center">
                    <div className="text-muted-foreground">Loading analytics...</div>
                </CardContent>
            </Card>
        );
    }

    if (!analytics) {
        return (
            <Card>
                <CardContent className="py-8 text-center">
                    <div className="text-muted-foreground">No analytics data available</div>
                </CardContent>
            </Card>
        );
    }

    // Set vs Achieved Chart Data
    const targetChartData = {
        labels: ['Doctor Visits', 'Chemist Visits', 'Call Reports', 'Sales'],
        datasets: [
            {
                label: 'Target',
                data: [
                    analytics.targets.doctorVisits.target,
                    analytics.targets.chemistVisits.target,
                    analytics.targets.callReports.target,
                    analytics.targets.sales.target
                ],
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1
            },
            {
                label: 'Achieved',
                data: [
                    analytics.targets.doctorVisits.achieved,
                    analytics.targets.chemistVisits.achieved,
                    analytics.targets.callReports.achieved,
                    analytics.targets.sales.achieved
                ],
                backgroundColor: 'rgba(34, 197, 94, 0.5)',
                borderColor: 'rgb(34, 197, 94)',
                borderWidth: 1
            }
        ]
    };

    // Calculate completion percentages
    const calculateCompletion = (target: number, achieved: number) => {
        return target > 0 ? ((achieved / target) * 100).toFixed(1) : '0';
    };

    const doctorCompletion = calculateCompletion(
        analytics.targets.doctorVisits.target,
        analytics.targets.doctorVisits.achieved
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Current Month Analytics</CardTitle>
                <CardDescription>
                    Performance tracking for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-slate-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <Target className="h-3 w-3" />
                            <span>Completion</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">{analytics.completionPercentage}%</div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <Users className="h-3 w-3" />
                            <span>Total Visits</span>
                        </div>
                        <div className="text-2xl font-bold">{analytics.visitFrequency.totalVisits}</div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <Calendar className="h-3 w-3" />
                            <span>Avg/Day</span>
                        </div>
                        <div className="text-2xl font-bold">{analytics.visitFrequency.averageVisitsPerDay}</div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <TrendingUp className="h-3 w-3" />
                            <span>Peak Day</span>
                        </div>
                        <div className="text-sm font-bold">{analytics.visitFrequency.peakVisitDay || 'N/A'}</div>
                    </div>
                </div>

                {/* Target vs Achieved Chart */}
                <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Set vs Achieved</h4>
                    <Bar
                        data={targetChartData}
                        options={{
                            responsive: true,
                            plugins: {
                                legend: {
                                    position: 'top' as const,
                                },
                            },
                            scales: {
                                y: {
                                    beginAtZero: true
                                }
                            }
                        }}
                    />
                </div>

                {/* Visit Breakdown */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                        <h4 className="font-semibold text-sm mb-3">Doctor Visits</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Target:</span>
                                <span className="font-medium">{analytics.targets.doctorVisits.target}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Achieved:</span>
                                <span className="font-medium text-green-600">{analytics.targets.doctorVisits.achieved}</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                                <div
                                    className="bg-green-500 h-2 rounded-full"
                                    style={{ width: `${Math.min(parseFloat(doctorCompletion), 100)}%` }}
                                ></div>
                            </div>
                            <div className="text-xs text-center text-muted-foreground">{doctorCompletion}% Complete</div>
                        </div>
                    </div>

                    <div className="border rounded-lg p-4">
                        <h4 className="font-semibold text-sm mb-3">Visit Frequency</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Unique Doctors:</span>
                                <span className="font-medium">{analytics.visitFrequency.uniqueDoctors}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Unique Chemists:</span>
                                <span className="font-medium">{analytics.visitFrequency.uniqueChemists}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Visits:</span>
                                <span className="font-medium">{analytics.visitFrequency.totalVisits}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default Analytics;
