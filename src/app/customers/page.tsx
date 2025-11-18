'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import Layout from '@/components/Layout';
import Link from 'next/link';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await apiClient.get('/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading customers...</div>
        </div>
      </Layout>
    );
  }

  const filteredCustomers = search
    ? customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(search.toLowerCase()) ||
          customer.email?.toLowerCase().includes(search.toLowerCase()),
      )
    : customers;

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Customers</h2>
          <Link
            href="/customers/new"
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            Add Customer
          </Link>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {customer.name}
              </h3>
              {customer.email && (
                <p className="text-sm text-gray-600 mb-1">📧 {customer.email}</p>
              )}
              {customer.phone && (
                <p className="text-sm text-gray-600 mb-1">📞 {customer.phone}</p>
              )}
              {customer.address && (
                <p className="text-sm text-gray-600 mb-4">📍 {customer.address}</p>
              )}
              <div className="flex space-x-3">
                <Link
                  href={`/customers/${customer.id}`}
                  className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                >
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {search ? 'No customers found matching your search' : 'No customers found'}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}

