import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import { getEmployees, deleteEmployee, createEmployee, updateEmployee } from '../../api/employee.api';
import { getHQs } from '../../api/hq.api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { X, Pencil, Trash2, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const EmployeeList: React.FC = () => {
    const { user } = useAuth();
    const [employees, setEmployees] = useState<any[]>([]);
    const [hqs, setHQs] = useState<any[]>([]);
    const [selectedHQ, setSelectedHQ] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        username: '',
        password: '',
        role: 'employee',
        hq: '',
        designation: '',
        state: '',
        division: '',
        staffType: '',
        monthlyPay: '',
        distanceTravelled: 0
    });

    useEffect(() => {
        loadData();
    }, [selectedHQ]);

    const loadData = async () => {
        try {
            setLoading(true);
            // Fetch employees filtered by generic HQ selector
            const empPromise = getEmployees(selectedHQ);

            // Only fetch HQs if not already loaded and user is admin/HQ (likely admin needs list for filter)
            // But EmployeeList already fetched HQs for dropdown in form, so we can reuse or check length
            const promises: Promise<any>[] = [empPromise];
            if (hqs.length === 0) {
                promises.push(getHQs());
            }

            const [empRes, hqRes] = await Promise.all(promises);

            if (empRes.success) {
                setEmployees(empRes.data);
            }
            // If hqRes exists (meaning we fetched it above), set it
            if (hqRes && hqRes.success) {
                setHQs(hqRes.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const openCreateModal = () => {
        setFormData({
            name: '',
            username: '',
            password: '',
            role: 'employee',
            hq: user?.role === 'hq' ? (typeof user.hq === 'string' ? user.hq : user.hq?._id) : '', // Auto-set HQ
            designation: '',
            state: '',
            division: '',
            staffType: '',
            monthlyPay: '',
            distanceTravelled: 0
        });
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const openEditModal = (employee: any) => {
        setFormData({
            name: employee.name,
            username: employee.username,
            password: '', // Leave empty to not change
            role: employee.role,
            hq: employee.hq?._id || '',
            designation: employee.designation || '',
            state: employee.state || '',
            division: employee.division || '',
            staffType: employee.staffType || '',
            monthlyPay: employee.monthlyPay || '',
            distanceTravelled: employee.distanceTravelled || 0
        });
        setCurrentId(employee._id);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && currentId) {
                const dataToSend = { ...formData };
                if (!dataToSend.password) delete (dataToSend as any).password;

                await updateEmployee(currentId, dataToSend);
            } else {
                await createEmployee(formData);
            }
            setIsModalOpen(false);
            loadData();
        } catch (err) {
            console.error(err);
            alert('Operation failed');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure?')) {
            await deleteEmployee(id);
            loadData(); // Reload to refresh list
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Employees</h2>
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
                    <Button onClick={openCreateModal}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Employee
                    </Button>
                </div>
            </div>

            <Table
                data={employees}
                columns={[
                    { header: 'Emp ID', accessor: 'username' },
                    { header: 'Name', accessor: 'name' },
                    { header: 'Reporting HQ', accessor: (row) => row.hq?.name || 'N/A' },
                    { header: 'Division', accessor: 'division' },
                    { header: 'Staff Type', accessor: 'staffType' },
                    { header: 'Designation', accessor: 'designation' },
                    { header: 'State', accessor: 'state' },
                    { header: 'Monthly Pay', accessor: 'monthlyPay' },
                    { header: 'Dist. Travelled', accessor: 'distanceTravelled' },
                    { header: 'Role', accessor: 'role' },
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
                    <div className="bg-background p-6 rounded-lg w-full max-w-2xl shadow-lg relative my-8">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <h3 className="text-xl font-bold mb-4">{isEditing ? 'Edit Employee' : 'Add Employee'}</h3>

                        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Emp ID / Username</label>
                                <Input
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Name</label>
                                <Input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            {!isEditing && (
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Password</label>
                                    <Input
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required={!isEditing}
                                        minLength={6}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Minimum 6 characters</p>
                                </div>
                            )}

                            <div>
                                <label className="text-sm font-medium mb-1 block">Role</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="employee">Employee</option>
                                    <option value="hq">HQ Manager</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            {formData.role === 'employee' && (
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Reporting HQ</label>
                                    <select
                                        name="hq"
                                        value={formData.hq || (user?.role === 'hq' ? (typeof user.hq === 'string' ? user.hq : user.hq?._id) : '')}
                                        onChange={handleInputChange}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                        required={formData.role === 'employee'}
                                        disabled={user?.role === 'hq'}
                                    >
                                        <option value="">Select HQ</option>
                                        {hqs.map((hq) => (
                                            <option key={hq._id} value={hq._id}>
                                                {hq.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="text-sm font-medium mb-1 block">Designation</label>
                                <Input
                                    name="designation"
                                    value={formData.designation}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">State</label>
                                <Input
                                    name="state"
                                    value={formData.state}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Division/Dept</label>
                                <Input
                                    name="division"
                                    value={formData.division}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Staff Type</label>
                                <Input
                                    name="staffType"
                                    value={formData.staffType}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Monthly Pay</label>
                                <Input
                                    name="monthlyPay"
                                    type="number"
                                    value={formData.monthlyPay}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Distance Travelled</label>
                                <Input
                                    name="distanceTravelled"
                                    type="number"
                                    value={formData.distanceTravelled}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="col-span-2 flex justify-end gap-2 mt-4">
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
            )
            }
        </div >
    );
};

export default EmployeeList;
