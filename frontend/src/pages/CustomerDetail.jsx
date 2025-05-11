import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCustomer } from '../api/axios';
import { CurrencyRupeeIcon, UserIcon } from '@heroicons/react/24/outline';

export default function CustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCustomer(id);
      setCustomer(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch customer details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-gray-500">Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Customer Header */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center gap-x-4">
          <div className="rounded-full bg-gray-100 p-3">
            <UserIcon className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{customer.name}</h1>
            <p className="mt-1 text-sm text-gray-500">{customer.phone}</p>
          </div>
        </div>
      </div>

      {/* Balance Summary */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center gap-x-4">
            <div className="rounded-full bg-green-100 p-3">
              <CurrencyRupeeIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Received</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                ₹{customer.totalReceived.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center gap-x-4">
            <div className="rounded-full bg-red-100 p-3">
              <CurrencyRupeeIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Paid</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                ₹{customer.totalPaid.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-x-4">
            <div className={`rounded-full p-3 ${customer.balance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <CurrencyRupeeIcon className={`h-6 w-6 ${customer.balance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Outstanding Balance</p>
              <p className={`mt-1 text-2xl font-semibold ${customer.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{Math.abs(customer.balance).toLocaleString()}
                <span className="text-sm font-medium text-gray-500">
                  {customer.balance >= 0 ? ' (to receive)' : ' (to pay)'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold leading-6 text-gray-900">Transaction History</h2>
            <Link
              to="/payments/add"
              className="inline-flex items-center gap-x-1.5 rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              Add Payment
            </Link>
          </div>
        </div>

        <ul role="list" className="divide-y divide-gray-100">
          {customer.transactions && customer.transactions.length > 0 ? (
            customer.transactions.map((transaction) => (
              <li key={transaction.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center gap-x-4">
                  <div className={`rounded-full p-2 ${transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'}`}>
                    <CurrencyRupeeIcon 
                      className={`h-5 w-5 ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}
                    />
                  </div>
                  <div className="min-w-0 flex-auto">
                    <p className="text-sm text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-500">{transaction.description || 'No description'}</p>
                  </div>
                  <div className={`text-sm font-medium ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="px-4 py-12 text-center">
              <CurrencyRupeeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No transactions</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding a new payment.</p>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
} 