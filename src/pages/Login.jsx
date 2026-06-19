import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiLogIn } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      // Error handled in auth context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl border border-gray-100">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {/* Glow effect behind logo */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-400 via-pink-300 to-blue-300 rounded-2xl blur-xl opacity-30 animate-pulse"></div>
            {/* Logo container */}
            <div className="relative w-24 h-24 bg-gradient-to-br from-pink-400 via-pink-300 to-blue-300 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-200/50 transition-all hover:scale-105 duration-300 overflow-hidden">
              {/* Custom Logo Image - Replace with your logo */}
              <img 
                src="/logo.png" 
                alt="SocialHub" 
                className="w-16 h-16 object-contain"
              />
              {/* If you don't have an image yet, use text fallback */}
              {/* <span className="text-white font-bold text-2xl tracking-tight">SH</span> */}
            </div>
          </div>
        </div>
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
          <p className="text-gray-500 mt-2">Sign in to your SocialHub account</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Email Address</label>
            <div className="relative">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all bg-gray-50/50 hover:bg-white"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-2">Password</label>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all bg-gray-50/50 hover:bg-white"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-400 via-pink-300 to-blue-300 text-white py-3 rounded-lg font-semibold hover:opacity-90 hover:shadow-lg hover:shadow-pink-200/50 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <FiLogIn size={18} />
                Sign In
              </>
            )}
          </button>
        </form>
        
        <p className="text-center mt-6 text-gray-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-pink-500 hover:text-pink-600 font-medium hover:underline transition-colors">
            Create one
          </Link>
        </p>
        <div className="text-center mt-4 text-xs text-gray-400">
  <Link to="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
  <span className="mx-2">•</span>
  <Link to="/terms" className="hover:text-gray-600 transition-colors">Terms of Service</Link>
</div>
      </div>
    </div>
  );
};

export default Login;