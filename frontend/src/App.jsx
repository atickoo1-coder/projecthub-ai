import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import HODDashboard from './pages/HODDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Portfolio from './pages/Portfolio';
import ProjectDetail from './pages/ProjectDetail';
import Meetings from './pages/Meetings';
import Chat from './pages/Chat';
import AIHub from './pages/AIHub';

// Private Route Guard Component
const PrivateRoute = ({ children, allowedRoles }) => {
  const { token, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-sky-500"></div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to respective dashboard
    if (user.role === 'student') return <Navigate to="/student-dashboard" replace />;
    if (user.role === 'teacher') return <Navigate to="/teacher-dashboard" replace />;
    if (user.role === 'hod') return <Navigate to="/hod-dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin-dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/20">
          {children}
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Public Portfolio page */}
            <Route path="/portfolio/:rollOrId" element={<Portfolio />} />

            {/* Protected Student Routes */}
            <Route 
              path="/student-dashboard" 
              element={
                <PrivateRoute allowedRoles={['student']}>
                  <StudentDashboard defaultTab="profile" />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/student/guide" 
              element={
                <PrivateRoute allowedRoles={['student']}>
                  <StudentDashboard defaultTab="guide" />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/student/placements" 
              element={
                <PrivateRoute allowedRoles={['student']}>
                  <StudentDashboard defaultTab="placements" />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/student/certificates" 
              element={
                <PrivateRoute allowedRoles={['student']}>
                  <StudentDashboard defaultTab="certificates" />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/student/publications" 
              element={
                <PrivateRoute allowedRoles={['student']}>
                  <StudentDashboard defaultTab="publications" />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/project/:projectId" 
              element={
                <PrivateRoute allowedRoles={['student', 'teacher', 'hod', 'admin']}>
                  <ProjectDetail />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/ai-hub" 
              element={
                <PrivateRoute allowedRoles={['student']}>
                  <AIHub />
                </PrivateRoute>
              } 
            />

            {/* Protected Teacher Routes */}
            <Route 
              path="/teacher-dashboard" 
              element={
                <PrivateRoute allowedRoles={['teacher']}>
                  <TeacherDashboard />
                </PrivateRoute>
              } 
            />

            {/* Protected HOD Routes */}
            <Route 
              path="/hod-dashboard" 
              element={
                <PrivateRoute allowedRoles={['hod', 'admin']}>
                  <HODDashboard />
                </PrivateRoute>
              } 
            />

            {/* Protected Admin Routes */}
            <Route 
              path="/admin-dashboard" 
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </PrivateRoute>
              } 
            />

            {/* Common Protected Routes */}
            <Route 
              path="/meetings" 
              element={
                <PrivateRoute allowedRoles={['student', 'teacher', 'hod']}>
                  <Meetings />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/chat" 
              element={
                <PrivateRoute allowedRoles={['student', 'teacher', 'hod']}>
                  <Chat />
                </PrivateRoute>
              } 
            />

            {/* Fallback route redirect */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
