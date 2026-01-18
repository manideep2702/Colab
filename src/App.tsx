import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Layouts
import { DashboardLayout } from '@/components/layout';

// Public Pages
import LandingPage from '@/pages/LandingPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { AdmissionPage } from '@/pages/AdmissionPage';

// Student Pages
import { StudentDashboard } from '@/pages/student/StudentDashboard';
import { StudentRecordingsPage } from '@/pages/student/RecordingsPage';
import { StudentAssessmentsPage } from '@/pages/student/AssessmentsPage';
import { StudentProjectsPage } from '@/pages/student/ProjectsPage';
import { StudentLiveClassesPage } from '@/pages/student/LiveClassesPage';
import { StudentAnnouncementsPage } from '@/pages/student/AnnouncementsPage';
import { StudentSettingsPage } from '@/pages/student/SettingsPage';

// Admin Pages
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { RecordingsPage as AdminRecordingsPage } from '@/pages/admin/RecordingsPage';
import { AssessmentsPage as AdminAssessmentsPage } from '@/pages/admin/AssessmentsPage';
import { ProjectsPage as AdminProjectsPage } from '@/pages/admin/ProjectsPage';
import { LiveClassesPage as AdminLiveClassesPage } from '@/pages/admin/LiveClassesPage';
import { AnnouncementsPage as AdminAnnouncementsPage } from '@/pages/admin/AnnouncementsPage';
import { StudentsPage as AdminStudentsPage } from '@/pages/admin/StudentsPage';
import { SettingsPage as AdminSettingsPage } from '@/pages/admin/SettingsPage';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

function App() {
  const initializeAuth = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admission" element={<AdmissionPage />} />

          {/* Student Routes */}
          <Route path="/student" element={<DashboardLayout requiredRole="student" />}>
            <Route index element={<StudentDashboard />} />
            <Route path="recordings" element={<StudentRecordingsPage />} />
            <Route path="assessments" element={<StudentAssessmentsPage />} />
            <Route path="projects" element={<StudentProjectsPage />} />
            <Route path="live-classes" element={<StudentLiveClassesPage />} />
            <Route path="announcements" element={<StudentAnnouncementsPage />} />
            <Route path="settings" element={<StudentSettingsPage />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<DashboardLayout requiredRole="admin" />}>
            <Route index element={<AdminDashboard />} />
            <Route path="recordings" element={<AdminRecordingsPage />} />
            <Route path="assessments" element={<AdminAssessmentsPage />} />
            <Route path="projects" element={<AdminProjectsPage />} />
            <Route path="live-classes" element={<AdminLiveClassesPage />} />
            <Route path="announcements" element={<AdminAnnouncementsPage />} />
            <Route path="students" element={<AdminStudentsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

