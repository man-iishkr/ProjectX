import React, { useEffect, useState } from 'react';
import { callReportAPI } from '../../api/callReport.api';
import { getEmployees } from '../../api/employee.api';
import { getHQs } from '../../api/hq.api';
import Table from '../../components/Table';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Calendar, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const CallReportList: React.FC = () => {
    const { user } = useAuth();
    const [reports, setReports] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [hqs, setHQs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filters, setFilters] = useState({
        employeeId: '',
        hqId: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        loadInitialData();
        loadReports();
    }, []);

    const loadInitialData = async () => {
        try {
            if (user?.role === 'admin') {
                const hqRes = await getHQs();
                if (hqRes.success) setHQs(hqRes.data);

                const empRes = await getEmployees();
                if (empRes.success) setEmployees(empRes.data);
            } else if (user?.role === 'hq') {
                const empRes = await getEmployees(); // Should filter by HQ automatically in backend or we filter here
                if (empRes.success) setEmployees(empRes.data);
            }
        } catch (err) { console.error(err); }
    };

    const loadReports = async () => {
        try {
            setLoading(true);
            const res = await callReportAPI.getAll(filters);
            if (res.success) {
                setReports(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadReports();
    };

    const columns = [
        {
            header: 'Doctor',
            accessor: (row: any) => (
                <div>
                    <div className="font-medium">{row.doctor?.name}</div>
                    <div className="text-xs text-muted-foreground">{row.doctor?.address}</div>
                </div>
            )
        },
        {
            header: 'Employee',
            accessor: (row: any) => row.employee?.name || 'Unknown'
        },
        {
            header: 'Date & Time',
            accessor: (row: any) => new Date(row.createdAt).toLocaleString()
        },
        {
            header: 'Stats',
            accessor: (row: any) => (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Visit #{row.stats?.visitFrequency || 1}
                </span>
            )
        },
        {
            header: 'Status',
            accessor: (row: any) => (
                <div className="flex flex-col">
                    <span className={`text-xs font-bold ${row.isApproved ? 'text-green-600' : 'text-amber-600'}`}>
                        {row.isApproved ? 'Approved' : 'Pending Approval'}
                    </span>
                    <span className="text-xs text-muted-foreground">{Math.round(row.distanceFromDoctor || 0)}m away</span>
                </div>
            )
        },
        {
            header: 'Remarks',
            accessor: 'remarks'
        }
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Call Report Monitoring</h1>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        {user?.role === 'admin' && (
                            <div>
                                <label className="text-sm font-medium mb-1 block">HQ</label>
                                <select
                                    name="hqId"
                                    className="w-full border rounded px-3 py-2 text-sm bg-background"
                                    value={filters.hqId}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">All HQs</option>
                                    {hqs.map(hq => <option key={hq._id} value={hq._id}>{hq.name}</option>)}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="text-sm font-medium mb-1 block">Employee</label>
                            <select
                                name="employeeId"
                                className="w-full border rounded px-3 py-2 text-sm bg-background"
                                value={filters.employeeId}
                                onChange={handleFilterChange}
                            >
                                <option value="">All Employees</option>
                                {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-1 block">Start Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="date"
                                    name="startDate"
                                    className="w-full border rounded pl-8 pr-3 py-2 text-sm bg-background"
                                    value={filters.startDate}
                                    onChange={handleFilterChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-1 block">End Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="date"
                                    name="endDate"
                                    className="w-full border rounded pl-8 pr-3 py-2 text-sm bg-background"
                                    value={filters.endDate}
                                    onChange={handleFilterChange}
                                />
                            </div>
                        </div>

                        <Button type="submit">
                            <Search className="h-4 w-4 mr-2" />
                            Filter
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Data Table */}
            {loading ? (
                <div>Loading reports...</div>
            ) : (
                <Table
                    data={reports}
                    columns={columns}
                />
            )}
        </div>
    );
};

export default CallReportList;
