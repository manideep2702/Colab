import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge, Button } from '@/components/ui';
import { Megaphone, Pin, Clock, Loader2, X, Calendar } from 'lucide-react';
import { cn, formatRelativeTime, getCategoryColor } from '@/lib/utils';
import { announcementService } from '@/services/api';
import type { Announcement } from '@/types';

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

export const StudentAnnouncementsPage: React.FC = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
    const [showViewModal, setShowViewModal] = useState(false);

    useEffect(() => {
        fetchAnnouncements();

        // Subscribe to real-time updates
        const subscription = announcementService.subscribe((payload) => {
            console.log('Real-time update:', payload);
            if (payload.eventType === 'INSERT') {
                setAnnouncements(prev => [payload.new as Announcement, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
                setAnnouncements(prev => prev.map(a => a.id === payload.new.id ? payload.new as Announcement : a));
            } else if (payload.eventType === 'DELETE') {
                setAnnouncements(prev => prev.filter(a => a.id !== payload.old.id));
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchAnnouncements = async () => {
        try {
            setIsLoading(true);
            const data = await announcementService.getAll();
            setAnnouncements(data);
        } catch (error) {
            console.error('Error fetching announcements:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewAnnouncement = (announcement: Announcement) => {
        setSelectedAnnouncement(announcement);
        setShowViewModal(true);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* View Announcement Modal */}
            <Modal
                isOpen={showViewModal}
                onClose={() => {
                    setShowViewModal(false);
                    setSelectedAnnouncement(null);
                }}
                title="Announcement Details"
            >
                {selectedAnnouncement && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Badge
                                className={cn(
                                    getCategoryColor(selectedAnnouncement.category).bg,
                                    getCategoryColor(selectedAnnouncement.category).text
                                )}
                                size="sm"
                            >
                                {selectedAnnouncement.category.replace('_', ' ')}
                            </Badge>
                            {selectedAnnouncement.is_pinned && (
                                <Badge variant="primary" size="sm">
                                    <Pin className="w-3 h-3 mr-1" />
                                    Pinned
                                </Badge>
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-white">{selectedAnnouncement.title}</h2>
                        <div className="prose prose-invert max-w-none">
                            <p className="text-gray-300 whitespace-pre-wrap">{selectedAnnouncement.content}</p>
                        </div>
                        <div className="flex items-center gap-4 pt-4 border-t border-white/10 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatRelativeTime(selectedAnnouncement.created_at)}
                            </span>
                            {selectedAnnouncement.scheduled_at && (
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Scheduled: {new Date(selectedAnnouncement.scheduled_at).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                        <div className="flex justify-end mt-4 pt-4 border-t border-white/10">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setShowViewModal(false);
                                    setSelectedAnnouncement(null);
                                }}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            <div>
                <h1 className="text-2xl font-bold text-white">Announcements</h1>
                <p className="text-gray-400 mt-1">Stay updated with the latest course information</p>
            </div>

            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
            )}

            {!isLoading && (
                <div className="space-y-4">
                    {announcements.map((announcement, index) => {
                        const categoryColor = getCategoryColor(announcement.category);
                        return (
                            <motion.div
                                key={announcement.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card
                                    variant="hover"
                                    padding="md"
                                    className="cursor-pointer"
                                    onClick={() => handleViewAnnouncement(announcement)}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge className={cn(categoryColor.bg, categoryColor.text)} size="sm">
                                            {announcement.category.replace('_', ' ')}
                                        </Badge>
                                        {announcement.is_pinned && (
                                            <Badge variant="primary" size="sm">
                                                <Pin className="w-3 h-3 mr-1" />
                                                Pinned
                                            </Badge>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-semibold text-white hover:text-indigo-400 transition-colors">{announcement.title}</h3>
                                    <p className="text-gray-400 mt-2 line-clamp-2">{announcement.content}</p>
                                    <div className="flex items-center gap-1 mt-4 text-sm text-gray-500">
                                        <Clock className="w-4 h-4" />
                                        {formatRelativeTime(announcement.created_at)}
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {!isLoading && announcements.length === 0 && (
                <Card variant="default" padding="lg" className="text-center">
                    <Megaphone className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white">No announcements yet</h3>
                    <p className="text-gray-400 mt-1">Check back later for updates</p>
                </Card>
            )}
        </motion.div>
    );
};
