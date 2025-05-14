import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/axios';

interface AccessCode {
  id: string;
  code: string;
  isUsed: boolean;
  businessName: string;
  expiresAt: string;
  usedBy?: {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    stats?: BusinessStats;
  };
  createdAt: string;
}

interface BusinessStats {
  totalSessions: number;
  activeSessions: number;
  totalMessages: number;
  incomingMessages: number;
  outgoingMessages: number;
  responseRate: number;
  averageResponseTime: number;
}

interface Business {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  status?: 'Active' | 'Blocked' | 'Pending';
  createdAt: string;
  lastActive?: string;
  stats?: BusinessStats;
}

export const AdminDashboard = () => {
  const { admin, logout } = useAuth();
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [selectedAccessCode, setSelectedAccessCode] = useState<AccessCode | null>(null);
  const [extensionDays, setExtensionDays] = useState(7);
  const [newAccessCode, setNewAccessCode] = useState({
    businessName: '',
    expiryDays: 7
  });
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [codesResponse, businessesResponse] = await Promise.all([
        api.get('/admin/access-codes'),
        api.get('/admin/businesses'),
      ]);
      setAccessCodes(codesResponse.data.accessCodes);
      setBusinesses(businessesResponse.data.businesses);
      setError('');
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const response = await api.post('/admin/access-codes', {
        businessName: newAccessCode.businessName,
        expiryDays: newAccessCode.expiryDays
      });
      setAccessCodes((prev) => [response.data.accessCode, ...prev]);
      setNewAccessCode({ businessName: '', expiryDays: 7 });
      setError('');
    } catch (err) {
      setError('Failed to generate access code');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleBusinessStatus = async (businessId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/admin/businesses/${businessId}/status`, {
        isActive: !currentStatus
      });
      setBusinesses(businesses.map(business => 
        business.id === businessId 
          ? { ...business, isActive: !currentStatus }
          : business
      ));
    } catch (err) {
      setError('Failed to update business status');
    }
  };

  const handleViewBusinessDetails = async (business: Business) => {
    try {
      // If the business is not active (unused access code), show the modal directly without API call
      if (!business.isActive) {
        setSelectedBusiness(business);
        return;
      }

      // Otherwise, fetch business details from API
      console.log('Fetching business details for:', business.id);
      const response = await api.get(`/admin/businesses/${business.id}`);
      console.log('Business details response:', response.data);
      
      if (!response.data.business) {
        throw new Error('No business data received');
      }
      
      setSelectedBusiness(response.data.business);
    } catch (error) {
      console.error('Error fetching business details:', error);
      // For unused access codes, still show the modal with basic info
      if (!business.isActive) {
        setSelectedBusiness(business);
      } else {
        setError(error instanceof Error ? error.message : 'Failed to fetch business details');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const handleExtendAccessCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccessCode) return;
    
    setIsExtending(true);
    try {
      const response = await api.patch(`/admin/access-codes/${selectedAccessCode.id}/extend`, {
        additionalDays: extensionDays
      });
      
      setAccessCodes(codes => codes.map(code => 
        code.id === selectedAccessCode.id 
          ? { ...code, expiresAt: response.data.accessCode.expiresAt }
          : code
      ));
      
      setSelectedAccessCode(null);
      setExtensionDays(7);
      setError('');
    } catch (err) {
      setError('Failed to extend access code expiry');
    } finally {
      setIsExtending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">{admin?.name}</span>
              <button
                onClick={logout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          {/* Generate Access Code Form */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Generate New Access Code</h2>
              <form onSubmit={handleGenerateCode} className="space-y-4">
                <div>
                  <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                    Business Name
                  </label>
                  <input
                    type="text"
                    id="businessName"
                    value={newAccessCode.businessName}
                    onChange={(e) => setNewAccessCode(prev => ({ ...prev, businessName: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="expiryDays" className="block text-sm font-medium text-gray-700">
                    Expiry Days
                  </label>
                  <input
                    type="number"
                    id="expiryDays"
                    value={newAccessCode.expiryDays}
                    onChange={(e) => setNewAccessCode(prev => ({ ...prev, expiryDays: parseInt(e.target.value) }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    min="1"
                    max="365"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {isGenerating ? 'Generating...' : 'Generate Access Code'}
                </button>
              </form>
            </div>
          </div>

          {/* Access Codes Table */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Access Codes</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Code</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Business Name</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Expires At</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Used By</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {accessCodes.map((code) => (
                      <tr key={code.id}>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">{code.code}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{code.businessName}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            code.isUsed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {code.isUsed ? 'Used' : 'Available'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {new Date(code.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {code.usedBy ? `${code.usedBy.name} (${code.usedBy.email})` : '-'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex space-x-2">
                            {!code.isUsed && (
                              <>
                                <button
                                  onClick={() => setSelectedAccessCode(code)}
                                  className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                                >
                                  Extend
                                </button>
                                <button
                                  onClick={() => {
                                    const business: Business = {
                                      id: code.id,
                                      name: code.businessName,
                                      email: '-',
                                      phoneNumber: '-',
                                      isActive: false,
                                      status: 'Pending',
                                      createdAt: code.createdAt,
                                      stats: {
                                        totalSessions: 0,
                                        activeSessions: 0,
                                        totalMessages: 0,
                                        incomingMessages: 0,
                                        outgoingMessages: 0,
                                        responseRate: 0,
                                        averageResponseTime: 0
                                      }
                                    };
                                    handleViewBusinessDetails(business);
                                  }}
                                  className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
                                >
                                  View Details
                                </button>
                              </>
                            )}
                            {code.isUsed && code.usedBy?.id && (
                              <button
                                onClick={() => {
                                  if (!code.usedBy?.id || !code.usedBy?.name || !code.usedBy?.email) return;
                                  const business: Business = {
                                    id: code.usedBy.id,
                                    name: code.usedBy.name,
                                    email: code.usedBy.email,
                                    phoneNumber: code.usedBy.phoneNumber || '-',
                                    isActive: true,
                                    createdAt: code.createdAt,
                                    stats: code.usedBy.stats || {
                                      totalSessions: 0,
                                      activeSessions: 0,
                                      totalMessages: 0,
                                      incomingMessages: 0,
                                      outgoingMessages: 0,
                                      responseRate: 0,
                                      averageResponseTime: 0
                                    }
                                  };
                                  handleViewBusinessDetails(business);
                                }}
                                className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200"
                              >
                                View Business Details
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Extension Modal */}
          {selectedAccessCode && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Extend Access Code</h3>
                  <button
                    onClick={() => setSelectedAccessCode(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleExtendAccessCode} className="space-y-4">
                  <div>
                    <label htmlFor="extensionDays" className="block text-sm font-medium text-gray-700">
                      Extension Days
                    </label>
                    <input
                      type="number"
                      id="extensionDays"
                      value={extensionDays}
                      onChange={(e) => setExtensionDays(parseInt(e.target.value))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      min="1"
                      max="365"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setSelectedAccessCode(null)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isExtending}
                      className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                      {isExtending ? 'Extending...' : 'Extend'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Businesses Table */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Registered Businesses</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Business Name</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Last Active</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {businesses.map((business) => (
                      <tr key={business.id}>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                          {business.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {business.email}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            business.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {business.isActive ? 'Active' : 'Blocked'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {business.lastActive ? new Date(business.lastActive).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewBusinessDetails(business)}
                              className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => handleToggleBusinessStatus(business.id, business.isActive)}
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                business.isActive
                                  ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                  : 'bg-green-100 text-green-800 hover:bg-green-200'
                              }`}
                            >
                              {business.isActive ? 'Block' : 'Unblock'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Business Details Modal */}
          {selectedBusiness && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
              <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-medium text-gray-900">Business Details</h3>
                  <button
                    onClick={() => setSelectedBusiness(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Business Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Business Information</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                      <div>
                        <h5 className="text-sm font-medium text-gray-500">Business Name</h5>
                        <p className="mt-1 text-sm text-gray-900">{selectedBusiness.name}</p>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-500">Email</h5>
                        <p className="mt-1 text-sm text-gray-900">{selectedBusiness.email}</p>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-500">Phone Number</h5>
                        <p className="mt-1 text-sm text-gray-900">{selectedBusiness.phoneNumber}</p>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-500">Status</h5>
                        <div className="mt-1 flex items-center space-x-2">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            selectedBusiness.status === 'Pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : selectedBusiness.status === 'Active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {selectedBusiness.status || (selectedBusiness.isActive ? 'Active' : 'Blocked')}
                          </span>
                          {selectedBusiness.status !== 'Pending' && (
                            <button
                              onClick={() => handleToggleBusinessStatus(selectedBusiness.id, selectedBusiness.isActive)}
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                selectedBusiness.isActive
                                  ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                  : 'bg-green-100 text-green-800 hover:bg-green-200'
                              }`}
                            >
                              {selectedBusiness.isActive ? 'Block' : 'Unblock'}
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-500">Registered On</h5>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date(selectedBusiness.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-500">Last Active</h5>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedBusiness.lastActive 
                            ? new Date(selectedBusiness.lastActive).toLocaleDateString()
                            : 'Never'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Chatbot Usage Statistics */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Chatbot Usage Statistics</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h5 className="text-sm font-medium text-gray-500">Total Sessions</h5>
                          <p className="mt-1 text-2xl font-semibold text-gray-900">
                            {selectedBusiness.stats?.totalSessions || 0}
                          </p>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-gray-500">Active Sessions</h5>
                          <p className="mt-1 text-2xl font-semibold text-gray-900">
                            {selectedBusiness.stats?.activeSessions || 0}
                          </p>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-gray-500">Total Messages</h5>
                          <p className="mt-1 text-2xl font-semibold text-gray-900">
                            {selectedBusiness.stats?.totalMessages || 0}
                          </p>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-gray-500">Response Rate</h5>
                          <p className="mt-1 text-2xl font-semibold text-gray-900">
                            {selectedBusiness.stats?.responseRate || 0}%
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <h5 className="text-sm font-medium text-gray-500 mb-2">Message Distribution</h5>
                        <div className="bg-white rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-500">Incoming Messages</span>
                            <span className="text-sm font-medium text-gray-900">
                              {selectedBusiness.stats?.incomingMessages || 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Outgoing Messages</span>
                            <span className="text-sm font-medium text-gray-900">
                              {selectedBusiness.stats?.outgoingMessages || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <h5 className="text-sm font-medium text-gray-500 mb-2">Response Time</h5>
                        <div className="bg-white rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Average Response Time</span>
                            <span className="text-sm font-medium text-gray-900">
                              {selectedBusiness.stats?.averageResponseTime 
                                ? `${selectedBusiness.stats.averageResponseTime.toFixed(1)} seconds`
                                : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}; 