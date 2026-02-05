import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import { getInventory, getProducts, updateStock } from '../../api/inventory.api';
import { getStockists } from '../../api/stockist.api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Plus, X, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const InventoryList: React.FC = () => {
    const [inventory, setInventory] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [stockists, setStockists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [selectedStockist, setSelectedStockist] = useState('');

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [stockForm, setStockForm] = useState({
        stockistId: '',
        productId: '',
        type: 'in', // 'in' or 'out'
        quantity: ''
    });

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        loadInventory();
    }, [selectedStockist]);

    const loadInitialData = async () => {
        try {
            const [prodRes, stockistRes] = await Promise.all([
                getProducts(),
                getStockists()
            ]);
            if (prodRes.success) setProducts(prodRes.data);
            if (stockistRes.success) setStockists(stockistRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    const loadInventory = async () => {
        try {
            setLoading(true);
            const res = await getInventory(selectedStockist);
            if (res.success) {
                setInventory(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleStockSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                stockistId: stockForm.stockistId,
                productId: stockForm.productId,
                stockIn: stockForm.type === 'in' ? Number(stockForm.quantity) : 0,
                stockOut: stockForm.type === 'out' ? Number(stockForm.quantity) : 0
            };

            await updateStock(payload);
            setIsModalOpen(false);
            loadInventory();
            setStockForm({ ...stockForm, quantity: '' }); // keep selection, clear qty
        } catch (err) {
            console.error(err);
            alert('Failed to update stock');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Inventory Stock</h2>
                <div className="flex gap-4">
                    <select
                        className="border rounded px-3 py-2 text-sm bg-background"
                        value={selectedStockist}
                        onChange={(e) => setSelectedStockist(e.target.value)}
                    >
                        <option value="">All Stockists</option>
                        {stockists.map((s) => (
                            <option key={s._id} value={s._id}>{s.name}</option>
                        ))}
                    </select>

                    <Button onClick={() => setIsModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Update Stock
                    </Button>
                </div>
            </div>

            <Table
                data={inventory}
                columns={[
                    { header: 'Product', accessor: (row) => row.product?.name || 'N/A' },
                    { header: 'Stockist', accessor: (row) => row.stockist?.name || 'N/A' },
                    { header: 'Total In', accessor: 'stockIn' },
                    { header: 'Total Out', accessor: 'stockOut' },
                    {
                        header: 'Closing Stock',
                        accessor: (row) => (
                            <span className={row.closingStock < 0 ? 'text-red-600 font-bold' : ''}>
                                {row.closingStock}
                            </span>
                        )
                    },
                ]}
            />

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-background p-6 rounded-lg w-full max-w-md shadow-lg relative">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <h3 className="text-xl font-bold mb-4">Update Stock</h3>

                        <form onSubmit={handleStockSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Stockist</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={stockForm.stockistId}
                                    onChange={(e) => setStockForm({ ...stockForm, stockistId: e.target.value })}
                                    required
                                >
                                    <option value="">Select Stockist</option>
                                    {stockists.map((s) => (
                                        <option key={s._id} value={s._id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Product</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={stockForm.productId}
                                    onChange={(e) => setStockForm({ ...stockForm, productId: e.target.value })}
                                    required
                                >
                                    <option value="">Select Product</option>
                                    {products.map((p) => (
                                        <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Action</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setStockForm({ ...stockForm, type: 'in' })}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded border ${stockForm.type === 'in' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-background hover:bg-muted'}`}
                                        >
                                            <ArrowDownLeft className="h-4 w-4" /> In
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setStockForm({ ...stockForm, type: 'out' })}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded border ${stockForm.type === 'out' ? 'bg-red-100 border-red-500 text-red-700' : 'bg-background hover:bg-muted'}`}
                                        >
                                            <ArrowUpRight className="h-4 w-4" /> Out
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-1 block">Quantity</label>
                                    <Input
                                        type="number"
                                        value={stockForm.quantity}
                                        onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
                                        required
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    Update Stock
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryList;
