import React from 'react';

interface Column<T> {
    header: string;
    accessor: keyof T | ((row: T, index: number) => React.ReactNode);
    className?: string;
}

interface TableProps<T> {
    data: T[];
    columns: Column<T>[];
    actions?: (row: T) => React.ReactNode;
}

const Table = <T extends { _id: string }>({ data, columns, actions }: TableProps<T>) => {
    return (
        <div className="overflow-x-auto shadow-md sm:rounded-lg">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        {columns.map((col, idx) => (
                            <th key={idx} className={`px-6 py-3 ${col.className || ''}`}>
                                {col.header}
                            </th>
                        ))}
                        {actions && <th className="px-6 py-3">Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIndex) => (
                        <tr key={row._id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                            {columns.map((col, idx) => (
                                <td key={idx} className="px-6 py-4">
                                    {typeof col.accessor === 'function'
                                        ? (col.accessor as any)(row, rowIndex)
                                        : (row[col.accessor as keyof T] as React.ReactNode)}
                                </td>
                            ))}
                            {actions && <td className="px-6 py-4">{actions(row)}</td>}
                        </tr>
                    ))}
                    {data.length === 0 && (
                        <tr>
                            <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-4 text-center dark:bg-gray-800 dark:text-gray-400">
                                No data found
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Table;
