import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, Badge, Progress, Button, LineChart, BarChart } from '@/components/ui';
import {
    BookOpen,
    Video,
    FileText,
    Calendar,
    Trophy,
    TrendingUp,
    Bell,
    ChevronRight,
    Play,
    Loader2,
    Sparkles,
    BarChart2,
    Clock,
    ArrowRight,
    Zap,
    Target,
    Code2,
    CheckCircle2
} from 'lucide-react';
import { cn, formatRelativeTime, getModuleColor } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { announcementService, recordingService, assessmentService, liveClassService, codingChallengeService } from '@/services/api';
import type { Announcement, Recording, Assessment, LiveClass, AssessmentSubmission, CodingSubmission, CodingChallenge } from '@/types';
import { ActivityTracker } from '@/components/ActivityTracker';

export const StudentDashboard: React.FC = () => {
    const { user } = useAuthStore();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [recordings, setRecordings] = useState<Recording[]>([]);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
    const [submissions, setSubmissions] = useState<AssessmentSubmission[]>([]);
    const [codingSubmissions, setCodingSubmissions] = useState<CodingSubmission[]>([]);
    const [codingChallenges, setCodingChallenges] = useState<CodingChallenge[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            setIsLoading(true);
            const [announcementsData, recordingsData, assessmentsData, liveClassesData, challengesData] = await Promise.all([
                announcementService.getAll(),
                recordingService.getAll(),
                assessmentService.getAll(),
                liveClassService.getAll(),
                codingChallengeService.getAll(),
            ]);
            setAnnouncements(announcementsData.slice(0, 3));
            setRecordings(recordingsData.slice(0, 4));
            setAssessments(assessmentsData.filter(a => a.questions && a.questions.length > 0).slice(0, 3));
            setLiveClasses(liveClassesData.filter(lc => new Date(lc.scheduled_at) > new Date()).slice(0, 2));
            setCodingChallenges(challengesData);

            if (user) {
                try {
                    const [submissionsData, codingSubmissionsData] = await Promise.all([
                        assessmentService.getStudentSubmissions(user.id),
                        codingChallengeService.getMySubmissions(user.id),
                    ]);
                    setSubmissions(submissionsData);
                    setCodingSubmissions(codingSubmissionsData);
                } catch (e) {
                    console.log('No submissions found');
                }
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const averageScore = submissions.length > 0
        ? Math.round(submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length)
        : 0;

    // Coding challenge stats
    const totalChallenges = codingChallenges.length;
    const completedChallenges = codingSubmissions.filter(s => s.status === 'passed').length;
    const attemptedChallenges = codingSubmissions.length;

    // Combined score data for chart (assessments + coding challenges)
    const allSubmissions = [
        ...submissions.map(s => ({ score: s.score || 0, date: s.submitted_at, type: 'assessment' })),
        ...codingSubmissions.map(s => ({
            score: s.total_test_cases > 0 ? Math.round((s.test_cases_passed / s.total_test_cases) * 100) : 0,
            date: s.submitted_at,
            type: 'coding'
        }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Get last 7 entries for chart
    const recentScores = allSubmissions.slice(-7);
    const chartData = recentScores.length > 0
        ? recentScores.map(s => s.score)
        : [0]; // At least one point
    const chartLabels = recentScores.length > 0
        ? recentScores.map(s => new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }))
        : ['No data'];

    // Calculate topic mastery from module-based data
    const getModuleScore = (module: string): number => {
        const moduleSubmissions = codingSubmissions.filter(s => {
            const challenge = codingChallenges.find(c => c.id === s.challenge_id);
            return challenge?.module === module;
        });
        if (moduleSubmissions.length === 0) return 0;
        const totalPassed = moduleSubmissions.reduce((sum, s) => sum + s.test_cases_passed, 0);
        const totalTests = moduleSubmissions.reduce((sum, s) => sum + s.total_test_cases, 0);
        return totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;
    };

    const topicMasteryData = [
        0, // Set to 0 specifically as requested: 'make python zero'
        getModuleScore('sql'),
        getModuleScore('machine_learning'),
        getModuleScore('deep_learning')
    ];

    // Check if we have any real data
    const hasData = submissions.length > 0 || codingSubmissions.length > 0;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[600px]">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            </div>
        );
    }

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
                            <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-widest">
                                Student Portal
                            </span>
                            <span className="flex items-center text-xs text-zinc-400">
                                <Clock className="w-3 h-3 mr-1" />
                                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                            Welcome back, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                                {user?.name || 'Scholar'}
                            </span>
                        </h1>
                        <p className="text-zinc-400 mt-4 max-w-xl text-lg leading-relaxed">
                            You're on track! Check your upcoming classes and continue your learning journey.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Column: Quick Stats & Main Feed */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <StatCard
                            icon={<Video className="w-5 h-5 text-blue-400" />}
                            label="Classes"
                            value={recordings.length.toString()}
                            color="blue"
                        />
                        <StatCard
                            icon={<FileText className="w-5 h-5 text-emerald-400" />}
                            label="Tests Done"
                            value={submissions.length.toString()}
                            color="emerald"
                        />
                        <StatCard
                            icon={<Code2 className="w-5 h-5 text-indigo-400" />}
                            label="Challenges"
                            value={`${completedChallenges}/${totalChallenges}`}
                            color="indigo"
                        />
                        <StatCard
                            icon={<BarChart2 className="w-5 h-5 text-amber-400" />}
                            label="Avg Score"
                            value={`${averageScore}%`}
                            color="amber"
                        />
                        <StatCard
                            icon={<Trophy className="w-5 h-5 text-rose-400" />}
                            label="Best"
                            value={submissions.length > 0 ? `${Math.max(...submissions.map(s => s.score || 0))}%` : '0%'}
                            color="rose"
                        />
                    </div>

                    {/* Performance Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-3xl bg-[#0F0F11] border border-white/[0.05]">
                            <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-indigo-400" />
                                Score Trajectory
                            </h3>
                            {hasData ? (
                                <LineChart
                                    data={chartData}
                                    labels={chartLabels}
                                    color="#818cf8"
                                    height={200}
                                />
                            ) : (
                                <div className="h-[200px] flex flex-col items-center justify-center text-zinc-500">
                                    <TrendingUp className="w-10 h-10 mb-3 opacity-30" />
                                    <p className="text-sm">Complete assessments to see your progress</p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 rounded-3xl bg-[#0F0F11] border border-white/[0.05]">
                            <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                                <BarChart2 className="w-5 h-5 text-emerald-400" />
                                Topic Mastery
                            </h3>
                            {hasData ? (
                                <BarChart
                                    data={topicMasteryData}
                                    labels={['Python', 'SQL', 'ML', 'Deep']}
                                    color="#34d399"
                                    height={200}
                                />
                            ) : (
                                <div className="h-[200px] flex flex-col items-center justify-center text-zinc-500">
                                    <BarChart2 className="w-10 h-10 mb-3 opacity-30" />
                                    <p className="text-sm">Complete challenges to see topic mastery</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Activity Tracker - GitHub Style */}
                    <ActivityTracker />

                    {/* Upcoming Live Classes */}
                    {liveClasses.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-indigo-400" />
                                Upcoming Sessions
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {liveClasses.map((lc) => (
                                    <div key={lc.id} className="group relative p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-indigo-500/30 transition-all cursor-pointer overflow-hidden">
                                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <Video className="w-24 h-24 text-indigo-500 transform rotate-12 translate-x-4 -translate-y-4" />
                                        </div>
                                        <div className="relative z-10">
                                            <Badge variant="primary" className="mb-3">Live Class</Badge>
                                            <h3 className="text-xl font-bold text-white mb-2 leading-snug group-hover:text-indigo-400 transition-colors">{lc.title}</h3>
                                            <div className="flex items-center gap-4 text-sm text-zinc-400">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4" />
                                                    {new Date(lc.scheduled_at).toLocaleDateString()}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="w-4 h-4" />
                                                    {new Date(lc.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <Button size="sm" className="mt-4 w-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20">
                                                Join Session
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recent Recordings */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Play className="w-5 h-5 text-pink-400" />
                                Continue Watching
                            </h2>
                            <a href="/student/recordings" className="text-xs font-bold text-zinc-500 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1">
                                View All <ArrowRight className="w-3 h-3" />
                            </a>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {recordings.map((recording) => {
                                const moduleColor = getModuleColor(recording.module || 'python');
                                return (
                                    <a
                                        key={recording.id}
                                        href="/student/recordings"
                                        className="group relative rounded-xl overflow-hidden aspect-video bg-zinc-900 border border-white/10 hover:border-white/20 transition-all"
                                    >
                                        {/* Thumbnail or Gradient Background */}
                                        {recording.thumbnail_url ? (
                                            <img
                                                src={recording.thumbnail_url}
                                                alt={recording.title}
                                                className="absolute inset-0 w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className={cn("absolute inset-0 bg-gradient-to-br", moduleColor.bg.replace('bg-', 'from-'), "to-zinc-900")} />
                                        )}

                                        {/* Overlay Gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />

                                        {/* Play Button */}
                                        <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100">
                                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                                <Play className="w-5 h-5 text-white fill-current translate-x-0.5" />
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                                            <Badge variant="default" size="sm" className={cn("mb-2 backdrop-blur-md border-white/10", moduleColor.bg, moduleColor.text)}>
                                                {(recording.module || 'python').replace('_', ' ')}
                                            </Badge>
                                            <h3 className="text-white font-bold truncate">{recording.title}</h3>
                                        </div>
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                </div>

                {/* Right Column: Sidebar Widgets */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Progress Widget */}
                    <div className="p-6 rounded-3xl bg-[#0F0F11] border border-white/[0.05]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Target className="w-5 h-5 text-emerald-400" />
                                Your Progress
                            </h3>
                        </div>
                        <div className="space-y-6">
                            <ProgressItem label="Python" progress={topicMasteryData[0]} color="bg-blue-500" />
                            <ProgressItem label="SQL & Data" progress={topicMasteryData[1]} color="bg-emerald-500" />
                            <ProgressItem label="Machine Learning" progress={topicMasteryData[2]} color="bg-amber-500" />
                            <ProgressItem label="Deep Learning" progress={topicMasteryData[3]} color="bg-rose-500" />
                        </div>
                    </div>

                    {/* Coding Challenges Widget */}
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border border-white/[0.05]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Code2 className="w-5 h-5 text-purple-400" />
                                Coding Challenges
                            </h3>
                            <a href="/student/assessments" className="text-xs text-zinc-500 hover:text-white">View All</a>
                        </div>

                        {/* Completed Challenges */}
                        {codingSubmissions.filter(sub => sub.status === 'passed').length > 0 && (
                            <div className="mb-4">
                                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Completed
                                </h4>
                                <div className="space-y-2">
                                    {codingSubmissions
                                        .filter(sub => sub.status === 'passed')
                                        .slice(0, 2)
                                        .map(sub => {
                                            const challenge = codingChallenges.find(c => c.id === sub.challenge_id);
                                            return (
                                                <div key={sub.id} className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm font-medium text-white truncate flex-1 mr-2">
                                                            {challenge?.title || 'Challenge'}
                                                        </span>
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs text-emerald-300/60">
                                                        <span>{sub.test_cases_passed}/{sub.total_test_cases} tests</span>
                                                        <span className="font-bold text-emerald-400">{sub.score} pts</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        )}

                        {/* Upcoming/In Progress Challenges */}
                        {codingChallenges.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {codingSubmissions.filter(sub => sub.status !== 'passed').length > 0 ? 'In Progress' : 'Upcoming'}
                                </h4>
                                <div className="space-y-2">
                                    {codingChallenges
                                        .filter(challenge => {
                                            const submission = codingSubmissions.find(sub => sub.challenge_id === challenge.id);
                                            return !submission || submission.status !== 'passed';
                                        })
                                        .slice(0, 2)
                                        .map(challenge => {
                                            const submission = codingSubmissions.find(sub => sub.challenge_id === challenge.id);
                                            return (
                                                <div key={challenge.id} className="p-3 rounded-xl bg-black/20 border border-white/5 hover:border-amber-500/30 transition-colors">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm font-medium text-white truncate flex-1 mr-2">
                                                            {challenge.title}
                                                        </span>
                                                        {submission ? (
                                                            <div className="w-4 h-4 rounded-full border-2 border-amber-400 flex-shrink-0" />
                                                        ) : (
                                                            <div className="w-4 h-4 rounded-full border-2 border-zinc-600 flex-shrink-0" />
                                                        )}
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs text-zinc-500">
                                                        {submission ? (
                                                            <>
                                                                <span>{submission.test_cases_passed}/{submission.total_test_cases} tests</span>
                                                                <span>{submission.score} pts</span>
                                                            </>
                                                        ) : (
                                                            <span>Not started</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        )}

                        {codingChallenges.length === 0 && codingSubmissions.length === 0 && (
                            <div className="text-center py-6 text-zinc-600">
                                <Code2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No challenges available yet</p>
                                <a href="/student/assessments" className="text-xs text-indigo-400 hover:underline mt-1 inline-block">
                                    Check later →
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Announcements Widget */}
                    <div className="p-6 rounded-3xl bg-[#0F0F11] border border-white/[0.05] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Bell className="w-32 h-32 text-white transform rotate-12" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-amber-400" />
                                    Updates
                                </h3>
                                <span className="w-2 h-2 rounded-full bg-amber-500/50 animate-pulse" />
                            </div>
                            <div className="space-y-4">
                                {announcements.map((ann) => (
                                    <div key={ann.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-colors">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={cn(
                                                "w-1.5 h-1.5 rounded-full",
                                                ann.category === 'urgent' ? "bg-red-500" : "bg-blue-500"
                                            )} />
                                            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                                                {ann.category}
                                            </span>
                                            <span className="text-[10px] text-zinc-600 ml-auto">{formatRelativeTime(ann.created_at)}</span>
                                        </div>
                                        <h4 className="text-sm font-bold text-zinc-200 leading-snug">{ann.title}</h4>
                                    </div>
                                ))}
                                {announcements.length === 0 && (
                                    <div className="text-center py-8 text-zinc-600 text-sm">
                                        No new announcements.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Tests */}
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-white/[0.05]">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-400" />
                            Due Soon
                        </h3>
                        {assessments.length > 0 ? (
                            <div className="space-y-3">
                                {assessments.map(a => (
                                    <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                                        <div className="truncate pr-2">
                                            <div className="text-sm font-medium text-white truncate">{a.title}</div>
                                            <div className="text-xs text-zinc-500">{a.time_limit} mins • {a.questions?.length || 0} Qs</div>
                                        </div>
                                        <a href="/student/assessments">
                                            <Button size="sm" variant="secondary" className="h-8 text-xs">Start</Button>
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-zinc-500">All caught up! 🎉</p>
                        )}
                    </div>

                </div>
            </div>
        </motion.div>
    );
};

// --- Components ---

const StatCard = ({ icon, label, value, color }: any) => {
    const bgColors: Record<string, string> = {
        blue: 'bg-blue-500/10 border-blue-500/20 group-hover:border-blue-500/40',
        emerald: 'bg-emerald-500/10 border-emerald-500/20 group-hover:border-emerald-500/40',
        amber: 'bg-amber-500/10 border-amber-500/20 group-hover:border-amber-500/40',
        rose: 'bg-rose-500/10 border-rose-500/20 group-hover:border-rose-500/40',
        indigo: 'bg-indigo-500/10 border-indigo-500/20 group-hover:border-indigo-500/40',
    };

    return (
        <div className={cn(
            "group p-5 rounded-2xl border transition-all duration-300",
            bgColors[color] || bgColors.blue
        )}>
            <div className="flex flex-col gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    {icon}
                </div>
                <div>
                    <div className="text-2xl font-black text-white tracking-tight">{value}</div>
                    <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 group-hover:text-zinc-400 transition-colors">{label}</div>
                </div>
            </div>
        </div>
    );
};

const ProgressItem = ({ label, progress, color }: any) => (
    <div>
        <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{label}</span>
            <span className="text-xs font-bold text-white">{progress}%</span>
        </div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div
                className={cn("h-full rounded-full transition-all duration-1000", color)}
                style={{ width: `${progress}%` }}
            />
        </div>
    </div>
);
