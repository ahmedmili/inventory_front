'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApi } from '@/hooks/useApi';
import Layout from '@/components/Layout';
import Link from 'next/link';
import Pagination from '@/components/Pagination';
import { TableSkeleton } from '@/components/SkeletonLoader';

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  purchasePrice: number;
  salePrice: number;
  minStock: number;
  category?: { name: string };
  supplier?: { name: string };
}

interface ProductsResponse {
  data: Product[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function ProductsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const limit = 20;

  const searchParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    if (search) params.set('search', search);
    return params.toString();
  }, [page, search, limit]);

  const { data, loading, error } = useApi<ProductsResponse>(`/products?${searchParams}`);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page on search
  };

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Products</h2>
          <Link
            href="/products/new"
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            Add Product
          </Link>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {loading ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md p-6">
            <TableSkeleton rows={5} cols={4} />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">Failed to load products. Please try again.</p>
          </div>
        ) : (
          <>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {data?.data?.map((product) => (
              <li key={product.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {product.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          SKU: {product.sku} | Barcode: {product.barcode}
                        </p>
                        {product.category && (
                          <p className="text-xs text-gray-400">
                            Category: {product.category.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          Purchase: ${product.purchasePrice}
                        </p>
                        <p className="text-sm text-gray-500">
                          Sale: ${product.salePrice}
                        </p>
                        <p className="text-xs text-gray-400">
                          Min Stock: {product.minStock}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Link
                          href={`/products/${product.id}`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          View
                        </Link>
                        <Link
                          href={`/products/${product.id}/edit`}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
                </li>
                ))}
              </ul>
            </div>

            {data?.data?.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No products found</p>
              </div>
            )}

            {data?.meta && data.meta.totalPages > 1 && (
              <Pagination
                currentPage={data.meta.page}
                totalPages={data.meta.totalPages}
                onPageChange={setPage}
                hasNext={data.meta.hasNext}
                hasPrev={data.meta.hasPrev}
              />
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

