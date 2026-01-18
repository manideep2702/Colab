import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import {
    LayoutGrid,
    Users,
    Target,
    CheckCircle,
    ArrowRight,
    Zap,
    Activity,
    ChevronLeft,
    ChevronRight,
    Plus,
    Download,
    BarChart3,
    Megaphone,
    Video,
    X,
    Sparkles,
    FolderKanban,
    FileVideo,
    BookOpen,
    Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge, Button, LineChart, BarChart, HeatmapChart } from '@/components/ui';

// --- Mock Data & Constants ---
const recentSubmissions: any[] = []; // In a real app, fetch from API
const upcomingClasses: any[] = [];

// --- Modal Components ---
const Modal = ({ isOpen, onClose, title, children }: any) => (
    <AnimatePresence>
        {isOpen && (
            <>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-4 bg-[#09090b] ring-1 ring-white/10 rounded-2xl p-6 z-[101] shadow-2xl"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white">{title}</h3>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                    {children}
                </motion.div>
            </>
        )}
    </AnimatePresence>
);

const AnnouncementModal = ({ isOpen, onClose }: any) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); console.log({ title, content }); onClose(); setTitle(''); setContent(''); };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="New Announcement">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="e.g., Exam Schedule Update" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Content</label>
                    <textarea value={content} onChange={e => setContent(e.target.value)} rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none" placeholder="Type your announcement..." required />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">Cancel</button>
                    <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/25">Post</button>
                </div>
            </form>
        </Modal>
    );
};

const ClassModal = ({ isOpen, onClose }: any) => {
    const [topic, setTopic] = useState('');
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); console.log({ topic }); onClose(); setTopic(''); };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Schedule Class">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Topic</label>
                    <input type="text" value={topic} onChange={e => setTopic(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="e.g., Advanced Gradient Descent" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-400 mb-1">Date</label><input type="date" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors [color-scheme:dark]" /></div>
                    <div><label className="block text-sm font-medium text-gray-400 mb-1">Time</label><input type="time" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors [color-scheme:dark]" /></div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">Cancel</button>
                    <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/25">Schedule</button>
                </div>
            </form>
        </Modal>
    );
};

// --- Main Component ---
import { supabase } from '@/lib/supabase';

