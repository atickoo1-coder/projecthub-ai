import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Mail, Lock, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await login(email, password);
      
      // Redirect based on role
      if (data.role === 'student') navigate('/student-dashboard');
      else if (data.role === 'teacher') navigate('/teacher-dashboard');
      else if (data.role === 'hod') navigate('/hod-dashboard');
      else if (data.role === 'admin') navigate('/admin-dashboard');
      else navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.detail || 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-6 py-12">
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Decorative backdrop gradients */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>

        <div className="flex flex-col items-center mb-8 relative">
          <div className="bg-sky-500 text-white p-3 rounded-2xl mb-4 shadow-lg shadow-sky-500/30">
            <GraduationCap size={28} />
          </div>
          <h2 className="font-bold text-2xl tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-400">
            ProjectHub AI
          </h2>
          <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">Student & Faculty ERP</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu"
                className="w-full pl-10 pr-4 py-3 bg-slate-800/40 border border-slate-700/60 rounded-xl text-sm focus:outline-none focus:border-sky-500 text-slate-100 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Lock size={16} />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-800/40 border border-slate-700/60 rounded-xl text-sm focus:outline-none focus:border-sky-500 text-slate-100 transition-colors"
              />
            </div>
          </div>

          {error && (
            <div className="text-xs text-rose-400 flex items-center space-x-2 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-sky-500/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 text-sm"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center text-slate-500 text-xs">
          <span>Need accounts? Log in using </span>
          <span className="text-sky-400 font-semibold">student.cse@college.edu</span>
          <span> or </span>
          <span className="text-sky-400 font-semibold">teacher.cse@college.edu</span>
          <span> with password </span>
          <span className="text-sky-400 font-semibold">password123</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
