import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Calendar, TrendingUp, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

interface ActivityDay {
    date: string;
    count: number;
}

interface ActivityTrackerProps {
    className?: string;
}

export const ActivityTracker: React.FC<ActivityTrackerProps> = ({ className }) => {
    const { user } = useAuthStore();
    const [activityData, setActivityData] = useState<ActivityDay[]>([]);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [longestStreak, setLongestStreak] = useState(0);
    const [totalActiveDays, setTotalActiveDays] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchActivityData();
            recordTodayVisit();
        }
    }, [user]);

    const recordTodayVisit = async () => {
        if (!user) return;

        const today = new Date().toISOString().split('T')[0];

        try {
            // Upsert today's activity
            await supabase
                .from('student_activity')
                .upsert({
                    student_id: user.id,
                    activity_date: today,
                    visit_count: 1
                }, {
                    onConflict: 'student_id,activity_date'
                });
        } catch (error) {
            console.error('Error recording visit:', error);
        }
    };

    const fetchActivityData = async () => {
        if (!user) return;

        try {
            setIsLoading(true);

            // Fetch current year activity
            const currentYear = new Date().getFullYear();
            const startDate = new Date(currentYear, 0, 1);
            const endDate = new Date(currentYear, 11, 31);

            const { data, error } = await supabase
                .from('student_activity')
                .select('activity_date, visit_count')
                .eq('student_id', user.id)
                .gte('activity_date', startDate.toISOString().split('T')[0])
                .lte('activity_date', endDate.toISOString().split('T')[0])
                .order('activity_date', { ascending: true });

            if (error) throw error;

            // Process activity data
            const activityMap = new Map<string, number>();
            data?.forEach(item => {
                activityMap.set(item.activity_date, item.visit_count);
            });

            // Generate full year days
            const days: ActivityDay[] = [];
            let cursor = new Date(startDate);
            while (cursor <= endDate) {
                const dateStr = cursor.toISOString().split('T')[0];
                days.push({
                    date: dateStr,
                    count: activityMap.get(dateStr) || 0
                });
                cursor.setDate(cursor.getDate() + 1);
            }

            setActivityData(days);

            // Calculate streaks
            calculateStreaks(days);

        } catch (error) {
            console.error('Error fetching activity:', error);
            // Generate empty data for display
            generateEmptyData();
        } finally {
            setIsLoading(false);
        }
    };

    const generateEmptyData = () => {
        const days: ActivityDay[] = [];
        const currentYear = new Date().getFullYear();
        let cursor = new Date(currentYear, 0, 1);
        const endDate = new Date(currentYear, 11, 31);

        while (cursor <= endDate) {
            days.push({
                date: cursor.toISOString().split('T')[0],
                count: 0
            });
            cursor.setDate(cursor.getDate() + 1);
        }
        setActivityData(days);
    };

    const calculateStreaks = (days: ActivityDay[]) => {
        let current = 0;
        let longest = 0;
        let tempStreak = 0;
        let totalActive = 0;

        // Check from today backwards for current streak
        const today = new Date().toISOString().split('T')[0];
        const todayIndex = days.findIndex(d => d.date === today);

        if (todayIndex !== -1) {
            for (let i = todayIndex; i >= 0; i--) {
                if (days[i].count > 0) {
                    current++;
                } else {
                    break;
                }
            }
        }

        // Calculate longest streak and total active days
        for (const day of days) {
            if (day.count > 0) {
                tempStreak++;
                totalActive++;
                longest = Math.max(longest, tempStreak);
            } else {
                tempStreak = 0;
            }
        }

        setCurrentStreak(current);
        setLongestStreak(longest);
        setTotalActiveDays(totalActive);
    };

    const getIntensityClass = (count: number): string => {
        if (count === 0) return 'bg-zinc-800/50';
        if (count === 1) return 'bg-emerald-900/60';
        if (count <= 3) return 'bg-emerald-700/70';
        if (count <= 5) return 'bg-emerald-500/80';
        return 'bg-emerald-400';
    };

    const getMonthLabels = () => {
        const months: { label: string; index: number }[] = [];
        const currentYear = new Date().getFullYear();
        const jan1 = new Date(currentYear, 0, 1);

        for (let i = 0; i < 12; i++) {
            const firstOfMonth = new Date(currentYear, i, 1);
            // Calculate day offset from Jan 1
            const dayOffset = Math.floor((firstOfMonth.getTime() - jan1.getTime()) / (1000 * 60 * 60 * 24));

            // Adjust index by the day of week of Jan 1st to align with the grid columns
            const startDayOfWeek = jan1.getDay();
            const adjustedIndex = dayOffset + startDayOfWeek;

            months.push({
                label: firstOfMonth.toLocaleString('default', { month: 'short' }),
                index: adjustedIndex
            });
        }

        return months;
    };

    // Group data into weeks (7 days each, starting from Sunday)
    const weeks: ActivityDay[][] = [];
    let currentWeek: ActivityDay[] = [];

    activityData.forEach((day, index) => {
        const dayOfWeek = new Date(day.date).getDay();

        if (index === 0) {
            // Pad the first week
            for (let i = 0; i < dayOfWeek; i++) {
                currentWeek.push({ date: '', count: -1 });
            }
        }

        currentWeek.push(day);

        if (dayOfWeek === 6 || index === activityData.length - 1) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "p-6 rounded-3xl bg-gradient-to-br from-zinc-900/80 to-black border border-white/[0.05]",
                className
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20">
                        <Calendar className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg">Activity Tracker</h3>
                        <p className="text-xs text-zinc-500">Your learning journey</p>
                    </div>
                </div>

                {/* Current Streak Badge */}
                {currentStreak > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30"
                    >
                        <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
                        <span className="text-xl font-black text-orange-400">{currentStreak}</span>
                        <span className="text-xs text-orange-300 font-medium">day streak!</span>
                    </motion.div>
                )}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                    <div className="flex items-center gap-2 text-zinc-400 mb-1">
                        <Flame className="w-4 h-4 text-orange-400" />
                        <span className="text-xs font-medium uppercase tracking-wider">Current</span>
                    </div>
                    <div className="text-2xl font-black text-white">{currentStreak}</div>
                    <div className="text-xs text-zinc-500">days</div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                    <div className="flex items-center gap-2 text-zinc-400 mb-1">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-medium uppercase tracking-wider">Longest</span>
                    </div>
                    <div className="text-2xl font-black text-white">{longestStreak}</div>
                    <div className="text-xs text-zinc-500">days</div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                    <div className="flex items-center gap-2 text-zinc-400 mb-1">
                        <Zap className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-medium uppercase tracking-wider">Total</span>
                    </div>
                    <div className="text-2xl font-black text-white">{totalActiveDays}</div>
                    <div className="text-xs text-zinc-500">active days</div>
                </div>
            </div>

            {/* Contribution Graph */}
            <div className="relative overflow-x-auto pb-2">
                {/* Month Labels */}
                <div className="flex mb-2 ml-8">
                    {getMonthLabels().map((month, i) => (
                        <div
                            key={i}
                            className="text-[10px] text-zinc-500 font-medium"
                            style={{
                                position: 'absolute',
                                left: `${32 + Math.floor(month.index / 7) * 14}px`
                            }}
                        >
                            {month.label}
                        </div>
                    ))}
                </div>

                <div className="flex gap-0.5 mt-6">
                    {/* Day Labels */}
                    <div className="flex flex-col gap-0.5 mr-2 text-[10px] text-zinc-500 font-medium">
                        <span className="h-3"></span>
                        <span className="h-3">Mon</span>
                        <span className="h-3"></span>
                        <span className="h-3">Wed</span>
                        <span className="h-3"></span>
                        <span className="h-3">Fri</span>
                        <span className="h-3"></span>
                    </div>

                    {/* Weeks Grid */}
                    {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="flex flex-col gap-0.5">
                            {week.map((day, dayIndex) => (
                                <motion.div
                                    key={`${weekIndex}-${dayIndex}`}
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: weekIndex * 0.01 }}
                                    className={cn(
                                        "w-3 h-3 rounded-sm cursor-pointer transition-all hover:ring-1 hover:ring-white/30",
                                        day.count === -1 ? 'bg-transparent' : getIntensityClass(day.count)
                                    )}
                                    title={day.date ? `${day.date}: ${day.count} ${day.count === 1 ? 'visit' : 'visits'}` : ''}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-4 text-xs text-zinc-500">
                <span>Less</span>
                <div className="flex gap-0.5">
                    <div className="w-3 h-3 rounded-sm bg-zinc-800/50" />
                    <div className="w-3 h-3 rounded-sm bg-emerald-900/60" />
                    <div className="w-3 h-3 rounded-sm bg-emerald-700/70" />
                    <div className="w-3 h-3 rounded-sm bg-emerald-500/80" />
                    <div className="w-3 h-3 rounded-sm bg-emerald-400" />
                </div>
                <span>More</span>
            </div>
        </motion.div>
    );
};

export default ActivityTracker;
