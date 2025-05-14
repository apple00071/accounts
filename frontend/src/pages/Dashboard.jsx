import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  CurrencyRupeeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  PlusIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { getSummary } from '../api/axios';
import Card from '../components/Card';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

export default function Dashboard() {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching dashboard summary...');
        const response = await getSummary();
        console.log('Dashboard summary response:', response.data);
        setSummaryData(response.data);
      } catch (err) {
        console.error('Error fetching summary:', err);
        setError(err.message || 'Failed to fetch summary data');
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchSummary();

    // Set up polling every 2 seconds (increased from 5 seconds)
    const intervalId = setInterval(fetchSummary, 2000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-primary-200 border-t-primary-600"></div>
          <p className="text-sm text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-md mx-auto">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-red-50 p-3">
            <CurrencyRupeeIcon className="h-5 w-5 text-red-600" />
          </div>
          <div className="text-center">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Error Loading Dashboard</h3>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      </Card>
    );
  }

  if (!summaryData || !summaryData.summary) {
    return null;
  }

  const { summary, recentTransactions } = summaryData;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Received */}
        <Card>
          <div className="flex items-center gap-x-3">
            <div className="rounded-full bg-green-50 p-1.5 ring-4 ring-green-50/30">
              <ArrowTrendingUpIcon className="h-3.5 w-3.5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Received</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {formatCurrency(summary.totalReceived)}
              </p>
            </div>
          </div>
        </Card>

        {/* Total Paid */}
        <Card>
          <div className="flex items-center gap-x-3">
            <div className="rounded-full bg-red-50 p-1.5 ring-4 ring-red-50/30">
              <ArrowTrendingDownIcon className="h-3.5 w-3.5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Paid</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {formatCurrency(summary.totalPaid)}
              </p>
            </div>
          </div>
        </Card>

        {/* Outstanding Balance */}
        <Card>
          <div className="flex items-center gap-x-3">
            <div className={`rounded-full p-1.5 ring-4 ${
              summary.outstandingBalance >= 0 
                ? 'bg-primary-50 ring-primary-50/30' 
                : 'bg-orange-50 ring-orange-50/30'
            }`}>
              <CurrencyRupeeIcon className={`h-3.5 w-3.5 ${
                summary.outstandingBalance >= 0 ? 'text-primary-600' : 'text-orange-600'
              }`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Net Balance</p>
              <div className="flex items-baseline gap-2">
                <p className={`mt-1 text-lg font-semibold ${
                  summary.outstandingBalance >= 0 ? 'text-primary-600' : 'text-orange-600'
                }`}>
                  {formatCurrency(Math.abs(summary.outstandingBalance))}
                </p>
                <span className="text-xs font-medium text-gray-400">
                  {summary.outstandingBalance >= 0 ? '(to receive)' : '(to pay)'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Active Customers */}
        <Card>
          <div className="flex items-center gap-x-3">
            <div className="rounded-full bg-blue-50 p-1.5 ring-4 ring-blue-50/30">
              <UsersIcon className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active Customers</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {summary.activeCustomers || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <div className="border-b border-gray-100 pb-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClockIcon className="h-3.5 w-3.5 text-gray-400" />
              <h2 className="text-base font-semibold text-gray-900">Recent Transactions</h2>
            </div>
            <Link
              to="/payments/add"
              className="inline-flex items-center justify-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-colors"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Add Transaction
            </Link>
          </div>
        </div>

        {recentTransactions && recentTransactions.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {recentTransactions.map((transaction) => (
              <li key={transaction.id} className="py-3">
                <div className="flex items-center gap-x-3">
                  <div className={`rounded-full p-1.5 ${
                    transaction.direction === 'CREDIT' 
                      ? 'bg-green-50 ring-4 ring-green-50/30' 
                      : 'bg-red-50 ring-4 ring-red-50/30'
                  }`}>
                    <CurrencyRupeeIcon className={`h-3.5 w-3.5 ${
                      transaction.direction === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{transaction.customer.name}</p>
                      <div className={`text-sm font-medium ${
                        transaction.direction === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.direction === 'CREDIT' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-x-2">
                        <p className="text-xs text-gray-500">
                          {format(new Date(transaction.date), 'PPP')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(transaction.date), 'p')}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">
                        via {transaction.method || 'Cash'}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-6 text-center">
            <CurrencyRupeeIcon className="mx-auto h-8 w-8 text-gray-300" />
            <h3 className="mt-3 text-sm font-medium text-gray-900">No transactions yet</h3>
            <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
              Get started by adding your first transaction using the button above.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
} 