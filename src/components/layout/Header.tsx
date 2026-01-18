import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { Avatar, Badge } from '@/components/ui';
import {
    Menu,
    Bell,
    Search,
    LogOut,
    ChevronDown,
    Sun,
    Moon,
} from 'lucide-react';

export const Header: React.FC = () => {
    const { user, logout } = useAuthStore();
    const { sidebarCollapsed, toggleSidebar, theme, setTheme } = useUIStore();
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Mock notifications
    const notifications = [
        { id: 1, title: 'New Assessment Available', message: 'Python Week 2 Quiz is now available', time: '5m ago', unread: true },
        { id: 2, title: 'Project Deadline', message: 'ML Project due in 2 days', time: '1h ago', unread: true },
        { id: 3, title: 'Live Class Starting', message: 'Deep Learning basics starts in 30 min', time: '2h ago', unread: false },
    ];

    const unreadCount = notifications.filter(n => n.unread).length;

    return (
        <header
            className={cn(
                'fixed top-0 right-0 z-20 h-16',
                'bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/50',
                'transition-all duration-300',
                sidebarCollapsed ? 'lg:left-20' : 'lg:left-72',
                'left-0'
            )}
        >
            <div className="flex items-center justify-between h-full px-4 lg:px-6">
                {/* Left Section */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* Search */}
                    <div className="hidden md:flex items-center relative">
                        <Search className="absolute left-3 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search courses, assessments..."
                            className="w-64 lg:w-80 pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-sm text-gray-300 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-3">
                    {/* Theme Toggle */}
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>

                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors relative"
                        >
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            )}
                        </button>

                        <AnimatePresence>
                            {showNotifications && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowNotifications(false)}
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-20"
                                    >
                                        <div className="p-4 border-b border-gray-800">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-semibold text-white">Notifications</h3>
                                                {unreadCount > 0 && (
                                                    <Badge variant="primary" size="sm">{unreadCount} new</Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="max-h-80 overflow-y-auto">
                                            {notifications.map((notification) => (
                                                <div
                                                    key={notification.id}
                                                    className={cn(
                                                        'p-4 hover:bg-gray-800/50 transition-colors cursor-pointer border-b border-gray-800/50 last:border-0',
                                                        notification.unread && 'bg-primary-500/5'
                                                    )}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        {notification.unread && (
                                                            <span className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0" />
                                                        )}
                                                        <div className={cn(!notification.unread && 'ml-5')}>
                                                            <p className="text-sm font-medium text-white">{notification.title}</p>
                                                            <p className="text-xs text-gray-400 mt-0.5">{notification.message}</p>
                                                            <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="p-3 border-t border-gray-800">
                                            <button className="w-full text-center text-sm text-primary-400 hover:text-primary-300 transition-colors">
                                                View all notifications
                                            </button>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* User Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-3 p-1.5 pr-3 hover:bg-gray-800/50 rounded-xl transition-colors"
                        >
                            <Avatar name={user?.name || 'User'} src={user?.avatar_url} size="sm" />
                            <div className="hidden sm:block text-left">
                                <p className="text-sm font-medium text-white">{user?.name}</p>
                                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                            </div>
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                        </button>

                        <AnimatePresence>
                            {showUserMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowUserMenu(false)}
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 top-full mt-2 w-56 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-20"
                                    >
                                        <div className="p-4 border-b border-gray-800">
                                            <p className="text-sm font-medium text-white">{user?.name}</p>
                                            <p className="text-xs text-gray-400">{user?.email}</p>
                                        </div>
                                        <div className="p-2">
                                            {/* Profile and Settings removed as per request */}
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Logout
                                            </button>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </header>
    );
};
