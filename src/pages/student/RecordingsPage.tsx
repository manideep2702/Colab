import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, Badge, Button, Progress, VideoPlayerModal } from '@/components/ui';
import { Video, Play, Clock, CheckCircle2, PlayCircle, Loader2 } from 'lucide-react';
import { cn, getModuleColor, formatDuration } from '@/lib/utils';
import { recordingService } from '@/services/api';
import type { Recording } from '@/types';

export const StudentRecordingsPage: React.FC = () => {
    const [recordings, setRecordings] = useState<Recording[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [playingRecording, setPlayingRecording] = useState<Recording | null>(null);

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

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            <VideoPlayerModal
                isOpen={!!playingRecording}
                onClose={() => setPlayingRecording(null)}
                videoUrl={playingRecording?.video_url || ''}
                title={playingRecording?.title || ''}
            />

            <div>
                <h1 className="text-2xl font-bold text-white">Recordings</h1>
                <p className="text-gray-400 mt-1">Watch lecture recordings and track your progress</p>
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
                                <Card
                                    variant="hover"
                                    padding="none"
                                    className="group overflow-hidden cursor-pointer"
                                    onClick={() => setPlayingRecording(recording)}
                                >
                                    {/* Thumbnail */}
                                    <div className="relative h-40 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center overflow-hidden">
                                        {recording.thumbnail_url ? (
                                            <img
                                                src={recording.thumbnail_url}
                                                alt={recording.title}
                                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className={cn('w-16 h-16 rounded-xl flex items-center justify-center', moduleColor.bg)}>
                                                <Video className={cn('w-8 h-8', moduleColor.text)} />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                            <div className="transform scale-90 group-hover:scale-100 transition-transform duration-300">
                                                <PlayCircle className="w-16 h-16 text-white drop-shadow-lg" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="p-4">
                                        <Badge className={cn(moduleColor.bg, moduleColor.text, moduleColor.border)} size="sm">
                                            {(recording.module || 'python').replace('_', ' ')}
                                        </Badge>
                                        <h3 className="font-semibold text-white mt-2 line-clamp-1 group-hover:text-indigo-400 transition-colors">{recording.title}</h3>
                                        <p className="text-gray-400 text-sm mt-1 line-clamp-2">{recording.description}</p>
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
                    <h3 className="text-lg font-medium text-white">No recordings available</h3>
                    <p className="text-gray-400 mt-1">Check back later for new lecture recordings</p>
                </Card>
            )}
        </motion.div>
    );
};
