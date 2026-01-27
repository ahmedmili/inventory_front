import React, { ReactNode } from 'react';
import { CalendarIcon, PackageIcon, UserIcon, ProjectIcon, ChevronDownIcon } from '@/components/icons';
import StatusBadge from '@/components/ui/StatusBadge';

// Helper functions for status (can be moved to a utils file later)
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    RESERVED: 'bg-blue-100 text-blue-800 border-blue-200',
    FULFILLED: 'bg-green-100 text-green-800 border-green-200',
    RELEASED: 'bg-gray-100 text-gray-800 border-gray-200',
    CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    RESERVED: 'Réservé',
    FULFILLED: 'Rempli',
    RELEASED: 'Libéré',
    CANCELLED: 'Annulé',
  };
  return labels[status] || status;
};

interface ReservationGroup {
  groupId: string;
  createdAt: string;
  status: string;
  expiresAt?: string;
  project?: {
    id: string;
    name: string;
  };
  notes?: string;
  items: any[];
  totalItems: number;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface ReservationCardProps {
  group: ReservationGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate?: () => void;
  onUpdateGroup?: () => void;
  onDownloadPDF?: () => void;
  onRelease?: () => void;
  canManage?: boolean;
  canCancel?: boolean;
  isAdmin?: boolean;
  expandedContent?: ReactNode;
  formatDate: (date?: string) => string;
  daysAgo: number;
}

export default function ReservationCard({
  group,
  isExpanded,
  onToggle,
  onUpdate,
  onUpdateGroup,
  onDownloadPDF,
  onRelease,
  canManage = false,
  canCancel = false,
  isAdmin = false,
  expandedContent,
  formatDate,
  daysAgo,
}: ReservationCardProps) {
  const hasMultipleItems = group.totalItems > 1;
  const allReserved = group.items.every((item: any) => item.status === 'RESERVED');

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 hover:shadow-2xl hover:border-blue-400 transition-all duration-300 overflow-hidden transform hover:-translate-y-1 group">
      {/* Group Header */}
      <div className="p-5 sm:p-7 bg-gradient-to-br from-white via-blue-50/30 to-gray-50 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-xl ring-4 ring-blue-100 group-hover:ring-blue-200 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <CalendarIcon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
            </div>

            {/* Main Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 break-words">
                  Réservation #{group.groupId.slice(-8)}
                </h3>
                <StatusBadge status={group.status} variant="default" size="md" />
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs sm:text-sm">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100">
                  <div className="h-5 w-5 rounded-lg bg-gradient-to-br from-blue-200 to-blue-300 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <PackageIcon className="w-3 h-3 text-blue-700" />
                  </div>
                  <span className="font-semibold text-gray-700 whitespace-nowrap">{group.totalItems} produit{group.totalItems > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-100">
                  <div className="h-5 w-5 rounded-lg bg-gradient-to-br from-purple-200 to-purple-300 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <CalendarIcon className="w-3 h-3 text-purple-700" />
                  </div>
                  <span className="font-medium text-gray-700 whitespace-nowrap">{formatDate(group.createdAt)}</span>
                  {daysAgo >= 0 && daysAgo <= 7 && (
                    <span className="ml-1 text-xs text-gray-500 whitespace-nowrap">({daysAgo === 0 ? "Aujourd'hui" : `Il y a ${daysAgo} jour${daysAgo > 1 ? 's' : ''}`})</span>
                  )}
                </div>
                {isAdmin && group.user && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 border border-green-100 min-w-0">
                    <div className="h-5 w-5 rounded-lg bg-gradient-to-br from-green-200 to-green-300 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <UserIcon className="w-3 h-3 text-green-700" />
                    </div>
                    <span className="font-medium text-gray-700 truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">
                      {group.user.firstName} {group.user.lastName}
                    </span>
                  </div>
                )}
                {group.project && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-100 min-w-0">
                    <div className="h-5 w-5 rounded-lg bg-gradient-to-br from-orange-200 to-orange-300 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <ProjectIcon className="w-3 h-3 text-orange-700" />
                    </div>
                    <span className="font-medium text-gray-700 truncate max-w-[150px] sm:max-w-[250px] md:max-w-none">{group.project.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0 sm:ml-auto">
            {(canManage || isAdmin) && allReserved && onUpdateGroup && (
              <button
                onClick={onUpdateGroup}
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 border border-blue-300 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 text-blue-600 hover:text-blue-900 transition-all duration-200 text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md transform hover:scale-105"
                title="Modifier le groupe de réservations"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="hidden sm:inline">Modifier</span>
              </button>
            )}
            {onDownloadPDF && (
              <button
                onClick={onDownloadPDF}
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 border border-blue-300 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 text-blue-600 hover:text-blue-900 transition-all duration-200 text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md transform hover:scale-105"
                title="Télécharger le PDF du groupe"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">PDF</span>
              </button>
            )}
            {hasMultipleItems && (
              <button
                onClick={onToggle}
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 border-2 border-gray-300 rounded-xl hover:border-blue-400 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 text-gray-700 hover:text-blue-700 transition-all duration-300 text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transform hover:scale-110 active:scale-95"
                title={isExpanded ? 'Masquer les détails' : 'Voir les détails des produits'}
              >
                <ChevronDownIcon
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                />
                <span className="hidden sm:inline">{isExpanded ? 'Masquer' : 'Voir les détails'}</span>
                <span className="sm:hidden">{isExpanded ? 'Masquer' : 'Voir'}</span>
              </button>
            )}
            {canCancel && allReserved && onRelease && (
              <button
                onClick={onRelease}
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 border border-red-300 rounded-lg hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 text-red-600 hover:text-red-900 transition-all duration-200 text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md transform hover:scale-105"
                title="Libérer toutes les réservations de ce groupe"
              >
                <span className="hidden sm:inline">Libérer tout</span>
                <span className="sm:hidden">Libérer</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && expandedContent}

      {/* Notes */}
      {group.notes && (
        <div className="border-t-2 border-gray-200 bg-gradient-to-r from-amber-50/50 to-yellow-50/50 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 h-6 w-6 rounded-lg bg-gradient-to-br from-amber-200 to-amber-300 flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-700 mb-1">Notes:</p>
              <p className="text-sm text-gray-600 break-words leading-relaxed">{group.notes}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
