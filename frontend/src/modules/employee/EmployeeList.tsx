import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import { deleteEmployee, createEmployee, updateEmployee } from '../../api/employee.api';
import { getHQs } from '../../api/hq.api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Pencil, Trash2, Plus, Search, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/ui/Modal';
import axios from 'axios';
import api from '../../api/axios';
import RecordDetailModal from '../../components/ui/RecordDetailModal';
import { exportToExcel } from '../../utils/exportToExcel';

const ROLE_OPTIONS = [
    { value: 'bde', label: 'BDE (Business Development Executive)' },
    { value: 'asm', label: 'ASM (Area Sales Manager)' },
    { value: 'rsm', label: 'RSM (Regional Sales Manager)' },
    { value: 'sm', label: 'SM (Sales Manager)' },
    { value: 'admin', label: 'Admin' },
];

const DESIGNATION_MAP: Record<string, string> = {
    bde: 'BDE',
    asm: 'ASM',
    rsm: 'RSM',
    sm: 'SM',
    admin: 'Admin',
};

const EmployeeList: React.FC = () => {
    const { user } = useAuth();
    const [employees, setEmployees] = useState<any[]>([]);
    const [hqs, setHQs] = useState<any[]>([]);
    const [managers, setManagers] = useState<any[]>([]);
    const [selectedHQ, setSelectedHQ] = useState('');
    const [employeeStatus, setEmployeeStatus] = useState<'active' | 'past'>('active');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [viewingEmployee, setViewingEmployee] = useState<any>(null);

    const emptyForm = {
        name: '',
        username: '',
        password: '',
        role: 'bde',
        hq: '',
        reportingTo: '',
        designation: 'BDE',
        state: '',
        division: '',
        staffType: '',
        salaryDetails: {
            basicPay: '', eduAllow: '', conveyance: '', splAllow: '', vme: '', hra: '', pf: ''
        },
        allowanceRates: {
            hqAllowance: '', xStationAllowance: '', offStationAllowance: ''
        },
        distanceTravelled: 0,
        joiningDate: '',
        resignationDate: '',
        aadharCard: '',
        panCard: '',
        mobile: '',
        address: '',
        pincode: '',
        city: ''
    };

    const [formData, setFormData] = useState(emptyForm);

    useEffect(() => {
        loadData();
    }, [selectedHQ, employeeStatus]);

    // Refresh reporting managers when role changes
    useEffect(() => {
        if (formData.role) {
            loadManagers(formData.role);
        }
    }, [formData.role]);

    const loadData = async () => {
        try {
            setLoading(true);
            const params: any = { status: employeeStatus };
            if (selectedHQ) params.hq = selectedHQ;

            const [empRes, hqRes] = await Promise.all([
                api.get('/employees', { params }),
                hqs.length === 0 ? getHQs() : Promise.resolve(null)
            ]);

            if (empRes.data?.success) setEmployees(empRes.data.data);
            if (hqRes?.success) setHQs(hqRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadManagers = async (forRole: string) => {
        try {
            const res = await api.get('/employees/managers', { params: { forRole } });
            if (res.data?.success) {
                setManagers(res.data.data);
            }
        } catch (err) {
            console.error('Failed to load managers', err);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            // Keep designation in sync with role
            ...(name === 'role' ? { designation: DESIGNATION_MAP[value] || value.toUpperCase() } : {})
        }));

        if (name === 'pincode' && value.length === 6) {
            fetchPincodeDetails(value);
        }
    };

    const fetchPincodeDetails = async (pincode: string) => {
        try {
            const res = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
            if (res.data && res.data[0].Status === 'Success') {
                const details = res.data[0].PostOffice[0];
                setFormData(prev => ({
                    ...prev,
                    city: details.District,
                    state: details.State
                }));
            }
        } catch (err) {
            console.error("Failed to fetch pincode details", err);
        }
    };

    const handleNestedInputChange = (category: 'salaryDetails' | 'allowanceRates', e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [category]: {
                ...prev[category] as any,
                [name]: value
            }
        }));
    };

    const openCreateModal = () => {
        setFormData(emptyForm);
        setIsEditing(false);
        loadManagers('bde');
        setIsModalOpen(true);
    };

    const openEditModal = (employee: any) => {
        setFormData({
            name: employee.name,
            username: employee.username,
            password: '',
            role: employee.role || 'bde',
            hq: employee.hq?._id || '',
            reportingTo: employee.reportingTo?._id || '',
            designation: employee.designation || DESIGNATION_MAP[employee.role] || '',
            state: employee.state || '',
            division: employee.division || '',
            staffType: employee.staffType || '',
            salaryDetails: {
                basicPay: employee.salaryDetails?.basicPay || '',
                eduAllow: employee.salaryDetails?.eduAllow || '',
                conveyance: employee.salaryDetails?.conveyance || '',
                splAllow: employee.salaryDetails?.splAllow || '',
                vme: employee.salaryDetails?.vme || '',
                hra: employee.salaryDetails?.hra || '',
                pf: employee.salaryDetails?.pf || ''
            },
            allowanceRates: {
                hqAllowance: employee.allowanceRates?.hqAllowance || '',
                xStationAllowance: employee.allowanceRates?.xStationAllowance || '',
                offStationAllowance: employee.allowanceRates?.offStationAllowance || ''
            },
            distanceTravelled: employee.distanceTravelled || 0,
            joiningDate: employee.joiningDate ? employee.joiningDate.split('T')[0] : '',
            resignationDate: employee.resignationDate ? employee.resignationDate.split('T')[0] : '',
            aadharCard: employee.aadharCard || '',
            panCard: employee.panCard || '',
            mobile: employee.mobile || '',
            address: employee.address || '',
            pincode: employee.pincode || '',
            city: employee.city || ''
        });
        setCurrentId(employee._id);
        setIsEditing(true);
        loadManagers(employee.role || 'bde');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Strict Validation
        if (formData.aadharCard.length !== 12) {
            alert('Aadhar Card must be exactly 12 digits');
            return;
        }
        if (formData.mobile.length !== 10) {
            alert('Mobile Number must be exactly 10 digits');
            return;
        }
        if (formData.panCard.length !== 10) {
            alert('PAN Card must be exactly 10 characters');
            return;
        }

        try {
            const dataToSend: any = { ...formData };
            if (!dataToSend.reportingTo) delete dataToSend.reportingTo;

            if (isEditing && currentId) {
                if (!dataToSend.password) delete dataToSend.password;
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
            loadData();
        }
    };

    const columns = [
        { header: 'Emp ID', accessor: 'username' },
        { header: 'Name', accessor: 'name' },
        { header: 'Mobile', accessor: 'mobile' },
        { header: 'HQ', accessor: (row: any) => row.hq?.name || 'N/A' },
        { header: 'Designation', accessor: 'designation' },
        { header: 'Role', accessor: 'role' },
        { header: 'Reporting To', accessor: (row: any) => row.reportingTo ? `${row.reportingTo.name} (${row.reportingTo.designation})` : '-' },
        { header: 'State', accessor: 'state' },
        { header: 'Join Date', accessor: (row: any) => row.joiningDate ? new Date(row.joiningDate).toLocaleDateString() : '-' },
        ...(employeeStatus === 'past' ? [{ header: 'Resignation', accessor: (row: any) => row.resignationDate ? new Date(row.resignationDate).toLocaleDateString() : '-' }] : []),
    ];

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-semibold">Employees</h2>
                    <div className="flex gap-2 mt-2">
                        <Button
                            variant={employeeStatus === 'active' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setEmployeeStatus('active')}
                        >
                            Active Employees
                        </Button>
                        <Button
                            variant={employeeStatus === 'past' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setEmployeeStatus('past')}
                        >
                            Past Employees
                        </Button>
                    </div>
                </div>

                <div className="flex gap-4 items-center">
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
                            onClick={() => exportToExcel(employees, 'Employees_Export')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded flex items-center h-10 text-sm font-medium"
                        >
                            Export Excel
                        </button>
                    )}
                    <Button onClick={openCreateModal}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Employee
                    </Button>
                </div>
            </div>

            <Table
                data={employees}
                columns={columns}
                actions={(row) => (
                    <div className="flex gap-2">
                        {user?.role === 'admin' && (
                            <Button variant="ghost" size="icon" onClick={() => setViewingEmployee(row)} title="View Details">
                                <Eye className="h-4 w-4 text-slate-400 hover:text-blue-600" />
                            </Button>
                        )}
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

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={isEditing ? 'Edit Employee' : 'Add Employee'}
                maxWidth="max-w-4xl"
            >
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Basic Info */}
                    <div className="md:col-span-3 lg:col-span-3 font-semibold text-lg border-b pb-1 mb-2">Basic Info</div>

                    <div>
                        <label className="text-sm font-medium mb-1 block">Emp ID / Username *</label>
                        <Input
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            required
                            className="bg-background"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1 block">Name *</label>
                        <Input
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="bg-background"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1 block">
                            Password {isEditing ? <span className="text-muted-foreground font-normal text-xs">(leave blank to keep current)</span> : '*'}
                        </label>
                        <Input
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            required={!isEditing}
                            placeholder={isEditing ? 'Leave blank to keep current' : 'Min 6 characters'}
                            className="bg-background"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1 block">Role *</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleInputChange}
                            required
                            className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
                        >
                            {ROLE_OPTIONS.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                    </div>

                    {!isEditing && (
                        <div>
                            <label className="text-sm font-medium mb-1 block">Password *</label>
                            <Input
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                required={!isEditing}
                                minLength={6}
                                className="bg-background"
                            />
                        </div>
                    )}

                    {/* Official Details */}
                    <div className="md:col-span-3 lg:col-span-3 font-semibold text-lg border-b pb-1 mb-2 mt-4">Official Details</div>

                    <div>
                        <label className="text-sm font-medium mb-1 block">Joining Date *</label>
                        <Input
                            name="joiningDate"
                            type="date"
                            value={formData.joiningDate}
                            onChange={handleInputChange}
                            required
                            className="bg-background"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1 block">Reporting To *</label>
                        <select
                            name="reportingTo"
                            value={formData.reportingTo}
                            onChange={handleInputChange}
                            required={formData.role !== 'admin' && formData.role !== 'sm'}
                            className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
                        >
                            <option value="">None (Reports to Admin)</option>
                            {managers.map((m: any) => (
                                <option key={m._id} value={m._id}>
                                    {m.name} ({m.designation || m.role?.toUpperCase()})
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-muted-foreground mt-1">Only higher-designation employees shown</p>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1 block">Reporting HQ *</label>
                        <select
                            name="hq"
                            value={formData.hq}
                            onChange={handleInputChange}
                            className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
                            required
                        >
                            <option value="">Select HQ</option>
                            {hqs.map((hq) => (
                                <option key={hq._id} value={hq._id}>
                                    {hq.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-3 lg:col-span-3 font-semibold text-lg border-b pb-1 mb-2 mt-4">Salary Structure (Monthly)</div>
                    {[
                        { label: 'Basic Pay', name: 'basicPay' },
                        { label: 'H.R.A.', name: 'hra' },
                        { label: 'Edu Allowance', name: 'eduAllow' },
                        { label: 'Conveyance', name: 'conveyance' },
                        { label: 'Special Allowance', name: 'splAllow' },
                        { label: 'VME', name: 'vme' },
                    ].map(field => (
                        <div key={field.name}>
                            <label className="text-sm font-medium mb-1 block">{field.label}</label>
                            <Input
                                name={field.name}
                                type="number"
                                value={(formData.salaryDetails as any)[field.name]}
                                onChange={(e) => handleNestedInputChange('salaryDetails', e)}
                                className="bg-background"
                            />
                        </div>
                    ))}

                    <div className="md:col-span-3 lg:col-span-3 font-semibold text-lg border-b pb-1 mb-2 mt-4 text-destructive">Reductions / Deductions</div>
                    {[
                        { label: 'Provident Fund (PF)', name: 'pf' },
                    ].map(field => (
                        <div key={field.name}>
                            <label className="text-sm font-medium mb-1 block text-destructive">{field.label}</label>
                            <Input
                                name={field.name}
                                type="number"
                                value={(formData.salaryDetails as any)[field.name]}
                                onChange={(e) => handleNestedInputChange('salaryDetails', e)}
                                className="bg-background"
                            />
                        </div>
                    ))}

                    <div className="md:col-span-3 lg:col-span-3 font-semibold text-lg border-b pb-1 mb-2 mt-4 text-primary">Daily Operational Limits</div>
                    {[
                        { label: 'HQ Allowance / Day', name: 'hqAllowance' },
                        { label: 'X-Station Allowance / Day', name: 'xStationAllowance' },
                        { label: 'Off-Station Allowance / Day', name: 'offStationAllowance' },
                    ].map(field => (
                        <div key={field.name}>
                            <label className="text-sm font-medium mb-1 block text-primary">{field.label}</label>
                            <Input
                                name={field.name}
                                type="number"
                                value={(formData.allowanceRates as any)[field.name]}
                                onChange={(e) => handleNestedInputChange('allowanceRates', e)}
                                className="bg-background"
                            />
                        </div>
                    ))}

                    <div>
                        <label className="text-sm font-medium mb-1 block">Resignation Date</label>
                        <Input
                            name="resignationDate"
                            type="date"
                            value={formData.resignationDate}
                            onChange={handleInputChange}
                            className="bg-background"
                        />
                        <p className="text-xs text-muted-foreground">Set this to move employee to "Past"</p>
                    </div>

                    {/* Personal & Address */}
                    <div className="md:col-span-3 lg:col-span-3 font-semibold text-lg border-b pb-1 mb-2 mt-4">Personal & Address</div>

                    <div>
                        <label className="text-sm font-medium mb-1 block">Mobile No. *</label>
                        <Input
                            name="mobile"
                            value={formData.mobile}
                            onChange={handleInputChange}
                            required
                            maxLength={10}
                            minLength={10}
                            className="bg-background"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1 block">Aadhar Card *</label>
                        <Input
                            name="aadharCard"
                            value={formData.aadharCard}
                            onChange={handleInputChange}
                            required
                            maxLength={12}
                            minLength={12}
                            className="bg-background"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1 block">PAN Card *</label>
                        <Input
                            name="panCard"
                            value={formData.panCard}
                            onChange={handleInputChange}
                            required
                            maxLength={10}
                            minLength={10}
                            className="bg-background uppercase"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="text-sm font-medium mb-1 block">Address *</label>
                        <Input
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            required
                            className="bg-background"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1 block">Pincode *</label>
                        <div className="relative">
                            <Input
                                name="pincode"
                                value={formData.pincode}
                                onChange={handleInputChange}
                                required
                                maxLength={6}
                                minLength={6}
                                className="bg-background"
                                placeholder="Auto-fetches City/State"
                            />
                            {formData.pincode.length === 6 && (
                                <div className="absolute right-3 top-2.5 text-green-500">
                                    <Search className="h-4 w-4" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1 block">City</label>
                        <Input
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            required
                            className="bg-background"
                            readOnly
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1 block">State</label>
                        <Input
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            required
                            className="bg-background"
                            readOnly
                        />
                    </div>

                    <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-end gap-2 mt-6">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {isEditing ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </form>
            </Modal>
            {viewingEmployee && (
                <RecordDetailModal
                    record={viewingEmployee}
                    title={`Employee: ${viewingEmployee.name || ''}`}
                    onClose={() => setViewingEmployee(null)}
                />
            )}
        </div>
    );
};

export default EmployeeList;
