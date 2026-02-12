import React, { useState, useEffect } from 'react';
import { createChemist, updateChemist } from '../../api/chemist.api';
import { getHQs } from '../../api/hq.api';
import Modal from '../../components/ui/Modal';

interface ChemistFormProps {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

const ChemistForm: React.FC<ChemistFormProps> = ({ onClose, onSuccess, initialData }) => {
    const [formData, setFormData] = useState({
        name: '',
        contactPerson: '',
        hq: '',
        address: '',
        latitude: '',
        longitude: '',
        phone: '',
        email: ''
    });
    const [hqs, setHqs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadHQs();
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                contactPerson: initialData.contactPerson || '',
                hq: initialData.hq?._id || initialData.hq || '',
                address: initialData.address || '',
                latitude: initialData.location?.coordinates?.[1]?.toString() || '',
                longitude: initialData.location?.coordinates?.[0]?.toString() || '',
                phone: initialData.phone || '',
                email: initialData.email || ''
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Ensure lat/lng are present if required by backend, or at least dummy ones if not strictly validated for logic but required for schema
            // Mongoose model requires location.
            const payload = { ...formData };
            if (!payload.latitude) payload.latitude = '0'; // Default to 0 if missing/not crucial logic-wise but required by schema
            if (!payload.longitude) payload.longitude = '0';

            if (initialData) {
                await updateChemist(initialData._id, payload);
            } else {
                await createChemist(payload);
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            alert(err.error || 'Failed to save chemist');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} maxWidth="max-w-2xl">
            <div>
                <h2 className="text-xl font-bold mb-4">{initialData ? 'Edit Chemist' : 'Add Chemist'}</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Chemist Name *</label>
                        <input name="name" value={formData.name} onChange={handleChange} className="w-full border p-2 rounded bg-background text-foreground" required />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Contact Person *</label>
                        <input name="contactPerson" value={formData.contactPerson} onChange={handleChange} className="w-full border p-2 rounded bg-background text-foreground" required />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">HQ *</label>
                        <select name="hq" value={formData.hq} onChange={handleChange} className="w-full border p-2 rounded bg-background text-foreground" required>
                            <option value="">Select HQ</option>
                            {hqs.map(hq => (
                                <option key={hq._id} value={hq._id}>{hq.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Address *</label>
                        <input name="address" value={formData.address} onChange={handleChange} className="w-full border p-2 rounded bg-background text-foreground" required />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Location Coordinates</label>
                        <div className="flex gap-2 items-center">
                            <button
                                type="button"
                                onClick={() => {
                                    if (navigator.geolocation) {
                                        navigator.geolocation.getCurrentPosition(
                                            (position) => {
                                                setFormData({
                                                    ...formData,
                                                    latitude: position.coords.latitude.toString(),
                                                    longitude: position.coords.longitude.toString()
                                                });
                                            },
                                            (error) => {
                                                console.error("Error getting location: ", error);
                                                alert("Unable to retrieve your location. Please ensure location services are enabled.");
                                            }
                                        );
                                    } else {
                                        alert("Geolocation is not supported by this browser.");
                                    }
                                }}
                                className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                            >
                                Use Current Location
                            </button>
                            <div className="flex-1 flex gap-2">
                                <input
                                    type="text"
                                    value={formData.latitude}
                                    placeholder="Latitude"
                                    className="w-full border p-2 rounded bg-slate-100 dark:bg-muted text-foreground cursor-not-allowed"
                                    readOnly
                                />
                                <input
                                    type="text"
                                    value={formData.longitude}
                                    placeholder="Longitude"
                                    className="w-full border p-2 rounded bg-slate-100 dark:bg-muted text-foreground cursor-not-allowed"
                                    readOnly
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Mobile</label>
                        <input name="phone" value={formData.phone} onChange={handleChange} className="w-full border p-2 rounded bg-background text-foreground" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full border p-2 rounded bg-background text-foreground" />
                    </div>

                    <div className="md:col-span-2 flex justify-end gap-2 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-muted">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50">
                            {loading ? 'Saving...' : 'Save Chemist'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default ChemistForm;
