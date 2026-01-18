import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, Badge, Button, Progress } from '@/components/ui';
import { FolderKanban, Calendar, Upload, CheckCircle2, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { cn, getModuleColor, formatDate, getStatusColor } from '@/lib/utils';
import { projectService } from '@/services/api';
import type { Project } from '@/types';

export const StudentProjectsPage: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchProjects();

        // Subscribe to real-time updates
        const subscription = projectService.subscribe((payload) => {
            console.log('Real-time update:', payload);
            if (payload.eventType === 'INSERT') {
                setProjects(prev => [payload.new as Project, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
                setProjects(prev => prev.map(p => p.id === payload.new.id ? payload.new as Project : p));
            } else if (payload.eventType === 'DELETE') {
                setProjects(prev => prev.filter(p => p.id !== payload.old.id));
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchProjects = async () => {
        try {
            setIsLoading(true);
            const data = await projectService.getAll();
            setProjects(data);
        } catch (error) {
            console.error('Error fetching projects:', error);
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
            <div>
                <h1 className="text-2xl font-bold text-white">Projects</h1>
                <p className="text-gray-400 mt-1">Work on projects and track your submissions</p>
            </div>

            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
            )}

            {!isLoading && (
                <div className="space-y-4">
                    {projects.map((project, index) => {
                        const moduleColor = getModuleColor(project.module || 'python');
                        const isOverdue = project.deadline ? new Date(project.deadline) < new Date() : false;

                        return (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card variant="hover" padding="md">
                                    <div className="flex items-start gap-4">
                                        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', moduleColor.bg)}>
                                            <FolderKanban className={cn('w-6 h-6', moduleColor.text)} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge className={cn(moduleColor.bg, moduleColor.text, moduleColor.border)} size="sm">
                                                    {(project.module || 'python').replace('_', ' ')}
                                                </Badge>
                                                {isOverdue && (
                                                    <Badge variant="danger" size="sm">
                                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                                        Overdue
                                                    </Badge>
                                                )}
                                            </div>
                                            <h3 className="text-lg font-semibold text-white">{project.title}</h3>
                                            <p className="text-gray-400 text-sm mt-1">{project.description}</p>
                                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                                {project.deadline && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        Due: {formatDate(project.deadline)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" leftIcon={<Upload className="w-4 h-4" />}>
                                                Submit
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {!isLoading && projects.length === 0 && (
                <Card variant="default" padding="lg" className="text-center">
                    <FolderKanban className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white">No projects available</h3>
                    <p className="text-gray-400 mt-1">Check back later for new project assignments</p>
                </Card>
            )}
        </motion.div>
    );
};
