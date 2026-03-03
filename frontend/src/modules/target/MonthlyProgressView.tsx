import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFinancialYearProgress, useSubmitMonthlyAchievement } from '../../hooks/useMonthlyAchievements';
import { useHQs } from '../../hooks/useHQs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Line, Bar } from 'react-chartjs-2';
import { Target, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

const MonthlyProgressView: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const isEmployee = user?.role === 'employee';

    const currentDate = new Date();
    const currentMonthNum = currentDate.getMonth() + 1;
    const currentYearNum = currentDate.getFullYear();
    const initialStartYear = currentMonthNum >= 4 ? currentYearNum : currentYearNum - 1;

    const [startYear, setStartYear] = useState<number>(initialStartYear);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [selectedHqId, setSelectedHqId] = useState<string>('');

    // Selection state for form
    const [formMonth, setFormMonth] = useState<number>(currentMonthNum);
    const [formYear, setFormYear] = useState<number>(currentYearNum);
    const [salesAmount, setSalesAmount] = useState<number | ''>('');

    const { data: hqsRes } = useHQs();
    const { data: progressRes, isLoading, refetch } = useFinancialYearProgress(startYear, selectedHqId || undefined, selectedEmployeeId || undefined);
    const submitMutation = useSubmitMonthlyAchievement();

    const progress = progressRes?.data;
    const targetValue = progress?.totalYearlyTarget || 0;

    const handleEmployeeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedEmployeeId(e.target.value);
    };

    const handleHqFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedHqId(e.target.value);
        setSelectedEmployeeId(''); // reset employee filter when HQ changes
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setStartYear(Number(e.target.value));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (salesAmount === '' || salesAmount < 0) return;

        try {
            await submitMutation.mutateAsync({
                year: formYear,
                month: formMonth,
                salesAchieved: Number(salesAmount)
            });
            setSalesAmount('');
            alert('Monthly achievement submitted successfully!');
            refetch();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to submit achievement');
        }
    };

    if (isLoading) return <div className="p-4">Loading financial year progress...</div>;

    const lineChartData = {
        labels: progress?.chartData?.labels || [],
        datasets: [
            {
                label: 'Monthly Achievement',
                data: progress?.chartData?.achievements || [],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                tension: 0.3,
            }
        ]
    };

    // If Admin/HQ, also add the target line or plot
    const targetVsAchieveData = {
        labels: progress?.chartData?.labels || [],
        datasets: [
            {
                label: 'Achievement',
                data: progress?.chartData?.achievements || [],
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.5)',
                tension: 0.3,
            },
            {
                label: 'Target',
                data: progress?.chartData?.targets || [],
                borderColor: 'rgb(156, 163, 175)',
                backgroundColor: 'rgba(209, 213, 219, 0.5)',
                borderDash: [5, 5],
                tension: 0.3,
            }
        ]
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold">Current Month Target Progress</h2>

                <div className="flex flex-wrap gap-4">
                    {isAdmin && (
                        <select
                            className="border p-2 rounded bg-background"
                            value={selectedHqId}
                            onChange={handleHqFilterChange}
                        >
                            <option value="">All HQs (Total Aggregate)</option>
                            {hqsRes?.map((hq: any) => (
                                <option key={hq._id} value={hq._id}>{hq.name}</option>
                            ))}
                        </select>
                    )}
                    {!isEmployee && (
                        <select
                            className="border p-2 rounded bg-background"
                            value={selectedEmployeeId}
                            onChange={handleEmployeeFilterChange}
                            disabled={isAdmin && !selectedHqId && progress?.employeeBreakdown?.length === 0}
                        >
                            <option value="">All Employees (Aggregate)</option>
                            {progress?.employeeBreakdown?.map((emp: any) => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                        </select>
                    )}
                    <select
                        className="border p-2 rounded bg-background font-medium"
                        value={startYear}
                        onChange={handleYearChange}
                    >
                        <option value={initialStartYear - 1}>FY {initialStartYear - 1}-{initialStartYear}</option>
                        <option value={initialStartYear}>FY {initialStartYear}-{initialStartYear + 1}</option>
                        <option value={initialStartYear + 1}>FY {initialStartYear + 1}-{initialStartYear + 2}</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground flex items-center justify-between">
                            Current Month Target <Target className="h-4 w-4 text-blue-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{progress?.currentMonthTarget?.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground flex items-center justify-between">
                            Current Month Achieved <TrendingUp className="h-4 w-4 text-green-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">₹{progress?.currentMonthAchieved?.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground flex items-center justify-between">
                            Remaining <AlertCircle className="h-4 w-4 text-amber-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">₹{Math.max(0, (progress?.currentMonthTarget || 0) - (progress?.currentMonthAchieved || 0)).toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground flex items-center justify-between">
                            Completion <CheckCircle className="h-4 w-4 text-purple-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{progress?.currentMonthCompletion || 0}%</div>
                        <div className="w-full bg-muted rounded-full h-2 mt-2">
                            <div
                                className="bg-purple-500 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(100, progress?.currentMonthCompletion || 0)}%` }}
                            ></div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* For Employee: Show Line Graph. For Admin: Show Bar Chart of Target vs Achievement */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>{isEmployee ? 'Monthly Achievement Trend' : 'Target vs Achievement'}</CardTitle>
                        <CardDescription>Performance across Financial Year {progress?.financialYear}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full">
                            {isEmployee ? (
                                <Line
                                    data={lineChartData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { display: true } },
                                        scales: { y: { beginAtZero: true } }
                                    }}
                                />
                            ) : (
                                <Line
                                    data={targetVsAchieveData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { display: true, position: 'top' } },
                                        scales: { y: { beginAtZero: true } }
                                    }}
                                />
                            )}
                        </div>
                    </CardContent>
                </Card>

                {isEmployee ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Log Monthly Sales</CardTitle>
                            <CardDescription>Submit your achievement</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Month</label>
                                        <select
                                            className="w-full border p-2 rounded bg-background"
                                            value={formMonth}
                                            onChange={(e) => setFormMonth(Number(e.target.value))}
                                        >
                                            <option value={4}>April</option>
                                            <option value={5}>May</option>
                                            <option value={6}>June</option>
                                            <option value={7}>July</option>
                                            <option value={8}>August</option>
                                            <option value={9}>September</option>
                                            <option value={10}>October</option>
                                            <option value={11}>November</option>
                                            <option value={12}>December</option>
                                            <option value={1}>January</option>
                                            <option value={2}>February</option>
                                            <option value={3}>March</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Year</label>
                                        <select
                                            className="w-full border p-2 rounded bg-background"
                                            value={formYear}
                                            onChange={(e) => setFormYear(Number(e.target.value))}
                                        >
                                            <option value={startYear}>{startYear}</option>
                                            <option value={startYear + 1}>{startYear + 1}</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Monthly Sales Amount (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        className="w-full border p-2 rounded bg-background"
                                        placeholder="e.g. 50000"
                                        value={salesAmount}
                                        onChange={(e) => setSalesAmount(Number(e.target.value))}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitMutation.isPending}
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground p-2 rounded disabled:opacity-50 transition-colors"
                                >
                                    {submitMutation.isPending ? 'Submitting...' : 'Submit Achievement'}
                                </button>
                            </form>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Employee Breakdown</CardTitle>
                            <CardDescription>Total contribution for FY {progress?.financialYear}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto max-h-[250px] overflow-y-auto">
                                {progress?.employeeBreakdown?.length > 0 ? (
                                    <table className="w-full text-sm text-left whitespace-nowrap">
                                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0 bg-background">
                                            <tr>
                                                <th className="px-4 py-2">Employee</th>
                                                <th className="px-4 py-2 text-right">Total Contributed</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {progress.employeeBreakdown.map((emp: any) => (
                                                <tr key={emp.id} className="border-b border-border/50 hover:bg-muted/50">
                                                    <td className="px-4 py-2 font-medium">{emp.name}</td>
                                                    <td className="px-4 py-2 text-right text-green-600 font-semibold">
                                                        ₹{emp.total.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No performance data found for this period.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default MonthlyProgressView;
