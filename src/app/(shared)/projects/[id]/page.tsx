"use client";

import ConfirmModal from "@/components/ConfirmModal";
import RouteGuard from "@/components/guards/RouteGuard";
import { EditIcon, TrashIcon } from "@/components/icons";
import AddProjectMemberModal from "@/components/projects/AddProjectMemberModal";
import AddProjectProductModal from "@/components/projects/AddProjectProductModal";
import ProjectExitSlipModal from "@/components/projects/ProjectExitSlipModal";
import ProjectExitSlipsSection from "@/components/projects/ProjectExitSlipsSection";
import ProjectFormModal from "@/components/projects/ProjectFormModal";
import ProjectMembersSection from "@/components/projects/ProjectMembersSection";
import ProjectReservedProductsTable from "@/components/projects/ProjectReservedProductsTable";
import ReservationCartModal from "@/components/reservations/ReservationCartModal";
import UpdateGroupReservationModal from "@/components/reservations/UpdateGroupReservationModal";
import ExportDropdown from "@/components/ui/ExportDropdown";
import PageHeader from "@/components/ui/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useModal } from "@/contexts/ModalContext";
import { useToast } from "@/contexts/ToastContext";
import { useApi, useApiMutation } from "@/hooks/useApi";
import { apiClient } from "@/lib/api";
import {
  downloadCSV,
  exportProductsToCSV,
  exportProjectsToCSV,
} from "@/lib/csv-utils";
import {
  exportProductsToExcel,
  exportProjectsToExcel,
} from "@/lib/excel-utils";
import { hasPermission } from "@/lib/permissions";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  PaginationMeta,
  Project,
  ReservationGroup,
  StockMovement,
} from "@/types/shared";

/** Projet avec membres et produits (réponse API détail) */
type ProjectDetail = Project & {
  members?: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      role?: { code: string };
    };
  }>;
  products?: Array<{
    id: string;
    quantity: number;
    notes?: string | null;
    product: {
      id: string;
      name: string;
      sku?: string | null;
      salePrice: number;
    };
  }>;
};

const ExportIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const toast = useToast();
  const modal = useModal();
  const { user } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [isExitSlipModalOpen, setIsExitSlipModalOpen] = useState(false);

  const [reservations, setReservations] = useState<ReservationGroup[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [reservationPage, setReservationPage] = useState(1);
  const [reservationMeta, setReservationMeta] =
    useState<PaginationMeta | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(
    new Set(),
  );
  const [exitSlipMovements, setExitSlipMovements] = useState<StockMovement[]>(
    [],
  );
  const [loadingExitSlips, setLoadingExitSlips] = useState(false);
  const canCreateReservation = hasPermission(user, "reservations.create");
  const canFulfillReservation = hasPermission(user, "reservations.fulfill");
  const canEditReservation = hasPermission(user, "reservations.update");
  const canReleaseReservation = hasPermission(user, "reservations.cancel");
  const { mutate: deleteProject, loading: deleting } = useApiMutation();
  const canUpdate = hasPermission(user, "projects.update");
  const canDelete = hasPermission(user, "projects.delete");
  const [editingReservationGroupId, setEditingReservationGroupId] = useState<string | null>(null);

  const {
    data: project,
    loading,
    error,
    mutate,
  } = useApi<ProjectDetail>(projectId ? `/projects/${projectId}` : null);

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await deleteProject(`/projects/${projectId}`, "DELETE");
      toast.success("Projet supprimé avec succès!");
      router.push("/projects");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Échec de la suppression du projet";
      toast.error(errorMessage);
    }
  };

  const loadReservations = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoadingReservations(true);
      const params: Record<string, string> = {
        projectId,
        grouped: "true",
        page: reservationPage.toString(),
        limit: "20",
      };
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      const response = await apiClient.get("/reservations", { params });
      const data = (response.data?.data ?? []) as ReservationGroup[];
      const meta = (response.data?.meta ?? null) as PaginationMeta | null;
      setReservations(data);
      setReservationMeta(meta);
    } catch (error: unknown) {
      console.error("Failed to load reservations:", error);
      toast.error("Erreur lors du chargement des réservations");
    } finally {
      setLoadingReservations(false);
    }
  }, [projectId, statusFilter, reservationPage, toast]);

  const loadExitSlips = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoadingExitSlips(true);
      const response = await apiClient.get("/stock-movements", {
        params: {
          type: "OUT",
          reason: "PROJECT_EXIT",
          reference: projectId,
          limit: "100",
        },
      });
      const raw = response.data;
      const data = raw?.data ?? (Array.isArray(raw) ? raw : []);
      setExitSlipMovements(Array.isArray(data) ? (data as StockMovement[]) : []);
    } catch (err: unknown) {
      console.error("Failed to load exit slips:", err);
      toast.error("Erreur lors du chargement des bons de sortie");
      setExitSlipMovements([]);
    } finally {
      setLoadingExitSlips(false);
    }
  }, [projectId, toast]);

  useEffect(() => {
    if (projectId) loadReservations();
  }, [projectId, loadReservations]);

  useEffect(() => {
    if (projectId) loadExitSlips();
  }, [projectId, loadExitSlips]);

  const exitSlipGroups = useMemo(() => {
    const map = new Map<
      string,
      { createdAt: string; user?: StockMovement["user"]; items: StockMovement[] }
    >();
    exitSlipMovements.forEach((m) => {
      const userId = (m as StockMovement & { userId?: string }).userId ?? m.user?.id;
      const key = `${m.createdAt}_${userId ?? "anon"}`;
      if (!map.has(key)) {
        map.set(key, {
          createdAt: m.createdAt,
          user: m.user,
          items: [],
        });
      }
      map.get(key)!.items.push(m);
    });
    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [exitSlipMovements]);

  const productReservations = useMemo(() => {
    const productMap = new Map<
      string,
      {
        product: { id: string; name: string; sku?: string | null };
        totalQuantity: number;
        reservations: any[];
        groups: any[];
      }
    >();

    reservations.forEach((group) => {
      group.items?.forEach((item: any) => {
        const productId = item.product?.id;
        if (!productId) return;

        if (!productMap.has(productId)) {
          productMap.set(productId, {
            product: item.product,
            totalQuantity: 0,
            reservations: [],
            groups: [],
          });
        }

        const entry = productMap.get(productId)!;
        entry.totalQuantity += item.quantity;
        entry.reservations.push({
          ...item,
          groupId: group.groupId,
          createdAt: group.createdAt,
          status: group.status,
          user: group.user,
          expiresAt: group.expiresAt,
          notes: group.notes,
        });

        // Add group if not already added
        if (!entry.groups.find((g) => g.groupId === group.groupId)) {
          entry.groups.push(group);
        }
      });
    });

    return Array.from(productMap.values());
  }, [reservations]);

  const toggleProduct = (productId: string) => {
    setExpandedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleExportProjectCSV = () => {
    if (!project) return;
    const csvContent = exportProjectsToCSV([project]);
    downloadCSV(
      csvContent,
      `projet_${project.name.replace(/[^a-z0-9]/gi, "_")}_${new Date().toISOString().split("T")[0]}.csv`,
    );
    toast.success("Projet exporté en CSV");
  };

  const handleExportProjectExcel = async () => {
    if (!project) return;
    await exportProjectsToExcel(
      [project],
      `projet_${project.name.replace(/[^a-z0-9]/gi, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
    toast.success("Projet exporté en Excel");
  };

  const handleExportProjectProductsCSV = () => {
    if (!project || !productReservations.length) {
      toast.error("Aucun produit à exporter");
      return;
    }
    // Convert reservations to products format
    const products = productReservations.map((entry) => ({
      name: entry.product.name,
      sku: entry.product.sku,
      description: "",
      salePrice: 0,
      minStock: 0,
      supplier: null,
      warehouseStock: [{ quantity: entry.totalQuantity }],
    }));
    const csvContent = exportProductsToCSV(products);
    downloadCSV(
      csvContent,
      `produits_projet_${project.name.replace(/[^a-z0-9]/gi, "_")}_${new Date().toISOString().split("T")[0]}.csv`,
    );
    toast.success("Produits du projet exportés en CSV");
  };

  const handleFulfillReservationGroup = useCallback(
    async (groupId: string, reservationIds: string[]) => {
      try {
        for (const id of reservationIds) {
          await apiClient.post(`/reservations/${id}/fulfill`);
        }
        toast.success("Réservation confirmée");
        loadReservations();
      } catch (err: unknown) {
        const msg = (err as any)?.response?.data?.message || "Erreur lors de la confirmation";
        toast.error(msg);
        throw err;
      }
    },
    [toast, loadReservations]
  );

  const handleReleaseReservationGroup = useCallback(
    async (groupId: string, reservationIds: string[]) => {
      try {
        for (const id of reservationIds) {
          await apiClient.post(`/reservations/${id}/release`, {});
        }
        toast.success("Réservation supprimée");
        loadReservations();
      } catch (err: unknown) {
        const msg = (err as any)?.response?.data?.message || "Erreur lors de la suppression";
        toast.error(msg);
        throw err;
      }
    },
    [toast, loadReservations]
  );

  const editingReservationGroup = useMemo(
    () => (editingReservationGroupId ? reservations.find((r) => r.groupId === editingReservationGroupId) ?? null : null),
    [editingReservationGroupId, reservations]
  );

  const handleExportProjectProductsExcel = async () => {
    if (!project || !productReservations.length) {
      toast.error("Aucun produit à exporter");
      return;
    }
    // Convert reservations to products format
    const products = productReservations.map((entry) => ({
      name: entry.product.name,
      sku: entry.product.sku,
      description: "",
      salePrice: 0,
      minStock: 0,
      supplier: null,
      warehouseStock: [{ quantity: entry.totalQuantity }],
    }));
    await exportProductsToExcel(
      products,
      `produits_projet_${project.name.replace(/[^a-z0-9]/gi, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
    toast.success("Produits du projet exportés en Excel");
  };

  if (loading) {
    return (
      <RouteGuard requirements={{ requirePermissions: ["projects.read"] }}>
        <div className="p-6">
          <div className="text-center py-8 text-gray-500">Chargement...</div>
        </div>
      </RouteGuard>
    );
  }

  if (error || !project) {
    return (
      <RouteGuard requirements={{ requirePermissions: ["projects.read"] }}>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Projet introuvable</p>
          </div>
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard requirements={{ requirePermissions: ["projects.read"] }}>
      <div className="max-w-7xl mx-auto min-w-0 w-full p-4 sm:p-6 space-y-6">
        {/* Header */}
        <PageHeader
          title={project.name}
          description={project.description || "Aucune description"}
          backUrl="/projects"
          actions={
            <>
              <ExportDropdown
                trigger={
                  <>
                    <ExportIcon />
                    Exporter
                  </>
                }
                options={[
                  {
                    label: "Exporter le projet (CSV)",
                    description: "Informations du projet",
                    icon: <ExportIcon />,
                    onClick: handleExportProjectCSV,
                  },
                  {
                    label: "Exporter le projet (Excel)",
                    description: "Informations du projet",
                    icon: <ExportIcon />,
                    onClick: handleExportProjectExcel,
                  },
                  ...(productReservations.length > 0
                    ? [
                        {
                          label: "Exporter les produits (CSV)",
                          description: `${productReservations.length} produit(s) réservé(s)`,
                          icon: <ExportIcon />,
                          onClick: handleExportProjectProductsCSV,
                        },
                        {
                          label: "Exporter les produits (Excel)",
                          description: `${productReservations.length} produit(s) réservé(s)`,
                          icon: <ExportIcon />,
                          onClick: handleExportProjectProductsExcel,
                        },
                      ]
                    : []),
                ]}
              />
              {canUpdate && (
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-xl hover:from-yellow-700 hover:to-yellow-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <EditIcon className="w-5 h-5" />
                  <span>Modifier</span>
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <TrashIcon className="w-5 h-5" />
                  <span>Supprimer</span>
                </button>
              )}
            </>
          }
        />

        <ProjectMembersSection
          members={project.members ?? []}
          canUpdate={!!canUpdate}
          onAddMember={() => setIsAddMemberModalOpen(true)}
          onRemoveMember={(member) => {
            modal.confirm({
              title: "Retirer le membre",
              content: `Êtes-vous sûr de vouloir retirer ${member.user.firstName} ${member.user.lastName} du projet ?`,
              onConfirm: async () => {
                try {
                  await apiClient.delete(
                    `/projects/${projectId}/members/${member.user.id}`,
                  );
                  toast.success("Membre retiré avec succès");
                  mutate();
                } catch (error: any) {
                  toast.error(
                    error.response?.data?.message ||
                      "Erreur lors du retrait du membre",
                  );
                }
              },
            });
          }}
        />

        <ProjectExitSlipsSection
          exitSlipGroups={exitSlipGroups}
          loading={loadingExitSlips}
          canCreateExitSlip={!!canUpdate}
          onCreateExitSlip={() => setIsExitSlipModalOpen(true)}
        />

        <ProjectReservedProductsTable
          productReservations={productReservations}
          loading={loadingReservations}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          reservationPage={reservationPage}
          onReservationPageChange={setReservationPage}
          reservationMeta={reservationMeta}
          expandedProducts={expandedProducts}
          onToggleProduct={toggleProduct}
          canCreateReservation={!!canCreateReservation}
          onNewReservation={() => setIsReservationModalOpen(true)}
          onFulfillGroup={handleFulfillReservationGroup}
          onEditGroup={(groupId) => setEditingReservationGroupId(groupId)}
          onReleaseGroup={handleReleaseReservationGroup}
          canFulfill={!!canFulfillReservation}
          canEdit={!!canEditReservation}
          canRelease={!!canReleaseReservation}
        />

        {/* Modals */}
        {isEditModalOpen && (
          <ProjectFormModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            projectId={projectId}
            onSuccess={() => {
              mutate();
              setIsEditModalOpen(false);
            }}
          />
        )}

        {isDeleteModalOpen && (
          <ConfirmModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDelete}
            title="Supprimer le projet"
            message={`Êtes-vous sûr de vouloir supprimer le projet "${project.name}" ? Cette action peut être annulée.`}
            confirmText="Supprimer"
            cancelText="Annuler"
            type="danger"
            loading={deleting}
          />
        )}

        {isAddProductModalOpen && (
          <AddProjectProductModal
            isOpen={isAddProductModalOpen}
            onClose={() => setIsAddProductModalOpen(false)}
            projectId={projectId}
            onSuccess={() => {
              mutate();
              setIsAddProductModalOpen(false);
            }}
          />
        )}

        {isAddMemberModalOpen && (
          <AddProjectMemberModal
            isOpen={isAddMemberModalOpen}
            onClose={() => setIsAddMemberModalOpen(false)}
            projectId={projectId}
            existingMemberIds={project.members?.map((m) => m.user.id) || []}
            onSuccess={() => {
              mutate();
              setIsAddMemberModalOpen(false);
            }}
          />
        )}

        {isReservationModalOpen && (
          <ReservationCartModal
            isOpen={isReservationModalOpen}
            onClose={() => setIsReservationModalOpen(false)}
            initialProjectId={projectId}
            onSuccess={() => {
              loadReservations();
              setIsReservationModalOpen(false);
            }}
          />
        )}

        {isExitSlipModalOpen && project && (
          <ProjectExitSlipModal
            isOpen={isExitSlipModalOpen}
            onClose={() => setIsExitSlipModalOpen(false)}
            projectId={projectId}
            projectName={project.name}
            onSuccess={() => {
              mutate();
              loadExitSlips();
              setIsExitSlipModalOpen(false);
            }}
          />
        )}

        {editingReservationGroup && (
          <UpdateGroupReservationModal
            isOpen={!!editingReservationGroupId}
            onClose={() => setEditingReservationGroupId(null)}
            group={editingReservationGroup}
            onSuccess={() => {
              loadReservations();
              setEditingReservationGroupId(null);
            }}
          />
        )}
      </div>
    </RouteGuard>
  );
}
