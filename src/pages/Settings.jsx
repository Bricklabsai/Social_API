import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FiUser, FiMail, FiLock, FiKey, FiCopy, FiCheck, 
  FiRefreshCw, FiEye, FiEyeOff, FiTrash2, FiShield,
  FiCheckCircle, FiXCircle, FiAlertCircle, FiPlus,
  FiX  // ← ADDED
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { apiKeys, settings } from '../services/api';

// Skeleton Component
const SettingsSkeleton = () => (
  <div className="space-y-6">
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 bg-gray-200 rounded"></div>
        <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        <div>
          <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
      <div className="h-10 bg-gray-200 rounded-lg w-32 mt-4 animate-pulse"></div>
    </div>
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 bg-gray-200 rounded"></div>
        <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        ))}
      </div>
      <div className="h-10 bg-gray-200 rounded-lg w-40 mt-4 animate-pulse"></div>
    </div>
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-200 rounded"></div>
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded-lg w-40 animate-pulse"></div>
      </div>
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-40 animate-pulse mt-1"></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 bg-gray-200 rounded-full w-16 animate-pulse"></div>
              <div className="w-5 h-5 bg-gray-200 rounded"></div>
              <div className="w-5 h-5 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile state
  const [profile, setProfile] = useState({
    full_name: user?.full_name || '',
    email: user?.email || ''
  });

  // Password state
  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  // API Keys state
  const [apiKeysList, setApiKeysList] = useState([]);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [newKey, setNewKey] = useState(null);
  const [showSecret, setShowSecret] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyDescription, setNewKeyDescription] = useState('');
  const [newKeyLimit, setNewKeyLimit] = useState(1000);

  // Fetch API keys on load
  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await apiKeys.list();
      setApiKeysList(response.data.keys || []);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  // Update Profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await settings.updateProfile(profile);
      toast.success('Profile updated successfully!');
      if (updateUser) updateUser(response.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (password.new !== password.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.new.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      await settings.changePassword({
        current_password: password.current,
        new_password: password.new,
        confirm_password: password.confirm
      });
      toast.success('Password changed successfully!');
      setPassword({ current: '', new: '', confirm: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  // Generate API Key
  const handleGenerateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for your API key');
      return;
    }

    setGeneratingKey(true);
    try {
      const response = await apiKeys.create({
        name: newKeyName.trim(),
        description: newKeyDescription.trim(),
        monthly_limit: newKeyLimit
      });
      
      setNewKey(response.data);
      setShowCreateModal(false);
      setNewKeyName('');
      setNewKeyDescription('');
      setNewKeyLimit(1000);
      toast.success('API key generated successfully!');
      fetchApiKeys();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate API key');
    } finally {
      setGeneratingKey(false);
    }
  };

  // Toggle API Key Status
  const handleToggleKey = async (keyId, currentStatus) => {
    try {
      await apiKeys.update(keyId, { is_active: !currentStatus });
      toast.success(`API key ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchApiKeys();
    } catch (error) {
      toast.error('Failed to update API key');
    }
  };

  // Delete API Key
  const handleDeleteKey = async (keyId, keyName) => {
    if (!confirm(`Are you sure you want to delete "${keyName}"? This action cannot be undone.`)) return;
    try {
      await apiKeys.delete(keyId);
      toast.success('API key deleted successfully');
      fetchApiKeys();
    } catch (error) {
      toast.error('Failed to delete API key');
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="h-9 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-5 bg-gray-200 rounded w-64 animate-pulse mt-1"></div>
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>
          <SettingsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
            <p className="text-gray-500 mt-1">Manage your account and security preferences</p>
          </div>
          <div className="w-12 h-12 bg-linear-to-br from-pink-600 via-pink-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-300/50">
            <FiShield size={24} className="text-white" />
          </div>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
              <FiUser className="text-pink-600" />
              Profile Information
            </h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-gray-50/50 hover:bg-white transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Email Address</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-gray-50/50 hover:bg-white transition-all"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-linear-to-r from-pink-600 via-pink-500 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-pink-300/50 transition-all duration-300 disabled:opacity-50"
              >
                {saving ? <FiRefreshCw className="animate-spin inline" /> : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Password Section */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
              <FiLock className="text-pink-600" />
              Change Password
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Current Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password.current}
                    onChange={(e) => setPassword({ ...password, current: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-gray-50/50 hover:bg-white transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password.new}
                      onChange={(e) => setPassword({ ...password, new: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-gray-50/50 hover:bg-white transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Confirm Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password.confirm}
                    onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-gray-50/50 hover:bg-white transition-all"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-linear-to-r from-pink-600 via-pink-500 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-pink-300/50 transition-all duration-300 disabled:opacity-50"
              >
                {saving ? <FiRefreshCw className="animate-spin inline" /> : 'Change Password'}
              </button>
            </form>
          </div>

          {/* API Keys Section */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FiKey className="text-pink-600" />
                API Keys
              </h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-linear-to-r from-pink-600 via-pink-500 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-pink-300/50 transition-all duration-300 text-sm flex items-center gap-2"
              >
                <FiPlus size={16} />
                Generate New Key
              </button>
            </div>

            {/* Create Key Modal */}
            {showCreateModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Create API Key</h3>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FiX size={20} />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Key Name *</label>
                      <input
                        type="text"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="e.g., My Blog Integration"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <input
                        type="text"
                        value={newKeyDescription}
                        onChange={(e) => setNewKeyDescription(e.target.value)}
                        placeholder="What is this key for?"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Limit</label>
                      <input
                        type="number"
                        value={newKeyLimit}
                        onChange={(e) => setNewKeyLimit(parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-400 mt-1">Requests per month (0 = unlimited)</p>
                    </div>
                    <button
                      onClick={handleGenerateKey}
                      disabled={generatingKey}
                      className="w-full py-2 bg-linear-to-r from-pink-600 via-pink-500 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-pink-300/50 transition-all duration-300 disabled:opacity-50"
                    >
                      {generatingKey ? <FiRefreshCw className="animate-spin inline" /> : 'Create API Key'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* New Key Alert */}
            {newKey && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium mb-2">
                  ⚠️ Save your API key now. It won't be shown again!
                </p>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-50">
                    <p className="text-xs text-gray-500">API Key</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono bg-white px-2 py-1 rounded border border-gray-200 block truncate flex-1">
                        {showSecret ? newKey.key : '••••••••••••••••••••••••••••••'}
                      </code>
                      <button
                        onClick={() => setShowSecret(!showSecret)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {showSecret ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(newKey.key)}
                        className="text-pink-600 hover:text-pink-700"
                      >
                        <FiCopy size={16} />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setNewKey(null)}
                    className="text-gray-400 hover:text-gray-600 text-sm"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* API Keys List */}
            {apiKeysList.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FiKey size={32} className="mx-auto mb-2 opacity-50" />
                <p>No API keys generated yet</p>
                <p className="text-sm mt-1">Create your first API key to start building integrations.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeysList.map((key) => (
                  <div key={key.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-pink-200 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${key.is_active ? 'bg-green-500' : 'bg-red-400'}`}></div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{key.name}</p>
                        <p className="text-xs text-gray-400">
                          {key.description && `${key.description} • `}
                          Created: {formatDate(key.created_at)}
                          {key.last_used_at && ` • Last used: ${formatDate(key.last_used_at)}`}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span>Requests: {key.total_requests || 0}</span>
                          <span>Monthly: {key.monthly_requests || 0}/{key.monthly_limit || 1000}</span>
                          {key.expires_at && (
                            <span>Expires: {formatDate(key.expires_at)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${key.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {key.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => handleToggleKey(key.id, key.is_active)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          key.is_active ? 'text-gray-400 hover:text-amber-600' : 'text-gray-400 hover:text-green-600'
                        }`}
                        title={key.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {key.is_active ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                      </button>
                      <button
                        onClick={() => handleDeleteKey(key.id, key.name)}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                        title="Delete key"
                      >
                        <FiTrash2 size={14} />
                      </button>
                      <button
                        onClick={() => copyToClipboard(key.key || key.id.toString())}
                        className="p-1.5 text-gray-400 hover:text-pink-600 rounded-lg transition-colors"
                        title="Copy key"
                      >
                        <FiCopy size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;