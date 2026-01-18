import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Search,
    Download,
    Mail,
    MoreVertical,
    UserPlus,
    TrendingUp,
    TrendingDown,
    Clock,
    CheckCircle,
    XCircle,
    X,
    GraduationCap,
    BarChart3,
    Eye,
    Loader2,
    FileCheck,
    Trophy,
} from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { profileService, assessmentService } from '@/services/api';
import type { AssessmentSubmission } from '@/types';

// Modal Component
const Modal = ({ isOpen, onClose, title, children, size = 'md' }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'md' | 'lg' | 'xl' }) => (
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
                    className={cn(
                        "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#09090b] ring-1 ring-white/10 rounded-2xl p-6 z-[101] shadow-2xl max-h-[90vh] overflow-y-auto",
                        size === 'md' && 'w-full max-w-lg',
                        size === 'lg' && 'w-full max-w-2xl',
                        size === 'xl' && 'w-full max-w-4xl'
                    )}
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

interface Student {
    id: string;
    name: string;
    email: string;
    role: string;
    created_at: string;
    updated_at: string;
    module?: string;
    progress?: number;
    status?: string;
    submissions?: AssessmentSubmission[];
}

export const StudentsPage: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [studentSubmissions, setStudentSubmissions] = useState<AssessmentSubmission[]>([]);
    const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
    const [newStudent, setNewStudent] = useState({ name: '', email: '', module: 'python' });

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            setIsLoading(true);
            const data = await profileService.getAllStudents();
            setStudents(data.map(student => ({
                ...student,
                progress: Math.floor(Math.random() * 100), // Placeholder - would be calculated from submissions
                status: 'active', // Placeholder
            })));
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const viewStudent = async (student: Student) => {
        setSelectedStudent(student);
        setShowViewModal(true);
        setIsLoadingSubmissions(true);

        try {
            const submissions = await assessmentService.getStudentSubmissions(student.id);
            setStudentSubmissions(submissions);
        } catch (error) {
            console.error('Error fetching student submissions:', error);
            setStudentSubmissions([]);
        } finally {
            setIsLoadingSubmissions(false);
        }
    };

    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === 'all' || student.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const handleAddStudent = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Adding student:', newStudent);
        setShowAddModal(false);
        setNewStudent({ name: '', email: '', module: 'python' });
    };

    // Calculate stats
    const stats = [
        { label: 'Total Students', value: students.length.toString(), change: '+12%', trend: 'up', icon: Users },
        { label: 'Active This Week', value: students.length.toString(), change: '+5%', trend: 'up', icon: TrendingUp },
        { label: 'Avg. Progress', value: students.length > 0 ? `${Math.round(students.reduce((sum, s) => sum + (s.progress || 0), 0) / students.length)}%` : '0%', change: '+8%', trend: 'up', icon: BarChart3 },
        { label: 'At Risk', value: '0', change: '-2', trend: 'down', icon: Clock },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Students</h1>
                    <p className="text-gray-400 text-sm mt-1">Manage and monitor student progress</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-sm font-medium transition-colors">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/25"
                    >
                        <UserPlus className="w-4 h-4" />
                        Add Student
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 border border-white/10 rounded-xl p-5"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                                <stat.icon className="w-5 h-5 text-indigo-400" />
                            </div>
                            <span className={cn(
                                'text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1',
                                stat.trend === 'up' ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'
                            )}>
                                {stat.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {stat.change}
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                        <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search students..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                </div>
                <div className="flex gap-3">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer min-w-[140px]"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="at_risk">At Risk</option>
                    </select>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
            )}

            {/* Students Table */}
            {!isLoading && (
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Student</th>
                                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Joined</th>
                                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Status</th>
                                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
                                                    {student.name?.split(' ').map(n => n[0]).join('') || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{student.name || 'Unknown'}</p>
                                                    <p className="text-xs text-gray-500">{student.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-400">
                                                {student.created_at ? formatRelativeTime(student.created_at) : 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                                                student.status === 'active' && 'bg-emerald-500/10 text-emerald-400',
                                                student.status === 'inactive' && 'bg-gray-500/10 text-gray-400',
                                                student.status === 'at_risk' && 'bg-red-500/10 text-red-400'
                                            )}>
                                                {student.status === 'active' && <CheckCircle className="w-3 h-3" />}
                                                {student.status === 'inactive' && <Clock className="w-3 h-3" />}
                                                {student.status === 'at_risk' && <XCircle className="w-3 h-3" />}
                                                {student.status?.replace('_', ' ') || 'active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => viewStudent(student)}
                                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                                                    <Mail className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredStudents.length === 0 && (
                        <div className="text-center py-12">
                            <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-white">No students found</h3>
                            <p className="text-gray-400 mt-1">
                                {students.length === 0 ? 'Students will appear here once they register' : 'Try adjusting your search'}
                            </p>
                        </div>
                    )}

                    {/* Pagination */}
                    {filteredStudents.length > 0 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
                            <p className="text-sm text-gray-500">Showing {filteredStudents.length} of {students.length} students</p>
                            <div className="flex items-center gap-2">
                                <button className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">Previous</button>
                                <button className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg">1</button>
                                <button className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">Next</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* View Student Modal */}
            <Modal isOpen={showViewModal} onClose={() => { setShowViewModal(false); setSelectedStudent(null); }} title="Student Details" size="lg">
                {selectedStudent && (
                    <div className="space-y-6">
                        {/* Student Info */}
                        <div className="flex items-center gap-4 pb-4 border-b border-white/10">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xl">
                                {selectedStudent.name?.split(' ').map(n => n[0]).join('') || '?'}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">{selectedStudent.name}</h3>
                                <p className="text-gray-400">{selectedStudent.email}</p>
                                <p className="text-sm text-gray-500">Joined {selectedStudent.created_at ? formatRelativeTime(selectedStudent.created_at) : 'N/A'}</p>
                            </div>
                        </div>

                        {/* Assessment Submissions */}
                        <div>
                            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <FileCheck className="w-5 h-5 text-indigo-400" />
                                Assessment Submissions ({studentSubmissions.length})
                            </h4>

                            {isLoadingSubmissions ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                                </div>
                            ) : studentSubmissions.length > 0 ? (
                                <div className="space-y-3 max-h-80 overflow-y-auto">
                                    {studentSubmissions.map((submission) => {
                                        const assessment = submission.assessment as any;
                                        const passed = (submission.score || 0) >= (assessment?.passing_score || 70);

                                        return (
                                            <div
                                                key={submission.id}
                                                className={cn(
                                                    "p-4 rounded-xl border-l-4",
                                                    passed ? "bg-emerald-500/10 border-l-emerald-500" : "bg-red-500/10 border-l-red-500"
                                                )}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h5 className="font-medium text-white">{assessment?.title || 'Assessment'}</h5>
                                                        <p className="text-sm text-gray-400">
                                                            Submitted {submission.submitted_at ? formatRelativeTime(submission.submitted_at) : 'recently'}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "text-2xl font-bold",
                                                            passed ? "text-emerald-400" : "text-red-400"
                                                        )}>
                                                            {submission.score || 0}%
                                                        </div>
                                                        {passed ? (
                                                            <Trophy className="w-6 h-6 text-emerald-400" />
                                                        ) : (
                                                            <XCircle className="w-6 h-6 text-red-400" />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* AI Feedback Summary */}
                                                {submission.ai_feedback && (
                                                    <div className="mt-3 pt-3 border-t border-white/10">
                                                        <p className="text-sm text-gray-400">
                                                            <span className="text-indigo-400">AI Feedback:</span> {(submission.ai_feedback as any)?.overall_feedback?.slice(0, 100)}...
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-white/5 rounded-xl">
                                    <FileCheck className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                                    <p className="text-gray-400">No assessments completed yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Add Student Modal */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Student">
                <form onSubmit={handleAddStudent} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                        <input
                            type="text"
                            value={newStudent.name}
                            onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="Enter student name"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                        <input
                            type="email"
                            value={newStudent.email}
                            onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="student@email.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Starting Module</label>
                        <select
                            value={newStudent.module}
                            onChange={(e) => setNewStudent({ ...newStudent, module: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                        >
                            <option value="python">Python Basics</option>
                            <option value="sql">SQL Mastery</option>
                            <option value="statistics">Statistics</option>
                            <option value="ml">Machine Learning</option>
                            <option value="dl">Deep Learning</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                        <button
                            type="button"
                            onClick={() => setShowAddModal(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/25"
                        >
                            Add Student
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
