import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiUser, FiUserPlus } from 'react-icons/fi';
import PublicNavbar from '../components/marketing/PublicNavbar';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(email, password, fullName);
      navigate('/login');
    } catch {
      /* handled in context */
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <PublicNavbar />
      <div className="pt-24 pb-12 px-4 flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-sm border border-gray-100">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-[#168eea] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">SH</span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
            <p className="text-gray-500 mt-2 text-sm">Start publishing for free today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-700 font-medium mb-2 text-sm">Full name</label>
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#168eea]/30 focus:border-[#168eea] transition-all bg-gray-50/50 text-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2 text-sm">Email</label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#168eea]/30 focus:border-[#168eea] transition-all bg-gray-50/50 text-sm"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2 text-sm">Password</label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#168eea]/30 focus:border-[#168eea] transition-all bg-gray-50/50 text-sm"
                  placeholder="Create a strong password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#168eea] hover:bg-[#1378d4] text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <FiUserPlus size={18} />
                  Create account
                </>
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-500 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-[#168eea] hover:text-[#1378d4] font-medium">
              Log in
            </Link>
          </p>
          <div className="text-center mt-4 text-xs text-gray-400">
            <Link to="/privacy" className="hover:text-gray-600">Privacy</Link>
            <span className="mx-2">·</span>
            <Link to="/terms" className="hover:text-gray-600">Terms</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
