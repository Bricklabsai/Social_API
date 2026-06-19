import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FiUser, FiMail, FiLock, FiKey, FiCopy, FiCheck, 
  FiRefreshCw, FiEye, FiEyeOff, FiTrash2, FiShield,
  FiCheckCircle, FiXCircle, FiAlertCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
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
  const [apiKeys, setApiKeys] = useState([]);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [newKey, setNewKey] = useState(null);
  const [showSecret, setShowSecret] = useState(false);

  // Fetch API keys on load
  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await api.get('/settings/api-keys');
      setApiKeys(response.data.keys || []);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    }
  };

  // Update Profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await api.put('/settings/profile', profile);
      toast.success('Profile updated successfully!');
      updateUser(response.data.user);
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
      await api.post('/settings/change-password', {
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
    setGeneratingKey(true);
    try {
      const response = await api.post('/settings/api-keys/generate');
      setNewKey(response.data);
      toast.success('API key generated successfully!');
      fetchApiKeys();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate API key');
    } finally {
      setGeneratingKey(false);
    }
  };

  // Revoke API Key
  const handleRevokeKey = async (publicKey) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return;
    try {
      await api.post(`/settings/api-keys/${publicKey}/revoke`);
      toast.success('API key revoked successfully');
      fetchApiKeys();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to revoke API key');
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
            <p className="text-gray-500 mt-1">Manage your account and security preferences</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-pink-400 via-pink-300 to-blue-300 rounded-xl flex items-center justify-center shadow-lg shadow-pink-200/50">
            <FiShield size={24} className="text-white" />
          </div>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
              <FiUser className="text-pink-400" />
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
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-gray-50/50 hover:bg-white transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Email Address</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-gray-50/50 hover:bg-white transition-all"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-pink-400 via-pink-300 to-blue-300 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-pink-200/50 transition-all duration-300 disabled:opacity-50"
              >
                {saving ? <FiRefreshCw className="animate-spin inline" /> : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Password Section */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
              <FiLock className="text-pink-400" />
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
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-gray-50/50 hover:bg-white transition-all"
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
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-gray-50/50 hover:bg-white transition-all"
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
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-gray-50/50 hover:bg-white transition-all"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-pink-400 via-pink-300 to-blue-300 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-pink-200/50 transition-all duration-300 disabled:opacity-50"
              >
                {saving ? <FiRefreshCw className="animate-spin inline" /> : 'Change Password'}
              </button>
            </form>
          </div>

          {/* API Keys Section */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FiKey className="text-pink-400" />
                API Keys
              </h2>
              <button
                onClick={handleGenerateKey}
                disabled={generatingKey}
                className="px-4 py-2 bg-gradient-to-r from-pink-400 via-pink-300 to-blue-300 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-pink-200/50 transition-all duration-300 disabled:opacity-50 text-sm flex items-center gap-2"
              >
                {generatingKey ? <FiRefreshCw className="animate-spin" /> : <FiKey size={16} />}
                Generate New Key
              </button>
            </div>

            {/* New Key Alert */}
            {newKey && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium mb-2">
                  ⚠️ Save your secret key now. It won't be shown again!
                </p>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-xs text-gray-500">Public Key</p>
                    <code className="text-sm font-mono bg-white px-2 py-1 rounded border border-gray-200 block truncate">
                      {newKey.public_key}
                    </code>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-xs text-gray-500">Secret Key</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono bg-white px-2 py-1 rounded border border-gray-200 block truncate flex-1">
                        {showSecret ? newKey.secret_key : '••••••••••••••••••••••••••••••'}
                      </code>
                      <button
                        onClick={() => setShowSecret(!showSecret)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {showSecret ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(newKey.secret_key)}
                        className="text-pink-400 hover:text-pink-500"
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
            {apiKeys.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FiKey size={32} className="mx-auto mb-2 opacity-50" />
                <p>No API keys generated yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <div key={key.public_key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${key.is_active ? 'bg-green-500' : 'bg-red-400'}`}></div>
                      <div>
                        <code className="text-sm font-mono text-gray-600">{key.public_key}</code>
                        <p className="text-xs text-gray-400">
                          Created: {new Date(key.created_at).toLocaleDateString()}
                          {key.last_used && ` • Last used: ${new Date(key.last_used).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${key.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {key.is_active ? 'Active' : 'Revoked'}
                      </span>
                      {key.is_active && (
                        <button
                          onClick={() => handleRevokeKey(key.public_key)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="Revoke key"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => copyToClipboard(key.public_key)}
                        className="text-gray-400 hover:text-pink-400 transition-colors"
                        title="Copy public key"
                      >
                        <FiCopy size={16} />
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