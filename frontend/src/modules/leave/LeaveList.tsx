import React, { useEffect, useState } from 'react';
import { getLeaves, createLeave, cancelLeave, approveLeave, rejectLeave } from '../../api/leave.api';
import { useAuth } from '../../context/AuthContext';
import Table from '../../components/Table';
import { Button } from '../../components/ui/Button';
import { Plus, X, Check } from 'lucide-react';

const LeaveList: React.FC = () => {
    const { user } = useAuth();
    const [leaves, setLeaves] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        leaveType: 'casual',
        startDate: '',
        endDate: '',
        reason: ''
    });

    useEffect(() => {
        loadLeaves();
    }, []);

    const loadLeaves = async () => {
        try {
            setLoading(true);
            const res = await getLeaves();
            if (res.success) {
                setLeaves(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createLeave({ ...formData, employeeId: user._id }); // Backend might expect employeeId for admins creating, but usually req.user works
            setShowModal(false);
            setFormData({ leaveType: 'casual', startDate: '', endDate: '', reason: '' });
            loadLeaves();
        } catch (err) {
            console.error(err);
            alert('Failed to apply for leave');
        }
    };

    const handleCancel = async (id: string) => {
        if (window.confirm('Cancel this leave request?')) {
            await cancelLeave(id);
            loadLeaves();
        }
    };

    const handleApprove = async (id: string) => {
        if (window.confirm('Approve this leave?')) {
            await approveLeave(id);
            loadLeaves();
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt('Enter rejection reason:');
        if (reason) {
            await rejectLeave(id, reason);
            loadLeaves();
        }
    };

    const columns = [
        {
            header: 'Employee',
            accessor: (row: any) => row.employee?.name || 'Me'
        },
        { header: 'Type', accessor: (row: any) => row.leaveType.toUpperCase() },
        {
            header: 'Duration',
            accessor: (row: any) => (
                <div className="text-sm">
                    <div>{new Date(row.startDate).toLocaleDateString()} - {new Date(row.endDate).toLocaleDateString()}</div>
                    {/* Backend virtual field might not come in JSON unless explicitly set, calculating here if needed */}
                </div>
            )
        },
        { header: 'Reason', accessor: 'reason' },
        {
            header: 'Status',
            accessor: (row: any) => (
                <span className={`px-2 py-1 rounded text-xs font-semibold ${row.status === 'approved' ? 'bg-green-100 text-green-700' :
                    row.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        row.status === 'cancelled' ? 'bg-gray-100 text-gray-700' :
                            'bg-yellow-100 text-yellow-700'
                    }`}>
                    {row.status.toUpperCase()}
                </span>
            )
        }
    ];

    if (loading) return <div>Loading leaves...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900">Leave Management</h1>
                <Button onClick={() => setShowModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Apply for Leave
                </Button>
            </div>

            <Table
                data={leaves}
                columns={columns}
                actions={(row) => (
                    <div className="flex gap-2">
                        {/* Employee Actions */}
                        {user?.role === 'employee' && row.status === 'pending' && (
                            <Button variant="ghost" size="sm" onClick={() => handleCancel(row._id)} className="text-red-600">
                                Cancel
                            </Button>
                        )}

                        {/* Admin/HQ Actions */}
                        {(user?.role === 'admin' || user?.role === 'hq') && row.status === 'pending' && (
                            <>
                                <Button variant="ghost" size="icon" onClick={() => handleApprove(row._id)} className="text-green-600 bg-green-50 hover:bg-green-100">
                                    <Check className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleReject(row._id)} className="text-red-600 bg-red-50 hover:bg-red-100">
                                    <X className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                    </div>
                )}
            />

            {/* Apply Leave Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Apply for Leave</h3>
                            <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-gray-500" /></button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Leave Type</label>
                                <select
                                    className="w-full border rounded p-2"
                                    value={formData.leaveType}
                                    onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                                >
                                    <option value="casual">Casual Leave</option>
                                    <option value="sick">Sick Leave</option>
                                    <option value="earned">Earned Leave</option>
                                    <option value="emergency">Emergency</option>
                                    <option value="unpaid">Unpaid/LWP</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        className="w-full border rounded p-2"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">End Date</label>
                                    <input
                                        type="date"
                                        className="w-full border rounded p-2"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Reason</label>
                                <textarea
                                    className="w-full border rounded p-2 h-24"
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    placeholder="Please describe the reason..."
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                                <Button type="submit">Submit Request</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaveList;
