'use client';

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

export interface ExitSlipGroup {
  createdAt: string;
  user?: { id: string; firstName: string; lastName: string };
  items: Array<{
    id: string;
    quantity: number;
    product?: { name: string; sku?: string };
  }>;
}

interface ProjectExitSlipsSectionProps {
  exitSlipGroups: ExitSlipGroup[];
  loading: boolean;
  canCreateExitSlip: boolean;
  onCreateExitSlip: () => void;
}

export default function ProjectExitSlipsSection({
  exitSlipGroups,
  loading,
  canCreateExitSlip,
  onCreateExitSlip,
}: ProjectExitSlipsSectionProps) {
  const isEmpty = !loading && exitSlipGroups.length === 0;
  return (
    <div className={`bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 ${isEmpty ? 'p-3 sm:p-4' : 'p-5 sm:p-6'}`}>
      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${isEmpty ? 'mb-2' : 'mb-5'}`}>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <div className="h-1 w-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"></div>
          <span>Bons de sortie ({exitSlipGroups.length})</span>
        </h2>
        {canCreateExitSlip && (
          <button
            onClick={onCreateExitSlip}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 text-sm"
            title="Sortie de stock immédiate et définitive, liée au projet"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8 4-8-4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span>Créer un bon de sortie</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          <p className="mt-2">Chargement...</p>
        </div>
      ) : exitSlipGroups.length > 0 ? (
        <div className="space-y-4">
          {exitSlipGroups.map((group, index) => (
            <div
              key={`${group.createdAt}-${group.user?.id ?? index}`}
              className="border-2 border-amber-200 rounded-xl p-4 bg-amber-50/30 hover:border-amber-300 transition-all duration-200"
            >
              <div className="flex flex-wrap items-center gap-3 mb-3 pb-3 border-b border-amber-200">
                <div className="flex items-center gap-1.5 text-sm text-gray-700 px-2.5 py-1 rounded-lg bg-white border border-amber-200">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">{formatDateTime(group.createdAt)}</span>
                </div>
                {group.user && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-600 px-2.5 py-1 rounded-lg bg-amber-100 border border-amber-200">
                    <span className="font-medium">
                      {group.user.firstName} {group.user.lastName}
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {group.items.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-amber-100"
                  >
                    <div>
                      <div className="font-semibold text-gray-900">{m.product?.name}</div>
                      {m.product?.sku && (
                        <div className="text-xs text-gray-500 font-mono mt-0.5">SKU: {m.product.sku}</div>
                      )}
                    </div>
                    <span className="text-sm font-bold text-amber-700">−{m.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="mx-auto h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8 4-8-4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium text-sm">Aucun bon de sortie</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Les sorties créées via « Créer un bon de sortie » apparaîtront ici.
          </p>
          {canCreateExitSlip && (
            <button
              onClick={onCreateExitSlip}
              className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-xs font-medium"
            >
              <span>Créer un bon de sortie</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
