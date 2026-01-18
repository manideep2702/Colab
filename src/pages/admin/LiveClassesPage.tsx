import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge, Button } from '@/components/ui';
import { Radio, Plus, Calendar, Clock, Users, Video, ExternalLink, X, Loader2, Trash2 } from 'lucide-react';
import { cn, getModuleColor, formatDate } from '@/lib/utils';
import { liveClassService } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import type { LiveClass, CurriculumModule } from '@/types';

// Modal Component
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => (
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
                    className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#09090b] ring-1 ring-white/10 rounded-2xl p-6 z-[101] shadow-2xl"
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

export const LiveClassesPage: React.FC = () => {
    const { user } = useAuthStore();
    const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [newClass, setNewClass] = useState({
        title: '',
        description: '',
        meeting_link: '',
        scheduled_at: '',
        duration: 60,
        module: 'python' as CurriculumModule,
    });

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

    const handleScheduleClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            setIsSubmitting(true);
            await liveClassService.create({
                title: newClass.title,
                description: newClass.description,
                meeting_link: newClass.meeting_link,
                scheduled_at: new Date(newClass.scheduled_at).toISOString(),
                duration: newClass.duration,
                module: newClass.module,
                admin_id: user.id,
            });

            setShowScheduleModal(false);
            setNewClass({ title: '', description: '', meeting_link: '', scheduled_at: '', duration: 60, module: 'python' });
        } catch (error) {
            console.error('Error scheduling class:', error);
            alert('Failed to schedule class. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClass = async (id: string) => {
        if (!confirm('Are you sure you want to delete this class?')) return;

        try {
            await liveClassService.delete(id);
        } catch (error) {
            console.error('Error deleting class:', error);
            alert('Failed to delete class. Please try again.');
        }
    };

    // Split into upcoming and past
    const now = new Date();
    const upcomingClasses = liveClasses.filter(c => new Date(c.scheduled_at) > now);
    const pastClasses = liveClasses.filter(c => new Date(c.scheduled_at) <= now);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* Schedule Class Modal */}
            <Modal isOpen={showScheduleModal} onClose={() => setShowScheduleModal(false)} title="Schedule Live Class">
                <form onSubmit={handleScheduleClass} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Title</label>
                        <input
                            type="text"
                            value={newClass.title}
                            onChange={(e) => setNewClass({ ...newClass, title: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="e.g., Introduction to Neural Networks"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                        <textarea
                            value={newClass.description}
                            onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                            placeholder="Describe the class content..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Meeting Link</label>
                        <input
                            type="url"
                            value={newClass.meeting_link}
                            onChange={(e) => setNewClass({ ...newClass, meeting_link: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="https://zoom.us/... or https://meet.google.com/..."
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Scheduled Date & Time</label>
                            <input
                                type="datetime-local"
                                value={newClass.scheduled_at}
                                onChange={(e) => setNewClass({ ...newClass, scheduled_at: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors [color-scheme:dark]"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Duration (minutes)</label>
                            <input
                                type="number"
                                value={newClass.duration}
                                onChange={(e) => setNewClass({ ...newClass, duration: parseInt(e.target.value) })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                min={15}
                                max={180}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Module</label>
                        <select
                            value={newClass.module}
                            onChange={(e) => setNewClass({ ...newClass, module: e.target.value as CurriculumModule })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                        >
                            <option value="python">Python</option>
                            <option value="sql">SQL</option>
                            <option value="machine_learning">Machine Learning</option>
                            <option value="deep_learning">Deep Learning</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                        <button
                            type="button"
                            onClick={() => setShowScheduleModal(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/25 flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isSubmitting ? 'Scheduling...' : 'Schedule Class'}
                        </button>
                    </div>
                </form>
            </Modal>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Live Classes</h1>
                    <p className="text-gray-400 mt-1">Schedule and manage live sessions</p>
                </div>
                <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowScheduleModal(true)}>Schedule Class</Button>
            </div>

            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
            )}

            {/* Upcoming Classes */}
            {!isLoading && upcomingClasses.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-white">Upcoming Classes ({upcomingClasses.length})</h2>
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
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                leftIcon={<ExternalLink className="w-4 h-4" />}
                                                onClick={() => window.open(cls.meeting_link, '_blank')}
                                            >
                                                Open Link
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                onClick={() => handleDeleteClass(cls.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
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
                    <h2 className="text-lg font-semibold text-white text-gray-400">Past Classes ({pastClasses.length})</h2>
                    {pastClasses.map((cls, index) => {
                        const moduleColor = getModuleColor(cls.module || 'python');

                        return (
                            <motion.div
                                key={cls.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: (upcomingClasses.length + index) * 0.1 }}
                            >
                                <Card variant="default" padding="md" className="opacity-70">
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
                    <p className="text-gray-400 mt-1">Schedule your first live class to get started</p>
                </Card>
            )}
        </motion.div>
    );
};
