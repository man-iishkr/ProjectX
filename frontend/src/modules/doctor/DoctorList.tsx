import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import { getDoctors, deleteDoctor, updateDoctor } from '../../api/doctor.api';
import { getHQs } from '../../api/hq.api';
import DoctorForm from './DoctorForm';
import { useAuth } from '../../context/AuthContext';

const DoctorList: React.FC = () => {
    const { user } = useAuth();
    const [doctors, setDoctors] = useState<any[]>([]);
    const [hqs, setHQs] = useState<any[]>([]);
    const [selectedHQ, setSelectedHQ] = useState('');
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, [selectedHQ]);

    const loadData = async () => {
        try {
            setLoading(true);
            const promises: Promise<any>[] = [getDoctors(selectedHQ)];
            if (user?.role === 'admin' && hqs.length === 0) {
                promises.push(getHQs());
            }

            const [doctorsRes, hqsRes] = await Promise.all(promises);

            if (doctorsRes.success) {
                setDoctors(doctorsRes.data);
            }
            if (hqsRes && hqsRes.success) {
                setHQs(hqsRes.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure?')) {
            await deleteDoctor(id);
            loadData();
        }
    };

    const handleApprove = async (id: string) => {
        if (window.confirm('Approve this doctor?')) {
            await updateDoctor(id, { approvalStatus: 'Approved' });
            loadData();
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
        loadData();
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Doctors</h2>
                <div className="flex gap-4">
                    {user?.role === 'admin' && (
                        <select
                            className="border rounded px-2 py-1"
                            value={selectedHQ}
                            onChange={(e) => setSelectedHQ(e.target.value)}
                        >
                            <option value="">All HQs</option>
                            {hqs.map((hq: any) => (
                                <option key={hq._id} value={hq._id}>
                                    {hq.name}
                                </option>
                            ))}
                        </select>
                    )}
                    <button
                        onClick={handleAdd}
                        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded"
                    >
                        Add Doctor
                    </button>
                </div>
            </div>

            <Table
                data={doctors}
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
                        {row.approvalStatus === 'Pending' && (
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
