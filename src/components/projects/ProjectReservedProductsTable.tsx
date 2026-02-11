'use client';

import React from 'react';
import { ReservationIcon } from '@/components/icons';
import StatusBadge from '@/components/ui/StatusBadge';
import Pagination from '@/components/Pagination';

function formatDateTime(dateString: string | null | undefined) {
  if (!dateString) return 'Non définie';
  return new Date(dateString).toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export interface ProductReservationEntry {
  product: { id: string; name: string; sku?: string | null };
  totalQuantity: number;
  reservations: any[];
  groups: any[];
}

interface ProjectReservedProductsTableProps {
  productReservations: ProductReservationEntry[];
  loading: boolean;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  reservationPage: number;
  onReservationPageChange: (page: number) => void;
  reservationMeta: { totalPages: number; hasNext: boolean; hasPrev: boolean } | null;
  expandedProducts: Set<string>;
  onToggleProduct: (productId: string) => void;
  canCreateReservation: boolean;
  onNewReservation: () => void;
}

export default function ProjectReservedProductsTable({
  productReservations,
  loading,
  statusFilter,
  onStatusFilterChange,
  reservationPage,
  onReservationPageChange,
  reservationMeta,
  expandedProducts,
  onToggleProduct,
  canCreateReservation,
  onNewReservation,
}: ProjectReservedProductsTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 sm:p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <div className="h-1 w-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
          <span>Produits Réservés ({productReservations.length})</span>
        </h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              onStatusFilterChange(e.target.value);
              onReservationPageChange(1);
            }}
            className="px-4 py-2 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium shadow-sm hover:shadow-md transition-all duration-200"
          >
            <option value="all">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="CONFIRMED">Confirmée</option>
            <option value="RELEASED">Libérée</option>
            <option value="EXPIRED">Expirée</option>
          </select>

          {canCreateReservation && (
            <button
              onClick={onNewReservation}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 text-sm"
            >
              <ReservationIcon className="w-4 h-4" />
              <span>Nouvelle réservation</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2">Chargement...</p>
        </div>
      ) : productReservations.length > 0 ? (
        <>
          <div className="w-full min-w-0 overflow-x-auto rounded-xl border-2 border-gray-300 bg-white shadow-xl">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-12">
                    #
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Produit
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                    Quantité totale réservée
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                    Nombre de réservations
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {productReservations.map((entry, index) => {
                  const isExpanded = expandedProducts.has(entry.product.id);
                  const uniqueStatuses = [...new Set(entry.groups.map((g: any) => g.status).filter(Boolean))];
                  const reservationsByGroup = entry.groups.map((group) => ({
                    group,
                    items: entry.reservations.filter((r: any) => r.groupId === group.groupId),
                  }));

                  return (
                    <React.Fragment key={entry.product.id}>
                      <tr
                        className={`hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-white cursor-pointer transition-all duration-200 group/row ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        }`}
                        onClick={() => onToggleProduct(entry.product.id)}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-400 via-purple-500 to-pink-600 border-2 border-purple-300 flex items-center justify-center text-sm font-bold text-white shadow-md group-hover/row:scale-110 group-hover/row:rotate-6 transition-all duration-300">
                              {index + 1}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleProduct(entry.product.id);
                              }}
                              className="p-1.5 hover:bg-purple-100 rounded-lg transition-all duration-200 transform hover:scale-110"
                            >
                              <svg
                                className={`w-5 h-5 text-purple-600 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <div className="font-bold text-gray-900 group-hover/row:text-purple-700 transition-colors">
                              {entry.product.name}
                            </div>
                            {entry.product.sku && (
                              <div className="text-xs text-gray-500 font-mono mt-1">SKU: {entry.product.sku}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-14 h-8 rounded-lg text-sm font-extrabold bg-gradient-to-br from-blue-500 to-blue-600 text-white border-2 border-blue-700 shadow-lg">
                            {entry.totalQuantity}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg text-sm font-bold bg-purple-100 text-purple-700 border border-purple-300">
                            {entry.reservations.length}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap items-center justify-center gap-1.5">
                            {uniqueStatuses.length > 0 ? (
                              uniqueStatuses.map((status: string) => (
                                <StatusBadge key={status} status={status} variant="default" size="sm" />
                              ))
                            ) : (
                              <span className="text-xs text-gray-500">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="px-4 py-5 bg-gradient-to-br from-purple-50/50 via-gray-50 to-pink-50/50">
                            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                              <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                                <span>Détails des réservations</span>
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                              </h4>
                              {reservationsByGroup.map(({ group, items }) => (
                                <div
                                  key={group.groupId}
                                  className="border-2 border-gray-200 rounded-xl p-4 bg-white shadow-md hover:shadow-lg hover:border-purple-300 transition-all duration-200"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-gray-200">
                                    <div className="flex items-center gap-3 flex-wrap">
                                      <StatusBadge status={group.status} variant="default" size="sm" />
                                      <div className="flex items-center gap-1.5 text-xs text-gray-600 px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200">
                                        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span>{formatDateTime(group.createdAt)}</span>
                                      </div>
                                      {group.user && (
                                        <div className="flex items-center gap-1.5 text-xs text-gray-600 px-2.5 py-1 rounded-lg bg-blue-100 border border-blue-200">
                                          <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                          </svg>
                                          <span className="font-medium">
                                            {group.user.firstName} {group.user.lastName}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    {group.expiresAt && (
                                      <div className="flex items-center gap-1.5 text-xs text-gray-600 px-2.5 py-1 rounded-lg bg-purple-100 border border-purple-200">
                                        <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="font-medium">Expire: {formatDateTime(group.expiresAt)}</span>
                                      </div>
                                    )}
                                  </div>

                                  {group.notes && (
                                    <div className="mb-4 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                                      <p className="text-sm font-semibold text-gray-700 mb-1">Notes:</p>
                                      <p className="text-sm text-gray-600 italic">&quot;{group.notes}&quot;</p>
                                    </div>
                                  )}

                                  <div className="space-y-2">
                                    {items.map((item: any) => (
                                      <div
                                        key={item.id}
                                        className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all duration-200"
                                      >
                                        <div className="flex-1">
                                          <div className="font-semibold text-gray-900">{item.product?.name}</div>
                                          {item.product?.sku && (
                                            <div className="text-xs text-gray-500 font-mono mt-1">SKU: {item.product.sku}</div>
                                          )}
                                        </div>
                                        <div className="text-right">
                                          <div className="inline-flex items-center justify-center w-12 h-8 rounded-lg text-sm font-extrabold bg-gradient-to-br from-blue-500 to-blue-600 text-white border-2 border-blue-700 shadow-md">
                                            {item.quantity}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {reservationMeta && reservationMeta.totalPages > 1 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <Pagination
                currentPage={reservationPage}
                totalPages={reservationMeta.totalPages}
                hasNext={reservationMeta.hasNext}
                hasPrev={reservationMeta.hasPrev}
                onPageChange={onReservationPageChange}
              />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <ReservationIcon className="h-10 w-10 text-gray-400" />
          </div>
          <p className="text-lg font-semibold text-gray-900 mb-2">Aucun produit réservé</p>
          <p className="text-sm text-gray-600 mb-6">Commencez par créer une réservation pour ce projet</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {canCreateReservation && (
              <button
                onClick={onNewReservation}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <ReservationIcon className="w-5 h-5" />
                <span>Créer une réservation</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
