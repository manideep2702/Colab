import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Bell,
    Shield,
    Palette,
    Save,
    Camera,
    Check,
    Moon,
    Sun,
    Monitor,
    Eye,
    EyeOff,
    Mail,
    Globe,
    Smartphone,
    Lock,
    Zap,
    Cpu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { profileService } from '@/services/api';
import { Badge } from '@/components/ui';

const tabs = [
    { id: 'profile', label: 'My Profile', icon: User, description: 'Manage your personal info' },
    { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Customize your alerts' },
    { id: 'security', label: 'Security', icon: Shield, description: 'Protect your account' },
    { id: 'appearance', label: 'Appearance', icon: Palette, description: 'Theme & preferences' },
];

export const StudentSettingsPage: React.FC = () => {
    const { user, setUser } = useAuthStore();
    const [activeTab, setActiveTab] = useState('profile');
    const [showPassword, setShowPassword] = useState(false);
    const [saved, setSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form states
    const [profile, setProfile] = useState({
        name: user?.name || '',
        email: user?.email || '',
        bio: 'Aspiring Data Scientist passionate about Machine Learning and AI.',
        phone: '+1 (555) 000-0000',
        location: 'San Francisco, CA',
        timezone: 'Asia/Kolkata',
    });

    useEffect(() => {
        if (user) {
            setProfile(prev => ({
                ...prev,
                name: user.name,
                email: user.email,
            }));
            // Ideally fetch full profile details from DB here if extra fields exist
        }
    }, [user]);

    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        deadlines: true,
        announcements: true,
        grades: true,
    });

    const [appearance, setAppearance] = useState({
        theme: 'dark',
        compactMode: false,
        animations: true,
        blurEffects: true,
    });

    const handleSave = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            // Update profile in Supabase
            // Note: In a real app we might also update auth metadata
            await profileService.update(user.id, {
                name: profile.name,
                // Add other fields to profile table script if needed
            });

            // Update local user state
            setUser({ ...user, name: profile.name });

            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error('Error saving profile:', error);
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
        <div className="max-w-6xl mx-auto space-y-8 pb-10">
            {/* Header with decorative background */}
            {/* Header with Dashboard Theme */}
            <div className="relative rounded-3xl overflow-hidden p-8 border border-white/10 bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-black/40 backdrop-blur-xl shadow-2xl">
                <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none" />
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-2xl bg-indigo-500/10 backdrop-blur-md ring-2 ring-indigo-500/30 flex items-center justify-center text-3xl font-bold text-indigo-400 shadow-inner">
                                {profile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-500 transition-colors border border-white/10">
                                <Camera className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="text-center sm:text-left">
                            <h1 className="text-3xl font-bold text-white tracking-tight">{profile.name}</h1>
                            <div className="flex items-center justify-center sm:justify-start gap-3 mt-2">
                                <Badge variant="primary" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">STUDENT</Badge>
                                <span className="text-zinc-400 text-sm">{profile.email}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed",
                                saved
                                    ? "bg-emerald-500 text-white ring-2 ring-emerald-400/50"
                                    : "bg-white text-indigo-950 hover:bg-indigo-50"
                            )}
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-indigo-900/30 border-t-indigo-900 rounded-full animate-spin" />
                            ) : saved ? (
                                <Check className="w-4 h-4" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {saved ? 'Saved Successfully' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Modern Sidebar Navigation */}
                <div className="lg:w-72 flex-shrink-0">
                    <div className="bg-[#0A0A0B] border border-white/5 rounded-2xl p-2 sticky top-6 shadow-xl shadow-black/20">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-300 group text-left mb-1",
                                    activeTab === tab.id
                                        ? "bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 shadow-lg shadow-indigo-500/5"
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
                                    <motion.div
                                        layoutId="activeTabIndicator"
                                        className="w-1 h-8 bg-indigo-500 rounded-full absolute left-0"
                                    />
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
                            className="bg-[#0A0A0B] border border-white/5 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                            {activeTab === 'profile' && (
                                <div className="space-y-8 relative z-10">
                                    <motion.div variants={itemVariants}>
                                        <h2 className="text-2xl font-bold text-white mb-2">Personal Information</h2>
                                        <p className="text-gray-400">Update your personal details and public profile.</p>
                                    </motion.div>

                                    <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300 ml-1">Full Name</label>
                                            <div className="relative group">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                                                <input
                                                    type="text"
                                                    value={profile.name}
                                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 pl-11 text-white placeholder-[rgba(255,255,255,0.2)] focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300 ml-1">Email Address</label>
                                            <div className="relative group">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                                                <input
                                                    type="email"
                                                    value={profile.email}
                                                    disabled
                                                    className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 pl-11 text-gray-400 cursor-not-allowed font-medium"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300 ml-1">Phone Number</label>
                                            <div className="relative group">
                                                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                                                <input
                                                    type="tel"
                                                    value={profile.phone}
                                                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 pl-11 text-white placeholder-[rgba(255,255,255,0.2)] focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300 ml-1">Location</label>
                                            <div className="relative group">
                                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                                                <input
                                                    type="text"
                                                    value={profile.location}
                                                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 pl-11 text-white placeholder-[rgba(255,255,255,0.2)] focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium"
                                                />
                                            </div>
                                        </div>

                                        <div className="col-span-1 md:col-span-2 space-y-2">
                                            <label className="text-sm font-medium text-gray-300 ml-1">Bio</label>
                                            <textarea
                                                value={profile.bio}
                                                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                                rows={4}
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[rgba(255,255,255,0.2)] focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium resize-none leading-relaxed"
                                            />
                                            <p className="text-xs text-gray-500 text-right">Brief description for your profile.</p>
                                        </div>
                                    </motion.div>
                                </div>
                            )}

                            {activeTab === 'notifications' && (
                                <div className="space-y-8 relative z-10">
                                    <motion.div variants={itemVariants}>
                                        <h2 className="text-2xl font-bold text-white mb-2">Notification Preferences</h2>
                                        <p className="text-gray-400">Choose how and when you want to be notified.</p>
                                    </motion.div>

                                    <motion.div variants={itemVariants} className="space-y-4">
                                        {[
                                            { key: 'email', label: 'Email Notifications', desc: 'Receive daily summaries and important alerts via email', icon: Mail },
                                            { key: 'push', label: 'Push Notifications', desc: 'Real-time browser notifications', icon: Zap },
                                            { key: 'deadlines', label: 'Deadline Reminders', desc: 'Get reminded 24h before assignment deadlines', icon: Bell },
                                            { key: 'announcements', label: 'Course Announcements', desc: 'Stay updated with course news', icon: Smartphone },
                                            { key: 'grades', label: 'Grade Updates', desc: 'Get notified when grades are posted', icon: Cpu },
                                        ].map((item, idx) => (
                                            <motion.div
                                                key={item.key}
                                                variants={itemVariants}
                                                className="flex items-center justify-between p-5 bg-white/[0.03] hover:bg-white/[0.05] rounded-2xl border border-white/5 transition-all group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                                        <item.icon className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-semibold">{item.label}</p>
                                                        <p className="text-sm text-gray-500">{item.desc}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                                                    className={cn(
                                                        "w-14 h-8 rounded-full transition-all relative shadow-inner",
                                                        notifications[item.key as keyof typeof notifications]
                                                            ? "bg-gradient-to-r from-indigo-500 to-violet-500"
                                                            : "bg-gray-700"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-md",
                                                        notifications[item.key as keyof typeof notifications] ? "translate-x-7" : "translate-x-1"
                                                    )} />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div className="space-y-8 relative z-10">
                                    <motion.div variants={itemVariants}>
                                        <h2 className="text-2xl font-bold text-white mb-2">Security & Login</h2>
                                        <p className="text-gray-400">Manage your password and security settings.</p>
                                    </motion.div>

                                    <motion.div variants={itemVariants} className="bg-white/[0.03] border border-white/5 p-6 rounded-2xl space-y-6">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                                <Shield className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-white">Password Change</h3>
                                                <p className="text-sm text-gray-500">Ensure your account is secure with a strong password.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Current Password</label>
                                                <div className="relative group">
                                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                                                    <input
                                                        type={showPassword ? 'text' : 'password'}
                                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 pl-11 text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                                                        placeholder="••••••••••••"
                                                    />
                                                    <button
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors"
                                                    >
                                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-400 mb-2">New Password</label>
                                                    <div className="relative group">
                                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                                                        <input
                                                            type="password"
                                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 pl-11 text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                                                            placeholder="New password"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-400 mb-2">Confirm New Password</label>
                                                    <div className="relative group">
                                                        <Check className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-emerald-400 transition-colors" />
                                                        <input
                                                            type="password"
                                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 pl-11 text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                                                            placeholder="Confirm password"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>

                                    <motion.div variants={itemVariants} className="bg-gradient-to-br from-indigo-900/20 to-violet-900/20 border border-indigo-500/20 p-6 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                                <Smartphone className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-white">Two-Factor Authentication</h3>
                                                <p className="text-sm text-gray-400">Add an extra layer of security to your account.</p>
                                            </div>
                                        </div>
                                        <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-600/20">
                                            Enable 2FA
                                        </button>
                                    </motion.div>
                                </div>
                            )}

                            {activeTab === 'appearance' && (
                                <div className="space-y-8 relative z-10">
                                    <motion.div variants={itemVariants}>
                                        <h2 className="text-2xl font-bold text-white mb-2">Look & Feel</h2>
                                        <p className="text-gray-400">Customize your interface experience.</p>
                                    </motion.div>

                                    <motion.div variants={itemVariants}>
                                        <label className="block text-sm font-medium text-gray-400 mb-4">Theme Preference</label>
                                        <div className="grid grid-cols-3 gap-4">
                                            {[
                                                { id: 'light', label: 'Light', icon: Sun, bg: 'bg-gray-100', text: 'text-gray-900' },
                                                { id: 'dark', label: 'Dark', icon: Moon, bg: 'bg-gray-900', text: 'text-white' },
                                                { id: 'system', label: 'System', icon: Monitor, bg: 'bg-gradient-to-r from-gray-100 to-gray-900', text: 'text-gray-500' },
                                            ].map((theme) => (
                                                <button
                                                    key={theme.id}
                                                    onClick={() => setAppearance({ ...appearance, theme: theme.id })}
                                                    className={cn(
                                                        "group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 h-32 flex flex-col items-center justify-center gap-3",
                                                        appearance.theme === theme.id
                                                            ? "border-indigo-500 bg-indigo-900/10"
                                                            : "border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110",
                                                        appearance.theme === theme.id ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" : "bg-white/10 text-gray-400"
                                                    )}>
                                                        <theme.icon className="w-6 h-6" />
                                                    </div>
                                                    <span className={cn(
                                                        "font-medium",
                                                        appearance.theme === theme.id ? "text-white" : "text-gray-400"
                                                    )}>{theme.label}</span>

                                                    {/* Active Indicator */}
                                                    {appearance.theme === theme.id && (
                                                        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_2px_rgba(99,102,241,0.5)]" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>

                                    <motion.div variants={itemVariants} className="space-y-4 pt-6 mt-6 border-t border-white/10">
                                        {[
                                            { key: 'compactMode', label: 'Compact Mode', desc: 'Reduce spacing for a denser information view' },
                                            { key: 'animations', label: 'Interface Animations', desc: 'Enable smooth transitions and motion effects' },
                                            { key: 'blurEffects', label: 'Glassmorphism Effects', desc: 'Enable blur/transparency effects on interface elements' },
                                        ].map((item) => (
                                            <div key={item.key} className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/5">
                                                <div>
                                                    <p className="text-white font-medium">{item.label}</p>
                                                    <p className="text-sm text-gray-500">{item.desc}</p>
                                                </div>
                                                <button
                                                    onClick={() => setAppearance({ ...appearance, [item.key]: !appearance[item.key as keyof typeof appearance] })}
                                                    className={cn(
                                                        "w-12 h-6 rounded-full transition-colors relative",
                                                        appearance[item.key as keyof typeof appearance] ? "bg-indigo-600" : "bg-white/10"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm",
                                                        appearance[item.key as keyof typeof appearance] ? "translate-x-7" : "translate-x-1"
                                                    )} />
                                                </button>
                                            </div>
                                        ))}
                                    </motion.div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};



