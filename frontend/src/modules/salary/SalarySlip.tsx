import React, { useRef } from 'react';
import { X, Printer } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface SalarySlipProps {
    isOpen: boolean;
    onClose: () => void;
    salary: any;
}

const SalarySlip: React.FC<SalarySlipProps> = ({ isOpen, onClose, salary }) => {
    const slipRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    const handlePrint = () => {
        const printContent = slipRef.current?.innerHTML;
        const originalContents = document.body.innerHTML;

        if (printContent) {
            document.body.innerHTML = printContent;
            window.print();
            document.body.innerHTML = originalContents;
            // React state might break after replacing body HTML, typically reloading or using iframe is better
            // For simplicity in this demo, just reloading logic or simple window.print if styled for print
            window.location.reload();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="relative w-full max-w-3xl rounded-lg bg-card shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h2 className="text-xl font-semibold">Salary Slip</h2>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handlePrint}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                        </Button>
                        <button onClick={onClose} className="rounded-full p-1 hover:bg-muted/10">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="p-8" ref={slipRef}>
                    <div className="mb-8 text-center border-b pb-6">
                        <h1 className="text-2xl font-bold text-foreground">FIELD ERP COMPANY</h1>
                        <p className="text-muted-foreground">Corporate Office: Mumbai, India</p>
                        <h2 className="mt-4 text-lg font-semibold uppercase text-muted-foreground">
                            Payslip for {new Date(salary.period.year, salary.period.month - 1).toLocaleString('default', { month: 'long' })} {salary.period.year}
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8 text-sm">
                        <div className="space-y-1">
                            <p><span className="font-semibold w-32 inline-block">Employee Name:</span> {salary.employee.name}</p>
                            <p><span className="font-semibold w-32 inline-block">Designation:</span> {salary.employee.designation || 'N/A'}</p>
                            <p><span className="font-semibold w-32 inline-block">Department:</span> Sales</p>
                        </div>
                        <div className="space-y-1">
                            <p><span className="font-semibold w-32 inline-block">Staff ID:</span> {salary.employee.employeeId || salary.employee.username}</p>
                            <p><span className="font-semibold w-32 inline-block">Bank Acc:</span> {salary.employee.bankDetails?.accountNumber || 'N/A'}</p>
                            <p><span className="font-semibold w-32 inline-block">Working Days:</span> {salary.workingDays?.total || 30}</p>
                        </div>
                    </div>

                    <div className="border rounded-lg overflow-hidden mb-8">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-foreground w-1/2">Earnings</th>
                                    <th className="px-4 py-3 text-right font-semibold text-foreground">Amount (₹)</th>
                                    <th className="px-4 py-3 text-left font-semibold text-foreground w-1/2 border-l">Deductions</th>
                                    <th className="px-4 py-3 text-right font-semibold text-foreground">Amount (₹)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                <tr>
                                    <td className="px-4 py-2">Basic Salary</td>
                                    <td className="px-4 py-2 text-right">{salary.baseSalary?.toLocaleString() || 0}</td>
                                    <td className="px-4 py-2 border-l">Provident Fund</td>
                                    <td className="px-4 py-2 text-right">{salary.deductions?.pf?.toLocaleString() || 0}</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2">HRA</td>
                                    <td className="px-4 py-2 text-right">{salary.allowances?.hra?.toLocaleString() || 0}</td>
                                    <td className="px-4 py-2 border-l">Professional Tax</td>
                                    <td className="px-4 py-2 text-right">{salary.deductions?.tax?.toLocaleString() || 0}</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2">Special Allowance</td>
                                    <td className="px-4 py-2 text-right">{salary.allowances?.others?.toLocaleString() || 0}</td>
                                    <td className="px-4 py-2 border-l">Income Tax</td>
                                    <td className="px-4 py-2 text-right">0</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2 text-blue-600 dark:text-blue-400 font-medium">Approved Expenses</td>
                                    <td className="px-4 py-2 text-right text-blue-600 dark:text-blue-400 font-medium">{salary.approvedExpenses?.toLocaleString() || 0}</td>
                                    <td className="px-4 py-2 border-l">Loan Retrieval</td>
                                    <td className="px-4 py-2 text-right">{salary.deductions?.loanRepayment?.toLocaleString() || 0}</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2 text-indigo-600 dark:text-indigo-400 font-medium">
                                        Travel Allowance
                                        <span className="text-xs text-muted-foreground ml-1">
                                            ({salary.allowances?.ta > 0 ? `${Math.round(salary.allowances.ta / 10)} km × ₹10` : '0 km'})
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-right text-indigo-600 dark:text-indigo-400 font-medium">{salary.allowances?.ta?.toLocaleString() || 0}</td>
                                    <td className="px-4 py-2 border-l">Insurance</td>
                                    <td className="px-4 py-2 text-right">{salary.deductions?.insurance?.toLocaleString() || 0}</td>
                                </tr>
                                <tr className="bg-muted/30 font-bold border-t border-b-2">
                                    <td className="px-4 py-3">Total Earnings</td>
                                    <td className="px-4 py-3 text-right">{salary.grossSalary?.toLocaleString()}</td>
                                    <td className="px-4 py-3 border-l">Total Deductions</td>
                                    <td className="px-4 py-3 text-right">{salary.totalDeductions?.toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-between items-end mb-12">
                        <div className="text-sm">
                            <p className="font-semibold mb-1">Amount in Words:</p>
                            <p className="text-muted-foreground italic">Rupees {salary.netSalary} Only</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground mb-1">Net Pay</p>
                            <p className="text-3xl font-bold text-foreground">₹{salary.netSalary?.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 text-center text-sm mt-12 pt-8">
                        <div className="border-t pt-2">
                            <p className="font-medium">Employer Signature</p>
                        </div>
                        <div className="border-t pt-2">
                            <p className="font-medium">Employee Signature</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalarySlip;
