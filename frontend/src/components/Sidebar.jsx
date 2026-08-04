import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FolderGit2, 
  CalendarDays, 
  MessageSquare, 
  Brain, 
  UserCircle2, 
  LogOut,
  GraduationCap,
  Users,
  Settings,
  Bell,
  Briefcase,
  Award,
  BookOpen
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    const common = [
      { to: '/chat', label: 'Discussions', icon: MessageSquare },
      { to: '/meetings', label: 'Scheduler', icon: CalendarDays }
    ];

    switch (user.role) {
      case 'student':
        return [
          { to: '/student-dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/student/guide', label: 'Advisor Guide', icon: UserCircle2 },
          { to: '/student/placements', label: 'Placement Board', icon: Briefcase },
          { to: '/student/certificates', label: 'Certificates', icon: Award },
          { to: '/student/publications', label: 'Publications & Patents', icon: BookOpen },
          { to: `/portfolio/${user.student_profile?.id || user.id}`, label: 'My Portfolio', icon: UserCircle2 },
          { to: '/ai-hub', label: 'AI Workspace', icon: Brain },
          ...common
        ];
      case 'teacher':
        return [
          { to: '/teacher-dashboard', label: 'Dashboard', icon: LayoutDashboard },
          ...common
        ];
      case 'hod':
        return [
          { to: '/hod-dashboard', label: 'Dept Dashboard', icon: LayoutDashboard },
          ...common
        ];
      case 'admin':
        return [
          { to: '/admin-dashboard', label: 'Control Center', icon: LayoutDashboard }
        ];
      default:
        return common;
    }
  };

  const links = getNavLinks();

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 shrink-0 h-screen sticky top-0">
      {/* Header logo */}
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="bg-sky-500 p-2 rounded-lg text-white">
          <GraduationCap size={24} />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-400">
            ProjectHub AI
          </h1>
          <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">{user.role} Portal</span>
        </div>
      </div>

      {/* Nav Link Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20 scale-[1.02]'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                }`
              }
            >
              <Icon size={20} />
              <span className="font-medium text-sm">{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Profile Area */}
      <div className="p-4 border-t border-slate-800 flex flex-col space-y-4">
        <div className="flex items-center space-x-3 px-2">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sky-400 border border-slate-700">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-100 truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 text-slate-300 rounded-xl transition-colors duration-200 text-sm font-medium border border-slate-700 hover:border-rose-900/30"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
