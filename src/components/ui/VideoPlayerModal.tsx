import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPlayerModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoUrl: string;
    title: string;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
    isOpen,
    onClose,
    videoUrl,
    title
}) => {
    // Helper to get embed URL
    const getEmbedUrl = (url: string) => {
        if (!url) return '';

        // Google Drive
        if (url.includes('drive.google.com')) {
            // Handle 'open?id=' style
            if (url.includes('open?id=')) {
                const id = url.split('open?id=')[1]?.split('&')[0];
                if (id) return `https://drive.google.com/file/d/${id}/preview`;
            }
            // Handle '/file/d/' style
            if (url.includes('/file/d/')) {
                const id = url.split('/file/d/')[1]?.split('/')[0];
                if (id) return `https://drive.google.com/file/d/${id}/preview`;
            }
        }

        // YouTube
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
            return `https://www.youtube.com/embed/${videoId}`;
        }

        return url;
    };

    const embedUrl = getEmbedUrl(videoUrl);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200]"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 0 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 0 }}
                        className="fixed inset-0 z-[201] flex items-center justify-center p-4 sm:p-6"
                        onClick={onClose}
                    >
                        {/* Player Container */}
                        <div
                            className="w-full max-w-5xl bg-[#0F0F11] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Decorative Glow */}
                            <div className="absolute -top-20 -left-20 w-40 h-40 bg-indigo-500/20 blur-[100px] pointer-events-none" />
                            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-purple-500/20 blur-[100px] pointer-events-none" />

                            {/* Header */}
                            <div className="relative flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/40 backdrop-blur-sm z-10">
                                <div className="flex-1 min-w-0 flex justify-center">
                                    <h3 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent truncate text-center">
                                        {title}
                                    </h3>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="absolute right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-white border border-white/5 hover:border-white/20 hover:scale-105"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Video Area */}
                            <div className="relative aspect-video bg-black flex items-center justify-center group z-0">
                                {embedUrl ? (
                                    <iframe
                                        src={embedUrl}
                                        className="w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        title={title}
                                    />
                                ) : (
                                    <div className="text-center p-8">
                                        <AlertCircle className="w-12 h-12 text-red-500/80 mx-auto mb-4" />
                                        <p className="text-gray-400 text-lg">Invalid/Private Video URL</p>
                                        <p className="text-gray-500 text-sm mt-2">Check if the link is public</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
