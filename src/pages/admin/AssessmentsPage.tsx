import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge, Button, Input } from '@/components/ui';
import {
    FileCheck,
    Plus,
    Search,
    Clock,
    Calendar,
    Sparkles,
    Eye,
    Edit,
    Trash2,
    CheckCircle2,
    BarChart2,
    X,
    Code as CodeIcon,
    Loader2,
    GripVertical,
    Copy,
    ListChecks,
    AlignLeft,
    ToggleLeft,
    HelpCircle,
    Save,
    ArrowLeft,
    Users,
    Trophy,
    XCircle,
    Upload,
} from 'lucide-react';
import { cn, formatDate, getModuleColor, formatRelativeTime } from '@/lib/utils';
import { assessmentService, codingChallengeService } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import type { Assessment, AssessmentType, CurriculumModule, Question, CodingChallenge, ChallengeTestCase, CodingSubmission } from '@/types';
import { DocumentUploadModal } from '@/components/admin/DocumentUploadModal';
import type { ParsedAssessment, ParsedCodingChallenge } from '@/services/DocumentParserService';

// Modal Component
const Modal = ({ isOpen, onClose, title, children, size = 'md' }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' }) => (
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
                        size === 'sm' && 'w-full max-w-md',
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

// Question Type Icons
const questionTypeIcons: Record<string, any> = {
    mcq: ListChecks,
    short_answer: AlignLeft,
    long_answer: AlignLeft,
    true_false: ToggleLeft,
    coding: FileCheck,
};

const questionTypeLabels: Record<string, string> = {
    mcq: 'Multiple Choice',
    short_answer: 'Short Answer',
    long_answer: 'Long Answer',
    true_false: 'True/False',
    coding: 'Coding Challenge',
};

// Test Case Type
interface TestCase {
    id: string;
    input: string;
    expected_output: string;
    is_hidden?: boolean;
    description?: string;
}

// Question Builder Component
const QuestionBuilder = ({
    questions,
    setQuestions
}: {
    questions: Question[];
    setQuestions: (q: Question[]) => void;
}) => {
    const addQuestion = (type: Question['type']) => {
        const newQuestion: Question = {
            id: `q_${Date.now()}`,
            type,
            content: '',
            options: type === 'mcq' ? ['', '', '', ''] : type === 'true_false' ? ['True', 'False'] : undefined,
            correct_answer: type === 'true_false' ? 'True' : '',
            points: type === 'coding' ? 10 : 1,
            coding_language: type === 'coding' ? 'python' : undefined,
            test_cases: type === 'coding' ? [
                { id: `tc_${Date.now()}`, input: '', expected_output: '', is_hidden: false, description: 'Sample test case' }
            ] : undefined,
        };
        setQuestions([...questions, newQuestion]);
    };

    const addTestCase = (questionId: string) => {
        const question = questions.find(q => q.id === questionId);
        if (question && question.test_cases) {
            const newTestCase: TestCase = {
                id: `tc_${Date.now()}`,
                input: '',
                expected_output: '',
                is_hidden: false,
            };
            updateQuestion(questionId, { test_cases: [...question.test_cases, newTestCase] as any });
        }
    };

    const updateTestCase = (questionId: string, testCaseId: string, updates: Partial<TestCase>) => {
        const question = questions.find(q => q.id === questionId);
        if (question && question.test_cases) {
            const newTestCases = question.test_cases.map(tc =>
                (tc as any).id === testCaseId ? { ...tc, ...updates } : tc
            );
            updateQuestion(questionId, { test_cases: newTestCases as any });
        }
    };

    const removeTestCase = (questionId: string, testCaseId: string) => {
        const question = questions.find(q => q.id === questionId);
        if (question && question.test_cases && question.test_cases.length > 1) {
            const newTestCases = question.test_cases.filter(tc => (tc as any).id !== testCaseId);
            updateQuestion(questionId, { test_cases: newTestCases });
        }
    };

    const updateQuestion = (id: string, updates: Partial<Question>) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
    };

    const removeQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const duplicateQuestion = (question: Question) => {
        const newQuestion = { ...question, id: `q_${Date.now()}` };
        const index = questions.findIndex(q => q.id === question.id);
        const newQuestions = [...questions];
        newQuestions.splice(index + 1, 0, newQuestion);
        setQuestions(newQuestions);
    };

    const updateOption = (questionId: string, optionIndex: number, value: string) => {
        const question = questions.find(q => q.id === questionId);
        if (question && question.options) {
            const newOptions = [...question.options];
            newOptions[optionIndex] = value;
            updateQuestion(questionId, { options: newOptions });
        }
    };

    const addOption = (questionId: string) => {
        const question = questions.find(q => q.id === questionId);
        if (question && question.options) {
            updateQuestion(questionId, { options: [...question.options, ''] });
        }
    };

    const removeOption = (questionId: string, optionIndex: number) => {
        const question = questions.find(q => q.id === questionId);
        if (question && question.options && question.options.length > 2) {
            const newOptions = question.options.filter((_, i) => i !== optionIndex);
            updateQuestion(questionId, { options: newOptions });
        }
    };

    return (
        <div className="space-y-6">
            {/* Add Question Buttons */}
            <div className="flex flex-wrap gap-2">
                <p className="w-full text-sm text-gray-400 mb-2">Add Question:</p>
                {(['mcq', 'short_answer', 'long_answer', 'true_false', 'coding'] as const).map(type => {
                    const Icon = questionTypeIcons[type];
                    return (
                        <button
                            key={type}
                            onClick={() => addQuestion(type)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors",
                                type === 'coding'
                                    ? "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400"
                                    : "bg-white/5 hover:bg-white/10 border-white/10 text-gray-300"
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {questionTypeLabels[type]}
                        </button>
                    );
                })}
            </div>

            {/* Questions List */}
            <div className="space-y-4">
                {questions.map((question, index) => {
                    const Icon = questionTypeIcons[question.type];
                    return (
                        <motion.div
                            key={question.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/5 border border-white/10 rounded-xl p-4"
                        >
                            {/* Question Header */}
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400">
                                        <span className="text-sm font-bold">{index + 1}</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-md">
                                        <Icon className="w-3 h-3 text-gray-400" />
                                        <span className="text-xs text-gray-400">{questionTypeLabels[question.type]}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs text-gray-500">Points:</label>
                                        <input
                                            type="number"
                                            value={question.points}
                                            onChange={(e) => updateQuestion(question.id, { points: parseInt(e.target.value) || 1 })}
                                            className="w-16 px-2 py-1 bg-white/5 border border-white/10 rounded text-sm text-white text-center"
                                            min={1}
                                            max={100}
                                        />
                                    </div>
                                    <button
                                        onClick={() => duplicateQuestion(question)}
                                        className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                                        title="Duplicate"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => removeQuestion(question.id)}
                                        className="p-1.5 hover:bg-red-500/10 rounded text-gray-400 hover:text-red-400 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Question Content */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Question</label>
                                    <textarea
                                        value={question.content}
                                        onChange={(e) => updateQuestion(question.id, { content: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 resize-none"
                                        placeholder="Enter your question..."
                                        rows={2}
                                    />
                                </div>

                                {/* MCQ Options */}
                                {question.type === 'mcq' && question.options && (
                                    <div className="space-y-2">
                                        <label className="block text-sm text-gray-400">Options (select correct answer)</label>
                                        {question.options.map((option, optIndex) => (
                                            <div key={optIndex} className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name={`correct_${question.id}`}
                                                    checked={question.correct_answer === option && option !== ''}
                                                    onChange={() => updateQuestion(question.id, { correct_answer: option })}
                                                    className="w-4 h-4 text-indigo-500 bg-gray-800 border-gray-600"
                                                />
                                                <input
                                                    type="text"
                                                    value={option}
                                                    onChange={(e) => updateOption(question.id, optIndex, e.target.value)}
                                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500"
                                                    placeholder={`Option ${optIndex + 1}`}
                                                />
                                                {question.options!.length > 2 && (
                                                    <button
                                                        onClick={() => removeOption(question.id, optIndex)}
                                                        className="p-1.5 hover:bg-red-500/10 rounded text-gray-400 hover:text-red-400"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => addOption(question.id)}
                                            className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" /> Add option
                                        </button>
                                    </div>
                                )}

                                {/* True/False */}
                                {question.type === 'true_false' && (
                                    <div className="space-y-2">
                                        <label className="block text-sm text-gray-400">Correct Answer</label>
                                        <div className="flex gap-4">
                                            {['True', 'False'].map(val => (
                                                <label key={val} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name={`tf_${question.id}`}
                                                        checked={question.correct_answer === val}
                                                        onChange={() => updateQuestion(question.id, { correct_answer: val })}
                                                        className="w-4 h-4 text-indigo-500 bg-gray-800 border-gray-600"
                                                    />
                                                    <span className="text-white">{val}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Short/Long Answer */}
                                {(question.type === 'short_answer' || question.type === 'long_answer') && (
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Expected Answer (for AI grading reference)</label>
                                        <textarea
                                            value={question.correct_answer || ''}
                                            onChange={(e) => updateQuestion(question.id, { correct_answer: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 resize-none"
                                            placeholder="Enter the expected answer or key points..."
                                            rows={question.type === 'long_answer' ? 4 : 2}
                                        />
                                    </div>
                                )}

                                {/* Coding Challenge */}
                                {question.type === 'coding' && (
                                    <div className="space-y-4">
                                        {/* Language Selection */}
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1">
                                                <label className="block text-sm text-gray-400 mb-2">Programming Language</label>
                                                <select
                                                    value={question.coding_language || 'python'}
                                                    onChange={(e) => updateQuestion(question.id, { coding_language: e.target.value as 'python' | 'sql' })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                                                >
                                                    <option value="python" className="bg-gray-900">Python</option>
                                                    <option value="javascript" className="bg-gray-900">JavaScript</option>
                                                    <option value="java" className="bg-gray-900">Java</option>
                                                    <option value="cpp" className="bg-gray-900">C++</option>
                                                    <option value="c" className="bg-gray-900">C</option>
                                                </select>
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-sm text-gray-400 mb-2">Function Name (optional)</label>
                                                <input
                                                    type="text"
                                                    value={(question as any).function_name || ''}
                                                    onChange={(e) => updateQuestion(question.id, { function_name: e.target.value } as any)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                                                    placeholder="e.g., twoSum"
                                                />
                                            </div>
                                        </div>

                                        {/* Test Cases */}
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <label className="text-sm text-gray-400 flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                    Test Cases (like LeetCode/HackerRank)
                                                </label>
                                                <button
                                                    onClick={() => addTestCase(question.id)}
                                                    className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                                                >
                                                    <Plus className="w-3 h-3" /> Add Test Case
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                {(question.test_cases || []).map((tc: any, tcIndex: number) => (
                                                    <div key={tc.id} className="p-4 bg-black/30 border border-white/10 rounded-xl space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-medium text-white">
                                                                Test Case {tcIndex + 1}
                                                            </span>
                                                            <div className="flex items-center gap-3">
                                                                <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={tc.is_hidden || false}
                                                                        onChange={(e) => updateTestCase(question.id, tc.id, { is_hidden: e.target.checked })}
                                                                        className="w-3 h-3 rounded border-gray-600 bg-gray-800 text-indigo-500"
                                                                    />
                                                                    Hidden
                                                                </label>
                                                                {(question.test_cases?.length || 0) > 1 && (
                                                                    <button
                                                                        onClick={() => removeTestCase(question.id, tc.id)}
                                                                        className="p-1 hover:bg-red-500/10 rounded text-gray-400 hover:text-red-400"
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label className="block text-xs text-gray-500 mb-1">Description (optional)</label>
                                                            <input
                                                                type="text"
                                                                value={tc.description || ''}
                                                                onChange={(e) => updateTestCase(question.id, tc.id, { description: e.target.value })}
                                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                                                placeholder="e.g., Basic test case with small numbers"
                                                            />
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="block text-xs text-gray-500 mb-1">Input (stdin)</label>
                                                                <textarea
                                                                    value={tc.input}
                                                                    onChange={(e) => updateTestCase(question.id, tc.id, { input: e.target.value })}
                                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500 resize-none"
                                                                    placeholder="5&#10;1 2 3 4 5"
                                                                    rows={3}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs text-gray-500 mb-1">Expected Output</label>
                                                                <textarea
                                                                    value={tc.expected_output}
                                                                    onChange={(e) => updateTestCase(question.id, tc.id, { expected_output: e.target.value })}
                                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-emerald-400 font-mono focus:outline-none focus:border-indigo-500 resize-none"
                                                                    placeholder="15"
                                                                    rows={3}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Starter Code (optional) */}
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-2">Starter Code (optional)</label>
                                            <textarea
                                                value={question.correct_answer || ''}
                                                onChange={(e) => updateQuestion(question.id, { correct_answer: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 resize-none"
                                                placeholder="# Write the starter code template here..."
                                                rows={4}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {questions.length === 0 && (
                <div className="text-center py-12 bg-white/5 border border-dashed border-white/10 rounded-xl">
                    <HelpCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No questions added yet</p>
                    <p className="text-sm text-gray-500 mt-1">Click the buttons above to add questions</p>
                </div>
            )}

            {/* Summary */}
            {questions.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                    <div className="flex items-center gap-4">
                        <div className="text-sm">
                            <span className="text-gray-400">Total Questions:</span>
                            <span className="text-white font-bold ml-2">{questions.length}</span>
                        </div>
                        <div className="text-sm">
                            <span className="text-gray-400">Total Points:</span>
                            <span className="text-white font-bold ml-2">{questions.reduce((sum, q) => sum + q.points, 0)}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const AssessmentsPage: React.FC = () => {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'quizzes' | 'coding'>('quizzes');

    // Quiz States
    const [assessments, setAssessments] = useState<Assessment[]>([]);

    // Coding Challenge States
    const [codingChallenges, setCodingChallenges] = useState<CodingChallenge[]>([]);
    const [showCreateChallengeModal, setShowCreateChallengeModal] = useState(false);
    const [selectedChallenge, setSelectedChallenge] = useState<CodingChallenge | null>(null);
    const [showViewChallengeModal, setShowViewChallengeModal] = useState(false);
    const [codingSubmissions, setCodingSubmissions] = useState<CodingSubmission[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterModule, setFilterModule] = useState<CurriculumModule | 'all'>('all');
    const [showCreateModal, setShowCreateModal] = useState(false); // For Quizzes
    const [showViewModal, setShowViewModal] = useState(false); // For Quizzes
    const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
    const [viewTab, setViewTab] = useState<'details' | 'submissions'>('details');

    // Create Quiz form state
    const [newAssessment, setNewAssessment] = useState({
        title: '',
        description: '',
        type: 'weekly_test' as AssessmentType,
        module: 'python' as CurriculumModule,
        time_limit: 30,
        passing_score: 70,
        max_attempts: 1,
        ai_grading: true,
        due_date: '',
    });
    const [questions, setQuestions] = useState<Question[]>([]);
    const [createStep, setCreateStep] = useState<'details' | 'questions'>('details');

    // Create Coding Challenge form state
    const [newChallenge, setNewChallenge] = useState<{
        title: string;
        description: string;
        constraints: string;
        difficulty: 'easy' | 'medium' | 'hard';
        module: CurriculumModule;
        points: number;
        starter_code: Record<string, string>;
    }>({
        title: '',
        description: '',
        constraints: '',
        difficulty: 'medium',
        module: 'python',
        points: 100,
        starter_code: { python: "def solution():\n    pass" }
    });
    const [testCases, setTestCases] = useState<Partial<ChallengeTestCase>[]>([]);

    // Import modal state
    const [showImportModal, setShowImportModal] = useState(false);


    useEffect(() => {
        fetchAssessments();
        fetchCodingChallenges();

        const subscription = assessmentService.subscribe((payload) => {
            if (payload.eventType === 'INSERT') {
                setAssessments(prev => [payload.new as Assessment, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
                setAssessments(prev => prev.map(a => a.id === payload.new.id ? payload.new as Assessment : a));
            } else if (payload.eventType === 'DELETE') {
                setAssessments(prev => prev.filter(a => a.id !== payload.old.id));
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchAssessments = async () => {
        try {
            setIsLoading(true);
            const data = await assessmentService.getAll();
            setAssessments(data);
        } catch (error) {
            console.error('Error fetching assessments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCodingChallenges = async () => {
        try {
            const data = await codingChallengeService.getAll();
            setCodingChallenges(data);
        } catch (error) {
            console.error('Error fetching coding challenges:', error);
        }
    };

    const filteredAssessments = assessments.filter(a => {
        const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesModule = filterModule === 'all' || a.module === filterModule;
        return matchesSearch && matchesModule;
    });

    const filteredChallenges = codingChallenges.filter(c => {
        const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesModule = filterModule === 'all' || c.module === filterModule;
        return matchesSearch && matchesModule;
    });

    const handleCreateAssessment = async () => {
        if (!user) return;
        if (questions.length === 0) {
            alert('Please add at least one question');
            return;
        }

        try {
            setIsSubmitting(true);
            await assessmentService.create({
                title: newAssessment.title,
                description: newAssessment.description,
                type: newAssessment.type,
                module: newAssessment.module,
                time_limit: newAssessment.time_limit,
                passing_score: newAssessment.passing_score,
                max_attempts: newAssessment.max_attempts,
                ai_grading_enabled: newAssessment.ai_grading,
                due_date: newAssessment.due_date ? new Date(newAssessment.due_date).toISOString() : undefined,
                questions: questions,
                admin_id: user.id,
            });

            setShowCreateModal(false);
            resetCreateForm();
        } catch (error) {
            console.error('Error creating assessment:', error);
            alert('Failed to create assessment. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateCodingChallenge = async () => {
        if (!user) return;
        if (!newChallenge.title) {
            alert('Please enter a title');
            return;
        }

        try {
            setIsSubmitting(true);
            const challenge = await codingChallengeService.create({
                title: newChallenge.title,
                description: newChallenge.description,
                constraints: newChallenge.constraints,
                starter_code: newChallenge.starter_code,
                difficulty: newChallenge.difficulty,
                points: newChallenge.points,
                module: newChallenge.module,
                admin_id: user.id
            });

            if (challenge && testCases.length > 0) {
                // Create test cases sequentially
                for (const tc of testCases) {
                    if (tc.input !== undefined && tc.expected_output !== undefined) {
                        await codingChallengeService.addTestCase({
                            challenge_id: challenge.id,
                            input: tc.input,
                            expected_output: tc.expected_output,
                            is_hidden: tc.is_hidden || false
                        });
                    }
                }
            }

            setShowCreateChallengeModal(false);
            fetchCodingChallenges();
            // Reset form
            setNewChallenge({
                title: '',
                description: '',
                constraints: '',
                difficulty: 'medium',
                module: 'python',
                points: 100,
                starter_code: { python: "def solution():\n    pass" }
            });
            setTestCases([]);
        } catch (error: any) {
            console.error('Error creating coding challenge:', error);
            const errorMessage = error?.message || error?.error_description || 'Unknown error';
            alert(`Failed to create coding challenge: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetCreateForm = () => {
        setNewAssessment({
            title: '',
            description: '',
            type: 'weekly_test',
            module: 'python',
            time_limit: 30,
            passing_score: 70,
            max_attempts: 1,
            ai_grading: true,
            due_date: '',
        });
        setQuestions([]);
        setCreateStep('details');
    };

    const handleDeleteAssessment = async (id: string) => {
        if (!confirm('Are you sure you want to delete this assessment?')) return;

        try {
            await assessmentService.delete(id);
        } catch (error) {
            console.error('Error deleting assessment:', error);
            alert('Failed to delete assessment. Please try again.');
        }
    };

    const handleDeleteChallenge = async (id: string) => {
        if (!confirm('Are you sure you want to delete this coding challenge?')) return;
        try {
            await codingChallengeService.delete(id);
            setCodingChallenges(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error('Error deleting challenge:', error);
            alert('Failed to delete challenge');
        }
    };

    const viewAssessment = async (assessment: Assessment) => {
        setSelectedAssessment(assessment);
        setShowViewModal(true);
        setViewTab('details');
        setIsLoadingSubmissions(true);

        try {
            // Use supabase directly to get submissions for this assessment
            const { supabase } = await import('@/lib/supabase');
            const { data, error } = await supabase
                .from('assessment_submissions')
                .select('*, student:profiles!assessment_submissions_student_id_fkey(id, name, email)')
                .eq('assessment_id', assessment.id)
                .order('submitted_at', { ascending: false });

            if (error) throw error;
            setSubmissions(data || []);
        } catch (error) {
            console.error('Error fetching submissions:', error);
            setSubmissions([]);
        } finally {
            setIsLoadingSubmissions(false);
        }
    };

    const viewChallenge = async (challenge: CodingChallenge) => {
        setSelectedChallenge(challenge);
        setShowViewChallengeModal(true);
        setViewTab('details'); // Reusing the same tab state
        setIsLoadingSubmissions(true);

        try {
            const { supabase } = await import('@/lib/supabase');
            const { data, error } = await supabase
                .from('coding_submissions')
                .select('*, student:profiles!coding_submissions_student_id_fkey(id, name, email)')
                .eq('challenge_id', challenge.id)
                .order('submitted_at', { ascending: false });

            if (error) throw error;
            setCodingSubmissions(data || []);
        } catch (error) {
            console.error('Error fetching challenge submissions:', error);
            setCodingSubmissions([]);
        } finally {
            setIsLoadingSubmissions(false);
        }
    };

    // Handle imported document data
    const handleImportDocument = (data: ParsedAssessment | ParsedCodingChallenge) => {
        if (activeTab === 'quizzes' && 'questions' in data) {
            // Populate assessment form with imported data
            setNewAssessment({
                ...newAssessment,
                title: data.title,
                description: data.description || '',
                time_limit: data.timeLimit || 30,
                passing_score: data.passingScore || 70,
            });

            // Convert parsed questions to the format expected by the form
            const convertedQuestions: Question[] = data.questions.map((q, index) => ({
                id: `imported-${index}-${Date.now()}`,
                type: 'mcq' as const,
                content: q.question,
                options: q.options.map(opt => opt.text),
                correct_answer: q.options.find(opt => opt.key === q.correctAnswer)?.text || '',
                points: 10,
            }));

            setQuestions(convertedQuestions);
            setCreateStep('questions');
            setShowCreateModal(true);
        } else if (activeTab === 'coding' && 'testCases' in data) {
            // Populate coding challenge form with imported data
            setNewChallenge({
                ...newChallenge,
                title: data.title,
                description: data.description,
                constraints: data.constraints,
                difficulty: data.difficulty,
                points: data.points || 100,
                starter_code: data.starterCode || { python: "def solution():\n    pass" },
            });

            // Convert test cases
            const convertedTestCases: Partial<ChallengeTestCase>[] = data.testCases.map((tc, index) => ({
                id: `imported-${index}-${Date.now()}`,
                input: tc.input,
                expected_output: tc.expectedOutput,
                is_hidden: tc.isHidden,
                description: tc.explanation || '',
            }));

            setTestCases(convertedTestCases);
            setShowCreateChallengeModal(true);
        }
    };

    const assessmentStats = {
        total: assessments.length,
        active: assessments.filter(a => a.due_date && new Date(a.due_date) > new Date()).length,
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* Create Assessment Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => { setShowCreateModal(false); resetCreateForm(); }}
                title={createStep === 'details' ? 'Create Assessment' : 'Add Questions'}
                size="xl"
            >
                {createStep === 'details' ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-400 mb-2">Title</label>
                                <input
                                    type="text"
                                    value={newAssessment.title}
                                    onChange={(e) => setNewAssessment({ ...newAssessment, title: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                                    placeholder="e.g., Python Week 3 Quiz"
                                    required
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                                <textarea
                                    value={newAssessment.description}
                                    onChange={(e) => setNewAssessment({ ...newAssessment, description: e.target.value })}
                                    rows={2}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 resize-none"
                                    placeholder="Describe the assessment..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Type</label>
                                <select
                                    value={newAssessment.type}
                                    onChange={(e) => setNewAssessment({ ...newAssessment, type: e.target.value as AssessmentType })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                                >
                                    <option value="daily_quiz">Daily Quiz</option>
                                    <option value="weekly_test">Weekly Test</option>
                                    <option value="module_assessment">Module Assessment</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Module</label>
                                <select
                                    value={newAssessment.module}
                                    onChange={(e) => setNewAssessment({ ...newAssessment, module: e.target.value as CurriculumModule })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                                >
                                    <option value="python">Python</option>
                                    <option value="sql">SQL</option>
                                    <option value="machine_learning">Machine Learning</option>
                                    <option value="deep_learning">Deep Learning</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Time Limit (minutes)</label>
                                <input
                                    type="number"
                                    value={newAssessment.time_limit}
                                    onChange={(e) => setNewAssessment({ ...newAssessment, time_limit: parseInt(e.target.value) })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                                    min={5}
                                    max={180}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Passing Score (%)</label>
                                <input
                                    type="number"
                                    value={newAssessment.passing_score}
                                    onChange={(e) => setNewAssessment({ ...newAssessment, passing_score: parseInt(e.target.value) })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                                    min={0}
                                    max={100}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Max Attempts</label>
                                <input
                                    type="number"
                                    value={newAssessment.max_attempts}
                                    onChange={(e) => setNewAssessment({ ...newAssessment, max_attempts: parseInt(e.target.value) })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                                    min={1}
                                    max={10}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Due Date</label>
                                <input
                                    type="datetime-local"
                                    value={newAssessment.due_date}
                                    onChange={(e) => setNewAssessment({ ...newAssessment, due_date: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark]"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                            <input
                                type="checkbox"
                                id="ai_grading"
                                checked={newAssessment.ai_grading}
                                onChange={(e) => setNewAssessment({ ...newAssessment, ai_grading: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-indigo-500"
                            />
                            <label htmlFor="ai_grading" className="text-sm text-gray-400 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-400" />
                                Enable AI Grading (Powered by Gemini)
                            </label>
                        </div>
                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                            <button
                                type="button"
                                onClick={() => { setShowCreateModal(false); resetCreateForm(); }}
                                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (!newAssessment.title) {
                                        alert('Please enter a title');
                                        return;
                                    }
                                    setCreateStep('questions');
                                }}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium flex items-center gap-2"
                            >
                                Next: Add Questions
                                <ArrowLeft className="w-4 h-4 rotate-180" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 pb-4 border-b border-white/10">
                            <button
                                onClick={() => setCreateStep('details')}
                                className="flex items-center gap-2 text-gray-400 hover:text-white"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Details
                            </button>
                            <div className="flex-1">
                                <h4 className="text-white font-medium">{newAssessment.title}</h4>
                                <p className="text-sm text-gray-500">{newAssessment.type.replace('_', ' ')} • {newAssessment.time_limit} min</p>
                            </div>
                        </div>

                        <QuestionBuilder questions={questions} setQuestions={setQuestions} />

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                            <button
                                type="button"
                                onClick={() => setCreateStep('details')}
                                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleCreateAssessment}
                                disabled={isSubmitting || questions.length === 0}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Create Assessment
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* View Assessment Modal */}
            <Modal
                isOpen={showViewModal}
                onClose={() => { setShowViewModal(false); setSelectedAssessment(null); setSubmissions([]); }}
                title={selectedAssessment?.title || "Assessment Details"}
                size="xl"
            >
                {selectedAssessment && (
                    <div className="space-y-6">
                        {/* Tab Navigation */}
                        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                            <button
                                onClick={() => setViewTab('details')}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                                    viewTab === 'details'
                                        ? "bg-indigo-500/20 text-indigo-400"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <FileCheck className="w-4 h-4" />
                                Details & Questions
                            </button>
                            <button
                                onClick={() => setViewTab('submissions')}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                                    viewTab === 'submissions'
                                        ? "bg-indigo-500/20 text-indigo-400"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <Users className="w-4 h-4" />
                                Student Submissions ({submissions.length})
                            </button>
                        </div>

                        {/* Details Tab */}
                        {viewTab === 'details' && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Type</p>
                                        <p className="text-white">{selectedAssessment.type.replace('_', ' ')}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Module</p>
                                        <p className="text-white">{(selectedAssessment.module || 'python').replace('_', ' ')}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Time Limit</p>
                                        <p className="text-white">{selectedAssessment.time_limit} minutes</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Passing Score</p>
                                        <p className="text-white">{selectedAssessment.passing_score}%</p>
                                    </div>
                                    {selectedAssessment.due_date && (
                                        <div>
                                            <p className="text-sm text-gray-500">Due Date</p>
                                            <p className="text-white">{formatDate(selectedAssessment.due_date)}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm text-gray-500">AI Grading</p>
                                        <p className="text-white flex items-center gap-2">
                                            {selectedAssessment.ai_grading_enabled ? (
                                                <><Sparkles className="w-4 h-4 text-indigo-400" /> Enabled</>
                                            ) : 'Disabled'}
                                        </p>
                                    </div>
                                </div>

                                <div className="border-t border-white/10 pt-4">
                                    <h4 className="text-white font-medium mb-4">Questions ({selectedAssessment.questions?.length || 0})</h4>
                                    <div className="space-y-3 max-h-60 overflow-y-auto">
                                        {selectedAssessment.questions?.map((q, index) => (
                                            <div key={q.id} className="p-3 bg-white/5 rounded-lg">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-bold text-indigo-400">Q{index + 1}</span>
                                                    <Badge size="sm">{q.type.replace('_', ' ')}</Badge>
                                                    <span className="text-xs text-gray-500 ml-auto">{q.points} pts</span>
                                                </div>
                                                <p className="text-gray-300 text-sm">{q.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Submissions Tab */}
                        {viewTab === 'submissions' && (
                            <div>
                                {isLoadingSubmissions ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                    </div>
                                ) : submissions.length === 0 ? (
                                    <div className="text-center py-12 bg-white/5 rounded-xl">
                                        <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-white">No submissions yet</h3>
                                        <p className="text-gray-400 mt-1">Students haven't taken this assessment yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Summary Stats */}
                                        <div className="grid grid-cols-4 gap-3">
                                            <div className="bg-white/5 rounded-xl p-3 text-center">
                                                <p className="text-2xl font-bold text-white">{submissions.length}</p>
                                                <p className="text-xs text-gray-400">Total Submissions</p>
                                            </div>
                                            <div className="bg-emerald-500/10 rounded-xl p-3 text-center">
                                                <p className="text-2xl font-bold text-emerald-400">
                                                    {submissions.filter(s => (s.score || 0) >= (selectedAssessment.passing_score || 70)).length}
                                                </p>
                                                <p className="text-xs text-gray-400">Passed</p>
                                            </div>
                                            <div className="bg-red-500/10 rounded-xl p-3 text-center">
                                                <p className="text-2xl font-bold text-red-400">
                                                    {submissions.filter(s => (s.score || 0) < (selectedAssessment.passing_score || 70)).length}
                                                </p>
                                                <p className="text-xs text-gray-400">Failed</p>
                                            </div>
                                            <div className="bg-indigo-500/10 rounded-xl p-3 text-center">
                                                <p className="text-2xl font-bold text-indigo-400">
                                                    {submissions.length > 0
                                                        ? Math.round(submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length)
                                                        : 0}%
                                                </p>
                                                <p className="text-xs text-gray-400">Avg Score</p>
                                            </div>
                                        </div>

                                        {/* Submissions List */}
                                        <div className="space-y-3 max-h-80 overflow-y-auto">
                                            {submissions.map((submission) => {
                                                const passed = (submission.score || 0) >= (selectedAssessment.passing_score || 70);
                                                const student = submission.student;

                                                return (
                                                    <div
                                                        key={submission.id}
                                                        className={cn(
                                                            "p-4 rounded-xl border-l-4",
                                                            passed ? "bg-emerald-500/10 border-l-emerald-500" : "bg-red-500/10 border-l-red-500"
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
                                                                    {student?.name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-white">{student?.name || 'Unknown Student'}</p>
                                                                    <p className="text-xs text-gray-400">{student?.email || 'No email'}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <div className="text-right">
                                                                    <div className={cn(
                                                                        "text-2xl font-bold",
                                                                        passed ? "text-emerald-400" : "text-red-400"
                                                                    )}>
                                                                        {submission.score || 0}%
                                                                    </div>
                                                                    <p className="text-xs text-gray-500">
                                                                        {submission.submitted_at ? formatRelativeTime(submission.submitted_at) : 'recently'}
                                                                    </p>
                                                                </div>
                                                                {passed ? (
                                                                    <Trophy className="w-6 h-6 text-emerald-400" />
                                                                ) : (
                                                                    <XCircle className="w-6 h-6 text-red-400" />
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Student Answers */}
                                                        {submission.answers && (
                                                            <div className="mt-3 pt-3 border-t border-white/10">
                                                                <p className="text-xs text-gray-500 mb-2">Student's Answers:</p>
                                                                <div className="grid grid-cols-1 gap-2">
                                                                    {Object.entries(submission.answers).slice(0, 3).map(([qId, answer], idx) => {
                                                                        const question = selectedAssessment.questions?.find(q => q.id === qId);
                                                                        return (
                                                                            <div key={qId} className="text-sm bg-white/5 rounded-lg p-2">
                                                                                <span className="text-indigo-400 font-medium">Q{idx + 1}: </span>
                                                                                <span className="text-gray-300">{String(answer).slice(0, 100)}{String(answer).length > 100 ? '...' : ''}</span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                    {Object.keys(submission.answers).length > 3 && (
                                                                        <p className="text-xs text-gray-500">+ {Object.keys(submission.answers).length - 3} more answers</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* AI Feedback */}
                                                        {submission.ai_feedback && (
                                                            <div className="mt-3 pt-3 border-t border-white/10">
                                                                <p className="text-xs text-gray-500 mb-1">
                                                                    <Sparkles className="w-3 h-3 inline mr-1 text-indigo-400" />
                                                                    AI Feedback:
                                                                </p>
                                                                <p className="text-sm text-gray-300">
                                                                    {(submission.ai_feedback as any)?.overall_feedback?.slice(0, 150)}...
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Create Coding Challenge Modal */}
            <Modal
                isOpen={showCreateChallengeModal}
                onClose={() => setShowCreateChallengeModal(false)}
                title="Create Coding Challenge"
                size="xl"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-400 mb-2">Title</label>
                            <input
                                type="text"
                                value={newChallenge.title}
                                onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                                placeholder="Challenge Title"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                            <textarea
                                value={newChallenge.description}
                                onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                                rows={3}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 resize-none"
                                placeholder="Problem description..."
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-400 mb-2">Constraints</label>
                            <textarea
                                value={newChallenge.constraints}
                                onChange={(e) => setNewChallenge({ ...newChallenge, constraints: e.target.value })}
                                rows={2}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 resize-none"
                                placeholder="e.g. 1 <= N <= 1000"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Difficulty</label>
                            <select
                                value={newChallenge.difficulty}
                                onChange={(e) => setNewChallenge({ ...newChallenge, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                            >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Points</label>
                            <input
                                type="number"
                                value={newChallenge.points}
                                onChange={(e) => setNewChallenge({ ...newChallenge, points: parseInt(e.target.value) })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Module</label>
                            <select
                                value={newChallenge.module}
                                onChange={(e) => setNewChallenge({ ...newChallenge, module: e.target.value as CurriculumModule })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                            >
                                <option value="python">Python</option>
                                <option value="javascript">JavaScript</option>
                                <option value="java">Java</option>
                                <option value="cpp">C++</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-400 mb-2">Starter Code</label>
                            <textarea
                                value={newChallenge.starter_code?.python || ''}
                                onChange={(e) => setNewChallenge({ ...newChallenge, starter_code: { ...newChallenge.starter_code, python: e.target.value } })}
                                rows={4}
                                className="w-full bg-[#1e1e2e] border border-white/10 rounded-xl px-4 py-2.5 text-gray-300 font-mono text-sm focus:outline-none focus:border-indigo-500"
                                placeholder="def solution():..."
                            />
                        </div>
                    </div>

                    {/* Test Cases */}
                    <div className="border-t border-white/10 pt-4">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-white font-medium">Test Cases ({testCases.length})</h4>
                            <button
                                onClick={() => setTestCases([...testCases, { input: '', expected_output: '', is_hidden: false }])}
                                className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                            >
                                <Plus className="w-4 h-4" /> Add Test Case
                            </button>
                        </div>

                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                            {testCases.map((tc, idx) => (
                                <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-bold text-indigo-400">Test Case #{idx + 1}</span>
                                            <label className="flex items-center gap-2 text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">
                                                <input
                                                    type="checkbox"
                                                    checked={tc.is_hidden}
                                                    onChange={(e) => {
                                                        const newCases = [...testCases];
                                                        newCases[idx] = { ...newCases[idx], is_hidden: e.target.checked };
                                                        setTestCases(newCases);
                                                    }}
                                                    className="rounded border-gray-700 bg-gray-800 w-3 h-3"
                                                />
                                                Hidden
                                            </label>
                                        </div>
                                        <button
                                            onClick={() => setTestCases(testCases.filter((_, i) => i !== idx))}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Input (stdin)</label>
                                            <textarea
                                                value={tc.input}
                                                onChange={(e) => {
                                                    const newCases = [...testCases];
                                                    newCases[idx] = { ...newCases[idx], input: e.target.value };
                                                    setTestCases(newCases);
                                                }}
                                                rows={4}
                                                className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500/50 resize-none"
                                                placeholder="Enter input values...&#10;Each line is a new input"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Expected Output</label>
                                            <textarea
                                                value={tc.expected_output}
                                                onChange={(e) => {
                                                    const newCases = [...testCases];
                                                    newCases[idx] = { ...newCases[idx], expected_output: e.target.value };
                                                    setTestCases(newCases);
                                                }}
                                                rows={4}
                                                className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500/50 resize-none"
                                                placeholder="Expected output...&#10;Must match exactly"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {testCases.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <p className="text-sm">No test cases yet</p>
                                    <p className="text-xs mt-1">Click "Add Test Case" to create one</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                        <button
                            onClick={() => setShowCreateChallengeModal(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateCodingChallenge}
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Create Challenge
                        </button>
                    </div>
                </div>
            </Modal>

            {/* View Challenge Modal */}
            <Modal
                isOpen={showViewChallengeModal}
                onClose={() => { setShowViewChallengeModal(false); setSelectedChallenge(null); setCodingSubmissions([]); }}
                title={selectedChallenge?.title || "Challenge Details"}
                size="xl"
            >
                {selectedChallenge && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                            <button
                                onClick={() => setViewTab('details')}
                                className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2", viewTab === 'details' ? "bg-indigo-500/20 text-indigo-400" : "text-gray-400 hover:text-white")}
                            >
                                <CodeIcon className="w-4 h-4" /> Details
                            </button>
                            <button
                                onClick={() => setViewTab('submissions')}
                                className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2", viewTab === 'submissions' ? "bg-indigo-500/20 text-indigo-400" : "text-gray-400 hover:text-white")}
                            >
                                <Users className="w-4 h-4" /> Submissions ({codingSubmissions.length})
                            </button>
                        </div>

                        {viewTab === 'details' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><p className="text-sm text-gray-500">Difficulty</p><p className="text-white capitalize">{selectedChallenge.difficulty}</p></div>
                                    <div><p className="text-sm text-gray-500">Points</p><p className="text-white">{selectedChallenge.points}</p></div>
                                    <div className="col-span-2"><p className="text-sm text-gray-500">Description</p><p className="text-white">{selectedChallenge.description}</p></div>
                                    <div className="col-span-2"><p className="text-sm text-gray-500">Constraints</p><pre className="bg-black/20 p-2 rounded text-sm text-gray-300 whitespace-pre-wrap">{selectedChallenge.constraints}</pre></div>
                                </div>
                            </div>
                        )}

                        {viewTab === 'submissions' && (
                            <div className="space-y-3 max-h-80 overflow-y-auto">
                                {codingSubmissions.map(sub => (
                                    <div key={sub.id} className="p-3 bg-white/5 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="text-white font-medium">{sub.student?.name}</p>
                                            <p className="text-xs text-gray-400">{formatRelativeTime(sub.submitted_at)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={cn("font-bold", sub.status === 'passed' ? "text-green-400" : "text-red-400")}>{sub.status}</p>
                                            <p className="text-xs text-gray-400">{sub.execution_time ? `${sub.execution_time}ms` : '-'}</p>
                                        </div>
                                    </div>
                                ))}
                                {codingSubmissions.length === 0 && <p className="text-gray-400 text-center py-4">No submissions yet.</p>}
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Header & Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Assessments & Coding</h1>
                    <p className="text-gray-400 mt-1">Manage quizzes and coding challenges</p>
                </div>
                <div className="flex bg-white/5 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('quizzes')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            activeTab === 'quizzes' ? "bg-indigo-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
                        )}
                    >
                        Quizzes
                    </button>
                    <button
                        onClick={() => setActiveTab('coding')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            activeTab === 'coding' ? "bg-indigo-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
                        )}
                    >
                        Coding Contests
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        leftIcon={<Upload className="w-4 h-4" />}
                        onClick={() => setShowImportModal(true)}
                        className="bg-white/5 border border-white/10 hover:bg-white/10"
                    >
                        Import from File
                    </Button>
                    <Button
                        leftIcon={<Plus className="w-4 h-4" />}
                        onClick={() => activeTab === 'quizzes' ? setShowCreateModal(true) : setShowCreateChallengeModal(true)}
                    >
                        Create {activeTab === 'quizzes' ? 'Quiz' : 'Challenge'}
                    </Button>
                </div>
            </div>

            {/* Import Document Modal */}
            <DocumentUploadModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                type={activeTab === 'quizzes' ? 'assessment' : 'coding'}
                onImport={handleImportDocument}
            />

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Items', value: activeTab === 'quizzes' ? assessmentStats.total : codingChallenges.length, icon: FileCheck, color: 'text-blue-400' },
                    { label: 'Active', value: activeTab === 'quizzes' ? assessmentStats.active : codingChallenges.length, icon: Clock, color: 'text-green-400' },
                    { label: 'AI Graded', value: activeTab === 'quizzes' ? assessments.filter(a => a.ai_grading_enabled).length : codingChallenges.length, icon: Sparkles, color: 'text-purple-400' },
                    { label: 'Total Questions', value: activeTab === 'quizzes' ? assessments.reduce((sum, a) => sum + (a.questions?.length || 0), 0) : codingChallenges.length, icon: ListChecks, color: 'text-orange-400' },
                ].map((stat) => (
                    <Card key={stat.label} variant="default" padding="md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400">{stat.label}</p>
                                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                            </div>
                            <stat.icon className={cn('w-8 h-8', stat.color)} />
                        </div>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <Card variant="default" padding="md">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder={`Search ${activeTab}...`}
                            leftIcon={<Search className="w-4 h-4" />}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                        {(['all', 'python', 'sql', 'machine_learning', 'deep_learning'] as const).map((module) => {
                            const color = module === 'all' ? { bg: 'bg-gray-700/50', text: 'text-gray-300' } : getModuleColor(module);
                            return (
                                <button
                                    key={module}
                                    onClick={() => setFilterModule(module)}
                                    className={cn(
                                        'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                                        filterModule === module
                                            ? cn(color.bg, color.text, 'border border-current')
                                            : 'bg-gray-800/50 text-gray-400 border border-gray-800 hover:bg-gray-800'
                                    )}
                                >
                                    {module === 'all' ? 'All' : module.replace('_', ' ')}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </Card>

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
            )}

            {/* Lists */}
            {!isLoading && (
                <div className="space-y-4">
                    {activeTab === 'quizzes' ? (
                        <>
                            {filteredAssessments.length === 0 ? (
                                <Card variant="default" padding="lg" className="text-center">
                                    <FileCheck className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-white">No assessments found</h3>
                                    <p className="text-gray-400 mt-1">Create your first assessment to get started</p>
                                </Card>
                            ) : (
                                filteredAssessments.map((assessment, index) => (
                                    <AssessmentCard
                                        key={assessment.id}
                                        assessment={assessment}
                                        delay={index * 0.05}
                                        onDelete={handleDeleteAssessment}
                                        onView={viewAssessment}
                                    />
                                ))
                            )}
                        </>
                    ) : (
                        <>
                            {filteredChallenges.length === 0 ? (
                                <Card variant="default" padding="lg" className="text-center">
                                    <CodeIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-white">No coding challenges found</h3>
                                    <p className="text-gray-400 mt-1">Create your first coding challenge</p>
                                </Card>
                            ) : (
                                filteredChallenges.map((challenge, index) => (
                                    <CodingChallengeCard
                                        key={challenge.id}
                                        challenge={challenge}
                                        onDelete={handleDeleteChallenge}
                                        onView={viewChallenge}
                                    />
                                ))
                            )}
                        </>
                    )}
                </div>
            )}
        </motion.div>
    );
};

interface AssessmentCardProps {
    assessment: Assessment;
    delay?: number;
    onDelete: (id: string) => void;
    onView: (assessment: Assessment) => void;
}

const AssessmentCard: React.FC<AssessmentCardProps> = ({ assessment, delay = 0, onDelete, onView }) => {
    const moduleColor = getModuleColor(assessment.module || 'python');
    const isExpired = assessment.due_date ? new Date(assessment.due_date) < new Date() : false;
    const questionCount = assessment.questions?.length || 0;
    const totalPoints = assessment.questions?.reduce((sum, q) => sum + q.points, 0) || 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
        >
            <Card variant="hover" padding="md">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', moduleColor.bg)}>
                            <FileCheck className={cn('w-6 h-6', moduleColor.text)} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Badge className={cn(moduleColor.bg, moduleColor.text, moduleColor.border)} size="sm">
                                    {(assessment.module || 'python').replace('_', ' ')}
                                </Badge>
                                <Badge variant={isExpired ? 'danger' : 'default'} size="sm">
                                    {assessment.type?.replace('_', ' ') || 'Quiz'}
                                </Badge>
                                {assessment.ai_grading_enabled && (
                                    <Badge variant="primary" size="sm">
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        AI Graded
                                    </Badge>
                                )}
                            </div>
                            <h3 className="text-lg font-semibold text-white">{assessment.title}</h3>
                            <p className="text-gray-400 text-sm mt-1 line-clamp-1">{assessment.description}</p>

                            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    <ListChecks className="w-4 h-4" />
                                    {questionCount} questions
                                </span>
                                <span className="flex items-center gap-1">
                                    <BarChart2 className="w-4 h-4" />
                                    {totalPoints} pts
                                </span>
                                {assessment.time_limit && (
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {assessment.time_limit} min
                                    </span>
                                )}
                                {assessment.due_date && (
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        Due: {formatDate(assessment.due_date)}
                                    </span>
                                )}
                                {assessment.passing_score && (
                                    <span className="flex items-center gap-1">
                                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                                        Pass: {assessment.passing_score}%
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="p-2" onClick={() => onView(assessment)}>
                            <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="p-2">
                            <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => onDelete(assessment.id)}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};

interface CodingChallengeCardProps {
    challenge: CodingChallenge;
    onDelete: (id: string) => void;
    onView: (challenge: CodingChallenge) => void;
}

const CodingChallengeCard: React.FC<CodingChallengeCardProps> = ({ challenge, onDelete, onView }) => {
    const moduleColor = getModuleColor(challenge.module || 'python');

    return (
        <Card variant="hover" padding="md">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', moduleColor.bg)}>
                        <CodeIcon className={cn('w-6 h-6', moduleColor.text)} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <Badge className={cn(moduleColor.bg, moduleColor.text, moduleColor.border)} size="sm">
                                {challenge.module}
                            </Badge>
                            <Badge variant={challenge.difficulty === 'hard' ? 'danger' : challenge.difficulty === 'medium' ? 'warning' : 'success'} size="sm">
                                {challenge.difficulty}
                            </Badge>
                            <Badge variant="primary" size="sm">
                                {challenge.points} pts
                            </Badge>
                        </div>
                        <h3 className="text-lg font-semibold text-white">{challenge.title}</h3>
                        <p className="text-gray-400 text-sm mt-1 line-clamp-1">{challenge.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="p-2" onClick={() => onView(challenge)}>
                        <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => onDelete(challenge.id)}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </Card>
    );
};
