import React, { useState, useEffect } from 'react';
import { createDoctor, updateDoctor } from '../../api/doctor.api';
import { getHQs } from '../../api/hq.api';
import MapmyIndiaSearch from '../../components/MapmyIndiaSearch';
import { useAuth } from '../../context/AuthContext';

interface DoctorFormProps {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

const DoctorForm: React.FC<DoctorFormProps> = ({ onClose, onSuccess, initialData }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        routeFrom: '',
        routeTo: '',
        date: new Date().toISOString().split('T')[0],
        area: '',
        speciality: '',
        hq: user?.role === 'hq' ? user.hq : '',
        clinicAddress: '',
        residentialAddress: '',
        class: 'General',
        frequency: 1,
        mobile: '',
        phone: '',
        email: '',
        location: {
            type: 'Point',
            coordinates: [0, 0] // [lng, lat]
        },
        rejectedRemark: '',
        approvalStatus: 'Pending'
    });
    const [hqs, setHqs] = useState<any[]>([]);

    useEffect(() => {
        loadHQs();
        if (initialData) {
            setFormData({
                ...formData,
                ...initialData,
                hq: initialData.hq?._id || initialData.hq // Handle populated object or ID
            });
        }
    }, [initialData]);

    const loadHQs = async () => {
        try {
            const res = await getHQs();
            if (res.success) {
                setHqs(res.data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleLocationSelect = (address: string, lat?: number, lng?: number) => {
        setFormData(prev => ({
            ...prev,
            clinicAddress: address,
            location: (lat && lng) ? {
                type: 'Point',
                coordinates: [lng, lat]
            } : prev.location
        }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (initialData) {
                await updateDoctor(initialData._id, formData);
            } else {
                await createDoctor(formData);
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert('Failed to save doctor');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-card p-6 rounded-lg w-full max-w-4xl my-8">
                <h2 className="text-xl font-bold mb-4">{initialData ? 'Edit Doctor' : 'Add Doctor'}</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Basic Info */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Dr Name *</label>
                        <input name="name" value={formData.name} onChange={handleChange} className="w-full border p-2 rounded" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Dr Code</label>
                        <input name="code" value={formData.code} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>

                    {/* Location */}
                    {/* Location */}
                    <div className="md:col-span-2 grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">HQ *</label>
                            <select
                                name="hq"
                                value={formData.hq || (user?.role === 'hq' ? user.hq : '')}
                                onChange={handleChange}
                                className="w-full border p-2 rounded disabled:bg-gray-100"
                                required
                                disabled={user?.role === 'hq'}
                            >
                                <option value="">Select HQ</option>
                                {hqs.map(hq => (
                                    <option key={hq._id} value={hq._id}>{hq.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Date</label>
                            <input type="date" name="date" value={formData.date?.split('T')[0]} onChange={handleChange} className="w-full border p-2 rounded" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Route From *</label>
                        <input name="routeFrom" value={formData.routeFrom} onChange={handleChange} className="w-full border p-2 rounded" required placeholder="Start Point" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Route To *</label>
                        <input name="routeTo" value={formData.routeTo} onChange={handleChange} className="w-full border p-2 rounded" required placeholder="End Point" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Area *</label>
                        <input name="area" value={formData.area} onChange={handleChange} className="w-full border p-2 rounded" required />
                    </div>

                    {/* Professional Info */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Speciality *</label>
                        <input name="speciality" value={formData.speciality} onChange={handleChange} className="w-full border p-2 rounded" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Class</label>
                        <select name="class" value={formData.class} onChange={handleChange} className="w-full border p-2 rounded">
                            <option value="General">General</option>
                            <option value="Core">Core</option>
                            <option value="Super Core">Super Core</option>
                            <option value="Important">Important</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Frequency</label>
                        <input type="number" name="frequency" value={formData.frequency} onChange={handleChange} className="w-full border p-2 rounded" min="1" />
                    </div>

                    {/* Contact - Addresses */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Clinic Address *</label>
                        <MapmyIndiaSearch
                            value={formData.clinicAddress}
                            onSelect={handleLocationSelect}
                            placeholder="Search Clinic Location..."
                            className="w-full"
                        />
                        {formData.location?.coordinates[0] !== 0 && (
                            <p className="text-xs text-green-600 mt-1">Location Coordinates Captured</p>
                        )}
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Residential Address</label>
                        <input name="residentialAddress" value={formData.residentialAddress} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>

                    {/* Contact - Phones */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Mobile *</label>
                        <input name="mobile" value={formData.mobile} onChange={handleChange} className="w-full border p-2 rounded" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Phone</label>
                        <input name="phone" value={formData.phone} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>

                    {/* Admin Status */}

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Rejected Remark</label>
                        <input name="rejectedRemark" value={formData.rejectedRemark} onChange={handleChange} className="w-full border p-2 rounded" placeholder="Reason for rejection (if any)" />
                    </div>

                    <div className="md:col-span-2 flex justify-end gap-2 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-muted">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90">Save Doctor</button>
                    </div>
                </form>
            </div >
        </div >
    );
};

export default DoctorForm;
