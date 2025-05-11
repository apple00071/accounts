import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomers, createPayment } from '../api/axios';
import { CurrencyRupeeIcon } from '@heroicons/react/24/outline';

export default function AddPayment() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payment, setPayment] = useState({
    customerId: '',
    amount: '',
    type: 'credit',
    description: '',
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCustomers();
      setCustomers(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      await createPayment({
        ...payment,
        amount: parseFloat(payment.amount),
      });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to create payment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-gray-500">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-base font-semibold leading-7 text-gray-900">Add Payment</h1>
        <p className="mt-1 text-sm leading-6 text-gray-500">
          Record a new payment transaction
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg bg-white p-6 shadow">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="customerId" className="block text-sm font-medium leading-6 text-gray-900">
              Customer
            </label>
            <div className="mt-2">
              <select
                id="customerId"
                name="customerId"
                required
                value={payment.customerId}
                onChange={(e) => setPayment({ ...payment, customerId: e.target.value })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium leading-6 text-gray-900">
              Payment Type
            </label>
            <div className="mt-2">
              <select
                id="type"
                name="type"
                required
                value={payment.type}
                onChange={(e) => setPayment({ ...payment, type: e.target.value })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
              >
                <option value="credit">Received (Credit)</option>
                <option value="debit">Paid (Debit)</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium leading-6 text-gray-900">
              Amount
            </label>
            <div className="relative mt-2 rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <CurrencyRupeeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="number"
                name="amount"
                id="amount"
                required
                min="0"
                step="0.01"
                value={payment.amount}
                onChange={(e) => setPayment({ ...payment, amount: e.target.value })}
                className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900">
              Description
            </label>
            <div className="mt-2">
              <textarea
                id="description"
                name="description"
                rows={3}
                value={payment.description}
                onChange={(e) => setPayment({ ...payment, description: e.target.value })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                placeholder="Optional payment description"
              />
            </div>
          </div>

          <div className="flex justify-end gap-x-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              Save Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 