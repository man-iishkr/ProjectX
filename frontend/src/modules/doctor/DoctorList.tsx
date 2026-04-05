import React, { useState } from 'react';
import Table from '../../components/Table';
import DoctorForm from './DoctorForm';
import { useAuth } from '../../context/AuthContext';
import { useDoctors, useDeleteDoctor, useUpdateDoctor, useBatchApproveDoctors } from '../../hooks/useDoctors';
import { useHQs } from '../../hooks/useHQs';
import { ChevronDown, ChevronUp, CheckCircle, Eye, UploadCloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RecordDetailModal from '../../components/ui/RecordDetailModal';
import { exportToExcel } from '../../utils/exportToExcel';

interface DoctorListProps {
    hideAddButton?: boolean;
    title?: string;
}

const DoctorList: React.FC<DoctorListProps> = ({ hideAddButton = false, title = 'Doctors' }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [selectedHQ, setSelectedHQ] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const [viewingDoctor, setViewingDoctor] = useState<any>(null);

    const { data: doctors, isLoading: loading } = useDoctors(selectedHQ);
    const { data: hqs } = useHQs();

    const deleteDoctorMutation = useDeleteDoctor();
    const updateDoctorMutation = useUpdateDoctor();
    const batchApproveMutation = useBatchApproveDoctors();

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure?')) {
            await deleteDoctorMutation.mutateAsync(id);
        }
    };

    const handleApprove = async (id: string) => {
        if (window.confirm('Approve this doctor?')) {
            await updateDoctorMutation.mutateAsync({ id, data: { approvalStatus: 'Approved' } });
        }
    };

    const handleBatchApprove = async (creatorName: string, doctorIds: string[]) => {
        if (window.confirm(`Approve all ${doctorIds.length} doctors added by ${creatorName}?`)) {
            await batchApproveMutation.mutateAsync(doctorIds);
        }
    };

    const handleEdit = (doctor: any) => {
        setEditingDoctor(doctor);
        setShowForm(true);
    };

    const handleAdd = () => {
        setEditingDoctor(null);
        setShowForm(true);
    };

    const handleFormSuccess = () => {
        setShowForm(false);
    };

    const toggleGroup = (creatorName: string) => {
        setExpandedGroups(prev => ({ ...prev, [creatorName]: !prev[creatorName] }));
    };

    if (loading) return <div>Loading...</div>;

    const allDoctors = doctors || [];
    const pendingDoctors = allDoctors.filter((d: any) => d.approvalStatus === 'Pending');

    // Group pending doctors by createdBy.name
    const pendingGroups = pendingDoctors.reduce((acc: any, doctor: any) => {
        const creatorName = doctor.createdBy?.name || 'Unknown User';
        if (!acc[creatorName]) {
            acc[creatorName] = [];
        }
        acc[creatorName].push(doctor);
        return acc;
    }, {});

    const commonColumns = [
        { header: 'SrNo', accessor: (_: any, index: number) => index + 1 },
        { header: 'Dr Name', accessor: 'name' },
        { header: 'Route', accessor: (row: any) => `${row.routeFrom} - ${row.routeTo}` },
        { header: 'Area', accessor: 'area' },
        { header: 'Class', accessor: 'class' },
        { header: 'Speciality', accessor: 'speciality' },
        { header: 'Mobile', accessor: 'mobile' },
        { header: 'Add Date', accessor: (row: any) => new Date(row.date).toLocaleDateString() },
        {
            header: 'Status',
            accessor: (row: any) => {
                if (row.approvalStatus === 'Approved' && !row.isLocationVerified) {
                    return <span className="text-amber-600 font-semibold">Loc. Pending</span>;
                }
                if (row.approvalStatus === 'Approved' && row.isLocationVerified) {
                    return <span className="text-green-600 font-semibold">Active</span>;
                }
                if (row.approvalStatus === 'Pending') {
                    return <span className="text-blue-600 font-semibold">Pending</span>;
                }
                return row.approvalStatus;
            }
        },
    ];

    const actions = (row: any) => (
        <div className="flex gap-2 items-center">
            {user?.role === 'admin' && (
                <button
                    onClick={() => setViewingDoctor(row)}
                    className="text-slate-400 hover:text-blue-600 transition-colors"
                    title="View Details"
                >
                    <Eye className="h-4 w-4" />
                </button>
            )}
            {row.approvalStatus === 'Pending' && (user?.role === 'admin' || user?.role === 'hq') && (
                <button
                    onClick={() => handleApprove(row._id)}
                    className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                >
                    Approve
                </button>
            )}
            {row.locationImageUrl && (user?.role === 'admin' || user?.role === 'hq') && (
                <button
                    onClick={() => window.open(`http://localhost:5000${row.locationImageUrl}`, '_blank')}
                    className="text-purple-600 hover:text-purple-900 border border-purple-600 px-2 py-0.5 rounded text-xs"
                    title="View Clinic Image"
                >
                    View Image
                </button>
            )}

            {/* All users can edit doctors as requested */}
            <button
                onClick={() => handleEdit(row)}
                className="text-blue-600 hover:text-blue-900"
            >
                Edit
            </button>

            {user?.role === 'admin' && (
                <button
                    onClick={() => handleDelete(row._id)}
                    className="text-red-600 hover:text-red-900"
                >
                    Delete
                </button>
            )}
        </div>
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">{title}</h2>
                <div className="flex gap-4 items-center">
                    {(user?.role === 'admin' || user?.role === 'hq') && (
                        <div className="flex bg-muted p-1 rounded-lg border border-border">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'all' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                All Doctors
                            </button>
                            <button
                                onClick={() => setActiveTab('pending')}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${activeTab === 'pending' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Pending Approvals
                                {pendingDoctors.length > 0 && (
                                    <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                                        {pendingDoctors.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    )}
                    {user?.role === 'admin' && activeTab === 'all' && (
                        <select
                            className="border rounded px-2 py-1 bg-background"
                            value={selectedHQ}
                            onChange={(e) => setSelectedHQ(e.target.value)}
                        >
                            <option value="">All HQs</option>
                            {(hqs || []).map((hq: any) => (
                                <option key={hq._id} value={hq._id}>
                                    {hq.name}
                                </option>
                            ))}
                        </select>
                    )}

                    {user?.role === 'admin' && activeTab === 'all' && (
                        <button
                            onClick={() => exportToExcel(allDoctors, 'Doctors_Export')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded flex items-center gap-2"
                        >
                            Export Excel
                        </button>
                    )}

                    {!hideAddButton && user?.role !== 'admin' && user?.role !== 'hq' && (
                        <button
                            onClick={() => {
                                const basePath = user?.role === 'bde' ? '/employee' : '/manager';
                                navigate(`${basePath}/import`);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
                        >
                            <UploadCloud className="h-4 w-4" />
                            Import Excel
                        </button>
                    )}

                    {!hideAddButton && (
                        <button
                            onClick={handleAdd}
                            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded"
                        >
                            Add Doctor
                        </button>
                    )}
                </div>
            </div>

            {activeTab === 'all' ? (
                <Table
                    data={allDoctors}
                    columns={commonColumns}
                    actions={actions}
                />
            ) : (
                <div className="space-y-4">
                    {Object.keys(pendingGroups).length === 0 ? (
                        <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
                            No doctors pending approval.
                        </div>
                    ) : (
                        Object.entries(pendingGroups).map(([creatorName, groupDocs]: [string, any]) => {
                            const isExpanded = expandedGroups[creatorName];
                            return (
                                <div key={creatorName} className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                                    <div
                                        className="flex items-center justify-between p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => toggleGroup(creatorName)}
                                    >
                                        <div className="flex items-center gap-3">
                                            {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                                            <div>
                                                <h3 className="font-medium text-foreground">
                                                    <span className="font-semibold text-primary">{creatorName}</span> added {groupDocs.length} doctor{groupDocs.length > 1 ? 's' : ''}
                                                </h3>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleBatchApprove(creatorName, groupDocs.map((d: any) => d._id));
                                                }}
                                                disabled={batchApproveMutation.isPending}
                                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                                Approve All
                                            </button>
                                        </div>
                                    </div>
                                    {isExpanded && (
                                        <div className="p-4 border-t border-border bg-background">
                                            <Table
                                                data={groupDocs}
                                                columns={commonColumns}
                                                actions={actions}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {showForm && (
                <DoctorForm
                    onClose={() => setShowForm(false)}
                    onSuccess={handleFormSuccess}
                    initialData={editingDoctor}
                />
            )}
            {viewingDoctor && (
                <RecordDetailModal
                    record={viewingDoctor}
                    title={`Doctor Details: ${viewingDoctor.name || ''}`}
                    onClose={() => setViewingDoctor(null)}
                />
            )}
        </div>
    );
};

export default DoctorList;
