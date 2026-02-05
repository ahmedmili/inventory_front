'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../Modal';
import { useApiMutation } from '@/hooks/useApi';
import { useToast } from '@/contexts/ToastContext';

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productId: string;
  productName: string;
  type: 'IN' | 'OUT'; // 'IN' for dispose, 'OUT' for withdraw
  defaultWarehouseId?: string; // Deprecated: warehouses removed, kept for prop compatibility
}

interface FormData {
  quantity: number;
  reason?: string;
  reference?: string;
}

export default function StockMovementModal({
  isOpen,
  onClose,
  onSuccess,
  productId,
  productName,
  type,
  defaultWarehouseId,
}: StockMovementModalProps) {
  const toast = useToast();
  const { mutate: createMovement, loading } = useApiMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>();

  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const endpoint = type === 'IN' ? '/stock-movements/dispose' : '/stock-movements/withdraw';
      await createMovement(endpoint, 'POST', {
        productId,
        quantity: Number(data.quantity),
        reason: data.reason || undefined,
        reference: data.reference || undefined,
      });

      toast.success(
        type === 'IN'
          ? `Stock ajouté avec succès!`
          : `Stock retiré avec succès!`
      );
      onSuccess();
      onClose();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        (type === 'IN'
          ? 'Échec de l\'ajout du stock'
          : 'Échec du retrait du stock');
      toast.error(errorMessage);
    }
  };

  const title = type === 'IN' ? 'Ajouter du stock' : 'Retirer du stock';
  const actionLabel = type === 'IN' ? 'Ajouter' : 'Retirer';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      variant="form"
      size="md"
      animation="scale"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 px-4 py-3 rounded-r-lg">
          <p className="text-sm font-medium">
            Produit: <span className="font-semibold">{productName}</span>
          </p>
          {/* Warehouse info removed from display */}
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantité <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            step="1"
            {...register('quantity', {
              required: 'La quantité est requise',
              min: { value: 1, message: 'La quantité doit être supérieure à 0' },
              valueAsNumber: true,
            })}
            placeholder="Entrez la quantité"
            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
          {errors.quantity && (
            <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
          )}
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Raison (optionnel)
          </label>
          <textarea
            {...register('reason')}
            rows={3}
            placeholder="Raison du mouvement de stock..."
            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
          />
        </div>

        {/* Reference */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Référence (optionnel)
          </label>
          <input
            type="text"
            {...register('reference')}
            placeholder="Numéro de bon, facture, etc."
            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-5 border-t border-gray-200/80">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
            title="Annuler le mouvement de stock"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              type === 'IN'
                ? 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500'
                : 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
            }`}
            title={type === 'IN' ? 'Ajouter du stock' : 'Retirer du stock'}
          >
            {loading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {actionLabel}...
              </span>
            ) : (
              actionLabel
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

