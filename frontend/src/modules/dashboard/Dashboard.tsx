import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { analyticsAPI, type DashboardSummary } from '../../api/analytics.api';
import DashboardCalendar from './DashboardCalendar';
import { Users, TrendingUp, Network } from 'lucide-react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);

    // Employee specific state
    const [trendData, setTrendData] = useState<any>(null);

    const isEmployee = user?.role === 'employee';

    const loadSummary = async () => {
        try {
            const params: any = {};
            if (user?.role === 'employee') {
                params.employeeId = user._id;
            } else if (user?.role === 'hq') {
                params.hqId = user.hq?._id || user.hq;
            }

            const res = await analyticsAPI.getSummary(params);
            setSummary(res);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadEmployeeStats = async () => {
        if (!user?._id) return;
        try {
            const trendRes = await analyticsAPI.getEmployeeTrend(user._id);

            if (trendRes.success && trendRes.data) {
                const trend = trendRes.data;
                setTrendData({
                    months: trend.trend.map((t: any) => t.month),
                    visits: trend.trend.map((t: any) => t.visits),
                    doctorBreakdown: trend.doctorBreakdown || []
                });
            }
        } catch (e) {
            console.error('Failed to load employee stats', e);
        }
    };

    useEffect(() => {
        if (user) {
            loadSummary();
            if (user.role === 'employee') {
                loadEmployeeStats();
            }
        }
    }, [user]);

    // Chart Data Preparation for HQ/Admin
    const hqPerformanceData = {
        labels: summary?.hqPerformance?.map(h => h.name) || [],
        datasets: [
            {
                label: 'Avg Visits per Employee',
                data: summary?.hqPerformance?.map(h => h.avgVisits) || [],
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1
            }
        ]
    };

    const hqDistributionData = {
        labels: summary?.hqDistribution?.map(h => h.name) || [],
        datasets: [
            {
                data: summary?.hqDistribution?.map(h => h.count) || [],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(153, 102, 255, 0.5)',
                    'rgba(255, 159, 64, 0.5)',
                ],
                borderWidth: 1,
            },
        ],
    };

    if (loading) return <div className="p-8">Loading dashboard...</div>;



    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    {isEmployee ? `Welcome, ${user?.name}` : 'Executive Dashboard'}
                </h1>
                <p className="text-muted-foreground mt-2">
                    {isEmployee
                        ? 'Here is your performance overview for this month.'
                        : 'High-level overview of network performance and field statistics.'}
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {isEmployee ? 'My Visits' : (user?.role === 'hq' ? 'Working Professionals' : 'Total Field Force')}
                        </CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isEmployee ? (summary?.periodMetrics?.totalVisits || 0) : (summary?.counts?.employees || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {isEmployee ? 'Visits this month' : (user?.role === 'hq' ? 'Under this HQ' : 'Active Employees')}
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {isEmployee ? 'My Doctors' : (user?.role === 'hq' ? 'Total Doctors' : 'Network Size')}
                        </CardTitle>
                        {user?.role === 'hq' || isEmployee ? (
                            <div className="h-4 w-4 text-green-500">🩺</div>
                        ) : (
                            <Network className="h-4 w-4 text-green-500" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isEmployee ? (summary?.counts?.doctors || 0) : (user?.role === 'hq' ? (summary?.counts?.doctors || 0) : (summary?.counts?.hqs || 0))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {isEmployee ? 'Assigned/Visited' : (user?.role === 'hq' ? 'Registered Doctors' : 'Operational HQs')}
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {isEmployee ? 'My Avg Score' : 'Avg Performance'}
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary?.periodMetrics?.avgCompletion || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {isEmployee ? 'Based on reporting quality' : 'Overall completion rate'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Middle Row: Charts */}
            {!isEmployee && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* HQ Performance (Span 3) */}
                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>Headquarters Performance</CardTitle>
                            <CardDescription>Average employee performance score by HQ</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] flex items-center justify-center">
                                {summary?.hqPerformance?.length ? (
                                    <Bar
                                        data={hqPerformanceData}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: { legend: { display: false } }
                                        }}
                                    />
                                ) : (
                                    <p className="text-muted-foreground">No performance data available.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* HQ Distribution (Span 2) */}
                    <Card className="col-span-2">
                        <CardHeader>
                            <CardTitle>Staff Distribution</CardTitle>
                            <CardDescription>Employees per HQ</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] flex items-center justify-center">
                                {summary?.hqDistribution?.length ? (
                                    <Doughnut
                                        data={hqDistributionData}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: { legend: { position: 'right' } }
                                        }}
                                    />
                                ) : (
                                    <p className="text-muted-foreground">No distribution data available.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Employee Specific Charts */}
            {isEmployee && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Performance Trend</CardTitle>
                            <CardDescription>Visits over last 3 months</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] flex items-center justify-center">
                                {trendData ? (
                                    <Line
                                        data={{
                                            labels: trendData.months,
                                            datasets: [{
                                                label: 'Visits',
                                                data: trendData.visits,
                                                borderColor: 'rgb(75, 192, 192)',
                                                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                                                tension: 0.3,
                                                pointBackgroundColor: 'rgb(75, 192, 192)',
                                            }]
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: { legend: { display: true } }
                                        }}
                                    />
                                ) : <div className="text-muted-foreground">Loading trend data...</div>}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Visit Frequency</CardTitle>
                            <CardDescription>Doctors visited by frequency</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] flex items-center justify-center">
                                {trendData?.doctorBreakdown?.length ? (
                                    <Bar
                                        data={{
                                            labels: trendData.doctorBreakdown.map((d: any) => d.name),
                                            datasets: [
                                                {
                                                    label: 'Total Visits',
                                                    data: trendData.doctorBreakdown.map((d: any) => d.visits),
                                                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                                                    borderColor: 'rgb(54, 162, 235)',
                                                    borderWidth: 1
                                                }
                                            ]
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: { display: false },
                                                tooltip: {
                                                    callbacks: {
                                                        label: (context) => `Visits: ${context.raw}`
                                                    }
                                                }
                                            },
                                            scales: {
                                                y: { beginAtZero: true, ticks: { precision: 0 } }
                                            }
                                        }}
                                    />
                                ) : <div className="text-muted-foreground">No visit data available</div>}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Bottom Row: Calendar */}
            <div className="grid grid-cols-1">
                <DashboardCalendar />
            </div>
        </div>
    );
};

export default Dashboard;

