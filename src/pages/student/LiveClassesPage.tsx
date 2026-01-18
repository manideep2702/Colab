import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, Badge, Button } from '@/components/ui';
import { Radio, Calendar, Clock, Users, Video, ExternalLink, CalendarPlus, Loader2 } from 'lucide-react';
import { cn, getModuleColor, formatDate } from '@/lib/utils';
import { liveClassService } from '@/services/api';
import type { LiveClass } from '@/types';

export const StudentLiveClassesPage: React.FC = () => {
    const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchClasses();

        const subscription = liveClassService.subscribe((payload) => {
            if (payload.eventType === 'INSERT') {
                setLiveClasses(prev => [...prev, payload.new as LiveClass].sort((a, b) =>
                    new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
                ));
            } else if (payload.eventType === 'UPDATE') {
                setLiveClasses(prev => prev.map(c => c.id === payload.new.id ? payload.new as LiveClass : c));
            } else if (payload.eventType === 'DELETE') {
                setLiveClasses(prev => prev.filter(c => c.id !== payload.old.id));
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchClasses = async () => {
        try {
            setIsLoading(true);
            const data = await liveClassService.getAll();
            setLiveClasses(data);
        } catch (error) {
            console.error('Error fetching live classes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const now = new Date();
    const upcomingClasses = liveClasses.filter(c => new Date(c.scheduled_at) > now);
    const pastClasses = liveClasses.filter(c => new Date(c.scheduled_at) <= now);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            <div>
                <h1 className="text-2xl font-bold text-white">Live Classes</h1>
                <p className="text-gray-400 mt-1">Join live sessions and view recordings</p>
            </div>

            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
            )}

            {/* Upcoming */}
            {!isLoading && upcomingClasses.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-white">Upcoming Classes</h2>
                    {upcomingClasses.map((cls, index) => {
                        const moduleColor = getModuleColor(cls.module || 'python');
                        const isLive = new Date(cls.scheduled_at) <= new Date(Date.now() + 30 * 60 * 1000);

                        return (
                            <motion.div
                                key={cls.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card variant="hover" padding="md">
                                    <div className="flex items-start gap-4">
                                        <div className={cn(
                                            'w-12 h-12 rounded-xl flex items-center justify-center relative',
                                            moduleColor.bg
                                        )}>
                                            <Radio className={cn('w-6 h-6', moduleColor.text)} />
                                            {isLive && (
                                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge className={cn(moduleColor.bg, moduleColor.text, moduleColor.border)} size="sm">
                                                    {(cls.module || 'python').replace('_', ' ')}
                                                </Badge>
                                                {isLive && (
                                                    <Badge variant="danger" size="sm">
                                                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1" />
                                                        Starting Soon
                                                    </Badge>
                                                )}
                                            </div>
                                            <h3 className="text-lg font-semibold text-white">{cls.title}</h3>
                                            <p className="text-gray-400 text-sm mt-1">{cls.description}</p>
                                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDate(cls.scheduled_at, 'MMM d, h:mm a')}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    {cls.duration} min
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {isLive ? (
                                                <Button
                                                    leftIcon={<ExternalLink className="w-4 h-4" />}
                                                    onClick={() => window.open(cls.meeting_link, '_blank')}
                                                >
                                                    Join Now
                                                </Button>
                                            ) : (
                                                <Button variant="secondary" size="sm" leftIcon={<CalendarPlus className="w-4 h-4" />}>
                                                    Add to Calendar
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Past Classes */}
            {!isLoading && pastClasses.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-white">Past Classes</h2>
                    {pastClasses.map((cls, index) => {
                        const moduleColor = getModuleColor(cls.module || 'python');

                        return (
                            <motion.div
                                key={cls.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: (upcomingClasses.length + index) * 0.1 }}
                            >
                                <Card variant="default" padding="md">
                                    <div className="flex items-start gap-4">
                                        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', moduleColor.bg)}>
                                            <Radio className={cn('w-6 h-6', moduleColor.text)} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge className={cn(moduleColor.bg, moduleColor.text, moduleColor.border)} size="sm">
                                                    {(cls.module || 'python').replace('_', ' ')}
                                                </Badge>
                                                <Badge variant="success" size="sm">Completed</Badge>
                                            </div>
                                            <h3 className="font-semibold text-white">{cls.title}</h3>
                                            <p className="text-gray-500 text-sm mt-1">
                                                {formatDate(cls.scheduled_at, 'MMM d, yyyy')}
                                            </p>
                                        </div>
                                        {cls.recorded_video_url && (
                                            <Button variant="secondary" size="sm" leftIcon={<Video className="w-4 h-4" />}>
                                                Watch Recording
                                            </Button>
                                        )}
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {!isLoading && liveClasses.length === 0 && (
                <Card variant="default" padding="lg" className="text-center">
                    <Radio className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white">No classes scheduled</h3>
                    <p className="text-gray-400 mt-1">Check back later for upcoming live sessions</p>
                </Card>
            )}
        </motion.div>
    );
};
