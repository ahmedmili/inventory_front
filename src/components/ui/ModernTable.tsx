'use client';

import React, { ReactNode, useRef, useState, useCallback, useEffect } from 'react';

const MIN_COL_WIDTH = 5;
const MAX_COL_WIDTH = 60;

export type SortDirection = 'asc' | 'desc';

interface Column {
  key: string;
  label: string;
  render?: (item: any, index: number) => ReactNode;
  className?: string;
  headerClassName?: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  widthPercent?: number;
  sortable?: boolean;
}

interface ModernTableProps {
  columns: Column[];
  data: any[];
  headerGradient?: string;
  striped?: boolean;
  hoverable?: boolean;
  emptyMessage?: string;
  minWidth?: string;
  nested?: boolean;
  resizable?: boolean;
  /** Tri : colonne active et ordre */
  sortBy?: string;
  sortOrder?: SortDirection;
  /** Callback au clic sur un en-tête triable */
  onSort?: (key: string, direction: SortDirection) => void;
}

function normalizeWidths(columns: Column[]): Record<string, number> {
  const total = columns.reduce((sum, c) => sum + (c.widthPercent ?? 0), 0);
  const hasCustom = columns.some((c) => c.widthPercent != null);
  const equal = 100 / columns.length;
  const result: Record<string, number> = {};
  columns.forEach((col) => {
    result[col.key] = hasCustom && col.widthPercent != null
      ? col.widthPercent
      : equal;
  });
  if (hasCustom && total !== 100) {
    const scale = 100 / total;
    columns.forEach((col) => {
      if (col.widthPercent != null) result[col.key] = col.widthPercent * scale;
    });
  }
  return result;
}

export default function ModernTable({
  columns,
  data,
  headerGradient = 'from-blue-600 via-blue-500 to-indigo-600',
  striped = true,
  hoverable = true,
  emptyMessage = 'Aucune donnée disponible',
  minWidth = '600px',
  nested = false,
  resizable = false,
  sortBy,
  sortOrder = 'asc',
  onSort,
}: ModernTableProps) {
  const handleHeaderClick = useCallback(
    (key: string, sortable: boolean | undefined) => {
      if (!sortable || !onSort) return;
      const nextOrder: SortDirection =
        sortBy === key ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc';
      onSort(key, nextOrder);
    },
    [onSort, sortBy, sortOrder]
  );
  const tableRef = useRef<HTMLTableElement>(null);
  const columnsRef = useRef(columns);
  columnsRef.current = columns;
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() =>
    normalizeWidths(columns)
  );
  const [resizingIndex, setResizingIndex] = useState<number | null>(null);
  const startXRef = useRef(0);
  const startWidthsRef = useRef<Record<string, number>>({});

  // Réinitialiser les largeurs si les colonnes changent (ex. autre page)
  const columnKeys = columns.map((c) => c.key).join(',');
  useEffect(() => {
    setColumnWidths(normalizeWidths(columnsRef.current));
  }, [columnKeys]);

  const handleResizeStart = useCallback(
    (index: number, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (index >= columns.length - 1) return;
      setResizingIndex(index);
      startXRef.current = e.clientX;
      startWidthsRef.current = { ...columnWidths };
    },
    [columns.length, columnWidths]
  );

  useEffect(() => {
    if (resizingIndex === null) return;
    const cols = columnsRef.current;
    const keyA = cols[resizingIndex].key;
    const keyB = cols[resizingIndex + 1]?.key;
    if (!keyB) return;

    const onMove = (e: MouseEvent) => {
      const table = tableRef.current;
      if (!table) return;
      const tableWidth = table.offsetWidth;
      const deltaPx = e.clientX - startXRef.current;
      const deltaPercent = (deltaPx / tableWidth) * 100;
      const start = startWidthsRef.current;
      let wA = (start[keyA] ?? 0) + deltaPercent;
      let wB = (start[keyB] ?? 0) - deltaPercent;
      wA = Math.max(MIN_COL_WIDTH, Math.min(MAX_COL_WIDTH, wA));
      wB = Math.max(MIN_COL_WIDTH, Math.min(MAX_COL_WIDTH, wB));
      setColumnWidths((prev) => ({ ...prev, [keyA]: wA, [keyB]: wB }));
    };

    const onEnd = () => {
      setResizingIndex(null);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [resizingIndex]);

  if (data.length === 0) {
    return (
      <div
        className={`min-w-0 max-w-full text-center py-8 bg-white ${nested ? 'rounded-lg border border-gray-200' : 'rounded-xl border-2 border-gray-200'}`}
      >
        <p className="text-gray-500 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  const getColWidth = (key: string) =>
    resizable ? columnWidths[key] ?? 100 / columns.length : undefined;

  return (
    <div
      className={`min-w-0 overflow-x-auto overflow-y-hidden bg-white ${nested ? 'rounded-lg border border-gray-200 shadow-sm' : 'rounded-xl border-2 border-gray-300 shadow-xl'}`}
      style={{ width: '100%' }}
    >
      <table
        ref={tableRef}
        className="table-fixed"
        style={{
          width: '100%',
          minWidth: minWidth === '100%' ? '100%' : minWidth,
          tableLayout: 'fixed',
        }}
      >
        <thead className={`bg-gradient-to-r ${headerGradient}`}>
          <tr>
            {columns.map((column, index) => (
              <th
                key={column.key || index}
                className={`relative min-w-0 overflow-hidden pl-3 pr-4 py-2.5 text-${column.align || 'left'} text-xs font-bold text-white uppercase tracking-wider ${column.sortable && onSort ? 'cursor-pointer select-none hover:bg-white/10' : ''} ${column.width ? `w-${column.width}` : ''} ${column.headerClassName || ''}`}
                style={
                  getColWidth(column.key) != null
                    ? { width: `${getColWidth(column.key)}%` }
                    : undefined
                }
                onClick={() => handleHeaderClick(column.key, column.sortable)}
              >
                <span className="block min-w-0 truncate" title={column.label}>{column.label}</span>
                {resizable && index < columns.length - 1 && (
                  <span
                    role="separator"
                    aria-orientation="vertical"
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize touch-none border-r border-white/40 hover:border-white/80 hover:bg-white/15 transition-colors z-10"
                    onMouseDown={(e) => { e.stopPropagation(); handleResizeStart(index, e); }}
                    onClick={(e) => e.stopPropagation()}
                    title="Redimensionner la colonne"
                  />
                )}
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
                  className={`min-w-0 overflow-hidden px-3 py-2.5 text-${column.align || 'left'} ${resizable && colIndex < columns.length - 1 ? 'border-r border-gray-200' : ''} ${column.className || ''}`}
                  style={
                    getColWidth(column.key) != null
                      ? { width: `${getColWidth(column.key)}%` }
                      : undefined
                  }
                >
                  <div className="min-w-0 max-w-full overflow-hidden [&>*]:min-w-0 [&>*]:overflow-hidden">
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
