import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { analyticsAPI, type DashboardSummary } from '../../api/analytics.api';
import { Users, Truck, Building2, TrendingUp, Calendar, Target } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { getHQs } from '../../api/hq.api';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const Analytics: React.FC = () => {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [hqs, setHQs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [selectedHQ, setSelectedHQ] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        loadData();
    }, [selectedHQ, selectedMonth, selectedYear]);

    useEffect(() => {
        loadHQs();
    }, []);

    const loadHQs = async () => {
        try {
            const res = await getHQs();
            if (res.success) setHQs(res.data);
        } catch (err) { console.error(err); }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await analyticsAPI.getSummary({
                year: selectedYear,
                month: selectedMonth,
                hqId: selectedHQ || undefined
            });
            setSummary(data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading Analytics...</div>;
    if (!summary) return <div>No data available</div>;

    // Performance Chart Data
    const chartData = {
        labels: summary.topPerformers.map(p => p.name),
        datasets: [
            {
                label: 'Visits',
                data: summary.topPerformers.map(p => p.visits),
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1
            },
            {
                label: 'Performance Score',
                data: summary.topPerformers.map(p => p.score),
                backgroundColor: 'rgba(34, 197, 94, 0.5)',
                borderColor: 'rgb(34, 197, 94)',
                borderWidth: 1
            }
        ]
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
                <div className="flex gap-2">
                    <select
                        className="border rounded px-3 py-2 text-sm bg-white"
                        value={selectedHQ}
                        onChange={(e) => setSelectedHQ(e.target.value)}
                    >
                        <option value="">All HQs</option>
                        {hqs.map(hq => <option key={hq._id} value={hq._id}>{hq.name}</option>)}
                    </select>

                    <select
                        className="border rounded px-3 py-2 text-sm bg-white"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                        ))}
                    </select>

                    <select
                        className="border rounded px-3 py-2 text-sm bg-white"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                    >
                        <option value={2025}>2025</option>
                        <option value={2026}>2026</option>
                    </select>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.counts.employees}</div>
                        <p className="text-xs text-muted-foreground">Active field force</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.periodMetrics.totalVisits}</div>
                        <p className="text-xs text-muted-foreground">In selected period</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.periodMetrics.avgCompletion}%</div>
                        <p className="text-xs text-muted-foreground">Based on reported metrics</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Network Size</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.counts.hqs} HQs / {summary.counts.stockists} Stockists</div>
                        <p className="text-xs text-muted-foreground">Distribution network</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                {/* Chart Section */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Top Performers Overview</CardTitle>
                        <CardDescription>Visits vs Performance Score</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Bar
                            data={chartData}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: { position: 'top' as const },
                                }
                            }}
                        />
                    </CardContent>
                </Card>

                {/* Top Performers List */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Top 5 Employees</CardTitle>
                        <CardDescription>Based on total visits</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {summary.topPerformers.map((performer, index) => (
                                <div key={performer.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-white ${index < 3 ? 'bg-yellow-500' : 'bg-slate-500'}`}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium leading-none">{performer.name}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{performer.visits} Visits</p>
                                        </div>
                                    </div>
                                    <div className="font-bold text-green-600">
                                        {performer.score}
                                    </div>
                                </div>
                            ))}
                            {summary.topPerformers.length === 0 && <p className="text-muted-foreground text-center py-4">No data available for this period</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Analytics;
