import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCustomers, createCustomer } from '../api/axios';
import { PlusIcon, UserIcon } from '@heroicons/react/24/outline';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });

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
      await createCustomer(newCustomer);
      setNewCustomer({ name: '', phone: '' });
      setShowAddForm(false);
      await fetchCustomers();
    } catch (err) {
      setError(err.message || 'Failed to create customer');
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
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-base font-semibold leading-7 text-gray-900">Customers</h1>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            Manage your customer list and view their payment history
          </p>
        </div>
        <div className="mt-4 sm:ml-4 sm:mt-0">
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-x-1.5 rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            Add Customer
          </button>
        </div>
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

      {showAddForm && (
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-base font-semibold leading-7 text-gray-900">Add New Customer</h2>
          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                Name
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium leading-6 text-gray-900">
                Phone
              </label>
              <div className="mt-2">
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  required
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="flex justify-end gap-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-lg bg-white shadow">
        <ul role="list" className="divide-y divide-gray-100">
          {customers.length > 0 ? (
            customers.map((customer) => (
              <li key={customer.id}>
                <Link
                  to={`/customers/${customer.id}`}
                  className="block hover:bg-gray-50"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center gap-x-4">
                      <div className="rounded-full bg-gray-100 p-2">
                        <UserIcon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="min-w-0 flex-auto">
                        <p className="text-sm font-semibold leading-6 text-gray-900">{customer.name}</p>
                        <p className="mt-1 truncate text-sm leading-5 text-gray-500">{customer.phone}</p>
                      </div>
                      <div className="flex items-center gap-x-2">
                        <div className="hidden sm:flex sm:flex-col sm:items-end">
                          <p className={`text-sm font-medium ${customer.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{Math.abs(customer.balance).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            {customer.balance >= 0 ? 'To Receive' : 'To Pay'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))
          ) : (
            <li className="px-4 py-12 text-center">
              <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No customers</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding a new customer.</p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-x-1.5 rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                >
                  <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
                  Add Customer
                </button>
              </div>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
} 