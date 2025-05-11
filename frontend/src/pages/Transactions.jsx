import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { getPayments } from '../api/axios';
import Table from '../components/Table';
import Card from '../components/Card';
import { PlusIcon, ArrowsRightLeftIcon, FunnelIcon } from '@heroicons/react/24/outline';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export default function Transactions() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ payments: [], pagination: {} });
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    customer: '',
    dateRange: '',
    method: '',
    direction: ''
  });

  useEffect(() => {
    fetchTransactions();
  }, [currentPage]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await getPayments(currentPage);
      setData(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (row) => format(new Date(row.date), 'MMM d, yyyy')
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (row) => row.customer.name
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (row) => (
        <span className={row.direction === 'CREDIT' ? 'text-green-600' : 'text-red-600'}>
          {row.direction === 'CREDIT' ? '+' : '-'}{formatCurrency(row.amount)}
        </span>
      )
    },
    {
      key: 'method',
      header: 'Method',
      render: (row) => row.method || 'Cash'
    },
    {
      key: 'direction',
      header: 'Type',
      render: (row) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          row.direction === 'CREDIT' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {row.direction === 'CREDIT' ? 'Received' : 'Paid'}
        </span>
      )
    },
    {
      key: 'note',
      header: 'Note',
      render: (row) => row.note || '-'
    }
  ];

  const handleRowClick = (row) => {
    navigate(`/customers/${row.customer_id}`);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Transactions</h2>
          <p className="mt-1 text-sm text-gray-500">
            A complete list of all payment transactions
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <FunnelIcon className="-ml-0.5 h-4 w-4 text-gray-400" aria-hidden="true" />
            Filter
          </button>
          <Link
            to="/payments/add"
            className="inline-flex items-center gap-x-1.5 rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            <PlusIcon className="-ml-0.5 h-4 w-4" aria-hidden="true" />
            Add Payment
          </Link>
        </div>
      </div>

      {error && (
        <Card className="bg-red-50 text-red-700 p-4">
          <p className="text-sm">{error}</p>
        </Card>
      )}

      <Table
        columns={columns}
        data={data.payments}
        isLoading={loading}
        emptyMessage="No transactions found. Add your first payment to get started."
        onRowClick={handleRowClick}
      />

      {/* Pagination */}
      {data.pagination && data.pagination.pages > 1 && (
        <nav
          className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6"
          aria-label="Pagination"
        >
          <div className="hidden sm:block">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * data.pagination.limit + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(currentPage * data.pagination.limit, data.pagination.total)}
              </span>{' '}
              of <span className="font-medium">{data.pagination.total}</span> results
            </p>
          </div>
          <div className="flex flex-1 justify-between sm:justify-end">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                currentPage === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === data.pagination.pages}
              className={`relative ml-3 inline-flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                currentPage === data.pagination.pages
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
        </nav>
      )}
    </div>
  );
} 