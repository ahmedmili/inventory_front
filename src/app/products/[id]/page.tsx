'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import Layout from '@/components/Layout';
import Link from 'next/link';
import LazyImage from '@/components/LazyImage';

interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  barcode: string;
  purchasePrice: number;
  salePrice: number;
  minStock: number;
  images?: string[] | string | null;
  category?: { id: string; name: string };
  supplier?: { id: string; name: string };
  warehouseStock?: Array<{
    warehouse: { id: string; name: string };
    quantity: number;
  }>;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const response = await apiClient.get(`/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      console.error('Failed to load product:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading product...</div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Product not found</p>
          <Link href="/products" className="text-primary-600 hover:text-primary-900 mt-4 inline-block">
            ← Back to Products
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-4">
          <Link href="/products" className="text-primary-600 hover:text-primary-900">
            ← Back to Products
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-2xl font-bold">{product.name}</h2>
            <Link
              href={`/products/${id}/edit`}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
            >
              Edit
            </Link>
          </div>

          <div className="px-6 py-4">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">SKU</dt>
                <dd className="mt-1 text-sm text-gray-900">{product.sku}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Barcode</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{product.barcode}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Purchase Price</dt>
                <dd className="mt-1 text-sm text-gray-900">${product.purchasePrice.toFixed(2)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Sale Price</dt>
                <dd className="mt-1 text-sm text-gray-900">${product.salePrice.toFixed(2)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Minimum Stock</dt>
                <dd className="mt-1 text-sm text-gray-900">{product.minStock}</dd>
              </div>
              {product.category && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Category</dt>
                  <dd className="mt-1 text-sm text-gray-900">{product.category.name}</dd>
                </div>
              )}
              {product.supplier && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Supplier</dt>
                  <dd className="mt-1 text-sm text-gray-900">{product.supplier.name}</dd>
                </div>
              )}
              {product.description && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900">{product.description}</dd>
                </div>
              )}
            </dl>
          </div>

          {(() => {
            const productImages = Array.isArray(product.images)
              ? product.images
              : product.images
                ? JSON.parse(product.images as string)
                : [];
            
            return productImages.length > 0 ? (
              <div className="px-6 py-4 border-t border-gray-200">
                <h3 className="text-lg font-medium mb-4">Product Images</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {productImages.map((imageUrl: string, index: number) => (
                    <div key={index} className="relative group">
                      <LazyImage
                        src={imageUrl}
                        alt={`${product.name} - Image ${index + 1}`}
                        width={300}
                        height={192}
                        className="w-full h-48 rounded-lg border border-gray-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          {product.warehouseStock && product.warehouseStock.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <h3 className="text-lg font-medium mb-4">Stock Levels</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Warehouse
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {product.warehouseStock.map((stock) => {
                      const isLowStock = stock.quantity <= product.minStock;
                      return (
                        <tr key={stock.warehouse.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {stock.warehouse.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {stock.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isLowStock ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Low Stock
                              </span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                In Stock
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

