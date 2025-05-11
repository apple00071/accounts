import React, { useState } from 'react';
import Card from '../components/Card';
import { 
  DocumentArrowDownIcon, 
  ChartBarIcon, 
  ChartPieIcon 
} from '@heroicons/react/24/outline';

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Reports</h2>
          <p className="mt-1 text-sm text-gray-500">
            View financial reports and analytics
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <DocumentArrowDownIcon className="-ml-0.5 h-4 w-4 text-gray-400" aria-hidden="true" />
            Export PDF
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <DocumentArrowDownIcon className="-ml-0.5 h-4 w-4 text-gray-400" aria-hidden="true" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-2 inline-flex">
        <button
          type="button"
          onClick={() => setSelectedPeriod('week')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md ${
            selectedPeriod === 'week' 
              ? 'bg-primary-50 text-primary-700' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Week
        </button>
        <button
          type="button"
          onClick={() => setSelectedPeriod('month')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md ${
            selectedPeriod === 'month' 
              ? 'bg-primary-50 text-primary-700' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Month
        </button>
        <button
          type="button"
          onClick={() => setSelectedPeriod('quarter')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md ${
            selectedPeriod === 'quarter' 
              ? 'bg-primary-50 text-primary-700' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Quarter
        </button>
        <button
          type="button"
          onClick={() => setSelectedPeriod('year')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md ${
            selectedPeriod === 'year' 
              ? 'bg-primary-50 text-primary-700' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Year
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="border-b border-gray-100 pb-3 mb-3">
            <div className="flex items-center gap-x-2">
              <ChartBarIcon className="h-4 w-4 text-gray-400" />
              <h3 className="text-base font-medium text-gray-900">Monthly Summary</h3>
            </div>
          </div>
          <div className="h-72 flex items-center justify-center bg-gray-50 rounded-md">
            <p className="text-sm text-gray-500">Bar chart will be displayed here</p>
          </div>
        </Card>

        <Card>
          <div className="border-b border-gray-100 pb-3 mb-3">
            <div className="flex items-center gap-x-2">
              <ChartPieIcon className="h-4 w-4 text-gray-400" />
              <h3 className="text-base font-medium text-gray-900">Payment Method Breakdown</h3>
            </div>
          </div>
          <div className="h-72 flex items-center justify-center bg-gray-50 rounded-md">
            <p className="text-sm text-gray-500">Pie chart will be displayed here</p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="border-b border-gray-100 pb-3 mb-3">
          <h3 className="text-base font-medium text-gray-900">Payment Summary by Method</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Received
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Paid
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Amount
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transactions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {['Cash', 'UPI', 'Bank Transfer', 'Other'].map((method) => (
                <tr key={method}>
                  <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{method}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-green-600">₹10,000</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-red-600">₹5,000</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-primary-600">₹5,000</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">12</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
} 