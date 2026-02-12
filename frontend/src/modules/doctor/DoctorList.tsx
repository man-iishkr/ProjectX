import React, { useState } from 'react';
import Table from '../../components/Table';
import DoctorForm from './DoctorForm';
import { useAuth } from '../../context/AuthContext';
import { useDoctors, useDeleteDoctor, useUpdateDoctor } from '../../hooks/useDoctors';
import { useHQs } from '../../hooks/useHQs';

interface DoctorListProps {
    hideAddButton?: boolean;
    title?: string;
}

const DoctorList: React.FC<DoctorListProps> = ({ hideAddButton = false, title = 'Doctors' }) => {
    const { user } = useAuth();
    const [selectedHQ, setSelectedHQ] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState<any>(null);

    const { data: doctors, isLoading: loading } = useDoctors(selectedHQ);
    const { data: hqs } = useHQs();

    const deleteDoctorMutation = useDeleteDoctor();
    const updateDoctorMutation = useUpdateDoctor();

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

    const handleEdit = (doctor: any) => {
        setEditingDoctor(doctor);
        setShowForm(true);
    };

    const handleAdd = () => {
        setEditingDoctor(null);
        setShowForm(true);
    };

    const handleFormSuccess = () => {
        // refetch not needed as query invalidation handles it
        setShowForm(false);
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">{title}</h2>
                <div className="flex gap-4">
                    {user?.role === 'admin' && (
                        <select
                            className="border rounded px-2 py-1"
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

            <Table
                data={doctors || []}
                columns={[
                    { header: 'SrNo', accessor: (_, index) => index + 1 },
                    { header: 'Dr Name', accessor: 'name' },
                    { header: 'Dr. Code', accessor: 'code' },
                    { header: 'Route', accessor: (row) => `${row.routeFrom} - ${row.routeTo}` },
                    { header: 'Area', accessor: 'area' },
                    { header: 'Resi. Address', accessor: 'residentialAddress' },
                    { header: 'Clinic Address', accessor: 'clinicAddress' },
                    {
                        header: 'Coordinates',
                        accessor: (row) => row.location?.coordinates && row.location.coordinates[0] !== 0
                            ? `${row.location.coordinates[1]}, ${row.location.coordinates[0]}`
                            : '-'
                    },
                    { header: 'Class', accessor: 'class' },
                    { header: 'Speciality', accessor: 'speciality' },
                    { header: 'Frequency', accessor: 'frequency' },
                    { header: 'Mobile', accessor: 'mobile' },
                    { header: 'Phone', accessor: 'phone' },
                    { header: 'Add Date', accessor: (row) => new Date(row.date).toLocaleDateString() },
                    { header: 'Rejected Remark', accessor: 'rejectedRemark' },
                    { header: 'Status', accessor: 'approvalStatus' },
                ]}
                actions={(row: any) => (
                    <div className="flex gap-2">
                        {row.approvalStatus === 'Pending' && (user?.role === 'admin' || user?.role === 'hq') && (
                            <button
                                onClick={() => handleApprove(row._id)}
                                className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                            >
                                Approve
                            </button>
                        )}
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
                )}
            />

            {showForm && (
                <DoctorForm
                    onClose={() => setShowForm(false)}
                    onSuccess={handleFormSuccess}
                    initialData={editingDoctor}
                />
            )}
        </div>
    );
};

export default DoctorList;
