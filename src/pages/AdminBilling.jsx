// src/pages/AdminBilling.jsx
import React, { useState, useEffect } from 'react';
import { 
  FiUsers, FiKey, FiDollarSign, FiTrendingUp, FiCalendar, 
  FiRefreshCw, FiSearch, FiBarChart2, FiAlertCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api';

const AdminBilling = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [billingReport, setBillingReport] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch dashboard
      try {
        const dashRes = await api.get('/admin/dashboard');
        setDashboard(dashRes.data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        if (err.response?.status === 403) {
          setError('Admin access required. Please login with an admin account.');
          setLoading(false);
          return;
        }
        throw new Error('Failed to load dashboard: ' + (err.response?.data?.detail || err.message));
      }

      // Fetch users
      try {
        const usersRes = await api.get('/admin/users?limit=100');
        setUsers(usersRes.data.users || []);
      } catch (err) {
        console.error('Users fetch error:', err);
      }

      // Fetch API keys usage
      try {
        const keysRes = await api.get('/admin/usage/keys');
        setApiKeys(keysRes.data.keys || []);
      } catch (err) {
        console.error('API keys fetch error:', err);
      }

      // Fetch billing report
      try {
        const billingRes = await api.get(
          `/admin/billing/report?month=${selectedMonth}&year=${selectedYear}`
        );
        setBillingReport(billingRes.data);
      } catch (err) {
        console.error('Billing report fetch error:', err);
      }

    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      setError(error.message);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success('Data refreshed');
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getPlanBadge = (plan) => {
    const plans = {
      free: { label: 'Free', color: 'bg-gray-100 text-gray-600' },
      pro: { label: 'Pro', color: 'bg-blue-100 text-blue-600' },
      enterprise: { label: 'Enterprise', color: 'bg-purple-100 text-purple-700' }
    };
    return plans[plan] || plans.free;
  };

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return { label: 'Active', color: 'bg-green-100 text-green-600' };
    }
    return { label: 'Inactive', color: 'bg-red-100 text-red-600' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-32"></div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-red-50 rounded-full">
                <FiAlertCircle className="text-red-500" size={48} />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h2>
            <p className="text-gray-500 mb-4">{error}</p>
            <p className="text-sm text-gray-400">You need admin privileges to access this page.</p>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Billing</h1>
            <p className="text-gray-500 text-sm mt-1">Monitor API usage and manage billing</p>
          </div>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <FiRefreshCw className={refreshing ? 'animate-spin' : ''} size={16} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Stats Cards */}
        {dashboard && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <FiUsers className="text-indigo-600" size={20} />
                </div>
                <span className="text-xs text-gray-400">Total Users</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{dashboard.total_users}</p>
              <p className="text-xs text-gray-400 mt-1">+{dashboard.new_users_this_month} this month</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FiKey className="text-blue-600" size={20} />
                </div>
                <span className="text-xs text-gray-400">Active API Keys</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{dashboard.active_api_keys}</p>
              <p className="text-xs text-gray-400 mt-1">Total requests: {dashboard.total_requests?.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-50 rounded-lg">
                  <FiTrendingUp className="text-green-600" size={20} />
                </div>
                <span className="text-xs text-gray-400">Monthly Requests</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{dashboard.monthly_requests?.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <FiDollarSign className="text-yellow-600" size={20} />
                </div>
                <span className="text-xs text-gray-400">Revenue</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">${dashboard.revenue?.total || 0}</p>
              <p className="text-xs text-gray-400 mt-1">Pro: ${dashboard.revenue?.pro || 0} | Enterprise: ${dashboard.revenue?.enterprise || 0}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: FiBarChart2 },
            { id: 'users', label: 'Users', icon: FiUsers },
            { id: 'keys', label: 'API Keys', icon: FiKey },
            { id: 'billing', label: 'Billing Report', icon: FiDollarSign }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content - Dashboard */}
        {activeTab === 'dashboard' && dashboard && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Users by Plan</h3>
              <div className="space-y-3">
                {['free', 'pro', 'enterprise'].map((plan) => (
                  <div key={plan} className="flex items-center justify-between">
                    <span className="capitalize text-gray-600">{plan}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-gray-800">
                        {dashboard.users_by_plan?.[plan] || 0}
                      </span>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            plan === 'free' ? 'bg-gray-400' :
                            plan === 'pro' ? 'bg-blue-500' : 'bg-purple-500'
                          }`}
                          style={{ 
                            width: `${((dashboard.users_by_plan?.[plan] || 0) / Math.max(dashboard.total_users, 1)) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Revenue Breakdown</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Pro Plans</span>
                  <span className="text-sm font-medium text-gray-800">${dashboard.revenue?.pro || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Enterprise Plans</span>
                  <span className="text-sm font-medium text-gray-800">${dashboard.revenue?.enterprise || 0}</span>
                </div>
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-gray-800">Total Revenue</span>
                    <span className="text-lg text-indigo-600">${dashboard.revenue?.total || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content - Users */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search users by name or email..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <span className="text-sm text-gray-400">{filteredUsers.length} users</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Plan</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">API Keys</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Total Requests</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Monthly</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center text-gray-400 py-8">No users found</td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const planBadge = getPlanBadge(user.plan);
                      const statusBadge = getStatusBadge(user.is_active);
                      return (
                        <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-800">{user.full_name || 'Unknown'}</div>
                            <div className="text-xs text-gray-400">{user.email}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${planBadge.color}`}>
                              {planBadge.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">{user.api_keys_count}</td>
                          <td className="px-4 py-3 text-center font-medium">{user.total_requests?.toLocaleString()}</td>
                          <td className="px-4 py-3 text-center">{user.monthly_requests?.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                              {statusBadge.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400">{formatDate(user.created_at)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content - API Keys */}
        {activeTab === 'keys' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">All API Keys ({apiKeys.length})</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">User ID</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Total Requests</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Monthly</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Limit</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Usage</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Last Used</th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center text-gray-400 py-8">No API keys found</td>
                    </tr>
                  ) : (
                    apiKeys.map((key) => {
                      const statusBadge = getStatusBadge(key.is_active);
                      const usage = Math.min(key.usage_percentage || 0, 100);
                      return (
                        <tr key={key.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-800">{key.name}</td>
                          <td className="px-4 py-3 text-gray-600">{key.user_id}</td>
                          <td className="px-4 py-3 text-center">{key.total_requests?.toLocaleString()}</td>
                          <td className="px-4 py-3 text-center">{key.monthly_requests?.toLocaleString()}</td>
                          <td className="px-4 py-3 text-center">{key.monthly_limit?.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    usage > 80 ? 'bg-red-500' :
                                    usage > 50 ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${usage}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-400">{usage.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                              {statusBadge.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400">{formatDate(key.last_used_at)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content - Billing Report */}
        {activeTab === 'billing' && billingReport && (
          <div className="space-y-6">
            {/* Month Selector */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <FiCalendar className="text-gray-400" size={16} />
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                      <option key={m} value={m}>
                        {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                  <button
                    onClick={() => fetchData()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Load Report
                  </button>
                </div>
                <div className="ml-auto flex items-center gap-4 text-sm flex-wrap">
                  <span className="text-gray-500">Total Users: <strong>{billingReport.total_users}</strong></span>
                  <span className="text-gray-500">Revenue: <strong className="text-indigo-600">${billingReport.total_revenue}</strong></span>
                </div>
              </div>
            </div>

            {/* Billing Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Plan</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Price</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Monthly Requests</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Customer ID</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Subscription</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingReport.users.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center text-gray-400 py-8">No paid users found</td>
                      </tr>
                    ) : (
                      billingReport.users.map((user) => {
                        const planBadge = getPlanBadge(user.plan);
                        return (
                          <tr key={user.user_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-800">{user.full_name || 'Unknown'}</div>
                              <div className="text-xs text-gray-400">{user.email}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${planBadge.color}`}>
                                {planBadge.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-800">${user.price}</td>
                            <td className="px-4 py-3 text-center">{user.monthly_requests?.toLocaleString()}</td>
                            <td className="px-4 py-3 text-xs text-gray-400 truncate max-w-32">
                              {user.stripe_customer_id || '-'}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-400 truncate max-w-32">
                              {user.stripe_subscription_id || '-'}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-400">{formatDate(user.joined_at)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBilling;