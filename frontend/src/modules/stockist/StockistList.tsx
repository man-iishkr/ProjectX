import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import { getStockists, deleteStockist } from '../../api/stockist.api';
import { getHQs } from '../../api/hq.api';
import { useAuth } from '../../context/AuthContext';
import StockistForm from './StockistForm';
import { Eye } from 'lucide-react';
import RecordDetailModal from '../../components/ui/RecordDetailModal';
import { exportToExcel } from '../../utils/exportToExcel';

const StockistList: React.FC = () => {
    const { user } = useAuth();
    const [stockists, setStockists] = useState<any[]>([]);
    const [hqs, setHQs] = useState<any[]>([]);
    const [selectedHQ, setSelectedHQ] = useState('');
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingStockist, setEditingStockist] = useState<any>(null);
    const [viewingStockist, setViewingStockist] = useState<any>(null);

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
                            className="border rounded px-2 py-1 bg-background dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
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
                    {user?.role === 'admin' && (
                        <button
                            onClick={() => exportToExcel(stockists, 'Stockists_Export')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded flex items-center h-10 text-sm font-medium"
                        >
                            Export Excel
                        </button>
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
                    <div className="flex gap-2 items-center">
                        {user?.role === 'admin' && (
                            <button
                                onClick={() => setViewingStockist(row)}
                                className="text-slate-400 hover:text-blue-600 transition-colors"
                                title="View Details"
                            >
                                <Eye className="h-4 w-4" />
                            </button>
                        )}
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
            {viewingStockist && (
                <RecordDetailModal
                    record={viewingStockist}
                    title={`Stockist: ${viewingStockist.name || ''}`}
                    onClose={() => setViewingStockist(null)}
                />
            )}
        </div>
    );
};

export default StockistList;
