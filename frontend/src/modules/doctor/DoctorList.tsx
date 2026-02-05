import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import { getDoctors, deleteDoctor, updateDoctor } from '../../api/doctor.api';
import DoctorForm from './DoctorForm';
import { useAuth } from '../../context/AuthContext';

const DoctorList: React.FC = () => {
    const { user } = useAuth();
    const [doctors, setDoctors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState<any>(null);

    useEffect(() => {
        loadDoctors();
    }, []);

    const loadDoctors = async () => {
        try {
            const res = await getDoctors();
            if (res.success) {
                setDoctors(res.data);
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
            loadDoctors();
        }
    };

    const handleApprove = async (id: string) => {
        if (window.confirm('Approve this doctor?')) {
            await updateDoctor(id, { approvalStatus: 'Approved' });
            loadDoctors();
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
        loadDoctors();
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Doctors</h2>
                <button
                    onClick={handleAdd}
                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded"
                >
                    Add Doctor
                </button>
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
