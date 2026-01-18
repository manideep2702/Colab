import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge, Button } from '@/components/ui';
import { FolderKanban, Plus, Calendar, Users, Github, ExternalLink, X, Loader2, Trash2 } from 'lucide-react';
import { cn, getModuleColor, formatDate } from '@/lib/utils';
import { projectService } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import type { Project, CurriculumModule } from '@/types';

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
                    className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#09090b] ring-1 ring-white/10 rounded-2xl p-6 z-[101] shadow-2xl max-h-[90vh] overflow-y-auto"
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

export const ProjectsPage: React.FC = () => {
    const { user } = useAuthStore();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newProject, setNewProject] = useState({
        title: '',
        description: '',
        module: 'python' as CurriculumModule,
        deadline: '',
        requirements: '',
    });

    // Fetch projects on mount
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

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            setIsSubmitting(true);
            await projectService.create({
                title: newProject.title,
                description: newProject.description,
                module: newProject.module,
                deadline: newProject.deadline || undefined,
                requirements: newProject.requirements || undefined,
                admin_id: user.id,
            });

            setShowCreateModal(false);
            setNewProject({ title: '', description: '', module: 'python', deadline: '', requirements: '' });
        } catch (error) {
            console.error('Error creating project:', error);
            alert('Failed to create project. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProject = async (id: string) => {
        if (!confirm('Are you sure you want to delete this project?')) return;

        try {
            await projectService.delete(id);
        } catch (error) {
            console.error('Error deleting project:', error);
            alert('Failed to delete project. Please try again.');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* Create Project Modal */}
            <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Project">
                <form onSubmit={handleCreateProject} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Project Title</label>
                        <input
                            type="text"
                            value={newProject.title}
                            onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="e.g., Data Analysis with Pandas"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                        <textarea
                            value={newProject.description}
                            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                            placeholder="Describe the project objectives..."
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Module</label>
                            <select
                                value={newProject.module}
                                onChange={(e) => setNewProject({ ...newProject, module: e.target.value as CurriculumModule })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            >
                                <option value="python">Python</option>
                                <option value="sql">SQL</option>
                                <option value="machine_learning">Machine Learning</option>
                                <option value="deep_learning">Deep Learning</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Deadline</label>
                            <input
                                type="datetime-local"
                                value={newProject.deadline}
                                onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors [color-scheme:dark]"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Requirements</label>
                        <textarea
                            value={newProject.requirements}
                            onChange={(e) => setNewProject({ ...newProject, requirements: e.target.value })}
                            rows={4}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                            placeholder="Detailed project requirements..."
                        />
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
                            {isSubmitting ? 'Creating...' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </Modal>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Projects</h1>
                    <p className="text-gray-400 mt-1">Manage project assignments and submissions</p>
                </div>
                <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>Create Project</Button>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
            )}

            {/* Projects List */}
            {!isLoading && (
                <div className="grid gap-4">
                    {projects.map((project, index) => {
                        const moduleColor = getModuleColor(project.module || 'python');

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
                                            <Button variant="secondary" size="sm">
                                                View Submissions
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                onClick={() => handleDeleteProject(project.id)}
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

            {!isLoading && projects.length === 0 && (
                <Card variant="default" padding="lg" className="text-center">
                    <FolderKanban className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white">No projects found</h3>
                    <p className="text-gray-400 mt-1">Create your first project to get started</p>
                </Card>
            )}
        </motion.div>
    );
};
