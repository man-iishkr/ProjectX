import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import { getStockists, deleteStockist } from '../../api/stockist.api';
import StockistForm from './StockistForm';

const StockistList: React.FC = () => {
    const [stockists, setStockists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingStockist, setEditingStockist] = useState<any>(null);

    useEffect(() => {
        loadStockists();
    }, []);

    const loadStockists = async () => {
        try {
            const res = await getStockists();
            if (res.success) {
                setStockists(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure?')) {
            await deleteStockist(id);
            loadStockists();
        }
    };

    const handleEdit = (stockist: any) => {
        setEditingStockist(stockist);
        setShowForm(true);
    };

    const handleAdd = () => {
        setEditingStockist(null);
        setShowForm(true);
    };

    const handleFormSuccess = () => {
        loadStockists();
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Stockists</h2>
                <button
                    onClick={handleAdd}
                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded"
                >
                    Add Stockist
                </button>
            </div>

            <Table
                data={stockists}
                columns={[
                    { header: 'SrNo', accessor: (_, index) => index + 1 },
                    { header: 'Name', accessor: 'name' },
                    { header: 'Code', accessor: 'code' },
                    { header: 'HQ', accessor: (row) => row.hq?.name || '-' },
                    { header: 'Address', accessor: 'address' },
                    { header: 'Contact', accessor: 'contact' },
                    { header: 'Status', accessor: 'status' },
                    { header: 'Created', accessor: (row) => new Date(row.createdAt).toLocaleDateString() },
                ]}
                actions={(row: any) => (
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
                <StockistForm
                    onClose={() => setShowForm(false)}
                    onSuccess={handleFormSuccess}
                    initialData={editingStockist}
                />
            )}
        </div>
    );
};

export default StockistList;
