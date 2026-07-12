import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FiUser, FiMail, FiLock, FiKey, FiCopy, FiCheck,
  FiRefreshCw, FiEye, FiEyeOff, FiTrash2, FiShield,
  FiPlus, FiX
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { apiKeys, settings } from '../services/api';

const inputClass =
  'w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#168eea]/30 focus:border-[#168eea] bg-white text-gray-800 transition-colors';

const primaryBtn =
  'px-5 py-2.5 bg-[#168eea] hover:bg-[#1378d4] text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-sm';

const SettingsSkeleton = () => (
  <div className="space-y-6">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-40 mb-4" />
        <div className="h-10 bg-gray-100 rounded-lg mb-3" />
        <div className="h-10 bg-gray-100 rounded-lg w-1/2" />
      </div>
    ))}
  </div>
);

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');

  const [profile, setProfile] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
  });

  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const [apiKeysList, setApiKeysList] = useState([]);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [newKey, setNewKey] = useState(null);
  const [showSecret, setShowSecret] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyDescription, setNewKeyDescription] = useState('');
  const [newKeyLimit, setNewKeyLimit] = useState(1000);

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
        confirm_password: password.confirm,
      });
      toast.success('Password changed successfully!');
      setPassword({ current: '', new: '', confirm: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

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
        monthly_limit: newKeyLimit,
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

  const handleToggleKey = async (keyId, currentStatus) => {
    try {
      await apiKeys.update(keyId, { is_active: !currentStatus });
      toast.success(`API key ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchApiKeys();
    } catch {
      toast.error('Failed to update API key');
    }
  };

  const handleDeleteKey = async (keyId, keyName) => {
    if (!confirm(`Are you sure you want to delete "${keyName}"? This cannot be undone.`)) return;
    try {
      await apiKeys.delete(keyId);
      toast.success('API key deleted successfully');
      fetchApiKeys();
    } catch {
      toast.error('Failed to delete API key');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const navItems = [
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'security', label: 'Security', icon: FiLock },
    { id: 'api', label: 'API keys', icon: FiKey },
  ];

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="h-8 bg-gray-200 rounded w-40 animate-pulse mb-6" />
        <SettingsSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <FiShield className="text-[#168eea]" size={24} />
          Settings
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Manage your account, security, and developer access
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <aside className="md:w-52 flex-shrink-0">
          <nav className="bg-white rounded-xl border border-gray-100 p-2 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#168eea]/10 text-[#168eea]'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="flex-1 space-y-6 min-w-0">
          {activeSection === 'profile' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Profile information</h2>
              <p className="text-sm text-gray-500 mb-5">Update how your name appears across SocialHub.</p>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
                    <input
                      type="text"
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <div className="relative">
                      <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        className={`${inputClass} pl-10`}
                        required
                      />
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={saving} className={primaryBtn}>
                  {saving ? <FiRefreshCw className="animate-spin inline" /> : 'Save changes'}
                </button>
              </form>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Password</h2>
              <p className="text-sm text-gray-500 mb-5">Choose a strong password you do not reuse elsewhere.</p>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Current password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password.current}
                    onChange={(e) => setPassword({ ...password, current: e.target.value })}
                    className={inputClass}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password.new}
                        onChange={(e) => setPassword({ ...password, new: e.target.value })}
                        className={inputClass}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password.confirm}
                      onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                      className={inputClass}
                      required
                    />
                  </div>
                </div>
                <button type="submit" disabled={saving} className={primaryBtn}>
                  {saving ? <FiRefreshCw className="animate-spin inline" /> : 'Update password'}
                </button>
              </form>
            </div>
          )}

          {activeSection === 'api' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">API keys</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Use keys to authenticate programmatic access to your account.
                  </p>
                </div>
                <button onClick={() => setShowCreateModal(true)} className={`${primaryBtn} flex items-center gap-2`}>
                  <FiPlus size={16} />
                  New key
                </button>
              </div>

              {showCreateModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Create API key</h3>
                      <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                        <FiX size={20} />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
                        <input
                          type="text"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          placeholder="e.g. Blog integration"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                        <input
                          type="text"
                          value={newKeyDescription}
                          onChange={(e) => setNewKeyDescription(e.target.value)}
                          placeholder="What is this key for?"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Monthly limit</label>
                        <input
                          type="number"
                          value={newKeyLimit}
                          onChange={(e) => setNewKeyLimit(parseInt(e.target.value) || 0)}
                          className={inputClass}
                        />
                        <p className="text-xs text-gray-400 mt-1">0 = unlimited</p>
                      </div>
                      <button
                        onClick={handleGenerateKey}
                        disabled={generatingKey}
                        className={`w-full ${primaryBtn}`}
                      >
                        {generatingKey ? <FiRefreshCw className="animate-spin inline" /> : 'Create key'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {newKey && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 font-medium mb-2">
                    Save this key now — it will not be shown again.
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-sm font-mono bg-white px-2 py-1 rounded border border-gray-200 flex-1 truncate">
                      {showSecret ? newKey.key : '••••••••••••••••••••••••••••••'}
                    </code>
                    <button onClick={() => setShowSecret(!showSecret)} className="text-gray-400 hover:text-gray-600">
                      {showSecret ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                    <button onClick={() => copyToClipboard(newKey.key)} className="text-[#168eea] hover:text-[#1378d4]">
                      <FiCopy size={16} />
                    </button>
                    <button onClick={() => setNewKey(null)} className="text-sm text-gray-500 hover:text-gray-700">
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {apiKeysList.length === 0 ? (
                <div className="text-center py-10 text-gray-400 border border-dashed border-gray-200 rounded-xl">
                  <FiKey size={28} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No API keys yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {apiKeysList.map((key) => (
                    <div
                      key={key.id}
                      className="flex items-center justify-between p-4 bg-[#f8f9fb] rounded-xl border border-gray-100 hover:border-gray-200 transition-colors gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            key.is_active ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{key.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {key.description && `${key.description} · `}
                            Created {formatDate(key.created_at)}
                            {key.last_used_at && ` · Last used ${formatDate(key.last_used_at)}`}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {key.monthly_requests || 0}/{key.monthly_limit || 1000} monthly ·{' '}
                            {key.total_requests || 0} total
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            key.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {key.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={() => handleToggleKey(key.id, key.is_active)}
                          className="p-1.5 text-gray-400 hover:text-[#168eea] rounded-lg"
                          title={key.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {key.is_active ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                        </button>
                        <button
                          onClick={() => handleDeleteKey(key.id, key.name)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg"
                          title="Delete"
                        >
                          <FiTrash2 size={14} />
                        </button>
                        <button
                          onClick={() => copyToClipboard(key.key || key.id.toString())}
                          className="p-1.5 text-gray-400 hover:text-[#168eea] rounded-lg"
                          title="Copy"
                        >
                          <FiCopy size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
