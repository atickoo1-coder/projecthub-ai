import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { GraduationCap, User, Mail, Lock, BookOpen, AlertCircle, CheckCircle } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roll_number: '',
    reg_number: '',
    univ_roll_number: '',
    mobile: '',
    department_id: 1,
    year: 1,
    semester: 1,
    section: 'A',
    batch: '2025-2029',
    skills: '[]',
    linkedin: '',
    github: '',
    resume_url: '',
    profile_pic_url: '',
    guide_id: null
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await authAPI.registerStudent(formData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to complete registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-6 py-12">
      <div className="w-full max-w-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-sky-500 text-white p-3 rounded-2xl mb-4 shadow-lg">
            <GraduationCap size={28} />
          </div>
          <h2 className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-400">
            Student Registration
          </h2>
          <p className="text-slate-500 text-xs mt-1">Create your academic profile portfolio</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Column 1 */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Alice Smith"
                  className="w-full px-4 py-2.5 bg-slate-800/40 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-sky-500 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="alice@college.edu"
                  className="w-full px-4 py-2.5 bg-slate-800/40 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-sky-500 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-slate-800/40 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-sky-500 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">College Roll Number</label>
                <input
                  type="text"
                  name="roll_number"
                  required
                  value={formData.roll_number}
                  onChange={handleChange}
                  placeholder="CSE-2023-045"
                  className="w-full px-4 py-2.5 bg-slate-800/40 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-sky-500 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Registration Number</label>
                <input
                  type="text"
                  name="reg_number"
                  required
                  value={formData.reg_number}
                  onChange={handleChange}
                  placeholder="REG987654321"
                  className="w-full px-4 py-2.5 bg-slate-800/40 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-sky-500 text-slate-100"
                />
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">University Roll Number</label>
                <input
                  type="text"
                  name="univ_roll_number"
                  required
                  value={formData.univ_roll_number}
                  onChange={handleChange}
                  placeholder="UNIV-CSE-001"
                  className="w-full px-4 py-2.5 bg-slate-800/40 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-sky-500 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Academic Year</label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-800/40 border border-slate-700 rounded-xl text-sm focus:outline-none text-slate-300"
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Semester</label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-800/40 border border-slate-700 rounded-xl text-sm focus:outline-none text-slate-300"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s}>Sem {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Department</label>
                  <select
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-800/40 border border-slate-700 rounded-xl text-sm focus:outline-none text-slate-300"
                  >
                    <option value={1}>CSE</option>
                    <option value={2}>AI</option>
                    <option value={3}>DS</option>
                    <option value={4}>IT</option>
                    <option value={5}>ECE</option>
                    <option value={6}>ME</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Section</label>
                  <input
                    type="text"
                    name="section"
                    required
                    value={formData.section}
                    onChange={handleChange}
                    placeholder="A"
                    className="w-full px-4 py-2.5 bg-slate-800/40 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-sky-500 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Mobile Number</label>
                <input
                  type="text"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className="w-full px-4 py-2.5 bg-slate-800/40 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-sky-500 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Batch Period</label>
                <input
                  type="text"
                  name="batch"
                  value={formData.batch}
                  onChange={handleChange}
                  placeholder="2023-2027"
                  className="w-full px-4 py-2.5 bg-slate-800/40 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-sky-500 text-slate-100"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="text-xs text-rose-400 flex items-center space-x-2 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 animate-fade-in">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="text-xs text-emerald-400 flex items-center space-x-2 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 animate-fade-in">
              <CheckCircle size={16} />
              <span>Registration completed! Redirecting to sign in...</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <Link to="/login" className="text-xs text-sky-400 hover:underline">
              Already have an account? Sign In
            </Link>
            
            <button
              type="submit"
              disabled={loading || success}
              className="py-2.5 px-8 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-sky-500/15"
            >
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
