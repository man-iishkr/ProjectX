import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import { getHQs, createHQ, deleteHQ } from '../../api/hq.api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/ui/Modal';

const HQList: React.FC = () => {
    const [hqs, setHQs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [formData, setFormData] = useState<any>({
        name: '',
        location: '',
        state: '',
        employeeStrength: '',
        managerStrength: '',
        transitDays: '',
        transportRemarks: ''
    });

    const { user } = useAuth();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await getHQs();
            if (res.success) {
                setHQs(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this HQ?')) {
            try {
                await deleteHQ(id);
                loadData();
            } catch (err: any) {
                console.error(err);
                alert(err?.response?.data?.error || 'Failed to delete HQ');
            }
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const submitData = {
                name: formData.name,
                location: formData.location,
                state: formData.state,
                ...(formData.employeeStrength && { employeeStrength: Number(formData.employeeStrength) }),
                ...(formData.managerStrength && { managerStrength: Number(formData.managerStrength) }),
                ...(formData.transitDays && { transitDays: Number(formData.transitDays) }),
                ...(formData.transportRemarks && { transportRemarks: formData.transportRemarks })
            };

            const response = await createHQ(submitData);

            if (response.success) {
                alert('HQ created successfully!');
                setIsModalOpen(false);
                loadData();
                setFormData({
                    name: '',
                    location: '',
                    state: '',
                    employeeStrength: '',
                    managerStrength: '',
                    transitDays: '',
                    transportRemarks: ''
                });
            }
        } catch (err: any) {
            console.error('Error creating HQ:', err);
            const errorMessage = err?.response?.data?.error || 'Failed to create HQ. Please try again.';
            alert(errorMessage);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">HQ Management</h2>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add HQ
                </Button>
            </div>

            <Table
                data={hqs}
                columns={[
                    { header: 'Name', accessor: 'name' },
                    { header: 'Location', accessor: 'location' },
                    { header: 'State', accessor: 'state' },
                    { header: 'Emp. Strength', accessor: (row) => row.employeeStrength || 0 },
                    { header: 'Mgr. Strength', accessor: (row) => row.managerStrength || 0 },
                    { header: 'Transit Days', accessor: (row) => row.transitDays || 0 },
                    { header: 'Transport', accessor: (row) => row.transportRemarks || '-' },
                ]}
                actions={(row) => (
                    <div className="flex gap-2">
                        {user?.role === 'admin' && (
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(row._id)}>
                                <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                        )}
                    </div>
                )}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add HQ"
                maxWidth="max-w-md"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block">Name</label>
                        <Input
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            placeholder="e.g. Delhi HQ"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1 block">Location <span className="text-muted-foreground text-xs">(optional)</span></label>
                        <Input
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            placeholder="e.g. Mumbai, Maharashtra"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1 block">State</label>
                        <select
                            name="state"
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <option value="">Select State</option>
                            {['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'].map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>



                    <div>
                        <label className="text-sm font-medium mb-1 block">Employee Strength</label>
                        <Input
                            name="employeeStrength"
                            type="number"
                            value={formData.employeeStrength}
                            onChange={handleInputChange}
                            placeholder="Optional"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1 block">Manager Strength</label>
                        <Input
                            name="managerStrength"
                            type="number"
                            value={formData.managerStrength}
                            onChange={handleInputChange}
                            placeholder="Optional"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1 block">Transit Days</label>
                        <Input
                            name="transitDays"
                            type="number"
                            value={formData.transitDays}
                            onChange={handleInputChange}
                            placeholder="Optional"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1 block">Transport Remarks</label>
                        <Input
                            name="transportRemarks"
                            value={formData.transportRemarks}
                            onChange={handleInputChange}
                            placeholder="Optional - e.g., Via flight, Train, etc."
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
            </Modal>
        </div>
    );
};

export default HQList;
