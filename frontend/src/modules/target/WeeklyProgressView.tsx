import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMonthlyProgress, useSubmitWeeklyAchievement } from '../../hooks/useWeeklyAchievements';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Bar } from 'react-chartjs-2';
import { Target, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

const getWeekOfMonth = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const pastDaysOfMonth = today.getDate();
    return Math.ceil((pastDaysOfMonth + firstDay.getDay()) / 7);
};

const WeeklyProgressView: React.FC = () => {
    const { user } = useAuth();
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const currentWeek = getWeekOfMonth() > 5 ? 5 : getWeekOfMonth();

    const { data: progressRes, isLoading } = useMonthlyProgress(currentYear, currentMonth);
    const submitMutation = useSubmitWeeklyAchievement();

    const [salesAmount, setSalesAmount] = useState<number | ''>('');
    const [selectedWeek, setSelectedWeek] = useState<number>(currentWeek);

    if (isLoading) return <div className="p-4">Loading target progress...</div>;

    const progress = progressRes?.data;
    const targetValue = progress?.targetValue || 0;
    const isEmployee = user?.role === 'employee';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (salesAmount === '' || salesAmount < 0) return;

        try {
            await submitMutation.mutateAsync({
                year: currentYear,
                month: currentMonth,
                week: selectedWeek,
                salesAchieved: Number(salesAmount)
            });
            setSalesAmount('');
            alert('Weekly achievement submitted successfully!');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to submit achievement');
        }
    };

    const chartData = {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
        datasets: [
            {
                label: 'Sales Achieved',
                data: [
                    progress?.weeklyBreakdown?.[1] || 0,
                    progress?.weeklyBreakdown?.[2] || 0,
                    progress?.weeklyBreakdown?.[3] || 0,
                    progress?.weeklyBreakdown?.[4] || 0,
                    progress?.weeklyBreakdown?.[5] || 0,
                ],
                backgroundColor: 'rgba(59, 130, 246, 0.7)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1,
            }
        ]
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Monthly Target Progress</h2>

            {targetValue === 0 ? (
                <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 p-4 border border-amber-200 dark:border-amber-900/50 rounded flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <span>No target has been assigned for this month yet.</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground flex items-center justify-between">
                                Assigned Target <Target className="h-4 w-4 text-blue-500" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₹{progress.targetValue.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground flex items-center justify-between">
                                Total Achieved <TrendingUp className="h-4 w-4 text-green-500" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">₹{progress.totalAchieved.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground flex items-center justify-between">
                                Remaining <AlertCircle className="h-4 w-4 text-amber-500" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600">₹{progress.remainingTarget.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground flex items-center justify-between">
                                Completion <CheckCircle className="h-4 w-4 text-purple-500" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{progress.completionPercentage}%</div>
                            <div className="w-full bg-muted rounded-full h-2 mt-2">
                                <div
                                    className="bg-purple-500 h-2 rounded-full"
                                    style={{ width: `${Math.min(100, progress.completionPercentage)}%` }}
                                ></div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Weekly Contribution</CardTitle>
                        <CardDescription>Sales achievement broken down by week</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full">
                            <Bar
                                data={chartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: { y: { beginAtZero: true } }
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {isEmployee ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Log Weekly Sales</CardTitle>
                            <CardDescription>Submit your achievement for the current month</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Select Week</label>
                                    <select
                                        className="w-full border p-2 rounded bg-background"
                                        value={selectedWeek}
                                        onChange={(e) => setSelectedWeek(Number(e.target.value))}
                                    >
                                        <option value={1}>Week 1</option>
                                        <option value={2}>Week 2</option>
                                        <option value={3}>Week 3</option>
                                        <option value={4}>Week 4</option>
                                        <option value={5}>Week 5</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Sales Amount (₹)</label>
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
                                    disabled={submitMutation.isPending || targetValue === 0}
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground p-2 rounded disabled:opacity-50 transition-colors"
                                >
                                    {submitMutation.isPending ? 'Submitting...' : 'Submit Achievement'}
                                </button>
                                {targetValue === 0 && (
                                    <p className="text-xs text-amber-600 mt-2 text-center">Cannot submit without an assigned target.</p>
                                )}
                            </form>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Employee Breakdown</CardTitle>
                            <CardDescription>Detailed contribution by team member</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                                {progress?.employeeBreakdown?.length > 0 ? (
                                    <table className="w-full text-sm text-left whitespace-nowrap">
                                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-2">Employee</th>
                                                <th className="px-4 py-2 text-right">W1</th>
                                                <th className="px-4 py-2 text-right">W2</th>
                                                <th className="px-4 py-2 text-right">W3</th>
                                                <th className="px-4 py-2 text-right">W4</th>
                                                <th className="px-4 py-2 text-right">W5</th>
                                                <th className="px-4 py-2 text-right font-bold text-foreground">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {progress.employeeBreakdown.map((emp: any) => (
                                                <tr key={emp.id} className="border-b border-border/50 hover:bg-muted/30">
                                                    <td className="px-4 py-2 font-medium">{emp.name}</td>
                                                    <td className="px-4 py-2 text-right">₹{emp.weeks[1].toLocaleString()}</td>
                                                    <td className="px-4 py-2 text-right">₹{emp.weeks[2].toLocaleString()}</td>
                                                    <td className="px-4 py-2 text-right">₹{emp.weeks[3].toLocaleString()}</td>
                                                    <td className="px-4 py-2 text-right">₹{emp.weeks[4].toLocaleString()}</td>
                                                    <td className="px-4 py-2 text-right">₹{emp.weeks[5].toLocaleString()}</td>
                                                    <td className="px-4 py-2 text-right text-green-600 font-bold">
                                                        ₹{emp.total.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No entries submitted yet.
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

export default WeeklyProgressView;