// --- Main Component ---
export const AdminDashboard: React.FC = () => {
    const { user } = useAuthStore();

    // Analytics State
    const [stats, setStats] = useState({
        activeStudents: 0,
        activeProjects: 0,
        pendingTasks: 0
    });
    const [heatmapData, setHeatmapData] = useState<{ x: string; y: string; value: number }[]>([]);
    const [quizTrends, setQuizTrends] = useState<number[]>([]);
    const [topRecordings, setTopRecordings] = useState<{ title: string; views: number; progress: number }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch Dashboard Data
    React.useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setIsLoading(true);

                // 1. Basic Stats
                const { count: studentCount } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('role', 'student');

                const { count: projectCount } = await supabase
                    .from('projects')
                    .select('*', { count: 'exact', head: true });

                const { count: pendingAdmissions } = await supabase
                    .from('admissions')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'pending');

                const { count: pendingSubmissions } = await supabase
                    .from('project_submissions')
                    .select('*', { count: 'exact', head: true })
                    .is('grade', null);

                setStats({
                    activeStudents: studentCount || 0,
                    activeProjects: projectCount || 0,
                    pendingTasks: (pendingAdmissions || 0) + (pendingSubmissions || 0)
                });

                // 2. Activity Heatmap (Using recording progress timestamps)
                const { data: activityData } = await supabase
                    .from('recording_progress')
                    .select('last_watched_at')
                    .order('last_watched_at', { ascending: false })
                    .limit(500);

                if (activityData) {
                    const processHeatmap = () => {
                        const counts: Record<string, number> = {};
                        activityData.forEach(item => {
                            const date = new Date(item.last_watched_at);
                            const day = date.toLocaleDateString('en-US', { weekday: 'short' });
                            const hour = date.getHours();
                            let period = 'Evening';
                            if (hour < 12) period = 'Morning';
                            else if (hour < 17) period = 'Afternoon';

                            const key = `${day}-${period}`;
                            counts[key] = (counts[key] || 0) + 1;
                        });

                        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                        const periods = ['Morning', 'Afternoon', 'Evening'];
                        const mappedData: { x: string; y: string; value: number }[] = [];

                        days.forEach(d => {
                            periods.forEach(p => {
                                mappedData.push({
                                    x: d,
                                    y: p,
                                    value: counts[`${d}-${p}`] || 0
                                });
                            });
                        });
                        setHeatmapData(mappedData);
                    };
                    processHeatmap();
                }

                // 3. Quiz Trends (Mock logic using assessment submissions if needed, strictly aggregated real data is complex without RPC)
                // For now, we'll fetch recent assessment submissions scores
                const { data: quizScores } = await supabase
                    .from('assessment_submissions')
                    .select('score, created_at')
                    .order('created_at', { ascending: true })
                    .limit(100);

                if (quizScores && quizScores.length > 0) {
                    // Simple aggregation: average score per 5 submissions to simulate "weeks" or trends
                    const trends = [];
                    const chunkSize = Math.max(1, Math.floor(quizScores.length / 7));
                    for (let i = 0; i < quizScores.length; i += chunkSize) {
                        const chunk = quizScores.slice(i, i + chunkSize);
                        const avg = chunk.reduce((sum, item) => sum + (item.score || 0), 0) / chunk.length;
                        trends.push(Math.round(avg));
                    }
                    // Ensure we have at least some data points
                    setQuizTrends(trends.length > 0 ? trends : [0]);
                } else {
                    setQuizTrends([0, 0, 0, 0, 0, 0, 0]);
                }

                // 4. Top Recordings
                const { data: recordingsData } = await supabase
                    .from('recordings')
                    .select(`
                        id,
                        title,
                        recording_progress (count)
                    `)
                    .limit(10);

                if (recordingsData) {
                    const processed = recordingsData
                        .map((r: any) => ({
                            title: r.title,
                            views: r.recording_progress?.[0]?.count || 0,
                            progress: Math.min(100, (r.recording_progress?.[0]?.count || 0) * 10) // Mock progress calculation based on views for demo
                        }))
                        .sort((a, b) => b.views - a.views)
                        .slice(0, 4);
                    setTopRecordings(processed);
                }

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const navigate = useNavigate();

    const handleProjectClick = () => navigate('/admin/projects');
    const handleRecordingClick = () => navigate('/admin/recordings');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >


            {/* Hero Section */}
            <div className="relative rounded-3xl overflow-hidden p-8 border border-white/10 bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-black/40 backdrop-blur-xl">
                <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-widest">
                                Admin Console
                            </span>
                            <span className="flex items-center text-xs text-zinc-400">
                                <Clock className="w-3 h-3 mr-1" />
                                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                            Welcome back, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400">
                                Administrator
                            </span>
                        </h1>
                        <p className="text-zinc-400 mt-4 max-w-xl text-lg leading-relaxed">
                            Winter Semester is running smoothly. 98% system uptime.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-2 text-zinc-400 mb-2">
                                <Users className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Active Students</span>
                            </div>
                            <div className="text-3xl font-black text-white">{stats.activeStudents}</div>
                        </div>
                        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-2 text-zinc-400 mb-2">
                                <BookOpen className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Active Projects</span>
                            </div>
                            <div className="text-3xl font-black text-white">{stats.activeProjects}</div>
                        </div>
                        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-2 text-zinc-400 mb-2">
                                <Zap className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Pending Tasks</span>
                            </div>
                            <div className="text-3xl font-black text-white">{stats.pendingTasks}</div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white">Quick Actions</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <ActionCard
                                icon={<Megaphone className="w-5 h-5 text-white" />}
                                label="Announcement"
                                subtext="Notify students"
                                gradient="from-violet-600 to-indigo-600"
                                onClick={() => navigate('/admin/announcements')}
                            />
                            <ActionCard
                                icon={<Video className="w-5 h-5 text-white" />}
                                label="Schedule Class"
                                subtext="Live session"
                                gradient="from-pink-600 to-rose-600"
                                onClick={() => navigate('/admin/live-classes')}
                            />
                            <ActionCard
                                icon={<FolderKanban className="w-5 h-5 text-white" />}
                                label="New Project"
                                subtext="Assign coursework"
                                gradient="from-emerald-600 to-teal-600"
                                onClick={handleProjectClick}
                            />
                            <ActionCard
                                icon={<FileVideo className="w-5 h-5 text-white" />}
                                label="Upload Video"
                                subtext="Lecture recording"
                                gradient="from-amber-600 to-orange-600"
                                onClick={handleRecordingClick}
                            />
                        </div>
                    </div>

                    {/* Enhanced Analytics Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Activity className="w-5 h-5 text-indigo-400" />
                                Performance & Engagement
                            </h3>
                            <select className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-1 text-xs text-gray-400 focus:outline-none focus:border-indigo-500">
                                <option>Last 7 Days</option>
                                <option>Last 30 Days</option>
                                <option>This Semester</option>
                            </select>
                        </div>

                        {/* Activity Heatmap */}
                        <div className="p-6 rounded-3xl bg-[#0F0F11] border border-white/[0.05]">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-emerald-400" />
                                    Student Activity Heatmap
                                </h4>
                            </div>
                            <HeatmapChart
                                data={heatmapData.length > 0 ? heatmapData : [
                                    { x: 'Mon', y: 'Morning', value: 0 }, { x: 'Mon', y: 'Afternoon', value: 0 }, { x: 'Mon', y: 'Evening', value: 0 },
                                    { x: 'Tue', y: 'Morning', value: 0 }, { x: 'Tue', y: 'Afternoon', value: 0 }, { x: 'Tue', y: 'Evening', value: 0 },
                                    { x: 'Wed', y: 'Morning', value: 0 }, { x: 'Wed', y: 'Afternoon', value: 0 }, { x: 'Wed', y: 'Evening', value: 0 },
                                    { x: 'Thu', y: 'Morning', value: 0 }, { x: 'Thu', y: 'Afternoon', value: 0 }, { x: 'Thu', y: 'Evening', value: 0 },
                                    { x: 'Fri', y: 'Morning', value: 0 }, { x: 'Fri', y: 'Afternoon', value: 0 }, { x: 'Fri', y: 'Evening', value: 0 },
                                    { x: 'Sat', y: 'Morning', value: 0 }, { x: 'Sat', y: 'Afternoon', value: 0 }, { x: 'Sat', y: 'Evening', value: 0 },
                                    { x: 'Sun', y: 'Morning', value: 0 }, { x: 'Sun', y: 'Afternoon', value: 0 }, { x: 'Sun', y: 'Evening', value: 0 },
                                ]}
                                height={240}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Quiz Score Trends */}
                            <div className="p-6 rounded-3xl bg-[#0F0F11] border border-white/[0.05]">
                                <h4 className="font-bold text-white text-sm mb-6 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-indigo-400" />
                                    Avg. Quiz Scores Trend
                                </h4>
                                <LineChart
                                    data={quizTrends.length > 0 ? quizTrends : [0, 0, 0, 0, 0, 0, 0]}
                                    labels={['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6', 'Wk 7']}
                                    color="#6366f1"
                                    height={180}
                                />
                                <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                                    {/* Placeholder for future trend analysis */}
                                </div>
                            </div>

                            {/* Most Watched Videos */}
                            <div className="p-6 rounded-3xl bg-[#0F0F11] border border-white/[0.05]">
                                <h4 className="font-bold text-white text-sm mb-6 flex items-center gap-2">
                                    <Video className="w-4 h-4 text-pink-400" />
                                    Most Watched Recordings
                                </h4>
                                <div className="space-y-4">
                                    {topRecordings.length > 0 ? (
                                        topRecordings.map((video, i) => (
                                            <div key={i} className="group cursor-pointer">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-gray-300 font-medium group-hover:text-white transition-colors">{video.title}</span>
                                                    <span className="text-gray-500">{video.views} views</span>
                                                </div>
                                                <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${video.progress}%` }}
                                                        transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                                                        className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-6 text-gray-500 text-sm">
                                            No data available yet
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pending Review Section */}
                    <div className="p-6 rounded-3xl bg-[#0F0F11] border border-white/[0.05]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Activity className="w-5 h-5 text-amber-400" />
                                Pending Review
                            </h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 ring-1 ring-white/10 hover:bg-white/[0.07] transition-colors">
                                <div className="flex items-center gap-3">
                                    <Zap className="w-4 h-4 text-amber-400" />
                                    <p className="text-sm text-slate-300">Grade ML Project submissions</p>
                                </div>
                                <span className="text-xs px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">High Priority</span>
                            </div>
                            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 ring-1 ring-white/10 hover:bg-white/[0.07] transition-colors">
                                <div className="flex items-center gap-3">
                                    <Activity className="w-4 h-4 text-emerald-400" />
                                    <p className="text-sm text-slate-300">Review Weekly Analytics</p>
                                </div>
                                <span className="text-xs text-slate-400">Due today</span>
                            </div>
                            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 ring-1 ring-white/10 hover:bg-white/[0.07] transition-colors">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-4 h-4 text-blue-400" />
                                    <p className="text-sm text-slate-300">Approve Capstone Proposals</p>
                                </div>
                                <span className="text-xs text-slate-400">5 pending</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-4 space-y-6">
                    {/* AI Grading Status */}
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-white/[0.05]">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-white flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-400" /> AI Grading System</h4>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <span className="font-bold text-emerald-400 pulse-dot flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Active
                                </span>
                            </div>
                        </div>
                        <div className="relative h-2 bg-white/10 rounded-full overflow-hidden mb-5">
                            <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full w-[92%] animate-pulse"></div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="rounded-xl bg-black/20 p-3 border border-white/5">
                                <div className="text-xl font-bold text-white">--</div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Avg Time</div>
                            </div>
                            <div className="rounded-xl bg-black/20 p-3 border border-white/5">
                                <div className="text-xl font-bold text-white">--</div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Accuracy</div>
                            </div>
                            <div className="rounded-xl bg-black/20 p-3 border border-white/5">
                                <div className="text-xl font-bold text-white">0</div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Processed</div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activities Feed */}
                    <div className="p-6 rounded-3xl bg-[#0F0F11] border border-white/[0.05]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Clock className="w-5 h-5 text-zinc-400" />
                                Feed
                            </h3>
                        </div>
                        <div className="text-center py-10 text-zinc-600 text-sm">
                            No recent activity to show.
                        </div>
                    </div>

                </div>
            </div>
        </motion.div>
    );
};

const ActionCard = ({ icon, label, subtext, gradient, onClick }: any) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/10 transition-all group w-full"
    >
        <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 bg-gradient-to-br shadow-lg", gradient)}>
            {icon}
        </div>
        <p className="text-sm font-bold text-white mb-0.5">{label}</p>
        <p className="text-xs text-zinc-500">{subtext}</p>
    </button>
);
