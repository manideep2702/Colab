import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge, Button } from '@/components/ui';
import { Video, Plus, Clock, Eye, Play, Upload, X, Loader2, Trash2 } from 'lucide-react';
import { cn, getModuleColor, formatDuration } from '@/lib/utils';
import { recordingService } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import type { Recording, CurriculumModule } from '@/types';

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

export const RecordingsPage: React.FC = () => {
    const { user } = useAuthStore();
    const [recordings, setRecordings] = useState<Recording[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [newRecording, setNewRecording] = useState({
        title: '',
        description: '',
        video_url: '',
        module: 'python' as CurriculumModule,
        duration: 60,
    });

    useEffect(() => {
        fetchRecordings();

        const subscription = recordingService.subscribe((payload) => {
            if (payload.eventType === 'INSERT') {
                setRecordings(prev => [payload.new as Recording, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
                setRecordings(prev => prev.map(r => r.id === payload.new.id ? payload.new as Recording : r));
            } else if (payload.eventType === 'DELETE') {
                setRecordings(prev => prev.filter(r => r.id !== payload.old.id));
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchRecordings = async () => {
        try {
            setIsLoading(true);
            const data = await recordingService.getAll();
            setRecordings(data);
        } catch (error) {
            console.error('Error fetching recordings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUploadRecording = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            setIsSubmitting(true);
            await recordingService.create({
                title: newRecording.title,
                description: newRecording.description,
                video_url: newRecording.video_url,
                module: newRecording.module,
                duration: newRecording.duration * 60, // Convert minutes to seconds
                admin_id: user.id,
            });

            setShowUploadModal(false);
            setNewRecording({ title: '', description: '', video_url: '', module: 'python', duration: 60 });
        } catch (error) {
            console.error('Error uploading recording:', error);
            alert('Failed to upload recording. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteRecording = async (id: string) => {
        if (!confirm('Are you sure you want to delete this recording?')) return;

        try {
            await recordingService.delete(id);
        } catch (error) {
            console.error('Error deleting recording:', error);
            alert('Failed to delete recording. Please try again.');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* Upload Recording Modal */}
            <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} title="Upload Recording">
                <form onSubmit={handleUploadRecording} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Title</label>
                        <input
                            type="text"
                            value={newRecording.title}
                            onChange={(e) => setNewRecording({ ...newRecording, title: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="e.g., Introduction to Python Functions"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                        <textarea
                            value={newRecording.description}
                            onChange={(e) => setNewRecording({ ...newRecording, description: e.target.value })}
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                            placeholder="Describe the recording content..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Video URL</label>
                        <input
                            type="url"
                            value={newRecording.video_url}
                            onChange={(e) => setNewRecording({ ...newRecording, video_url: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="https://..."
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Module</label>
                            <select
                                value={newRecording.module}
                                onChange={(e) => setNewRecording({ ...newRecording, module: e.target.value as CurriculumModule })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            >
                                <option value="python">Python</option>
                                <option value="sql">SQL</option>
                                <option value="machine_learning">Machine Learning</option>
                                <option value="deep_learning">Deep Learning</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Duration (minutes)</label>
                            <input
                                type="number"
                                value={newRecording.duration}
                                onChange={(e) => setNewRecording({ ...newRecording, duration: parseInt(e.target.value) })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                min={1}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                        <button
                            type="button"
                            onClick={() => setShowUploadModal(false)}
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
                            {isSubmitting ? 'Uploading...' : 'Upload Recording'}
                        </button>
                    </div>
                </form>
            </Modal>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Recordings</h1>
                    <p className="text-gray-400 mt-1">Manage lecture recordings</p>
                </div>
                <Button leftIcon={<Upload className="w-4 h-4" />} onClick={() => setShowUploadModal(true)}>Upload Recording</Button>
            </div>

            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
            )}

            {!isLoading && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recordings.map((recording, index) => {
                        const moduleColor = getModuleColor(recording.module || 'python');

                        return (
                            <motion.div
                                key={recording.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card variant="hover" padding="none" className="overflow-hidden">
                                    <div className="relative h-40 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                        <div className={cn('w-16 h-16 rounded-xl flex items-center justify-center', moduleColor.bg)}>
                                            <Video className={cn('w-8 h-8', moduleColor.text)} />
                                        </div>
                                        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white">
                                            {formatDuration(recording.duration || 0)}
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <Badge className={cn(moduleColor.bg, moduleColor.text, moduleColor.border)} size="sm">
                                            {(recording.module || 'python').replace('_', ' ')}
                                        </Badge>
                                        <h3 className="font-semibold text-white mt-2">{recording.title}</h3>
                                        <p className="text-gray-400 text-sm mt-1 line-clamp-2">{recording.description}</p>
                                        <div className="flex justify-between items-center mt-4">
                                            <Button variant="secondary" size="sm" leftIcon={<Play className="w-4 h-4" />}>
                                                Preview
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                onClick={() => handleDeleteRecording(recording.id)}
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

            {!isLoading && recordings.length === 0 && (
                <Card variant="default" padding="lg" className="text-center">
                    <Video className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white">No recordings found</h3>
                    <p className="text-gray-400 mt-1">Upload your first recording to get started</p>
                </Card>
            )}
        </motion.div>
    );
};
