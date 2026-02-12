import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import { getExpenses, updateExpenseStatus } from '../../api/expense.api';
import Modal from '../../components/ui/Modal';

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
                            <span className={`px-2 py-1 rounded text-xs ${row.status === 'Approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                row.status === 'Rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
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
            <Modal
                isOpen={showModal && !!selectedExpense}
                onClose={() => setShowModal(false)}
                title="Approve Expense"
                maxWidth="max-w-2xl"
            >
                <div className="max-h-[80vh] overflow-y-auto">
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Proof Image</label>
                        {selectedExpense?.imageUrl ? (
                            <div className="border rounded p-2 bg-muted/50 flex justify-center">
                                <img
                                    src={`http://localhost:5000/${selectedExpense.imageUrl}`}
                                    alt="Receipt"
                                    className="max-h-96 object-contain"
                                />
                            </div>
                        ) : (
                            <p className="text-muted-foreground italic">No image uploaded</p>
                        )}
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-1">Approved Amount</label>
                        <input
                            type="number"
                            value={approvalAmount}
                            onChange={(e) => setApprovalAmount(Number(e.target.value))}
                            className="w-full border p-2 rounded bg-background focus:ring-2 focus:ring-primary"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Original Claim: {selectedExpense?.amount}</p>
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
            </Modal>
        </div>
    );
};

export default ExpenseList;
