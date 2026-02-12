'use client';

import React, { ReactNode, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { CalendarIcon, PackageIcon, UserIcon, ProjectIcon, ChevronDownIcon } from '@/components/icons';
import StatusBadge from '@/components/ui/StatusBadge';

// Helper functions for status (can be moved to a utils file later)
// Réservation : En attente (bleu), Validé (vert), Annulé (rouge)
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    RESERVED: 'bg-blue-100 text-blue-800 border-blue-200',
    FULFILLED: 'bg-green-100 text-green-800 border-green-200',
    RELEASED: 'bg-red-100 text-red-800 border-red-200',
    CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    RESERVED: 'En attente',
    FULFILLED: 'Validé',
    RELEASED: 'Annulé',
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
    code?: string | null;
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
  onFulfill?: () => void;
  canManage?: boolean;
  canCancel?: boolean;
  canFulfill?: boolean;
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
  onFulfill,
  canManage = false,
  canCancel = false,
  canFulfill = false,
  isAdmin = false,
  expandedContent,
  formatDate,
  daysAgo,
}: ReservationCardProps) {
  const hasReservedItems = group.items.some((item: any) => item.status === 'RESERVED');
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setActionsOpen(false);
      }
    };
    if (actionsOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [actionsOpen]);

  const hasActions =
    ((canManage || isAdmin) && onUpdateGroup) ||
    (canFulfill && hasReservedItems && onFulfill) ||
    (canCancel && onRelease);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 overflow-hidden min-h-[200px]">
      {/* Header compact */}
      <div className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 ${group.notes ? 'border-b border-gray-100' : ''}`}>
        <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap order-2 sm:order-1">
          <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
            <CalendarIcon className="h-5 w-5 text-slate-600" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              Réservation #{group.groupId.startsWith('RES-') ? group.groupId : group.groupId.slice(0, 18)}
            </h3>
            {group.project && (
              <Link
                href={`/projects/${group.project.id}`}
                className="group text-xs text-gray-600 flex items-center gap-1.5 mt-0.5 min-w-0 truncate hover:text-blue-600 hover:underline"
                title={group.project.name}
              >
                <ProjectIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 group-hover:text-blue-600" />
                <span className="min-w-0 truncate">Projet : <span className="font-medium text-gray-700 group-hover:text-blue-600">{group.project.code ? `${group.project.code} – ${group.project.name}` : group.project.name}</span></span>
              </Link>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
              <StatusBadge status={group.status} variant="default" size="sm" />
              <span className="flex items-center gap-1 min-w-[5.5rem]">
                <PackageIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="tabular-nums">{group.totalItems} produit{group.totalItems > 1 ? 's' : ''}</span>
              </span>
              <span>{formatDate(group.createdAt)}</span>
              {daysAgo >= 0 && daysAgo <= 7 && (
                <span className="text-gray-400">· {daysAgo === 0 ? "Aujourd'hui" : `Il y a ${daysAgo} j.`}</span>
              )}
              {isAdmin && group.user && (
                <span className="truncate max-w-[100px] sm:max-w-[140px]">
                  · {group.user.firstName} {group.user.lastName}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 flex-shrink-0 order-1 sm:order-2 sm:ml-auto">
          {onDownloadPDF && (
            <button
              onClick={onDownloadPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              title="Télécharger le PDF"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PDF
            </button>
          )}
          {group.totalItems >= 1 && (
            <button
              onClick={onToggle}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
              title={isExpanded ? 'Masquer' : 'Voir les produits'}
            >
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              {isExpanded ? 'Masquer' : 'Voir les produits'}
            </button>
          )}
          {hasActions && (
            <div className="relative" ref={actionsRef}>
              <button
                type="button"
                onClick={() => setActionsOpen((v) => !v)}
                className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                title="Actions"
                aria-expanded={actionsOpen}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <circle cx="12" cy="5" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="19" r="1.5" />
                </svg>
              </button>
              {actionsOpen && (
                <div className="absolute right-0 top-full mt-1 py-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  {(canManage || isAdmin) && onUpdateGroup && (
                    <button
                      type="button"
                      onClick={() => {
                        setActionsOpen(false);
                        onUpdateGroup();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-blue-700 hover:bg-blue-50"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Modifier
                    </button>
                  )}
                  {canFulfill && hasReservedItems && onFulfill && (
                    <button
                      type="button"
                      onClick={() => {
                        setActionsOpen(false);
                        onFulfill();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-green-700 hover:bg-green-50"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Valider
                    </button>
                  )}
                  {canCancel && onRelease && (
                    <button
                      type="button"
                      onClick={() => {
                        setActionsOpen(false);
                        onRelease();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Refuser
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Contenu étendu : tableau dans une carte interne */}
      {isExpanded && expandedContent}

      {group.notes && (
        <div className="px-4 sm:px-5 py-3 border-t border-gray-100 bg-amber-50/50">
          <p className="text-xs font-medium text-amber-800 mb-0.5">Notes</p>
          <p className="text-sm text-gray-600 break-words">{group.notes}</p>
        </div>
      )}
    </div>
  );
}
