import React from 'react';
import Card from './Card';

export default function Table({ 
  columns, 
  data, 
  isLoading = false,
  emptyMessage = 'No data available',
  onRowClick
}) {
  if (isLoading) {
    return (
      <Card>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-100 rounded w-full mb-4" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-50 rounded w-full mb-2" />
          ))}
        </div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <div className="text-center py-6">
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card noPadding>
      <div className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                onClick={() => onRowClick && onRowClick(row)}
                className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-4 py-3 whitespace-nowrap text-sm text-gray-900"
                  >
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
} 