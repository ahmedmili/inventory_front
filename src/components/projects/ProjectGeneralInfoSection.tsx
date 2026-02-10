'use client';

import StatusBadge from '@/components/ui/StatusBadge';

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return 'Non définie';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

interface ProjectGeneralInfoSectionProps {
  status: string;
  createdBy?: { firstName: string; lastName: string } | null;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
}

export default function ProjectGeneralInfoSection({
  status,
  createdBy,
  startDate,
  endDate,
  createdAt,
}: ProjectGeneralInfoSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 sm:p-6 hover:shadow-lg transition-shadow duration-200">
      <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
        <div className="h-1 w-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
        <span>Informations générales</span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Statut</label>
          <div className="mt-2">
            <StatusBadge status={status} variant="rounded" size="md" />
          </div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Créé par</label>
          <div className="mt-2 text-gray-900 font-semibold">
            {createdBy ? (
              `${createdBy.firstName} ${createdBy.lastName}`
            ) : (
              <span className="text-gray-400 italic">-</span>
            )}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Date de début</label>
          <div className="mt-2 text-gray-900 font-semibold">{formatDate(startDate)}</div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Date de fin</label>
          <div className="mt-2 text-gray-900 font-semibold">{formatDate(endDate)}</div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Date de création</label>
          <div className="mt-2 text-gray-900 font-semibold">{formatDate(createdAt)}</div>
        </div>
      </div>
    </div>
  );
}
