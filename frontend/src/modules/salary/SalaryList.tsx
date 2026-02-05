import React, { useState, useEffect } from 'react';
import Table from '../../components/Table';
import { Button } from '../../components/ui/Button';
import { getSalaries, upsertSalary, getSalaryStats } from '../../api/salary.api';
import { getEmployees } from '../../api/employee.api';
import { FileText, DollarSign, RefreshCw } from 'lucide-react';
import SalarySlip from './SalarySlip';

const SalaryList: React.FC = () => {
    const [salaries, setSalaries] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
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

    // Helper to merge employee list with salary status
    const getTableData = () => {
        return employees.map(emp => {
            const salary = salaries.find(s => s.employee._id === emp._id || s.employee === emp._id);
            return {
                ...emp,
                salaryStatus: salary ? salary.paymentStatus : 'Not Generated',
                salaryId: salary?._id,
                salaryRecord: salary,
                netSalary: salary?.netSalary || '-'
            };
        });
    };

    if (loading && !employees.length) return <div className="p-8">Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Salary Management</h1>
                <div className="flex gap-2">
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {[2024, 2025, 2026, 2027].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    <select
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                        className="h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-xl border bg-white text-slate-900 shadow p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-slate-500">Total Payroll</h3>
                        <DollarSign className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="text-2xl font-bold">₹{stats?.totalPayroll?.toLocaleString() || 0}</div>
                </div>
                <div className="rounded-xl border bg-white text-slate-900 shadow p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-slate-500">Processed</h3>
                        <FileText className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="text-2xl font-bold">{stats?.paymentStatus?.processed || 0} / {employees.length}</div>
                </div>
            </div>

            <div className="rounded-md border bg-white">
                <Table
                    data={getTableData()}
                    columns={[
                        { header: 'Employee', accessor: 'name' },
                        { header: 'Designation', accessor: 'designation' },
                        { header: 'Status', accessor: 'salaryStatus' },
                        { header: 'Net Salary', accessor: 'netSalary' }
                    ]}
                    actions={(row) => (
                        <div className="flex gap-2">
                            {row.salaryRecord ? (
                                <Button size="sm" variant="outline" onClick={() => handleViewSlip(row.salaryRecord)}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    View Slip
                                </Button>
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
