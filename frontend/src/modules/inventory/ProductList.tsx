import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import { getProducts, createProduct } from '../../api/inventory.api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Plus, X } from 'lucide-react';

const ProductList: React.FC = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        unitPrice: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await getProducts();
            if (res.success) {
                setProducts(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createProduct({
                ...formData,
                unitPrice: Number(formData.unitPrice)
            });
            setIsModalOpen(false);
            loadData();
            setFormData({ name: '', code: '', unitPrice: '' });
        } catch (err) {
            console.error(err);
            alert('Failed to create product');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Product Management</h2>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                </Button>
            </div>

            <Table
                data={products}
                columns={[
                    { header: 'Name', accessor: 'name' },
                    { header: 'Code', accessor: 'code' },
                    { header: 'Unit Price', accessor: (row) => `₹${row.unitPrice}` },
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

                        <h3 className="text-xl font-bold mb-4">Add Product</h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Product Name</label>
                                <Input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Product Code</label>
                                <Input
                                    name="code"
                                    value={formData.code}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Unit Price (₹)</label>
                                <Input
                                    name="unitPrice"
                                    type="number"
                                    value={formData.unitPrice}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    Create
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductList;
