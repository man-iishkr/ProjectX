import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import { getStockists, deleteStockist } from '../../api/stockist.api';
import { getHQs } from '../../api/hq.api';
import { useAuth } from '../../context/AuthContext';
import StockistForm from './StockistForm';

const StockistList: React.FC = () => {
    const { user } = useAuth();
    const [stockists, setStockists] = useState<any[]>([]);
    const [hqs, setHQs] = useState<any[]>([]);
    const [selectedHQ, setSelectedHQ] = useState('');
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingStockist, setEditingStockist] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, [selectedHQ]);

    const loadData = async () => {
        try {
            setLoading(true);
            const promises: Promise<any>[] = [getStockists(selectedHQ)];
            if (user?.role === 'admin' && hqs.length === 0) {
                promises.push(getHQs());
            }

            const [stockistsRes, hqsRes] = await Promise.all(promises);

            if (stockistsRes.success) {
                setStockists(stockistsRes.data);
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
            await deleteStockist(id);
            loadData();
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
        loadData();
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Stockists</h2>
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
                        Add Stockist
                    </button>
                </div>
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
