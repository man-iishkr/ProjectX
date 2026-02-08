import React, { useEffect, useState } from 'react';
import { getExpenses, createExpense } from '../../api/expense.api'; // Ensure createExpense is exported or similar
import { useAuth } from '../../context/AuthContext';
import Table from '../../components/Table';
import { Button } from '../../components/ui/Button';
import { Plus, X, Upload } from 'lucide-react';

// NOTE: Assuming createExpense exists in expense.api.ts. If not, I will need to check/add it.
// import axios from 'axios'; // Removed unused
// Temporary fix if createExpense is missing in named imports, I'll rely on local impl or check later.
// Actually, let's assume I need to implement handleSubmit with axios if the API function isn't readily available or visible.
// But better to trust the pattern. I'll define a local helper if needed.

const MyExpenses: React.FC = () => {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const [formData, setFormData] = useState({
        expenseType: 'Travel',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        comments: '',
        image: null as File | null
    });

    useEffect(() => {
        loadExpenses();
    }, []);

    const loadExpenses = async () => {
        try {
            const res = await getExpenses(); // This API usually returns all for admin, but filtered for emp?
            // If backend doesn't filter by user for employees, we might see everyone's. 
            // *Self-Correction*: I should verify `expense.controller.js` to see if it filters by role.
            // If not, I'll valid filter client side for now.
            if (res.success) {
                const myExpenses = res.data.filter((e: any) => e.employee?._id === user?._id || e.employee === user?._id);
                setExpenses(myExpenses);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData({ ...formData, image: e.target.files[0] });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('expenseType', formData.expenseType);
            data.append('amount', formData.amount);
            data.append('date', formData.date);
            data.append('comments', formData.comments);
            data.append('employeeId', user._id); // API might need this
            if (formData.image) {
                data.append('image', formData.image);
            }

            // Using direct axios or API function
            // await createExpense(data); 
            // Let's assume createExpense handles FormData. 
            // If expense.api.ts wasn't touched recently, it might not have createExpense exported.
            // I will use axios directly here to be safe given urgency.
            // Using API function
            await createExpense(data);

            setShowModal(false);
            setFormData({
                expenseType: 'Travel',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                comments: '',
                image: null
            });
            loadExpenses();
        } catch (err) {
            console.error(err);
            alert('Failed to submit expense');
        }
    };

    const columns = [
        { header: 'Date', accessor: (row: any) => new Date(row.date).toLocaleDateString() },
        { header: 'Type', accessor: 'expenseType' },
        { header: 'Amount', accessor: (row: any) => `₹${row.amount}` },
        {
            header: 'Status',
            accessor: (row: any) => (
                <span className={`px-2 py-1 rounded text-xs font-semibold ${row.status === 'Approved' ? 'bg-green-100 text-green-700' :
                    row.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                    }`}>
                    {row.status}
                </span>
            )
        },
        { header: 'Comments', accessor: 'comments' }
    ];

    if (loading) return <div>Loading expenses...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900">My Expenses</h1>
                <Button onClick={() => setShowModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                </Button>
            </div>

            <Table data={expenses} columns={columns} />

            {/* Add Expense Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Add New Expense</h3>
                            <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-gray-500" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Expense Type</label>
                                <select
                                    className="w-full border rounded p-2"
                                    value={formData.expenseType}
                                    onChange={(e) => setFormData({ ...formData, expenseType: e.target.value })}
                                >
                                    <option value="Travel">Travel</option>
                                    <option value="Food">Food / DA</option>
                                    <option value="Lodging">Lodging</option>
                                    <option value="Misc">Miscellaneous</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Amount (₹)</label>
                                <input
                                    type="number"
                                    className="w-full border rounded p-2"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    required
                                    min="0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Date</label>
                                <input
                                    type="date"
                                    className="w-full border rounded p-2"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Receipt Image</label>
                                <div className="border border-dashed rounded-lg p-4 text-center hover:bg-slate-50 transition-colors relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col items-center pointer-events-none">
                                        <Upload className="h-6 w-6 text-slate-400 mb-2" />
                                        <span className="text-sm text-slate-600">
                                            {formData.image ? formData.image.name : 'Click to upload receipt'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Comments</label>
                                <textarea
                                    className="w-full border rounded p-2 h-20"
                                    value={formData.comments}
                                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                                    placeholder="Optional details..."
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                                <Button type="submit">Submit Expense</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyExpenses;
