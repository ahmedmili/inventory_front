import React, { ReactNode } from 'react';

interface Column {
  key: string;
  label: string;
  render?: (item: any, index: number) => ReactNode;
  className?: string;
  headerClassName?: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

interface ModernTableProps {
  columns: Column[];
  data: any[];
  headerGradient?: string;
  striped?: boolean;
  hoverable?: boolean;
  emptyMessage?: string;
  minWidth?: string;
}

export default function ModernTable({
  columns,
  data,
  headerGradient = 'from-blue-600 via-blue-500 to-indigo-600',
  striped = true,
  hoverable = true,
  emptyMessage = 'Aucune donnée disponible',
  minWidth = '600px',
}: ModernTableProps) {
  if (data.length === 0) {
    return (
      <div className="min-w-0 max-w-full text-center py-12 bg-white rounded-xl border-2 border-gray-200">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-xl border-2 border-gray-300 bg-white shadow-xl">
      <table className="w-full" style={{ minWidth }}>
        <thead className={`bg-gradient-to-r ${headerGradient}`}>
          <tr>
            {columns.map((column, index) => (
              <th
                key={column.key || index}
                className={`px-4 py-4 text-${column.align || 'left'} text-xs font-bold text-white uppercase tracking-wider ${column.width ? `w-${column.width}` : ''} ${column.headerClassName || ''}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.map((item, rowIndex) => (
            <tr
              key={item.id || rowIndex}
              className={`
                ${hoverable ? 'hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-white transition-all duration-200' : ''}
                ${striped && rowIndex % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'}
              `}
            >
              {columns.map((column, colIndex) => (
                <td
                  key={column.key || colIndex}
                  className={`min-w-0 px-4 py-4 text-${column.align || 'left'} ${column.className || ''}`}
                >
                  <div className="min-w-0 max-w-full">
                    {column.render ? column.render(item, rowIndex) : item[column.key]}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
