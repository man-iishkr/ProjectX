import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import { getProducts, createProduct, updateProduct } from '../../api/inventory.api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Plus, Pencil } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';

const ProductList: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        slNo: '',
        name: '',
        code: '',
        mrp: '',
        ptr: '',
        pts: ''
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

    const openCreateModal = () => {
        setFormData({ slNo: '', name: '', code: '', mrp: '', ptr: '', pts: '' });
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const openEditModal = (product: any) => {
        setFormData({
            slNo: product.slNo || '',
            name: product.name,
            code: product.code,
            mrp: product.mrp || '',
            ptr: product.ptr || '',
            pts: product.pts || ''
        });
        setCurrentId(product._id);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                unitPrice: Number(formData.unitPrice)
            };

            if (isEditing && currentId) {
                await updateProduct(currentId, payload);
            } else {
                await createProduct(payload);
            }

            setIsModalOpen(false);
            loadData();
            setFormData({ slNo: '', name: '', code: '', mrp: '', ptr: '', pts: '' });
        } catch (err) {
            console.error(err);
            alert('Operation failed');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Product Management</h2>
                {isAdmin && (
                    <Button onClick={openCreateModal}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Product
                    </Button>
                )}
            </div>

            <Table
                data={products}
                columns={[
                    { header: 'SL No', accessor: 'slNo' },
                    { header: 'Name', accessor: 'name' },
                    { header: 'Code', accessor: 'code' },
                    { header: 'MRP', accessor: (row) => row.mrp ? `₹${row.mrp}` : '-' },
                    { header: 'PTR', accessor: (row) => row.ptr ? `₹${row.ptr}` : '-' },
                    { header: 'PTS', accessor: (row) => row.pts ? `₹${row.pts}` : '-' },
                ]}
                actions={isAdmin ? (row) => (
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(row)}>
                        <Pencil className="h-4 w-4 text-blue-600" />
                    </Button>
                ) : undefined}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={isEditing ? 'Edit Product' : 'Add Product'}
                maxWidth="max-w-md"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block">SL No</label>
                        <Input
                            name="slNo"
                            value={formData.slNo}
                            onChange={handleInputChange}
                        />
                    </div>
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
                        <label className="text-sm font-medium mb-1 block">MRP (₹)</label>
                        <Input
                            name="mrp"
                            type="number"
                            value={formData.mrp}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1 block">PTR (₹)</label>
                            <Input
                                name="ptr"
                                type="number"
                                value={formData.ptr}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">PTS (₹)</label>
                            <Input
                                name="pts"
                                type="number"
                                value={formData.pts}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {isEditing ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ProductList;
