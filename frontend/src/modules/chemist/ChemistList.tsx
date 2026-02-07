import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import { getChemists, deleteChemist } from '../../api/chemist.api';
import { getHQs } from '../../api/hq.api';
import { useAuth } from '../../context/AuthContext';
import ChemistForm from './ChemistForm';

const ChemistList: React.FC = () => {
    const { user } = useAuth();
    const [chemists, setChemists] = useState<any[]>([]);
    const [hqs, setHQs] = useState<any[]>([]);
    const [selectedHQ, setSelectedHQ] = useState('');
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingChemist, setEditingChemist] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, [selectedHQ]);

    const loadData = async () => {
        try {
            setLoading(true);
            const promises: Promise<any>[] = [getChemists(selectedHQ)];
            if (user?.role === 'admin' && hqs.length === 0) {
                promises.push(getHQs());
            }

            const [chemistsRes, hqsRes] = await Promise.all(promises);

            if (chemistsRes.success) {
                setChemists(chemistsRes.data);
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
            await deleteChemist(id);
            loadData();
        }
    };

    const handleEdit = (chemist: any) => {
        setEditingChemist(chemist);
        setShowForm(true);
    };

    const handleAdd = () => {
        setEditingChemist(null);
        setShowForm(true);
    };

    const handleFormSuccess = () => {
        loadData();
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Chemists</h2>
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
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                    >
                        Add Chemist
                    </button>
                </div>
            </div>

            <Table
                data={chemists}
                columns={[
                    { header: 'Name', accessor: 'name' },
                    { header: 'Contact Person', accessor: 'contactPerson' },
                    { header: 'Phone', accessor: 'phone' },
                    { header: 'HQ', accessor: (row) => row.hq?.name || 'N/A' },
                    { header: 'Address', accessor: 'address' },
                ]}
                actions={(row) => (
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleEdit(row)}
                            className="text-blue-600 hover:text-blue-900"
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => handleDelete(row._id)}
                            className="text-red-600 hover:text-red-900"
                        >
                            Delete
                        </button>
                    </div>
                )}
            />

            {showForm && (
                <ChemistForm
                    onClose={() => setShowForm(false)}
                    onSuccess={handleFormSuccess}
                    initialData={editingChemist}
                />
            )}
        </div>
    );
};

export default ChemistList;
