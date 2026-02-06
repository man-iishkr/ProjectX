import React, { useState, useEffect } from 'react';
import { createStockist, updateStockist } from '../../api/stockist.api';
import { getHQs } from '../../api/hq.api';
import { useAuth } from '../../context/AuthContext';

interface StockistFormProps {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

const StockistForm: React.FC<StockistFormProps> = ({ onClose, onSuccess, initialData }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        hq: user?.role === 'hq' ? (typeof user.hq === 'string' ? user.hq : user.hq?._id) : '',
        address: '',
        contact: '',
        status: 'Active'
    });
    const [hqs, setHqs] = useState<any[]>([]);

    useEffect(() => {
        loadHQs();
        if (initialData) {
            setFormData({
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (initialData) {
                await updateStockist(initialData._id, formData);
            } else {
                await createStockist(formData);
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert('Failed to save stockist');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card p-6 rounded-lg w-full max-w-2xl">
                <h2 className="text-xl font-bold mb-4">{initialData ? 'Edit Stockist' : 'Add Stockist'}</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div>
                        <label className="block text-sm font-medium mb-1">Name *</label>
                        <input name="name" value={formData.name} onChange={handleChange} className="w-full border p-2 rounded" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Code</label>
                        <input name="code" value={formData.code} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">HQ *</label>
                        <select
                            name="hq"
                            value={formData.hq || (user?.role === 'hq' ? (typeof user.hq === 'string' ? user.hq : user.hq?._id) : '')}
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
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select name="status" value={formData.status} onChange={handleChange} className="w-full border p-2 rounded">
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Address</label>
                        <input name="address" value={formData.address} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Contact</label>
                        <input name="contact" value={formData.contact} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>

                    <div className="md:col-span-2 flex justify-end gap-2 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-muted">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90">Save Stockist</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StockistForm;
