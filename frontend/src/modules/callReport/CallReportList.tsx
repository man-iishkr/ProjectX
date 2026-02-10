import React, { useEffect, useState } from 'react';
import { callReportAPI } from '../../api/callReport.api';
import { getEmployees } from '../../api/employee.api';
import { getHQs } from '../../api/hq.api';
import Table from '../../components/Table';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Calendar, Search, PhoneCall, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

import ReportCall from './ReportCall';


const CallReportList: React.FC = () => {
    const { user } = useAuth();
    const [reports, setReports] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [hqs, setHQs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showReportModal, setShowReportModal] = useState(false);

    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        employeeId: '',
        hqId: ''
    });

    useEffect(() => {
        loadInitialData();
        loadReports();
    }, []);

    const loadInitialData = async () => {
        try {
            if (user?.role === 'admin' || user?.role === 'hq') {
                const empRes = await getEmployees();
                if (empRes.success) setEmployees(empRes.data);
            }
            if (user?.role === 'admin') {
                const hqRes = await getHQs();
                if (hqRes.success) setHQs(hqRes.data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const loadReports = async () => {
        setLoading(true);
        try {
            const data = await callReportAPI.getAll(filters);
            if (data.success) {
                setReports(data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadReports();
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const columns = [
        { header: 'Date', accessor: (row: any) => new Date(row.createdAt || row.date).toLocaleDateString() },
        { header: 'Time', accessor: (row: any) => new Date(row.createdAt || row.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        { header: 'Employee', accessor: (row: any) => row.employee?.name || '-' },
        { header: 'Doctor', accessor: (row: any) => row.doctor?.name || '-' },
        {
            header: 'Products', accessor: (row: any) => {
                if (!row.products || row.products.length === 0) return '-';
                return row.products.map((p: any) => p.name || p).join(', ');
            }
        },
        {
            header: 'Route Distance', accessor: (row: any) => {
                const dist = row.doctor?.distance;
                if (dist == null || dist === 0) return '0 km (Local)';
                return `${dist} km`;
            }
        },
        { header: 'Status', accessor: (row: any) => row.isApproved ? '✅ Verified' : '⏳ Pending' },
        { header: 'Remarks', accessor: 'remarks' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Call Report Monitoring</h1>
                {user?.role === 'employee' && (
                    <Button onClick={() => setShowReportModal(true)} className="bg-blue-600 hover:bg-blue-700">
                        <PhoneCall className="h-4 w-4 mr-2" />
                        New Call Report
                    </Button>
                )}
            </div>

            {/* Report Call Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="relative w-full max-w-xl">
                        <button
                            onClick={() => { setShowReportModal(false); loadReports(); }}
                            className="absolute -top-10 right-0 text-white hover:text-gray-200"
                        >
                            <X className="h-8 w-8" />
                        </button>
                        <ReportCall />
                    </div>
                </div>
            )}

            {/* Filters */}

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
