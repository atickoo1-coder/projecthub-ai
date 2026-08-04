import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { hodAPI, reportAPI } from '../services/api';
import Card from '../components/Card';
import { Bar, Pie } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { 
  GraduationCap, 
  Users, 
  BarChart3, 
  Download, 
  FileSpreadsheet, 
  FileText 
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const HODDashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [students, setStudents] = useState([]);
  const [filters, setFilters] = useState({
    year: '',
    section: '',
    guide_id: ''
  });

  const fetchData = async () => {
    try {
      const data = await hodAPI.getAnalytics();
      setAnalytics(data);
      const studs = await hodAPI.getStudents(filters);
      setStudents(studs);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleExport = (reportType, format) => {
    const url = reportAPI.getDownloadUrl(reportType, format, analytics?.department_id);
    window.open(url, '_blank');
  };

  const getDomainChartData = () => {
    if (!analytics?.domain_distribution) return { labels: [], datasets: [] };
    
    return {
      labels: analytics.domain_distribution.map(d => d.domain),
      datasets: [
        {
          label: 'Projects',
          data: analytics.domain_distribution.map(d => d.count),
          backgroundColor: [
            'rgba(14, 165, 233, 0.7)',
            'rgba(99, 102, 241, 0.7)',
            'rgba(168, 85, 247, 0.7)',
            'rgba(236, 72, 153, 0.7)',
          ],
          borderColor: [
            '#0ea5e9',
            '#6366f1',
            '#a855f7',
            '#ec4899',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const getYearChartData = () => {
    if (!analytics?.year_distribution) return { labels: [], datasets: [] };
    return {
      labels: analytics.year_distribution.map(y => `${y.year} Year`),
      datasets: [
        {
          label: 'Projects',
          data: analytics.year_distribution.map(y => y.count),
          backgroundColor: 'rgba(99, 102, 241, 0.7)',
          borderColor: '#6366f1',
          borderWidth: 1,
        }
      ]
    };
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Department Monitoring Console</h2>
          <p className="text-sm text-slate-500 mt-1">Overview analytics for college administrators and HODs.</p>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-indigo-500">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Enrolled</p>
          <span className="text-3xl font-extrabold text-slate-850 dark:text-slate-100 block mt-2">
            {analytics?.total_students || 0}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Students in department</span>
        </Card>

        <Card className="border-l-4 border-sky-500">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Project Advisors</p>
          <span className="text-3xl font-extrabold text-slate-850 dark:text-slate-100 block mt-2">
            {analytics?.total_teachers || 0}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Faculty guides</span>
        </Card>

        <Card className="border-l-4 border-amber-500">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Pending Evaluation</p>
          <span className="text-3xl font-extrabold text-slate-850 dark:text-slate-100 block mt-2">
            {analytics?.status_distribution?.pending_review || 0}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Awaiting teacher signature</span>
        </Card>

        <Card className="border-l-4 border-emerald-500">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Approved Milestones</p>
          <span className="text-3xl font-extrabold text-slate-850 dark:text-slate-100 block mt-2">
            {analytics?.status_distribution?.approved || 0}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Completed projects</span>
        </Card>
      </div>

      {/* Export Controls */}
      <Card title="Export Department Records" subtitle="Export data to Excel, CSV, or compile a PDF report.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-sm">Student Enrollment Log</h4>
              <p className="text-[11px] text-slate-500 mt-1">Roll numbers, academic years, sections, and assigned advisors.</p>
            </div>
            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => handleExport('students', 'excel')}
                className="flex items-center space-x-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition-all text-sky-500"
              >
                <FileSpreadsheet size={14} />
                <span>Excel</span>
              </button>
              <button
                onClick={() => handleExport('students', 'pdf')}
                className="flex items-center space-x-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition-all text-indigo-500"
              >
                <FileText size={14} />
                <span>PDF</span>
              </button>
            </div>
          </div>

          <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-sm">Active Projects Status</h4>
              <p className="text-[11px] text-slate-500 mt-1">Project titles, domain keywords, and evaluated scores.</p>
            </div>
            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => handleExport('projects', 'excel')}
                className="flex items-center space-x-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition-all text-sky-500"
              >
                <FileSpreadsheet size={14} />
                <span>Excel</span>
              </button>
              <button
                onClick={() => handleExport('projects', 'pdf')}
                className="flex items-center space-x-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition-all text-indigo-500"
              >
                <FileText size={14} />
                <span>PDF</span>
              </button>
            </div>
          </div>

          <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-sm">Weekly Progress Reports</h4>
              <p className="text-[11px] text-slate-500 mt-1">Academic tracking logs and completion percentage histories.</p>
            </div>
            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => handleExport('progress', 'excel')}
                className="flex items-center space-x-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition-all text-sky-500"
              >
                <FileSpreadsheet size={14} />
                <span>Excel</span>
              </button>
              <button
                onClick={() => handleExport('progress', 'pdf')}
                className="flex items-center space-x-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition-all text-indigo-500"
              >
                <FileText size={14} />
                <span>PDF</span>
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Analytical Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card title="Projects per Domain" subtitle="Breakdown of technology domains chosen by students.">
          <div className="max-h-64 flex justify-center">
            {analytics?.domain_distribution?.length > 0 ? (
              <Pie data={getDomainChartData()} options={{ responsive: true, maintainAspectRatio: false }} />
            ) : (
              <p className="text-xs text-slate-500 py-12">No data logged.</p>
            )}
          </div>
        </Card>

        <Card title="Academic Year Distribution" subtitle="Project proposals submitted split by class year.">
          <div className="max-h-64 flex justify-center">
            {analytics?.year_distribution?.length > 0 ? (
              <Bar data={getYearChartData()} options={{ responsive: true, maintainAspectRatio: false }} />
            ) : (
              <p className="text-xs text-slate-500 py-12">No data logged.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Student List and Filters */}
      <Card title="Class Files & Filter Registry">
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="w-40">
            <label className="block text-[10px] uppercase text-slate-400 font-bold mb-1">Year</label>
            <select
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
            >
              <option value="">All Years</option>
              <option value={1}>1st Year</option>
              <option value={2}>2nd Year</option>
              <option value={3}>3rd Year</option>
              <option value={4}>4th Year</option>
            </select>
          </div>

          <div className="w-40">
            <label className="block text-[10px] uppercase text-slate-400 font-bold mb-1">Section</label>
            <select
              value={filters.section}
              onChange={(e) => setFilters({ ...filters, section: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
            >
              <option value="">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-450 uppercase font-semibold">
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Section</th>
                <th className="py-3 px-4">Advisor Guide</th>
                <th className="py-3 px-4">Submissions</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-850">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">No student records found matching filters.</td>
                </tr>
              ) : (
                students.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-100">{s.name}</td>
                    <td className="py-3.5 px-4 text-slate-550 dark:text-slate-400">{s.roll_number}</td>
                    <td className="py-3.5 px-4">{s.year} Year</td>
                    <td className="py-3.5 px-4">{s.section}</td>
                    <td className="py-3.5 px-4 text-sky-500 font-semibold">{s.guide_name}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-sky-500/10 text-sky-500 px-2 py-0.5 rounded-md font-semibold">
                        {s.projects_count} Proj ({s.completed_projects} Done)
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default HODDashboard;
