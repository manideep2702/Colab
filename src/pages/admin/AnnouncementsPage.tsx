import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input } from '@/components/ui';
import {
    Megaphone,
    Plus,
    Search,
    Pin,
    Clock,
    Edit,
    Trash2,
    MoreVertical,
    Filter,
    Calendar,
    X,
    Loader2,
} from 'lucide-react';
import { cn, formatRelativeTime, getCategoryColor } from '@/lib/utils';
import { announcementService } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import type { Announcement, AnnouncementCategory } from '@/types';

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

const categories: { value: AnnouncementCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'general', label: 'General' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'course_update', label: 'Course Update' },
    { value: 'assignment', label: 'Assignment' },
    { value: 'event', label: 'Event' },
];

export const AnnouncementsPage: React.FC = () => {
    const { user } = useAuthStore();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<AnnouncementCategory | 'all'>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [newAnnouncement, setNewAnnouncement] = useState({
        title: '',
        content: '',
        category: 'general' as AnnouncementCategory,
        is_pinned: false,
    });
    const [editAnnouncement, setEditAnnouncement] = useState({
        id: '',
        title: '',
        content: '',
        category: 'general' as AnnouncementCategory,
        is_pinned: false,
    });

    const handleViewAnnouncement = (announcement: Announcement) => {
        setSelectedAnnouncement(announcement);
        setShowViewModal(true);
    };

    const handleOpenEditModal = (announcement: Announcement) => {
        setEditAnnouncement({
            id: announcement.id,
            title: announcement.title,
            content: announcement.content,
            category: announcement.category,
            is_pinned: announcement.is_pinned,
        });
        setShowEditModal(true);
    };

    // Fetch announcements on mount
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

    const filteredAnnouncements = announcements.filter(a => {
        const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'all' || a.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const pinnedAnnouncements = filteredAnnouncements.filter(a => a.is_pinned);
    const regularAnnouncements = filteredAnnouncements.filter(a => !a.is_pinned);

    const handleCreateAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            setIsSubmitting(true);
            const created = await announcementService.create({
                title: newAnnouncement.title,
                content: newAnnouncement.content,
                category: newAnnouncement.category,
                is_pinned: newAnnouncement.is_pinned,
                admin_id: user.id,
            });

            // Manually update local state as fallback
            setAnnouncements(prev => [created, ...prev]);
            setShowCreateModal(false);
            setNewAnnouncement({ title: '', content: '', category: 'general', is_pinned: false });
        } catch (error: any) {
            console.error('Error creating announcement:', error);
            const errorMessage = error?.message || error?.error_description || 'Unknown error';
            alert(`Failed to create announcement: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAnnouncement = async (id: string) => {
        if (!confirm('Are you sure you want to delete this announcement?')) return;

        try {
            setIsDeleting(true);
            await announcementService.delete(id);
            // Manually update local state as fallback (real-time may also update)
            setAnnouncements(prev => prev.filter(a => a.id !== id));
            // Close view modal if open
            if (showViewModal && selectedAnnouncement?.id === id) {
                setShowViewModal(false);
                setSelectedAnnouncement(null);
            }
        } catch (error: any) {
            console.error('Error deleting announcement:', error);
            const errorMessage = error?.message || error?.error_description || 'Unknown error';
            alert(`Failed to delete announcement: ${errorMessage}`);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEditAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editAnnouncement.id) return;

        try {
            setIsSubmitting(true);
            const updated = await announcementService.update(editAnnouncement.id, {
                title: editAnnouncement.title,
                content: editAnnouncement.content,
                category: editAnnouncement.category,
                is_pinned: editAnnouncement.is_pinned,
            });

            // Manually update local state as fallback
            setAnnouncements(prev => prev.map(a => a.id === editAnnouncement.id ? { ...a, ...updated } : a));
            setShowEditModal(false);
            setEditAnnouncement({ id: '', title: '', content: '', category: 'general', is_pinned: false });
        } catch (error: any) {
            console.error('Error updating announcement:', error);
            const errorMessage = error?.message || error?.error_description || 'Unknown error';
            alert(`Failed to update announcement: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* Create Announcement Modal */}
            <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Announcement">
                <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Title</label>
                        <input
                            type="text"
                            value={newAnnouncement.title}
                            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="Announcement title"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Content</label>
                        <textarea
                            value={newAnnouncement.content}
                            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                            rows={4}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                            placeholder="Write your announcement..."
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                        <select
                            value={newAnnouncement.category}
                            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, category: e.target.value as AnnouncementCategory })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                        >
                            <option value="general">General</option>
                            <option value="urgent">Urgent</option>
                            <option value="course_update">Course Update</option>
                            <option value="assignment">Assignment</option>
                            <option value="event">Event</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="pinned"
                            checked={newAnnouncement.is_pinned}
                            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, is_pinned: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-indigo-500 focus:ring-indigo-500"
                        />
                        <label htmlFor="pinned" className="text-sm text-gray-400">Pin this announcement</label>
                    </div>
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                        <button
                            type="button"
                            onClick={() => setShowCreateModal(false)}
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
                            {isSubmitting ? 'Creating...' : 'Create Announcement'}
                        </button>
                    </div>
                </form>
            </Modal>

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
                        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/10">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                disabled={isDeleting}
                                onClick={() => {
                                    handleDeleteAnnouncement(selectedAnnouncement.id);
                                }}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    handleOpenEditModal(selectedAnnouncement);
                                    setShowViewModal(false);
                                }}
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                            </Button>
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

            {/* Edit Announcement Modal */}
            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Announcement">
                <form onSubmit={handleEditAnnouncement} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Title</label>
                        <input
                            type="text"
                            value={editAnnouncement.title}
                            onChange={(e) => setEditAnnouncement({ ...editAnnouncement, title: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="Announcement title"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Content</label>
                        <textarea
                            value={editAnnouncement.content}
                            onChange={(e) => setEditAnnouncement({ ...editAnnouncement, content: e.target.value })}
                            rows={4}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                            placeholder="Write your announcement..."
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                        <select
                            value={editAnnouncement.category}
                            onChange={(e) => setEditAnnouncement({ ...editAnnouncement, category: e.target.value as AnnouncementCategory })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                        >
                            <option value="general">General</option>
                            <option value="urgent">Urgent</option>
                            <option value="course_update">Course Update</option>
                            <option value="assignment">Assignment</option>
                            <option value="event">Event</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="edit-pinned"
                            checked={editAnnouncement.is_pinned}
                            onChange={(e) => setEditAnnouncement({ ...editAnnouncement, is_pinned: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-indigo-500 focus:ring-indigo-500"
                        />
                        <label htmlFor="edit-pinned" className="text-sm text-gray-400">Pin this announcement</label>
                    </div>
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                        <button
                            type="button"
                            onClick={() => setShowEditModal(false)}
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
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Announcements</h1>
                    <p className="text-gray-400 mt-1">Manage and publish announcements to students</p>
                </div>
                <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
                    Create Announcement
                </Button>
            </div>

            {/* Filters */}
            <Card variant="default" padding="md">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search announcements..."
                            leftIcon={<Search className="w-4 h-4" />}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                        {categories.map((category) => (
                            <button
                                key={category.value}
                                onClick={() => setActiveCategory(category.value)}
                                className={cn(
                                    'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                                    activeCategory === category.value
                                        ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                                        : 'bg-gray-800/50 text-gray-400 border border-gray-800 hover:bg-gray-800'
                                )}
                            >
                                {category.label}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
            )}

            {/* Pinned Announcements */}
            {!isLoading && pinnedAnnouncements.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                        <Pin className="w-4 h-4" />
                        Pinned Announcements
                    </h2>
                    {pinnedAnnouncements.map((announcement, index) => (
                        <AnnouncementCard
                            key={announcement.id}
                            announcement={announcement}
                            delay={index * 0.1}
                            onDelete={handleDeleteAnnouncement}
                            onEdit={handleOpenEditModal}
                            onClick={() => handleViewAnnouncement(announcement)}
                        />
                    ))}
                </div>
            )}

            {/* All Announcements */}
            {!isLoading && (
                <div className="space-y-4">
                    <h2 className="text-sm font-medium text-gray-400">
                        All Announcements ({regularAnnouncements.length})
                    </h2>
                    {regularAnnouncements.map((announcement, index) => (
                        <AnnouncementCard
                            key={announcement.id}
                            announcement={announcement}
                            delay={(pinnedAnnouncements.length + index) * 0.1}
                            onDelete={handleDeleteAnnouncement}
                            onEdit={handleOpenEditModal}
                            onClick={() => handleViewAnnouncement(announcement)}
                        />
                    ))}
                </div>
            )}

            {!isLoading && filteredAnnouncements.length === 0 && (
                <Card variant="default" padding="lg" className="text-center">
                    <Megaphone className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white">No announcements found</h3>
                    <p className="text-gray-400 mt-1">
                        {announcements.length === 0
                            ? 'Create your first announcement to get started'
                            : 'Try adjusting your search or filters'}
                    </p>
                </Card>
            )}
        </motion.div>
    );
};

interface AnnouncementCardProps {
    announcement: Announcement;
    delay?: number;
    onDelete: (id: string) => void;
    onEdit: (announcement: Announcement) => void;
    onClick: () => void;
}

const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ announcement, delay = 0, onDelete, onEdit, onClick }) => {
    const categoryColor = getCategoryColor(announcement.category);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
        >
            <Card variant="hover" padding="md" className="cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1" onClick={onClick}>
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
                        <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatRelativeTime(announcement.created_at)}
                            </span>
                            {announcement.scheduled_at && (
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Scheduled
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="p-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(announcement);
                            }}
                        >
                            <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(announcement.id);
                            }}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};
