import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { analyticsAPI, type DashboardSummary } from '../../api/analytics.api';
import DashboardCalendar from './DashboardCalendar';
import { Users, TrendingUp, Network } from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
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

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSummary();
    }, []);

    const loadSummary = async () => {
        try {
            const res = await analyticsAPI.getSummary();
            setSummary(res);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Chart Data Preparation
    const hqPerformanceData = {
        labels: summary?.hqPerformance?.map(h => h.name) || [],
        datasets: [
            {
                label: 'Avg Performance Score',
                data: summary?.hqPerformance?.map(h => h.avgScore) || [],
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
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Executive Dashboard</h1>
                <p className="text-slate-500 mt-2">
                    High-level overview of network performance and field statistics.
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {user?.role === 'hq' ? 'Working Professionals' : 'Total Field Force'}
                        </CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary?.counts?.employees || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {user?.role === 'hq' ? 'Under this HQ' : 'Active Employees'}
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {user?.role === 'hq' ? 'Total Doctors' : 'Network Size'}
                        </CardTitle>
                        {user?.role === 'hq' ? (
                            <div className="h-4 w-4 text-green-500">🩺</div>
                        ) : (
                            <Network className="h-4 w-4 text-green-500" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {user?.role === 'hq' ? (summary?.counts?.doctors || 0) : (summary?.counts?.hqs || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {user?.role === 'hq' ? 'Registered Doctors' : 'Operational HQs'}
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Avg Performance</CardTitle>
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary?.periodMetrics?.avgCompletion || 0}%</div>
                        <p className="text-xs text-muted-foreground">Overall completion rate</p>
                    </CardContent>
                </Card>
            </div>

            {/* Middle Row: Charts */}
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

            {/* Bottom Row: Calendar */}
            <div className="grid grid-cols-1">
                <DashboardCalendar />
            </div>
        </div>
    );
};

export default Dashboard;

