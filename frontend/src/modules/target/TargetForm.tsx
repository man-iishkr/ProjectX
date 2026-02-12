import React, { useState, useEffect } from 'react';
import { createBulkTargets } from '../../api/target.api';
import { getHQs } from '../../api/hq.api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/ui/Modal';

interface TargetFormProps {
    onClose: () => void;
    onSuccess: () => void;
}

const TargetForm: React.FC<TargetFormProps> = ({ onClose, onSuccess }) => {
    const { user } = useAuth();
    const [hq, setHq] = useState(user?.role === 'hq' ? (typeof user.hq === 'string' ? user.hq : user.hq?._id) : '');
    const [year, setYear] = useState(new Date().getFullYear());
    const [targets, setTargets] = useState<number[]>(new Array(12).fill(0));
    const [hqs, setHqs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadHQs();
    }, []);

    const loadHQs = async () => {
        try {
            const res = await getHQs();
            if (res.success) setHqs(res.data);
        } catch (err) { console.error(err); }
    };

    const handleTargetChange = (index: number, value: string) => {
        const newTargets = [...targets];
        newTargets[index] = parseFloat(value) || 0;
        setTargets(newTargets);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createBulkTargets({ hq, year, targets });
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            alert(err.error || 'Failed to save targets');
        } finally {
            setLoading(false);
        }
    };

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
        <Modal isOpen={true} onClose={onClose} maxWidth="max-w-2xl">
            <div>
                <h2 className="text-xl font-bold mb-4">Construct Annual Targets</h2>
                <form onSubmit={handleSubmit} className="space-y-4">

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Select HQ *</label>
                            <select
                                value={hq || (user?.role === 'hq' ? (typeof user.hq === 'string' ? user.hq : user.hq?._id) : '')}
                                onChange={(e) => setHq(e.target.value)}
                                className="w-full border p-2 rounded disabled:bg-muted disabled:text-muted-foreground bg-background text-foreground"
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
                            <label className="block text-sm font-medium mb-1">Select Year *</label>
                            <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="w-full border p-2 rounded bg-background text-foreground" required>
                                {[0, 1, 2].map(offset => {
                                    const y = new Date().getFullYear() + offset;
                                    return <option key={y} value={y}>{y}</option>;
                                })}
                            </select>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="font-semibold mb-3 text-sm text-foreground">Monthly Targets (₹)</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {months.map((month, index) => (
                                <div key={index}>
                                    <label className="block text-xs font-medium mb-1 text-muted-foreground">{month}</label>
                                    <input
                                        type="number"
                                        value={targets[index] || ''}
                                        onChange={(e) => handleTargetChange(index, e.target.value)}
                                        className="w-full border p-2 rounded text-sm bg-background text-foreground"
                                        placeholder="0"
                                        required
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400">
                            {loading ? 'Saving...' : 'Construct Targets'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default TargetForm;
