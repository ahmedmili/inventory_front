'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { apiClient } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import Modal from '../Modal';
import Autocomplete from '../ui/Autocomplete';
import ProductFormModal from '../products/ProductFormModal';

// Icons as SVG components
const TrashIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const PlusIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const PackageIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const TruckIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

interface Product {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  purchasePrice?: number;
  stock?: {
    id: string;
    quantity: number;
  };
}

interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface ImportLine {
  productId: string;
  productName: string;
  productSku?: string;
  quantity: number;
  purchasePrice?: number;
}

interface ImportFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ImportFormModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportFormModalProps) {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [importLines, setImportLines] = useState<ImportLine[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProductData, setNewProductData] = useState<{ name?: string; sku?: string } | null>(null);

  const [formData, setFormData] = useState({
    supplierId: '',
    productId: '',
    quantity: 1,
    purchasePrice: 0,
    reference: '',
    receivedDate: '',
    notes: '',
  });

  const canCreate = hasPermission(user, 'imports.create');

  useEffect(() => {
    if (isOpen && canCreate) {
      loadOptions();
      // Reset form when modal opens
      setFormData({
        supplierId: '',
        productId: '',
        quantity: 1,
        purchasePrice: 0,
        reference: '',
        receivedDate: '',
        notes: '',
      });
      setImportLines([]);
    }
  }, [isOpen, canCreate]);

  const loadOptions = async () => {
    try {
      setLoadingOptions(true);
      const [productsRes, suppliersRes] = await Promise.all([
        apiClient.get('/products?limit=1000'),
        apiClient.get('/suppliers?limit=1000'),
      ]);

      const productsData = productsRes.data?.data || productsRes.data || [];
      setProducts(productsData);
      setSuppliers(suppliersRes.data?.data || suppliersRes.data || []);
    } catch (error: any) {
      console.error('Failed to load options:', error);
      toast.error('Erreur lors du chargement des options');
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleCreateProduct = (searchTerm: string) => {
    const skuMatch = searchTerm.match(/\(([^)]+)\)$/);
    const name = skuMatch ? searchTerm.replace(/\s*\([^)]+\)$/, '').trim() : searchTerm.trim();
    const sku = skuMatch ? skuMatch[1] : undefined;
    
    setNewProductData({ name, sku });
    setShowProductModal(true);
  };

  const handleProductCreated = async (createdProductId?: string) => {
    const savedProductData = { ...newProductData };
    setShowProductModal(false);
    setNewProductData(null);
    
    try {
      const productsRes = await apiClient.get('/products?limit=1000');
      const productsData = productsRes.data?.data || productsRes.data || [];
      setProducts(productsData);
      
      let productToSelect: Product | undefined;
      
      if (createdProductId) {
        productToSelect = productsData.find((p: Product) => p.id === createdProductId);
      } else if (savedProductData) {
        productToSelect = productsData.find(
          (p: Product) => 
            p.name.toLowerCase() === savedProductData.name?.toLowerCase() ||
            (savedProductData.sku && p.sku?.toLowerCase() === savedProductData.sku.toLowerCase())
        );
      }
      
      if (productToSelect) {
        setFormData(prev => ({ 
          ...prev, 
          productId: productToSelect!.id,
          purchasePrice: productToSelect!.purchasePrice || 0,
          quantity: prev.quantity || 1,
        }));
        toast.success('Produit créé et sélectionné !');
      } else {
        toast.success('Produit créé avec succès !');
      }
    } catch (error: any) {
      console.error('Failed to reload products:', error);
      toast.error('Produit créé mais erreur lors du rechargement.');
    }
  };

  const handleAddLine = () => {
    if (!formData.productId || formData.quantity < 1) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    const product = products.find(p => p.id === formData.productId);
    
    if (!product) {
      toast.error('Produit introuvable');
      return;
    }

    // Check if product already in lines
    const existingIndex = importLines.findIndex(
      line => line.productId === formData.productId
    );

    if (existingIndex >= 0) {
      // Update quantity
      setImportLines(prev => prev.map((line, index) => 
        index === existingIndex 
          ? { 
              ...line, 
              quantity: line.quantity + formData.quantity,
              purchasePrice: formData.purchasePrice || line.purchasePrice,
            }
          : line
      ));
    } else {
      // Add new line
      setImportLines(prev => [...prev, {
        productId: formData.productId,
        productName: product.name,
        productSku: product.sku,
        quantity: formData.quantity,
        purchasePrice: formData.purchasePrice || product.purchasePrice || 0,
      }]);
    }

    // Reset form
    setFormData(prev => ({
      ...prev,
      productId: '',
      quantity: 1,
      purchasePrice: 0,
    }));
  };

