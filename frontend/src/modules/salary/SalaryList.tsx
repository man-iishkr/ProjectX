import React, { useState, useEffect } from 'react';
import Table from '../../components/Table';
import { Button } from '../../components/ui/Button';
import { getSalaries, upsertSalary, getSalaryStats, updatePaymentStatus } from '../../api/salary.api';
import { getEmployees } from '../../api/employee.api';
import { FileText, DollarSign, RefreshCw, Info } from 'lucide-react';
import SalarySlip from './SalarySlip';

const SalaryList: React.FC = () => {
    const prevDate = new Date();
    prevDate.setMonth(prevDate.getMonth() - 1);

    const [salaries, setSalaries] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(prevDate.getFullYear());
    const [month, setMonth] = useState(prevDate.getMonth() + 1);
    const [selectedSalary, setSelectedSalary] = useState<any>(null);
    const [isSlipOpen, setIsSlipOpen] = useState(false);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, [year, month]);

    const loadData = async () => {
        setLoading(true);
        // Fetch Employees first as independent source of truth
        try {
            const empRes = await getEmployees();
            if (empRes.success) {
                setEmployees(empRes.data);
            } else {
                console.error('Failed to fetch employees:', empRes);
                // Fallback if structure is different
                if (Array.isArray(empRes)) setEmployees(empRes);
                else setEmployees(empRes.data || []);
            }
        } catch (err) {
            console.error('Error fetching employees:', err);
        }

        // Fetch Salary Data independently
        try {
            const [salaryData, statsData] = await Promise.all([
                getSalaries({ year, month }),
                getSalaryStats({ year, month })
            ]);
            setSalaries(salaryData);
            setStats(statsData);
        } catch (err) {
            console.error('Error fetching salary data:', err);
            // Don't clear employees if salary fetch fails
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async (employeeId: string) => {
        try {
            await upsertSalary({
                employeeId,
                year,
                month,
                workingDays: { total: 30 } // Default, should ideally come from attendance module
            });
            loadData();
            alert('Salary generated successfully!');
        } catch (err: any) {
            console.error(err);
            alert('Failed to generate salary');
        }
    };

    const handleViewSlip = (salary: any) => {
        setSelectedSalary(salary);
        setIsSlipOpen(true);
    };

    const getTableData = () => {
        return employees.map(emp => {
            const salary = salaries.find(s => s.employee._id === emp._id || s.employee === emp._id);
            const ta = salary?.expenses?.ta || 0;
            const hqAllowance = salary?.expenses?.hqAllowance || 0;
            const xStationAllowance = salary?.expenses?.xStationAllowance || 0;
            const offStationAllowance = salary?.expenses?.offStationAllowance || 0;
            const totalOperationalExpenses = ta + hqAllowance + xStationAllowance + offStationAllowance;

            // TA = route distance (km) × Configured Rate. We estimate distance backward for simple view.
            const distanceKm = ta > 0 ? (ta / 10).toFixed(1) : '0';
            return {
                ...emp,
                salaryStatus: salary ? salary.paymentStatus : 'Not Generated',
                salaryId: salary?._id,
                salaryRecord: salary,
                baseSalary: salary?.totalEarnings || '-',
                approvedExpenses: salary?.approvedExpenses || 0,
                travelAllowance: ta,
                totalOperationalExpenses,
                distanceKm,
                netSalary: salary?.netPayable || '-'
            };
        });
    };

    if (loading && !employees.length) return <div className="p-8">Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Salary Management</h1>
                <div className="flex gap-2">
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="h-10 rounded-md border border-slate-300 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {[2024, 2025, 2026, 2027].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    <select
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                        className="h-10 rounded-md border border-slate-300 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Total Payroll</h3>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">₹{stats?.totalPayroll?.toLocaleString() || 0}</div>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Processed</h3>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">{stats?.paymentStatus?.processed || 0} / {employees.length}</div>
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table
                    data={getTableData()}
                    columns={[
                        { header: 'Employee', accessor: 'name' },
                        { header: 'Designation', accessor: 'designation' },
                        { header: 'Base Pay (Earned)', accessor: (row: any) => row.baseSalary !== '-' ? `₹${Number(row.baseSalary).toLocaleString()}` : '-' },
                        { header: 'Apprv. Expenses', accessor: (row: any) => row.approvedExpenses > 0 ? `₹${Number(row.approvedExpenses).toLocaleString()}` : '₹0' },
                        {
                            header: 'Daily Allowances (TA/DA)', accessor: (row: any) => (
                                <div className="flex items-center gap-1">
                                    <span className="font-semibold text-primary">{row.totalOperationalExpenses > 0 ? `₹${Number(row.totalOperationalExpenses).toLocaleString()}` : '₹0'}</span>
                                    {row.totalOperationalExpenses > 0 && (
                                        <span className="relative group">
                                            <Info className="h-3.5 w-3.5 text-blue-500 cursor-help" />
                                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-3 py-2 bg-slate-800 text-white text-xs rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 text-left">
                                                <div>TA: ₹{row.salaryRecord?.expenses?.ta || 0}</div>
                                                <div>HQ: ₹{row.salaryRecord?.expenses?.hqAllowance || 0}</div>
                                                <div>X-Station: ₹{row.salaryRecord?.expenses?.xStationAllowance || 0}</div>
                                                <div>Off-Station: ₹{row.salaryRecord?.expenses?.offStationAllowance || 0}</div>
                                            </span>
                                        </span>
                                    )}
                                </div>
                            )
                        },
                        { header: 'Status', accessor: 'salaryStatus' },
                        { header: 'Net Salary', accessor: (row: any) => row.netSalary !== '-' ? `₹${Number(row.netSalary).toLocaleString()}` : '-' }
                    ]}
                    actions={(row) => (
                        <div className="flex gap-2 items-center">
                            {row.salaryRecord ? (
                                <>
                                    <select
                                        className="h-8 rounded border border-slate-300 text-xs"
                                        value={row.salaryRecord.paymentStatus}
                                        onChange={async (e) => {
                                            try {
                                                await updatePaymentStatus(row.salaryRecord._id, { status: e.target.value });
                                                loadData();
                                            } catch (err) {
                                                alert('Failed to update status');
                                            }
                                        }}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="processed">Processed</option>
                                        <option value="paid">Paid</option>
                                        <option value="hold">Hold</option>
                                    </select>
                                    <Button size="sm" variant="outline" onClick={() => handleViewSlip({ ...row.salaryRecord, employee: row })}>
                                        <FileText className="h-4 w-4" />
                                    </Button>
                                </>
                            ) : (
                                <Button size="sm" onClick={() => handleGenerate(row._id)}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Generate
                                </Button>
                            )}
                        </div>
                    )}
                />
            </div>

            {isSlipOpen && selectedSalary && (
                <SalarySlip
                    isOpen={isSlipOpen}
                    onClose={() => setIsSlipOpen(false)}
                    salary={selectedSalary}
                />
            )}
        </div>
    );
};

export default SalaryList;
