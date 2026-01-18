import React from 'react';
import { NavLink, useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import {
    LayoutGrid,
    Megaphone,
    ListChecks,
    FolderKanban,
    Video,
    Radio,
    Users,
    Settings2,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    X,
    LogOut
} from 'lucide-react';

const adminNavItems = [
    { icon: LayoutGrid, label: 'Dashboard', path: '/admin' },
    { icon: Megaphone, label: 'Announcements', path: '/admin/announcements' },
    { icon: ListChecks, label: 'Assessments', path: '/admin/assessments' },
    { icon: FolderKanban, label: 'Projects', path: '/admin/projects' },
    { icon: Video, label: 'Recordings', path: '/admin/recordings' },
    { icon: Radio, label: 'Live Classes', path: '/admin/live-classes' },
    { icon: Users, label: 'Students', path: '/admin/students' },
    { icon: Settings2, label: 'Settings', path: '/admin/settings' },
];

const studentNavItems = [
    { icon: LayoutGrid, label: 'Dashboard', path: '/student' },
    { icon: Megaphone, label: 'Announcements', path: '/student/announcements' },
    { icon: ListChecks, label: 'Assessments', path: '/student/assessments' },
    { icon: FolderKanban, label: 'Projects', path: '/student/projects' },
    { icon: Video, label: 'Recordings', path: '/student/recordings' },
    { icon: Radio, label: 'Live Classes', path: '/student/live-classes' },
    { icon: Settings2, label: 'Settings', path: '/student/settings' },
];

export const Sidebar: React.FC = () => {
    const { user, logout } = useAuthStore();
    const { sidebarOpen, sidebarCollapsed, toggleSidebarCollapse, setSidebarOpen } = useUIStore();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const navItems = user?.role === 'admin' ? adminNavItems : studentNavItems;

    const sidebarVariants = {
        open: { x: 0, opacity: 1 },
        closed: { x: -300, opacity: 0 },
    };

    return (
        <>
            {/* Mobile overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                variants={sidebarVariants}
                initial="closed"
                animate={sidebarOpen ? 'open' : 'closed'}
                className={cn(
                    'fixed left-0 top-0 h-screen z-50 lg:z-30',
                    'bg-[#09090b]/80 backdrop-blur-2xl border-r border-white/5',
                    'flex flex-col',
                    'transition-all duration-300',
                    sidebarCollapsed ? 'w-20' : 'w-72',
                    'lg:translate-x-0'
                )}
            >
                {/* Logo Section */}
                <div className="flex items-center justify-between h-20 px-4 mb-2">
                    <Link to={user?.role === 'admin' ? '/admin' : '/student'} className="flex items-center gap-3">
                        <img
                            src="/logo.png"
                            alt="Logo"
                            className={cn(
                                "h-10 w-auto transition-all duration-300",
                                sidebarCollapsed ? "mx-auto" : ""
                            )}
                        />
                        {!sidebarCollapsed && (
                            <div className="flex flex-col">
                                <span className="font-black text-white text-lg tracking-tighter uppercase leading-none">DataLearn</span>
                                <span className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase mt-1">LMS Platform</span>
                            </div>
                        )}
                    </Link>

                    {/* Mobile close button */}
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 text-gray-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Desktop collapse button */}
                    <button
                        onClick={toggleSidebarCollapse}
                        className={cn(
                            "hidden lg:flex p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors",
                            sidebarCollapsed && "mx-auto"
                        )}
                    >
                        {sidebarCollapsed ? (
                            <ChevronRight className="w-4 h-4" />
                        ) : (
                            <ChevronLeft className="w-4 h-4" />
                        )}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
                    <ul className="space-y-2">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path ||
                                (item.path !== '/admin' && item.path !== '/student' && location.pathname.startsWith(item.path));

                            return (
                                <li key={item.path}>
                                    <NavLink
                                        to={item.path}
                                        className={cn(
                                            'flex items-center gap-3 px-3 py-3 rounded-xl',
                                            'text-sm font-medium transition-all duration-300',
                                            'group relative overflow-hidden',
                                            isActive
                                                ? 'bg-gradient-to-r from-indigo-600/10 to-violet-600/10 text-indigo-400'
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        )}
                                        onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                                        title={sidebarCollapsed ? item.label : undefined}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeNav"
                                                className="absolute inset-x-0 inset-y-0 rounded-xl bg-white/5 border border-white/5"
                                                initial={false}
                                                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                            />
                                        )}
                                        <item.icon className={cn(
                                            'w-5 h-5 relative z-10 flex-shrink-0 transition-colors',
                                            isActive ? 'text-indigo-400' : 'group-hover:text-white'
                                        )} />
                                        {!sidebarCollapsed && (
                                            <span className="relative z-10">{item.label}</span>
                                        )}
                                        {isActive && !sidebarCollapsed && (
                                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
                                        )}
                                    </NavLink>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={handleLogout}
                        className={cn(
                            "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors",
                            sidebarCollapsed && "justify-center"
                        )}
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5" />
                        {!sidebarCollapsed && <span className="text-sm font-medium">Logout</span>}
                    </button>

                    {!sidebarCollapsed && (
                        <div className="mt-4 bg-gradient-to-br from-indigo-900/20 to-violet-900/20 border border-white/5 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4 text-indigo-400" />
                                <span className="text-sm font-medium text-white">AI Powered</span>
                            </div>
                            <p className="text-xs text-gray-500">
                                v2.4 Active
                            </p>
                        </div>
                    )}
                </div>
            </motion.aside>
        </>
    );
};
