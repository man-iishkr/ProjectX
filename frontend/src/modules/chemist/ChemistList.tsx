import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import { getChemists, deleteChemist } from '../../api/chemist.api';
import ChemistForm from './ChemistForm';

const ChemistList: React.FC = () => {
    const [chemists, setChemists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingChemist, setEditingChemist] = useState<any>(null);

    useEffect(() => {
        loadChemists();
    }, []);

    const loadChemists = async () => {
        try {
            const res = await getChemists();
            if (res.success) {
                setChemists(res.data);
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
            loadChemists();
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
        loadChemists();
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Chemists</h2>
                <button
                    onClick={handleAdd}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                    Add Chemist
                </button>
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
