'use client';

import { useState } from 'react';
import Modal from '../Modal';
import { apiClient } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { readFileAsText, parseCSV, ProductCSVRow } from '@/lib/csv-utils';
import { parseExcelFile, ProductExcelRow } from '@/lib/excel-utils';

interface ImportProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportProductsModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportProductsModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ProductCSVRow[] | ProductExcelRow[] | null>(null);
  const [error, setError] = useState<string>('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError('');
    setPreview(null);

    try {
      const isCSV = selectedFile.name.endsWith('.csv');
      const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls');

      if (!isCSV && !isExcel) {
        throw new Error('Format de fichier non supporté. Utilisez CSV ou Excel (.xlsx, .xls)');
      }

      if (isCSV) {
        const content = await readFileAsText(selectedFile);
        const parsed = parseCSV(content);
        setPreview(parsed.slice(0, 5)); // Show first 5 rows as preview
      } else {
        const parsed = await parseExcelFile(selectedFile);
        setPreview(parsed.slice(0, 5)); // Show first 5 rows as preview
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la lecture du fichier');
      setFile(null);
    }
  };

  const handleSubmit = async () => {
    if (!file || !preview) {
      toast.error('Veuillez sélectionner un fichier valide');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const isCSV = file.name.endsWith('.csv');
      let products: ProductCSVRow[] | ProductExcelRow[];

      if (isCSV) {
        const content = await readFileAsText(file);
        products = parseCSV(content);
      } else {
        products = await parseExcelFile(file);
      }

      // Load suppliers to match by name
      const suppliersRes = await apiClient.get('/suppliers');
      const suppliers = suppliersRes.data?.data || suppliersRes.data || [];
      const supplierMap = new Map(suppliers.map((s: any) => [s.name.toLowerCase(), s.id]));

      // Transform and create products
      const created = [];
      const errors = [];

      for (let i = 0; i < products.length; i++) {
        const row = products[i];
        try {
          const payload: any = {
            name: row.name,
            sku: row.sku || undefined,
            description: row.description || undefined,
            salePrice: parseFloat(row.salePrice) || 0,
            minStock: parseInt(row.minStock) || 0,
            initialQuantity: parseInt(row.initialQuantity || '0') || 0,
          };

          // Find supplier by name
          if (row.supplierName) {
            const supplierId = supplierMap.get(row.supplierName.toLowerCase());
            if (supplierId) {
              payload.supplierId = supplierId;
            }
          }

          await apiClient.post('/products', payload);
          created.push(row.name);
        } catch (err: any) {
          errors.push({
            row: i + 2, // +2 because of header and 0-index
            name: row.name,
            error: err.response?.data?.message || 'Erreur inconnue',
          });
        }
      }

      if (created.length > 0) {
        toast.success(`${created.length} produit(s) importé(s) avec succès`);
      }
      if (errors.length > 0) {
        toast.error(`${errors.length} erreur(s) lors de l'import`);
        console.error('Import errors:', errors);
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de l\'import des produits';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importer des produits" size="lg" variant="form">
      <div className="space-y-4">
        {/* File Selection */}
        <div>
          <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
            Fichier CSV ou Excel <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            id="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="mt-1 text-xs text-gray-500">
            Formats supportés: CSV, Excel (.xlsx, .xls)
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Preview */}
        {preview && preview.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Aperçu ({preview.length} ligne(s) sur {file?.name})
            </h3>
            <div className="overflow-x-auto border border-gray-200 rounded-md">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Nom</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">SKU</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Prix</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Seuil</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Fournisseur</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {preview.map((row, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 text-gray-900">{row.name}</td>
                      <td className="px-3 py-2 text-gray-600">{row.sku || '-'}</td>
                      <td className="px-3 py-2 text-gray-600">{row.salePrice}</td>
                      <td className="px-3 py-2 text-gray-600">{row.minStock}</td>
                      <td className="px-3 py-2 text-gray-600">{row.supplierName || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={handleClose}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !file || !preview}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Import en cours...' : `Importer ${preview?.length || 0} produit(s)`}
          </button>
        </div>
      </div>
    </Modal>
  );
}