  const handleRemoveLine = (index: number) => {
    setImportLines(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateLine = (index: number, field: 'quantity' | 'purchasePrice', value: number) => {
    setImportLines(prev => prev.map((line, i) => 
      i === index ? { ...line, [field]: value } : line
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplierId) {
      toast.error('Veuillez sélectionner un fournisseur');
      return;
    }

    if (importLines.length === 0) {
      toast.error('Veuillez ajouter au moins un produit');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        supplierId: formData.supplierId,
        lines: importLines.map(line => ({
          productId: line.productId,
          quantity: line.quantity,
          purchasePrice: line.purchasePrice && line.purchasePrice > 0 ? line.purchasePrice : undefined,
        })),
        reference: formData.reference || undefined,
        receivedDate: formData.receivedDate || undefined,
        notes: formData.notes || undefined,
      };

      await apiClient.post('/imports', payload);
      toast.success('Importation créée avec succès !');
      onClose();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Failed to create import:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la création de l\'importation');
    } finally {
      setLoading(false);
    }
  };

  const totalQuantity = importLines.reduce((sum, line) => sum + line.quantity, 0);
  const totalValue = importLines.reduce((sum, line) => sum + (line.quantity * (line.purchasePrice || 0)), 0);

  if (!canCreate) {
    return null;
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Nouvelle Importation"
        variant="form"
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Supplier Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TruckIcon className="w-5 h-5" />
              Fournisseur
            </h3>
            <div>
              <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700 mb-2">
                Fournisseur <span className="text-red-500">*</span>
              </label>
              <Autocomplete
                options={suppliers.map((supplier) => ({
                  value: supplier.id,
                  label: supplier.name,
                }))}
                value={formData.supplierId}
                onChange={(value) => setFormData({ ...formData, supplierId: value })}
                placeholder="Rechercher un fournisseur..."
                className="w-full"
                disabled={loadingOptions}
              />
            </div>
          </div>

          {/* Add Products Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PackageIcon className="w-5 h-5" />
              Ajouter des Produits
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label htmlFor="productId" className="block text-sm font-medium text-gray-700 mb-2">
                  Produit <span className="text-red-500">*</span>
                </label>
                <Autocomplete
                  options={products.map((product) => ({
                    value: product.id,
                    label: `${product.name}${product.sku ? ` (${product.sku})` : ''}`,
                  }))}
                  value={formData.productId}
                  onChange={(value) => {
                    const product = products.find(p => p.id === value);
                    setFormData({ 
                      ...formData, 
                      productId: value,
                      purchasePrice: product?.purchasePrice || 0,
                    });
                  }}
                  placeholder="Rechercher un produit..."
                  className="w-full"
                  onCreateNew={handleCreateProduct}
                  createNewLabel="Créer le produit"
                  disabled={loadingOptions}
                />
              </div>

              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                  Quantité <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="quantity"
                  min="1"
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-700 mb-2">
                  Prix d'achat (optionnel)
                </label>
                <input
                  type="number"
                  id="purchasePrice"
                  min="0"
                  step="0.01"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddLine}
              disabled={loadingOptions}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Ajouter au panier
            </button>
          </div>

          {/* Import Lines List */}
          {importLines.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Produits à importer</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix unitaire</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {importLines.map((line, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{line.productName}</div>
                            {line.productSku && (
                              <div className="text-sm text-gray-500">SKU: {line.productSku}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={(e) => handleUpdateLine(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-20 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.purchasePrice || 0}
                            onChange={(e) => handleUpdateLine(index, 'purchasePrice', parseFloat(e.target.value) || 0)}
                            className="w-24 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {(line.quantity * (line.purchasePrice || 0)).toFixed(2)} €
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-sm font-medium text-gray-900">
                        Total
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {totalQuantity} unités
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {totalValue.toFixed(2)} €
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations supplémentaires</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-2">
                  Référence (facture, bon de livraison, etc.)
                </label>
                <input
                  type="text"
                  id="reference"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: FACT-2024-001"
                />
              </div>

              <div>
                <label htmlFor="receivedDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Date de réception
                </label>
                <input
                  type="date"
                  id="receivedDate"
                  value={formData.receivedDate}
                  onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optionnel)
              </label>
              <textarea
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Notes additionnelles..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !formData.supplierId || importLines.length === 0}
              className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Création...' : 'Créer l\'importation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Product Creation Modal */}
      <ProductFormModal
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setNewProductData(null);
        }}
        onSuccess={handleProductCreated}
        initialData={newProductData || undefined}
      />
    </>
  );
}
