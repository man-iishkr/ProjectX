import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import { getRoutes, createRoute, updateRoute, deleteRoute } from '../../api/routing.api';
import { getHQs } from '../../api/hq.api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { X, Plus, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const RoutingList: React.FC = () => {
    const { user } = useAuth();
    const [routes, setRoutes] = useState<any[]>([]);
    const [hqs, setHQs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        hq: '',
        areas: '',
        isActive: true
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [routesRes, hqRes] = await Promise.all([getRoutes(), getHQs()]);
            if (routesRes.success) {
                setRoutes(routesRes.data);
            }
            if (hqRes.success) {
                setHQs(hqRes.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const openCreateModal = () => {
        setFormData({
            name: '',
            code: '',
            hq: '',
            areas: '',
            isActive: true
        });
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const openEditModal = (route: any) => {
        setFormData({
            name: route.name,
            code: route.code || '',
            hq: route.hq?._id || route.hq || '',
            areas: route.areas ? route.areas.join(', ') : '',
            isActive: route.isActive
        });
        setCurrentId(route._id);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Process areas string into array
            const areasArray = formData.areas
                .split(',')
                .map(area => area.trim())
                .filter(area => area.length > 0);

            const dataToSend = {
                ...formData,
                areas: areasArray
            };

            if (isEditing && currentId) {
                await updateRoute(currentId, dataToSend);
            } else {
                await createRoute(dataToSend);
            }
            setIsModalOpen(false);
            loadData();
        } catch (err: any) {
            console.error(err);
            const errorMessage = err?.response?.data?.error || 'Operation failed';
            alert(errorMessage);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this route?')) {
            try {
                await deleteRoute(id);
                loadData();
            } catch (err) {
                console.error(err);
                alert('Failed to delete route');
            }
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Route Management</h2>
                <Button onClick={openCreateModal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Route
                </Button>
            </div>

            <Table
                data={routes}
                columns={[
                    { header: 'Route Name', accessor: 'name' },
                    { header: 'Code', accessor: 'code' },
                    { header: 'HQ', accessor: (row) => row.hq?.name || 'N/A' },
                    { header: 'Areas', accessor: (row) => row.areas ? row.areas.join(', ') : '-' },
                    { header: 'Status', accessor: (row) => row.isActive ? 'Active' : 'Inactive' },
                    { header: 'Created At', accessor: (row) => new Date(row.createdAt).toLocaleDateString() },
                ]}
                actions={(row) => (
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(row)}>
                            <Pencil className="h-4 w-4 text-blue-600" />
                        </Button>
                        {user?.role === 'admin' && (
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(row._id)}>
                                <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                        )}
                    </div>
                )}
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

                        <h3 className="text-xl font-bold mb-4">{isEditing ? 'Edit Route' : 'Add Route'}</h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Route Name</label>
                                <Input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="e.g. South Delhi Route 1"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Route Code</label>
                                <Input
                                    name="code"
                                    value={formData.code}
                                    onChange={handleInputChange}
                                    placeholder="Optional e.g. R001"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Headquarters (HQ)</label>
                                <select
                                    name="hq"
                                    value={formData.hq}
                                    onChange={handleInputChange}
                                    required
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">Select HQ</option>
                                    {hqs.map((hq) => (
                                        <option key={hq._id} value={hq._id}>
                                            {hq.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Areas Covered</label>
                                <Input
                                    name="areas"
                                    value={formData.areas}
                                    onChange={handleInputChange}
                                    placeholder="Comma separated e.g. Saket, Malviya Nagar"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Separate multiple areas with commas</p>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="h-4 w-4"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium">Active Status</label>
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
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoutingList;
