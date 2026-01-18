import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings2,
    User,
    Bell,
    Shield,
    Palette,
    Save,
    Check,
    Moon,
    Sun,
    Monitor,
    Database,
    Server,
    Activity,
    Users,
    AlertTriangle,
    FileText,
    Zap,
    Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { profileService } from '@/services/api';

const tabs = [
    { id: 'profile', label: 'Admin Profile', icon: User, description: 'Personal & Role settings' },
    { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Alerts & System Messages' },
    { id: 'security', label: 'Security & Access', icon: Shield, description: '2FA, Audit Logs' },
    { id: 'system', label: 'System Settings', icon: Settings2, description: 'Platform configuration' },
    { id: 'appearance', label: 'Appearance', icon: Palette, description: 'Theme & UX' },
];

export const SettingsPage: React.FC = () => {
    const { user, setUser } = useAuthStore();
    const [activeTab, setActiveTab] = useState('profile');
    const [saved, setSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form states
    const [profile, setProfile] = useState({
        name: user?.name || 'Admin User',
        email: user?.email || 'admin@demo.com',
        bio: 'Senior Data Science Instructor & LMS Administrator.',
        department: 'Computer Science',
        timezone: 'Asia/Kolkata',
    });

    useEffect(() => {
        if (user) {
            setProfile(prev => ({
                ...prev,
                name: user.name,
                email: user.email,
            }));
        }
    }, [user]);

    const [notifications, setNotifications] = useState({
        systemAlerts: true,
        newSignups: true,
        submissions: true,
        announcements: true,
    });

    const [appearance, setAppearance] = useState({
        theme: 'dark',
        compactMode: false,
        animations: true,
        highContrast: false,
    });

    const [system, setSystem] = useState({
        maintenanceMode: false,
        registrationOpen: true,
        autoBackup: true,
        debugMode: false,
    });

    const handleSave = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            // Update profile
            await profileService.update(user.id, {
                name: profile.name,
                // Add extended fields if schema supports them
                // bio: profile.bio, etc
            });

            // Update local store
            setUser({ ...user, name: profile.name });

            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error('Error saving settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {/* Header with Admin Theme */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 to-indigo-950 p-8 sm:p-12 text-center sm:text-left border border-white/10 shadow-2xl">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-2xl bg-indigo-500/10 backdrop-blur-md ring-2 ring-indigo-500/30 flex items-center justify-center text-3xl font-bold text-indigo-400 shadow-inner">
                                {profile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <div className="absolute -bottom-2 -right-2 px-2 py-1 bg-indigo-600 rounded-md text-[10px] font-bold text-white shadow-lg uppercase tracking-wider border border-white/10">
                                ADMIN
                            </div>
                        </div>
                        <div className="text-center sm:text-left">
                            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center justify-center sm:justify-start gap-3">
                                {profile.name}
                                <Shield className="w-6 h-6 text-indigo-400" />
                            </h1>
                            <p className="text-gray-400 flex items-center justify-center sm:justify-start gap-2 mt-2 font-mono text-sm">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                SYSTEM ONLINE • {profile.email}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed",
                            saved
                                ? "bg-emerald-500 text-white ring-2 ring-emerald-400/50"
                                : "bg-indigo-600 text-white hover:bg-indigo-500"
                        )}
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : saved ? (
                            <Check className="w-4 h-4" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {saved ? 'Changes Saved' : 'Save Configuration'}
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Admin Sidebar Navigation */}
                <div className="lg:w-72 flex-shrink-0">
                    <div className="bg-[#0A0A0B] border border-white/5 rounded-2xl p-2 sticky top-6 shadow-xl shadow-black/20">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-300 group text-left mb-1",
                                    activeTab === tab.id
                                        ? "bg-white/5 border border-white/10 shadow-lg"
                                        : "hover:bg-white/5 border border-transparent"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                                    activeTab === tab.id
                                        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                                        : "bg-white/5 text-gray-400 group-hover:text-white"
                                )}>
                                    <tab.icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className={cn(
                                        "font-semibold transition-colors",
                                        activeTab === tab.id ? "text-white" : "text-gray-400 group-hover:text-white"
                                    )}>
                                        {tab.label}
                                    </p>
                                    <p className="text-xs text-gray-500 line-clamp-1">{tab.description}</p>
                                </div>
                                {activeTab === tab.id && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 min-w-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                            className="bg-[#0A0A0B] border border-white/5 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden min-h-[600px]"
                        >
                            {/* Background Pattern */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

                            {/* Gradient Blobs */}
                            <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
                            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-violet-500/5 rounded-full blur-[100px] pointer-events-none" />

                            <div className="relative z-10">
                                {activeTab === 'profile' && (
                                    <div className="space-y-8">
                                        <motion.div variants={itemVariants}>
                                            <h2 className="text-2xl font-bold text-white mb-2">Admin Profile</h2>
                                            <p className="text-gray-400">Manage your administrative details.</p>
                                        </motion.div>

                                        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Full Name</label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={profile.name}
                                                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Email</label>
                                                <div className="relative">
                                                    <input
                                                        type="email"
                                                        value={profile.email}
                                                        disabled
                                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-gray-400 cursor-not-allowed font-medium"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Department</label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={profile.department}
                                                        onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Timezone</label>
                                                <select
                                                    value={profile.timezone}
                                                    onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="Asia/Kolkata">India (IST)</option>
                                                    <option value="America/New_York">Eastern Time (ET)</option>
                                                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                                                </select>
                                            </div>
                                            <div className="col-span-1 md:col-span-2 space-y-2">
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Bio</label>
                                                <textarea
                                                    value={profile.bio}
                                                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                                    rows={4}
                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none leading-relaxed"
                                                />
                                            </div>
                                        </motion.div>
                                    </div>
                                )}

                                {activeTab === 'notifications' && (
                                    <div className="space-y-8">
                                        <motion.div variants={itemVariants}>
                                            <h2 className="text-2xl font-bold text-white mb-2">Admin Alerts</h2>
                                            <p className="text-gray-400">Configure system-wide alerts and notifications.</p>
                                        </motion.div>

                                        <motion.div variants={itemVariants} className="grid gap-4">
                                            {[
                                                { key: 'systemAlerts', label: 'Critical System Alerts', desc: 'Server downtime, security breaches, errors', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
                                                { key: 'newSignups', label: 'New Student Registrations', desc: 'Notify when new students join the platform', icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                                                { key: 'submissions', label: 'Assessment Submissions', desc: 'Alert when assessments are submitted', icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                                                { key: 'announcements', label: 'Announcement Engagement', desc: 'Comments and reactions on posts', icon: Bell, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                                            ].map((item) => (
                                                <div key={item.key} className="flex items-center justify-between p-5 bg-white/[0.03] hover:bg-white/[0.05] rounded-xl border border-white/5 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", item.bg, item.color)}>
                                                            <item.icon className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-medium">{item.label}</p>
                                                            <p className="text-sm text-gray-500">{item.desc}</p>
                                                        </div>
                                                    </div>
                                                    <div className="relative">
                                                        <input
                                                            type="checkbox"
                                                            checked={notifications[item.key as keyof typeof notifications]}
                                                            onChange={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                                                            className="sr-only peer"
                                                            id={item.key}
                                                        />
                                                        <label
                                                            htmlFor={item.key}
                                                            className="block w-14 h-8 bg-gray-800 rounded-full cursor-pointer peer-checked:bg-indigo-600 transition-colors relative"
                                                        >
                                                            <span className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform peer-checked:translate-x-6 shadow-sm" />
                                                        </label>
                                                    </div>
                                                </div>
                                            ))}
                                        </motion.div>
                                    </div>
                                )}

                                {activeTab === 'system' && (
                                    <div className="space-y-8">
                                        <motion.div variants={itemVariants}>
                                            <h2 className="text-2xl font-bold text-white mb-2">System Configuration</h2>
                                            <p className="text-gray-400">Global settings for the LMS platform.</p>
                                        </motion.div>

                                        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Status Card */}
                                            <div className="col-span-1 md:col-span-2 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                                        <Activity className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-white font-bold text-lg">System Healthy</h3>
                                                        <p className="text-emerald-400/80 text-sm">All services operational. version v2.5.0</p>
                                                    </div>
                                                </div>
                                                <button className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-semibold hover:bg-emerald-500/30 transition-colors">
                                                    View Logs
                                                </button>
                                            </div>

                                            <div className="p-6 bg-white/[0.03] border border-white/5 rounded-2xl space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Server className="w-5 h-5 text-indigo-400" />
                                                        <span className="text-white font-medium">Maintenance Mode</span>
                                                    </div>
                                                    <button onClick={() => setSystem({ ...system, maintenanceMode: !system.maintenanceMode })} className={cn("w-10 h-6 rounded-full relative transition-colors", system.maintenanceMode ? "bg-indigo-600" : "bg-gray-700")}>
                                                        <span className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", system.maintenanceMode ? "left-5" : "left-1")} />
                                                    </button>
                                                </div>
                                                <p className="text-xs text-gray-500">Temporarily disable access for all non-admin users.</p>
                                            </div>

                                            <div className="p-6 bg-white/[0.03] border border-white/5 rounded-2xl space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Users className="w-5 h-5 text-indigo-400" />
                                                        <span className="text-white font-medium">Registration</span>
                                                    </div>
                                                    <button onClick={() => setSystem({ ...system, registrationOpen: !system.registrationOpen })} className={cn("w-10 h-6 rounded-full relative transition-colors", system.registrationOpen ? "bg-indigo-600" : "bg-gray-700")}>
                                                        <span className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", system.registrationOpen ? "left-5" : "left-1")} />
                                                    </button>
                                                </div>
                                                <p className="text-xs text-gray-500">Allow new users to sign up for the platform.</p>
                                            </div>

                                            <div className="p-6 bg-white/[0.03] border border-white/5 rounded-2xl space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Database className="w-5 h-5 text-indigo-400" />
                                                        <span className="text-white font-medium">Auto Backups</span>
                                                    </div>
                                                    <button onClick={() => setSystem({ ...system, autoBackup: !system.autoBackup })} className={cn("w-10 h-6 rounded-full relative transition-colors", system.autoBackup ? "bg-indigo-600" : "bg-gray-700")}>
                                                        <span className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", system.autoBackup ? "left-5" : "left-1")} />
                                                    </button>
                                                </div>
                                                <p className="text-xs text-gray-500">Automatically backup database every 24 hours.</p>
                                            </div>

                                            <div className="p-6 bg-white/[0.03] border border-white/5 rounded-2xl space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Zap className="w-5 h-5 text-indigo-400" />
                                                        <span className="text-white font-medium">Debug Mode</span>
                                                    </div>
                                                    <button onClick={() => setSystem({ ...system, debugMode: !system.debugMode })} className={cn("w-10 h-6 rounded-full relative transition-colors", system.debugMode ? "bg-indigo-600" : "bg-gray-700")}>
                                                        <span className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", system.debugMode ? "left-5" : "left-1")} />
                                                    </button>
                                                </div>
                                                <p className="text-xs text-gray-500">Enable verbose logging for troubleshooting.</p>
                                            </div>
                                        </motion.div>
                                    </div>
                                )}

                                {activeTab === 'security' && (
                                    <div className="space-y-8">
                                        <motion.div variants={itemVariants}>
                                            <h2 className="text-2xl font-bold text-white mb-2">Security Audit</h2>
                                            <p className="text-gray-400">Review security logs and access controls.</p>
                                        </motion.div>

                                        <motion.div variants={itemVariants} className="bg-black/20 rounded-xl overflow-hidden border border-white/10">
                                            <div className="grid grid-cols-4 gap-4 p-4 border-b border-white/10 bg-white/5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                <div>Action</div>
                                                <div>User</div>
                                                <div>IP Address</div>
                                                <div className="text-right">Time</div>
                                            </div>
                                            <div className="divide-y divide-white/5">
                                                {[
                                                    { action: 'Login Success', user: 'admin@demo.com', ip: '192.168.1.1', time: '2 mins ago', status: 'success' },
                                                    { action: 'Settings Updated', user: 'admin@demo.com', ip: '192.168.1.1', time: '15 mins ago', status: 'success' },
                                                    { action: 'Failed Login', user: 'unknown', ip: '45.2.1.33', time: '2 hours ago', status: 'failure' },
                                                    { action: 'User Deleted', user: 'admin@demo.com', ip: '192.168.1.1', time: '1 day ago', status: 'warning' },
                                                ].map((log, idx) => (
                                                    <div key={idx} className="grid grid-cols-4 gap-4 p-4 text-sm hover:bg-white/5 transition-colors">
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn("w-2 h-2 rounded-full",
                                                                log.status === 'success' ? 'bg-emerald-500' :
                                                                    log.status === 'failure' ? 'bg-red-500' : 'bg-yellow-500'
                                                            )} />
                                                            <span className="text-gray-200">{log.action}</span>
                                                        </div>
                                                        <div className="text-gray-400">{log.user}</div>
                                                        <div className="text-gray-500 font-mono text-xs">{log.ip}</div>
                                                        <div className="text-right text-gray-500">{log.time}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>

                                        <motion.div variants={itemVariants} className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between">
                                            <div>
                                                <h3 className="text-white font-bold mb-1">Export Security Report</h3>
                                                <p className="text-sm text-gray-400">Download full audit logs for compliance.</p>
                                            </div>
                                            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">
                                                Download CSV
                                            </button>
                                        </motion.div>
                                    </div>
                                )}

                                {activeTab === 'appearance' && (
                                    <div className="space-y-8">
                                        <motion.div variants={itemVariants}>
                                            <h2 className="text-2xl font-bold text-white mb-2">Interface Customization</h2>
                                            <p className="text-gray-400">Manage theme and branding.</p>
                                        </motion.div>

                                        <motion.div variants={itemVariants} className="p-8 bg-white/5 rounded-2xl border border-white/10 text-center">
                                            <Palette className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                            <p className="text-gray-400">Admin interface is currently locked to Dark Mode for consistency.</p>
                                        </motion.div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};



