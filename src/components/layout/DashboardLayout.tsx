import React, { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface DashboardLayoutProps {
    requiredRole?: 'admin' | 'student';
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ requiredRole }) => {
    const { user, isAuthenticated, isLoading } = useAuthStore();
    const { sidebarCollapsed, setSidebarOpen } = useUIStore();

    // Open sidebar by default on desktop
    useEffect(() => {
        if (window.innerWidth >= 1024) {
            setSidebarOpen(true);
        }
    }, [setSidebarOpen]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return <Navigate to="/" replace />;
    }

    if (requiredRole && user.role !== requiredRole) {
        return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace />;
    }

    return (
        <div className="min-h-screen bg-[#09090b] relative overflow-hidden">
            {/* Global Glow Effect */}
            <div className="fixed inset-x-0 -top-8 mx-auto h-56 max-w-5xl rounded-[28px] bg-gradient-to-r from-violet-500/30 via-fuchsia-500/20 to-indigo-500/30 blur-2xl opacity-50 pointer-events-none z-0" />

            <Sidebar />
            <Header />

            <main
                className={cn(
                    'pt-16 min-h-screen transition-all duration-300 relative z-10',
                    sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
                )}
            >
                <div className="p-4 lg:p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
