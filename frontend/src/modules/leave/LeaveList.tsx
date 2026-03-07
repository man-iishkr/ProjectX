import React, { useEffect, useState, useMemo } from 'react';
import { getLeaves, createLeave, cancelLeave, approveLeave, rejectLeave } from '../../api/leave.api';
import { useAuth } from '../../context/AuthContext';
import Table from '../../components/Table';
import { Button } from '../../components/ui/Button';
import { Plus, Check, X } from 'lucide-react';
import Modal from '../../components/ui/Modal';

interface LeaveListProps {
    embedded?: boolean;
}

const LeaveList: React.FC<LeaveListProps> = ({ embedded = false }) => {
    const { user } = useAuth();
    const [leaves, setLeaves] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        employeeId: user?._id || '',
        leaveType: 'casual',
        startDate: '',
        endDate: '',
        reason: ''
    });

    // Employee List for Managers/Admins
    const [subordinates, setSubordinates] = useState<any[]>([]);

    useEffect(() => {
        loadLeaves();
        if (user?.role !== 'bde') {
            loadSubordinates();
        }
    }, [user]);

    const loadSubordinates = async () => {
        try {
            const { getEmployees } = await import('../../api/employee.api');
            const res = await getEmployees();
            if (res.success) {
                setSubordinates(res.data);
            }
        } catch (err) {
            console.error('Failed to load subordinates', err);
        }
    };

    const loadLeaves = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const res = await getLeaves();
            if (res.success) {
                setLeaves(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createLeave({ ...formData });
            setShowModal(false);
            setFormData({ employeeId: user?._id || '', leaveType: 'casual', startDate: '', endDate: '', reason: '' });
            await loadLeaves(true); // Silent reload
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
                <span className={`px-2 py-1 rounded text-xs font-semibold ${row.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    row.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        row.status === 'cancelled' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                    {row.status.toUpperCase()}
                </span>
            )
        }
    ];

    const isAdmin = user?.role === 'admin';

    // Calculate Monthly Summary
    const monthlySummary = useMemo(() => {
        if (!leaves.length || isAdmin) return null;

        const summary: Record<string, number> = {};

        leaves.forEach(leave => {
            // Only count approved leaves belonging to the active user in the summary
            // For nested views, employee id might match user._id
            const employeeId = leave.employee?._id || leave.employee;
            if (leave.status === 'approved' && employeeId === user?._id) {
                const start = new Date(leave.startDate);
                const end = new Date(leave.endDate);

                // Calculate days (inclusive)
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                const monthName = start.toLocaleString('default', { month: 'long', year: 'numeric' });
                summary[monthName] = (summary[monthName] || 0) + diffDays;
            }
        });

        return summary;
    }, [leaves, user, isAdmin]);

    if (loading) return <div>Loading leaves...</div>;

    return (
        <div className="space-y-6">
            {!embedded && !isAdmin && monthlySummary && Object.keys(monthlySummary).length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
                    {Object.entries(monthlySummary).map(([month, days]) => (
                        <div key={month} className="bg-card border border-border rounded-xl p-4 shadow-sm text-center">
                            <h3 className="text-sm font-medium text-muted-foreground">{month}</h3>
                            <p className="text-2xl font-bold text-blue-600 mt-1">{days} <span className="text-sm font-normal text-muted-foreground">days taken</span></p>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex justify-between items-center">
                {!embedded ? (
                    <h1 className="text-2xl font-bold text-foreground">Leave Management</h1>
                ) : (
                    <div></div>
                )}
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
                        {user?.role !== 'admin' && row.status === 'pending' && (!row.employee || row.employee._id === user?._id || row.employee === user?._id) && (
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
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Apply for Leave"
                maxWidth="max-w-md"
            >
                <form onSubmit={handleCreate} className="space-y-4">
                    {user?.role !== 'bde' && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Employee</label>
                            <select
                                className="w-full border rounded p-2 bg-background"
                                value={formData.employeeId}
                                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                required
                            >
                                <option value={user?._id}>Self ({user?.name})</option>
                                {subordinates.map(sub => (
                                    <option key={sub._id} value={sub._id}>{sub.name} ({sub.designation})</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium mb-1">Leave Type</label>
                        <select
                            className="w-full border rounded p-2 bg-background"
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
                                className="w-full border rounded p-2 bg-background cursor-pointer"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                required
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">End Date</label>
                            <input
                                type="date"
                                className="w-full border rounded p-2 bg-background cursor-pointer"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                required
                                min={formData.startDate || new Date().toISOString().split('T')[0]}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Reason</label>
                        <textarea
                            className="w-full border rounded p-2 h-24 bg-background"
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
            </Modal>
        </div>
    );
};

export default LeaveList;
