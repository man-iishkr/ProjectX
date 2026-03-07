import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { analyticsAPI, type DashboardSummary } from '../../api/analytics.api';
import { Users, Building2, TrendingUp, Target } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { getHQs } from '../../api/hq.api';
import { getEmployees } from '../../api/employee.api';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend
);

interface FrequencyData {
    employeeId: string;
    employeeName: string;
    once: number;
    twice: number;
    thricePlus: number;
    totalDoctors: number;
    totalVisits: number;
}

const Analytics: React.FC = () => {
    const { user } = useAuth();
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [hqs, setHQs] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [selectedHQ, setSelectedHQ] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedEmployee, setSelectedEmployee] = useState('');

    // Call Frequency Data
    const [frequencyData, setFrequencyData] = useState<FrequencyData[]>([]);
    const [freqLoading, setFreqLoading] = useState(false);

    // Employee Trend Data
    const [trendData, setTrendData] = useState<any>(null);
    const [trendLoading, setTrendLoading] = useState(false);

    useEffect(() => {
        if (user) {
            if (user.role === 'hq') {
                setSelectedHQ(user.hq?._id || user.hq || '');
            } else if (user.role === 'bde') {
                setSelectedHQ(user.hq?._id || user.hq || '');
                setSelectedEmployee(user._id);
            }
        }
    }, [user]);

    useEffect(() => {
        if (user?.role === 'admin') {
            loadHQs();
        }
    }, [user]);

    useEffect(() => {
        loadData();
        loadFrequencyData();
    }, [selectedHQ, selectedMonth, selectedYear]);

    useEffect(() => {
        if (selectedHQ) {
            loadEmployeesForHQ();
        } else {
            setEmployees([]);
            setSelectedEmployee('');
        }
    }, [selectedHQ]);

    useEffect(() => {
        if (selectedEmployee) {
            loadEmployeeTrend();
            // Also filter frequency to just this employee
            loadFrequencyData();
        } else {
            setTrendData(null);
            loadFrequencyData();
        }
    }, [selectedEmployee]);

    const loadHQs = async () => {
        try {
            const res = await getHQs();
            if (res.success) setHQs(res.data);
        } catch (err) { console.error(err); }
    };

    const loadEmployeesForHQ = async () => {
        if (user?.role === 'bde') {
            setEmployees([user]);
            return;
        }

        try {
            // Only fetch if HQ is selected or if user is admin/hq
            // If admin selects "All HQs", maybe we shouldn't fetch all employees? 
            // The UI logic: "All Employees" option appears only if selectedHQ is truthy.
            // So we are safe here as long as selectedHQ is set.

            const res = await getEmployees();
            if (res.success) {
                const filtered = selectedHQ
                    ? res.data.filter((e: any) => e.hq === selectedHQ || e.hq?._id === selectedHQ)
                    : res.data;
                setEmployees(filtered);
            }
        } catch (err) { console.error(err); }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await analyticsAPI.getSummary({
                year: selectedYear,
                month: selectedMonth,
                hqId: selectedHQ || undefined,
                employeeId: selectedEmployee || undefined
            });
            setSummary(data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadFrequencyData = async () => {
        try {
            setFreqLoading(true);
            const res = await analyticsAPI.getCallFrequency({
                year: selectedYear,
                month: selectedMonth,
                hqId: selectedHQ || undefined,
                employeeId: selectedEmployee || undefined
            });
            if (res.success) {
                setFrequencyData(res.data);
            }
        } catch (error) {
            console.error('Error fetching frequency:', error);
        } finally {
            setFreqLoading(false);
        }
    };

    const loadEmployeeTrend = async () => {
        if (!selectedEmployee) return;
        try {
            setTrendLoading(true);
            const res = await analyticsAPI.getEmployeeTrend(selectedEmployee);
            if (res.success) {
                setTrendData(res.data);
            }
        } catch (error) {
            console.error('Error fetching trend:', error);
        } finally {
            setTrendLoading(false);
        }
    };

    // Stacked Bar Chart Data for Frequency
    const frequencyChartData = {
        labels: frequencyData.map(d => d.employeeName),
        datasets: [
            {
                label: 'Visited Once',
                data: frequencyData.map(d => d.once),
                backgroundColor: 'rgba(139, 92, 246, 0.7)', // Violet 500
                borderColor: 'rgb(139, 92, 246)',
                borderWidth: 1
            },
            {
                label: 'Visited Twice',
                data: frequencyData.map(d => d.twice),
                backgroundColor: 'rgba(245, 158, 11, 0.7)', // Amber 500
                borderColor: 'rgb(245, 158, 11)',
                borderWidth: 1
            },
            {
                label: 'Visited 3+ Times',
                data: frequencyData.map(d => d.thricePlus),
                backgroundColor: 'rgba(16, 185, 129, 0.7)', // Emerald 500
                borderColor: 'rgb(16, 185, 129)',
                borderWidth: 1
            }
        ]
    };

    const frequencyChartOptions = {
        responsive: true,
        plugins: {
            title: {
                display: true,
                text: selectedEmployee
                    ? 'Doctor Visit Frequency'
                    : 'Employee-wise Doctor Visit Frequency (Stacked)',
                font: { size: 14 }
            },
            legend: { position: 'top' as const },
            tooltip: {
                callbacks: {
                    afterBody: (context: any) => {
                        const idx = context[0]?.dataIndex;
                        if (idx !== undefined && frequencyData[idx]) {
                            const d = frequencyData[idx];
                            return `Total Doctors: ${d.totalDoctors}\nTotal Visits: ${d.totalVisits}`;
                        }
                        return '';
                    }
                }
            }
        },
        scales: {
            x: { stacked: true },
            y: {
                stacked: true,
                beginAtZero: true,
                title: { display: true, text: 'Number of Doctors' }
            }
        }
    };

    // Trend Line Chart Data
    const trendChartData = trendData ? {
        labels: trendData.trend.map((t: any) => t.month),
        datasets: [{
            label: 'Total Visits',
            data: trendData.trend.map((t: any) => t.visits),
            borderColor: 'rgb(99, 102, 241)',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 6,
            pointBackgroundColor: 'rgb(99, 102, 241)'
        }]
    } : null;

    if (loading) return <div className="p-8 text-center">Loading Analytics...</div>;
    if (!summary) return <div className="p-8 text-center">No data available</div>;

    return (
        <div className="space-y-6">
            {/* Header + Filters */}
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics Dashboard</h1>
                <div className="flex flex-wrap gap-2">
                    <select
                        className="border rounded px-3 py-2 text-sm bg-background dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 disabled:opacity-50"
                        value={selectedHQ}
                        onChange={(e) => { setSelectedHQ(e.target.value); setSelectedEmployee(''); }}
                        disabled={user?.role === 'hq' || user?.role === 'bde'}
                    >
                        <option value="">All HQs</option>
                        {hqs.map(hq => <option key={hq._id} value={hq._id}>{hq.name}</option>)}
                    </select>

                    {selectedHQ && (
                        <select
                            className="border rounded px-3 py-2 text-sm bg-background dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 disabled:opacity-50"
                            value={selectedEmployee}
                            onChange={(e) => setSelectedEmployee(e.target.value)}
                            disabled={user?.role === 'bde'}
                        >
                            <option value="">All Employees</option>
                            {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
                        </select>
                    )}

                    <select
                        className="border rounded px-3 py-2 text-sm bg-background dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                        ))}
                    </select>

                    <select
                        className="border rounded px-3 py-2 text-sm bg-background dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
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
                        <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.counts.doctors}</div>
                        <p className="text-xs text-muted-foreground">In network</p>
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
                        <CardTitle className="text-sm font-medium">Network Size</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.counts.hqs} HQs / {summary.counts.stockists} Stockists</div>
                        <p className="text-xs text-muted-foreground">Distribution network</p>
                    </CardContent>
                </Card>
            </div>

            {/* ===== STACKED BAR CHART: Call Frequency ===== */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        {selectedEmployee
                            ? `Visit Frequency for ${employees.find(e => e._id === selectedEmployee)?.name || 'Employee'}`
                            : 'Employee Call Frequency Analysis'}
                    </CardTitle>
                    <CardDescription>
                        Doctors visited once, twice, or three+ times this month
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {freqLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading chart...</div>
                    ) : frequencyData.length > 0 ? (
                        <div style={{ minHeight: '350px' }}>
                            <Bar data={frequencyChartData} options={frequencyChartOptions} />
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            No call report data for this period
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ===== EMPLOYEE TREND: Last 3 Months ===== */}
            {selectedEmployee && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Trend Line Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Performance Trend (Last 3 Months)</CardTitle>
                            <CardDescription>Total visit frequency over time</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {trendLoading ? (
                                <div className="text-center py-8">Loading...</div>
                            ) : trendChartData ? (
                                <Line
                                    data={trendChartData}
                                    options={{
                                        responsive: true,
                                        plugins: { legend: { display: false } },
                                        scales: {
                                            y: { beginAtZero: true, title: { display: true, text: 'Visits' } }
                                        }
                                    }}
                                />
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">No trend data</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Doctor Breakdown Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Doctor-wise Visits (This Month)</CardTitle>
                            <CardDescription>All doctors visited by this employee</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {trendData?.doctorBreakdown?.length > 0 ? (
                                <div className="overflow-y-auto max-h-72">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-2 font-medium">Doctor</th>
                                                <th className="text-right py-2 font-medium">Visits</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {trendData.doctorBreakdown.map((doc: any, i: number) => (
                                                <tr key={i} className="border-b last:border-0">
                                                    <td className="py-2">{doc.name}</td>
                                                    <td className="py-2 text-right">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${doc.visits >= 3 ? 'bg-green-100 text-green-800' :
                                                            doc.visits >= 2 ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-blue-100 text-blue-800'
                                                            }`}>
                                                            {doc.visits}x
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">No visits recorded</div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ===== TOP PERFORMERS (from existing summary) ===== */}
            {!selectedEmployee && (
                <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Top Performers Overview</CardTitle>
                            <CardDescription>Visits vs Performance Score</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Bar
                                data={{
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
                                }}
                                options={{
                                    responsive: true,
                                    plugins: { legend: { position: 'top' as const } }
                                }}
                            />
                        </CardContent>
                    </Card>

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
            )}
        </div>
    );
};

export default Analytics;
