import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import { getExpenses, updateExpenseStatus } from '../../api/expense.api';

const ExpenseList: React.FC = () => {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedExpense, setSelectedExpense] = useState<any>(null);
    const [approvalAmount, setApprovalAmount] = useState<number>(0);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        loadExpenses();
    }, []);

    const loadExpenses = async () => {
        try {
            const res = await getExpenses();
            if (res.success) {
                setExpenses(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveClick = (expense: any) => {
        setSelectedExpense(expense);
        setApprovalAmount(expense.amount);
        setShowModal(true);
    };

    const handleConfirmApprove = async () => {
        if (!selectedExpense) return;
        try {
            await updateExpenseStatus(selectedExpense._id, 'Approved', approvalAmount);
            setShowModal(false);
            loadExpenses();
        } catch (err) {
            console.error(err);
            alert('Failed to approve');
        }
    };

    const handleReject = async (id: string) => {
        if (window.confirm('Reject this expense?')) {
            try {
                await updateExpenseStatus(id, 'Rejected');
                loadExpenses();
            } catch (err) {
                console.error(err);
            }
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Expense Approvals</h2>
            </div>

            <Table
                data={expenses}
                columns={[
                    { header: 'Employee', accessor: (row) => row.employee?.name || 'Unknown' },
                    { header: 'Date', accessor: (row) => new Date(row.date).toLocaleDateString() },
                    { header: 'Type', accessor: 'expenseType' },
                    { header: 'Amount', accessor: 'amount' },
                    {
                        header: 'Status', accessor: (row) => (
                            <span className={`px-2 py-1 rounded text-xs ${row.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                    row.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                }`}>
                                {row.status}
                            </span>
                        )
                    },
                    {
                        header: 'Image', accessor: (row) => (
                            row.imageUrl ? (
                                <a href={`http://localhost:5000/${row.imageUrl}`} target="_blank" rel="noreferrer" className="text-blue-500 underline text-xs">View</a>
                            ) : 'No Image'
                        )
                    },
                ]}
                actions={(row: any) => (
                    <div className="flex gap-2">
                        {row.status === 'Pending' && (
                            <>
                                <button
                                    onClick={() => handleApproveClick(row)}
                                    className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleReject(row._id)}
                                    className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                                >
                                    Reject
                                </button>
                            </>
                        )}
                    </div>
                )}
            />

            {/* Approval Modal */}
            {showModal && selectedExpense && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">Approve Expense</h3>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Proof Image</label>
                            {selectedExpense.imageUrl ? (
                                <div className="border rounded p-2 bg-gray-50 flex justify-center">
                                    <img
                                        src={`http://localhost:5000/${selectedExpense.imageUrl}`}
                                        alt="Receipt"
                                        className="max-h-96 object-contain"
                                    />
                                </div>
                            ) : (
                                <p className="text-gray-500 italic">No image uploaded</p>
                            )}
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Approved Amount</label>
                            <input
                                type="number"
                                value={approvalAmount}
                                onChange={(e) => setApprovalAmount(Number(e.target.value))}
                                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Original Claim: {selectedExpense.amount}</p>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border rounded hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmApprove}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                Confirm Approval
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpenseList;
