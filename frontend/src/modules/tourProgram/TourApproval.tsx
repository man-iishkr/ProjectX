import React, { useState, useEffect } from 'react';
import { getTourProgramsForApproval, updateTourStatus } from '../../api/tourProgram.api';
import Table from '../../components/Table';
import { Button } from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Calendar, CheckCircle2, XCircle, Eye } from 'lucide-react';

const TourApproval: React.FC = () => {
    const today = new Date();
    const [year, setYear] = useState<number>(today.getFullYear());
    const [month, setMonth] = useState<number>(today.getMonth() + 1); // Default strictly to current month for review
    const [programs, setPrograms] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [selectedProgram, setSelectedProgram] = useState<any>(null);
    const [isViewing, setIsViewing] = useState(false);
    const [remarks, setRemarks] = useState('');

    useEffect(() => {
        fetchApprovals();
    }, [year, month]);

    const fetchApprovals = async () => {
        setLoading(true);
        try {
            // Fetch Pending and Approved usually. Defaulting to all for visibility.
            const res = await getTourProgramsForApproval({ year, month });
            if (res.success) {
                setPrograms(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch approvals', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: 'Approved' | 'Rejected') => {
        if (newStatus === 'Rejected' && !remarks.trim()) {
            alert('Please provide remarks when rejecting a Tour Program.');
            return;
        }

        try {
            const res = await updateTourStatus(id, { status: newStatus, remarks });
            if (res.success) {
                // Refresh list
                fetchApprovals();
                setIsViewing(false);
                setRemarks('');
            }
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to update status');
        }
    };

    const columns = [
        { header: 'Employee', accessor: (row: any) => `${row.employee?.name} (${row.employee?.role?.toUpperCase()})` },
        { header: 'Location', accessor: (row: any) => row.employee?.city || 'N/A' },
        {
            header: 'Status', accessor: (row: any) => (
                <span className={`px-2 py-1 rounded text-xs font-semibold ${row.status === 'Approved' ? 'bg-green-100 text-green-800' :
                    row.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                        row.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-slate-100 text-slate-800'
                    }`}>
                    {row.status}
                </span>
            )
        },
        { header: 'Period', accessor: (row: any) => `${new Date(row.period.year, row.period.month - 1).toLocaleString('default', { month: 'short' })} ${row.period.year}` },
        { header: 'Submitted On', accessor: (row: any) => new Date(row.updatedAt).toLocaleDateString() },
        { header: 'Approved By', accessor: (row: any) => row.approvedBy?.name || '-' }
    ];

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Calendar className="h-6 w-6 text-blue-600" /> Tour Approvals
                    </h1>
                    <p className="text-slate-500">Review and approve monthly tour routes for your team.</p>
                </div>
                <div className="flex gap-4">
                    <select
                        className="p-2 border border-slate-300 rounded-md bg-white shadow-sm"
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                            </option>
                        ))}
                    </select>
                    <select
                        className="p-2 border border-slate-300 rounded-md bg-white shadow-sm"
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                    >
                        {[year - 1, year, year + 1].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading programs...</div>
                ) : (
                    <Table
                        columns={columns}
                        data={programs}
                        actions={(row) => (
                            <Button size="sm" variant="outline" onClick={() => { setSelectedProgram(row); setRemarks(row.remarks || ''); setIsViewing(true); }}>
                                <Eye className="h-4 w-4 mr-2" /> View Details
                            </Button>
                        )}
                    />
                )}
            </div>

            {/* View Modal */}
            {isViewing && selectedProgram && (
                <Modal
                    isOpen={isViewing}
                    onClose={() => setIsViewing(false)}
                    title={`Tour Program: ${selectedProgram.employee?.name} (${new Date(selectedProgram.period.year, selectedProgram.period.month - 1).toLocaleString('default', { month: 'short' })} ${selectedProgram.period.year})`}
                    maxWidth="max-w-4xl"
                >
                    <div className="max-h-[70vh] overflow-y-auto pr-2">
                        <div className="mb-4 flex gap-4 text-sm bg-slate-50 border border-slate-200 p-3 rounded-lg">
                            <div><strong>Employee ID:</strong> {selectedProgram.employee?.employeeId || 'N/A'}</div>
                            <div><strong>Designation:</strong> {selectedProgram.employee?.designation}</div>
                            <div><strong>Current Status:</strong> <span className="font-semibold text-blue-600">{selectedProgram.status}</span></div>
                        </div>

                        <table className="w-full text-left text-sm mb-6 whitespace-nowrap">
                            <thead className="bg-slate-800 text-white">
                                <tr>
                                    <th className="px-3 py-2">Date</th>
                                    <th className="px-3 py-2">From Base</th>
                                    <th className="px-3 py-2">To Destination</th>
                                    <th className="px-3 py-2">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {selectedProgram.dailyPlans.map((plan: any, idx: number) => {
                                    const isSunday = !plan.isWorkingDay;
                                    return (
                                        <tr key={idx} className={isSunday ? 'bg-red-50 text-red-800 italic' : ''}>
                                            <td className="px-3 py-2 font-medium">{new Date(plan.date).getDate()}</td>
                                            <td className="px-3 py-2">{plan.from}</td>
                                            <td className="px-3 py-2">{plan.to}</td>
                                            <td className="px-3 py-2 text-xs">{plan.notes}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>

                        {selectedProgram.status === 'Pending' && (
                            <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Manager Remarks (Required for Reject)</label>
                                    <textarea
                                        className="w-full border border-slate-300 rounded p-2 text-sm"
                                        rows={3}
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        placeholder="Add operational notes or reasons for rejection..."
                                    />
                                </div>
                                <div className="flex justify-end gap-3 mt-4">
                                    <Button variant="destructive" onClick={() => handleStatusUpdate(selectedProgram._id, 'Rejected')}>
                                        <XCircle className="h-4 w-4 mr-2" /> Reject Plan
                                    </Button>
                                    <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleStatusUpdate(selectedProgram._id, 'Approved')}>
                                        <CheckCircle2 className="h-4 w-4 mr-2" /> Approve Plan
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default TourApproval;
