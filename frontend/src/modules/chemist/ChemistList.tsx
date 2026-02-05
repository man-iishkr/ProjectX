import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import { getChemists, deleteChemist } from '../../api/chemist.api';

const ChemistList: React.FC = () => {
    const [chemists, setChemists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Chemists</h2>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
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
                    <button
                        onClick={() => handleDelete(row._id)}
                        className="text-red-600 hover:text-red-900"
                    >
                        Delete
                    </button>
                )}
            />
        </div>
    );
};

export default ChemistList;
