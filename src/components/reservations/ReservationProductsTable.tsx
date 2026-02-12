import React from 'react';
import { CalendarIcon, PackageIcon } from '@/components/icons';
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
  /** Style adapté quand le tableau est affiché dans une carte (header plus discret) */
  nested?: boolean;
  /** Afficher en liste (lignes) au lieu d'un tableau — pour l'intérieur d'une carte */
  asList?: boolean;
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
  nested = false,
  asList = false,
}: ReservationProductsTableProps) {
  if (asList) {
    if (items.length === 0) {
      return <p className="text-sm text-gray-500 py-4 px-4">Aucun produit dans cette réservation</p>;
    }
    return (
      <ul className="divide-y divide-gray-100">
        {items.map((item, index) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center gap-3 py-3 px-4 hover:bg-gray-50/50 transition-colors"
          >
            <span className="flex-shrink-0 w-7 h-7 rounded bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-semibold">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
              <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-gray-500">
                {item.product.sku && <span className="font-mono">{item.product.sku}</span>}
                {item.expiresAt && (
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" />
                    {formatDate(item.expiresAt)}
                  </span>
                )}
              </div>
            </div>
            <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded text-sm font-semibold bg-blue-100 text-blue-800">
              {item.quantity}
            </span>
          </li>
        ))}
      </ul>
    );
  }

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
  ];

  return (
    <ModernTable
      columns={columns}
      data={items}
      headerGradient={nested ? 'from-slate-600 to-slate-500' : 'from-blue-600 via-blue-500 to-indigo-600'}
      striped={true}
      hoverable={true}
      emptyMessage="Aucun produit dans cette réservation"
      minWidth="600px"
      nested={nested}
    />
  );
}
