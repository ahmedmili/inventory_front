import React from 'react';
import { CalendarIcon, PackageIcon } from '@/components/icons';
import StatusBadge from '@/components/ui/StatusBadge';
import ModernTable from '@/components/ui/ModernTable';
import type { ReservationItem } from '@/types/shared';

interface ReservationProductsTableProps {
  items: ReservationItem[];
  canManage?: boolean;
  canCancel?: boolean;
  canFulfill?: boolean;
  isAdmin?: boolean;
  onUpdate?: (item: ReservationItem) => void;
  onRelease?: (itemId: string) => void;
  onFulfill?: (itemId: string) => void;
  formatDate: (date?: string) => string;
}

export default function ReservationProductsTable({
  items,
  canManage = false,
  canCancel = false,
  canFulfill = false,
  isAdmin = false,
  onUpdate,
  onRelease,
  onFulfill,
  formatDate,
}: ReservationProductsTableProps) {
  const columns = [
    {
      key: 'index',
      label: '#',
      width: '12',
      align: 'left' as const,
      render: (_: any, index: number) => (
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 border-2 border-blue-300 flex items-center justify-center text-sm font-bold text-white shadow-md">
          {index + 1}
        </div>
      ),
    },
    {
      key: 'product',
      label: 'Produit',
      align: 'left' as const,
      render: (item: ReservationItem) => (
        <div>
          <p className="text-sm font-bold text-gray-900">{item.product.name}</p>
          {item.product.sku && (
            <p className="text-xs text-gray-500 font-mono mt-1 sm:hidden">SKU: {item.product.sku}</p>
          )}
          {item.expiresAt && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1 lg:hidden">
              <CalendarIcon className="w-3 h-3 text-purple-600" />
              <span>Expire: {formatDate(item.expiresAt)}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'sku',
      label: 'SKU',
      align: 'left' as const,
      className: 'hidden sm:table-cell',
      render: (item: ReservationItem) =>
        item.product.sku ? (
          <span className="px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200 font-mono text-xs font-semibold text-gray-700">
            {item.product.sku}
          </span>
        ) : (
          <span className="text-xs text-gray-400 italic">-</span>
        ),
    },
    {
      key: 'quantity',
      label: 'Quantité',
      align: 'center' as const,
      width: '24',
      render: (item: ReservationItem) => (
        <span className="inline-flex items-center justify-center w-12 h-8 rounded-lg text-sm font-extrabold bg-gradient-to-br from-blue-500 to-blue-600 text-white border-2 border-blue-700 shadow-lg">
          {item.quantity}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      align: 'center' as const,
      width: '28',
      render: (item: ReservationItem) => <StatusBadge status={item.status} variant="default" size="sm" />,
    },
    {
      key: 'expiresAt',
      label: 'Expiration',
      align: 'left' as const,
      className: 'hidden lg:table-cell',
      render: (item: ReservationItem) =>
        item.expiresAt ? (
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <CalendarIcon className="w-3.5 h-3.5 text-purple-600" />
            <span>{formatDate(item.expiresAt)}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-400 italic">-</span>
        ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center' as const,
      width: '32',
      render: (item: ReservationItem) => (
        <div className="flex items-center justify-center gap-1.5">
          {(canManage || isAdmin) && item.status === 'RESERVED' && onUpdate && (
            <button
              onClick={() => onUpdate(item)}
              className="text-blue-600 hover:text-blue-800 text-xs px-2.5 py-1.5 border-2 border-blue-300 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:border-blue-400 transition-all duration-200 font-bold shadow-sm hover:shadow-md transform hover:scale-110 active:scale-95 whitespace-nowrap"
              title="Modifier"
            >
              Modifier
            </button>
          )}
          {canFulfill && item.status === 'RESERVED' && onFulfill && (
            <button
              onClick={() => onFulfill(item.id)}
              className="text-green-600 hover:text-green-800 text-xs px-2.5 py-1.5 border-2 border-green-300 rounded-lg hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 hover:border-green-400 transition-all duration-200 font-bold shadow-sm hover:shadow-md transform hover:scale-110 active:scale-95 whitespace-nowrap"
              title="Valider (sortie définitive du stock)"
            >
              Valider
            </button>
          )}
          {canCancel && item.status === 'RESERVED' && onRelease && (
            <button
              onClick={() => onRelease(item.id)}
              className="text-red-600 hover:text-red-800 text-xs px-2.5 py-1.5 border-2 border-red-300 rounded-lg hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:border-red-400 transition-all duration-200 font-bold shadow-sm hover:shadow-md transform hover:scale-110 active:scale-95 whitespace-nowrap"
              title="Libérer"
            >
              Libérer
            </button>
          )}
          {(!canManage && !isAdmin && !canCancel) || item.status !== 'RESERVED' ? (
            <span className="text-xs text-gray-400 italic">Aucune action</span>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <ModernTable
      columns={columns}
      data={items}
      headerGradient="from-blue-600 via-blue-500 to-indigo-600"
      striped={true}
      hoverable={true}
      emptyMessage="Aucun produit dans cette réservation"
      minWidth="600px"
    />
  );
}
