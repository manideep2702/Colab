import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge, Button, Progress } from '@/components/ui';
import {
    FileCheck,
    Clock,
    Calendar,
    Sparkles,
    Play,
    CheckCircle2,
    CheckCircle,
    XCircle,
    AlertCircle,
    X,
    Loader2,
    ArrowRight,
    ArrowLeft,
    Send,
    Trophy,
    Target,
    AlertTriangle,
    BarChart2,
    Eye,
    Code2,
    Terminal as TerminalIcon,
    RotateCcw,
    Zap,
    ChevronDown,
    Code,
} from 'lucide-react';
import { cn, formatDate, getModuleColor, formatRelativeTime } from '@/lib/utils';
import { assessmentService, codingChallengeService } from '@/services/api';
import { geminiService, type GradingResult } from '@/services/gemini';
import { codeExecutionService, type TestCase, type SubmissionResult, type TestResult, type SupportedLanguage, LANGUAGE_SNIPPETS } from '@/services/codeExecution';
import { useAuthStore } from '@/stores/authStore';
import { CodePlayground } from '@/components/code-editor';
import type { Assessment, Question, AssessmentSubmission, CodingChallenge, ChallengeTestCase, CodingSubmission } from '@/types';

// Modal Component
const Modal = ({ isOpen, onClose, title, children, size = 'lg', closable = true }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'md' | 'lg' | 'xl';
    closable?: boolean;
}) => (
    <AnimatePresence>
        {isOpen && (
            <>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={closable ? onClose : undefined}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className={cn(
                        "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#09090b] ring-1 ring-white/10 rounded-2xl p-6 z-[101] shadow-2xl max-h-[95vh] overflow-y-auto",
                        size === 'md' && 'w-full max-w-lg',
                        size === 'lg' && 'w-full max-w-2xl',
                        size === 'xl' && 'w-full max-w-4xl'
                    )}
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white">{title}</h3>
                        {closable && (
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        )}
                    </div>
                    {children}
                </motion.div>
            </>
        )}
    </AnimatePresence>
);

// Timer Component
const Timer = ({ timeLimit, onTimeUp }: { timeLimit: number; onTimeUp: () => void }) => {
    const [timeLeft, setTimeLeft] = useState(timeLimit * 60); // Convert to seconds

    useEffect(() => {
        if (timeLeft <= 0) {
            onTimeUp();
            return;
        }

        const interval = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeft, onTimeUp]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const isLow = timeLeft < 60; // Less than 1 minute
    const isWarning = timeLeft < 300; // Less than 5 minutes

    return (
        <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg",
            isLow ? "bg-red-500/20 text-red-400 animate-pulse" :
                isWarning ? "bg-amber-500/20 text-amber-400" :
                    "bg-white/10 text-white"
        )}>
            <Clock className="w-5 h-5" />
            <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
        </div>
    );
};

// Quiz Taking Component
// Coding Question Component with Test Cases
const CodingQuestionView = ({
    question,
    value,
    onChange
}: {
    question: Question;
    value: string;
    onChange: (code: string, testResults?: SubmissionResult) => void;
}) => {
    const [code, setCode] = useState<string>(() => {
        try {
            const parsed = JSON.parse(value);
            const parsedCode = typeof parsed.code === 'string' ? parsed.code : null;
            return parsedCode || question.correct_answer || codeExecutionService.getStarterCode((question.coding_language as SupportedLanguage) || 'python');
        } catch {
            return question.correct_answer || codeExecutionService.getStarterCode((question.coding_language as SupportedLanguage) || 'python');
        }
    });
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [runResult, setRunResult] = useState<TestResult | null>(null);
    const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
    const [selectedTestCase, setSelectedTestCase] = useState(0);
    const [activeTab, setActiveTab] = useState<'testcases' | 'output'>('testcases');

    const testCases: TestCase[] = (question.test_cases || []).map((tc: any) => ({
        id: tc.id || `tc_${Math.random()}`,
        input: tc.input,
        expected_output: tc.expected_output,
        is_hidden: tc.is_hidden,
        description: tc.description,
    }));

    const visibleTestCases = testCases.filter(tc => !tc.is_hidden);
    const language: SupportedLanguage = (question.coding_language as SupportedLanguage) || 'python';

    const handleRun = async () => {
        if (!visibleTestCases[selectedTestCase]) return;

        setIsRunning(true);
        setActiveTab('output');
        setRunResult(null);

        try {
            const testCase = visibleTestCases[selectedTestCase];
            const { output, error, executionTime } = await codeExecutionService.executeCode(
                code,
                language,
                testCase.input
            );

            const normalizedOutput = output.trim().toLowerCase();
            const normalizedExpected = testCase.expected_output.trim().toLowerCase();
            const passed = !error && normalizedOutput === normalizedExpected;

            setRunResult({
                test_case_id: testCase.id,
                passed,
                actual_output: output || error || '',
                expected_output: testCase.expected_output,
                execution_time: executionTime,
                error,
            });
        } catch (error) {
            console.error('Run failed:', error);
        } finally {
            setIsRunning(false);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setActiveTab('output');

        try {
            const result = await codeExecutionService.runTestCases(code, language, testCases);
            setSubmissionResult(result);
            onChange(code, result);
        } catch (error) {
            console.error('Submit failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        const starterCode = question.correct_answer || codeExecutionService.getStarterCode(language);
        setCode(starterCode);
        setRunResult(null);
        setSubmissionResult(null);
    };

    return (
        <div className="space-y-4">
            {/* Editor Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Badge variant="primary" size="sm">{language.toUpperCase()}</Badge>
                    {submissionResult && (
                        <Badge
                            variant={submissionResult.overall_status === 'accepted' ? 'success' : 'danger'}
                            size="sm"
                        >
                            {submissionResult.passed_tests}/{submissionResult.total_tests} Passed
                        </Badge>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                    </button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleRun}
                        disabled={isRunning || isSubmitting}
                        className="bg-white/10"
                    >
                        {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        <span className="ml-1">Run</span>
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSubmit}
                        disabled={isRunning || isSubmitting}
                        className="bg-emerald-600 hover:bg-emerald-500"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        <span className="ml-1">Submit</span>
                    </Button>
                </div>
            </div>

            {/* Code Editor */}
            <textarea
                value={code}
                onChange={(e) => {
                    setCode(e.target.value);
                    onChange(e.target.value);
                }}
                spellCheck={false}
                className="w-full h-64 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-indigo-500 resize-none"
                placeholder="Write your code here..."
                style={{ tabSize: 4 }}
            />

            {/* Test Cases Panel */}
            <div className="bg-black/30 border border-white/10 rounded-xl overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-white/10">
                    <button
                        onClick={() => setActiveTab('testcases')}
                        className={cn(
                            "flex-1 px-4 py-2 text-sm font-medium transition-colors",
                            activeTab === 'testcases' ? "text-white border-b-2 border-indigo-500" : "text-gray-500"
                        )}
                    >
                        Test Cases
                    </button>
                    <button
                        onClick={() => setActiveTab('output')}
                        className={cn(
                            "flex-1 px-4 py-2 text-sm font-medium transition-colors",
                            activeTab === 'output' ? "text-white border-b-2 border-indigo-500" : "text-gray-500"
                        )}
                    >
                        Output
                    </button>
                </div>

                <div className="p-4 max-h-48 overflow-y-auto">
                    {activeTab === 'testcases' && (
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                {visibleTestCases.map((tc, i) => (
                                    <button
                                        key={tc.id}
                                        onClick={() => setSelectedTestCase(i)}
                                        className={cn(
                                            "px-3 py-1 rounded-lg text-xs font-medium transition-all",
                                            selectedTestCase === i
                                                ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                                                : "bg-white/5 text-gray-400 border border-white/10"
                                        )}
                                    >
                                        Case {i + 1}
                                    </button>
                                ))}
                            </div>
                            {visibleTestCases[selectedTestCase] && (
                                <div className="space-y-2">
                                    {visibleTestCases[selectedTestCase].description && (
                                        <p className="text-xs text-gray-400">{visibleTestCases[selectedTestCase].description}</p>
                                    )}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">Input</label>
                                            <pre className="p-2 bg-black/40 rounded text-xs text-white font-mono overflow-x-auto">
                                                {visibleTestCases[selectedTestCase].input || '(empty)'}
                                            </pre>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">Expected</label>
                                            <pre className="p-2 bg-black/40 rounded text-xs text-emerald-400 font-mono overflow-x-auto">
                                                {visibleTestCases[selectedTestCase].expected_output}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'output' && (
                        <div>
                            {submissionResult ? (
                                <div className="space-y-2">
                                    <div className={cn(
                                        "p-3 rounded-lg",
                                        submissionResult.overall_status === 'accepted'
                                            ? "bg-emerald-500/10 border border-emerald-500/20"
                                            : "bg-red-500/10 border border-red-500/20"
                                    )}>
                                        <div className="flex items-center gap-2">
                                            {submissionResult.overall_status === 'accepted' ? (
                                                <Trophy className="w-5 h-5 text-emerald-400" />
                                            ) : (
                                                <X className="w-5 h-5 text-red-400" />
                                            )}
                                            <span className={cn(
                                                "font-bold",
                                                submissionResult.overall_status === 'accepted' ? "text-emerald-400" : "text-red-400"
                                            )}>
                                                {submissionResult.overall_status === 'accepted' ? 'All Tests Passed!' :
                                                    submissionResult.overall_status.replace('_', ' ').toUpperCase()}
                                            </span>
                                            <span className="text-gray-400 text-sm ml-auto">
                                                {submissionResult.passed_tests}/{submissionResult.total_tests} passed ({submissionResult.score}%)
                                            </span>
                                        </div>
                                    </div>
                                    {submissionResult.results.slice(0, 3).map((r, i) => (
                                        <div key={r.test_case_id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                                            <span className="text-sm text-white">Test {i + 1}</span>
                                            {r.passed ? (
                                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                            ) : (
                                                <X className="w-4 h-4 text-red-400" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : runResult ? (
                                <div className={cn(
                                    "p-3 rounded-lg",
                                    runResult.passed ? "bg-emerald-500/10" : "bg-red-500/10"
                                )}>
                                    <div className="flex items-center gap-2 mb-2">
                                        {runResult.passed ? (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        ) : (
                                            <X className="w-4 h-4 text-red-400" />
                                        )}
                                        <span className={runResult.passed ? "text-emerald-400" : "text-red-400"}>
                                            {runResult.passed ? 'Passed' : 'Failed'}
                                        </span>
                                        <span className="text-xs text-gray-500 ml-auto">{runResult.execution_time}ms</span>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Output:</label>
                                        <pre className="text-xs text-white font-mono mt-1">{runResult.actual_output || '(empty)'}</pre>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <TerminalIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Run your code to see output</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// AI Feedback Type
interface AICodeFeedback {
    score: number;
    status: string;
    summary: string;
    strengths: string[];
    improvements: string[];
    tips: string[];
    timeComplexity?: string;
    spaceComplexity?: string;
}

// Challenge Code Editor Component - for standalone coding challenges
const ChallengeCodeEditor = ({
    challenge,
    testCases,
    visibleTestCases: visibleTestCasesProp,
    onSubmit,
    previousSubmission,
    alreadySubmitted
}: {
    challenge: CodingChallenge | null;
    testCases: ChallengeTestCase[]; // ALL test cases (including hidden) for execution
    visibleTestCases?: ChallengeTestCase[]; // Only visible test cases for display
    onSubmit?: (code: string, language: string, passed: boolean, passedCount?: number) => Promise<void>;
    previousSubmission?: CodingSubmission;
    alreadySubmitted?: boolean;
}) => {
    // Determine initial language
    const initialLanguage: SupportedLanguage = (previousSubmission?.language as SupportedLanguage) || 'python';

    // Use previous code if reviewing a submission, or get starter code for language
    const getStarterCode = (lang: SupportedLanguage): string => {
        if (previousSubmission?.code) return previousSubmission.code;
        if (challenge?.starter_code && typeof challenge.starter_code === 'object') {
            return challenge.starter_code[lang] || LANGUAGE_SNIPPETS[lang] || LANGUAGE_SNIPPETS['python'];
        }
        return LANGUAGE_SNIPPETS[lang] || LANGUAGE_SNIPPETS['python'];
    };

    const [code, setCode] = useState<string>(getStarterCode(initialLanguage));
    const [language, setLanguage] = useState<SupportedLanguage>(initialLanguage);
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedTestCase, setSelectedTestCase] = useState(0);
    const [activeTab, setActiveTab] = useState<'testcases' | 'output'>('testcases');
    const [runResult, setRunResult] = useState<TestResult | null>(null);
    const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(alreadySubmitted || false);
    const [aiFeedback, setAiFeedback] = useState<AICodeFeedback | null>(null);

    // Use provided visible test cases for display, or filter from all test cases
    const visibleTestCases = visibleTestCasesProp || testCases.filter(tc => !tc.is_hidden);

    // All test cases (including hidden) for submission
    const allTestCases = testCases;

    const handleRun = async () => {
        setIsRunning(true);
        setActiveTab('output');
        setRunResult(null);
        setSubmissionResult(null);

        try {
            // Run ALL test cases (including hidden) when clicking Run
            const formattedTestCases: TestCase[] = allTestCases.map((tc, idx) => ({
                id: tc.id || `tc_${idx}`,
                input: tc.input || '',
                expected_output: tc.expected_output || '',
                is_hidden: tc.is_hidden,
            }));

            console.log(`Running ${formattedTestCases.length} test cases (${formattedTestCases.filter(tc => tc.is_hidden).length} hidden)`);

            const result = await codeExecutionService.runTestCases(code, language, formattedTestCases);
            setSubmissionResult(result);
        } catch (error) {
            console.error('Run failed:', error);
        } finally {
            setIsRunning(false);
        }
    };

    const handleSubmit = async () => {
        // First run all test cases if not already done
        if (!submissionResult) {
            await handleRun();
        }

        setIsSubmitting(true);
        setActiveTab('output');

        try {
            // Run ALL test cases (including hidden) for final submission
            const formattedTestCases: TestCase[] = allTestCases.map((tc, idx) => ({
                id: tc.id || `tc_${idx}`,
                input: tc.input || '',
                expected_output: tc.expected_output || '',
                is_hidden: tc.is_hidden,
            }));

            const result = await codeExecutionService.runTestCases(code, language, formattedTestCases);
            setSubmissionResult(result);

            // Get AI feedback for improvements
            let aiFeedback = null;
            try {
                aiFeedback = await generateAIFeedback(code, language, result);
            } catch (e) {
                console.log('AI feedback unavailable');
            }

            setAiFeedback(aiFeedback);
            setIsSubmitted(true);

            if (onSubmit) {
                await onSubmit(code, language, result.overall_status === 'accepted', result.passed_tests);
            }
        } catch (error) {
            console.error('Submit failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // AI Feedback generator
    const generateAIFeedback = async (code: string, lang: string, result: SubmissionResult): Promise<AICodeFeedback> => {
        const GEMINI_API_KEY = 'AIzaSyC_kXHb3WddEkUOMz01ClNDisMd83IeDAs';
        const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

        const prompt = `You are a coding mentor. Analyze this ${lang} code submission and provide constructive feedback.

Code:
\`\`\`${lang}
${code}
\`\`\`

Test Results: ${result.passed_tests}/${result.total_tests} passed (${result.score}%)
Status: ${result.overall_status}

Provide feedback in this JSON format ONLY (no markdown):
{
    "score": ${result.score},
    "status": "${result.overall_status === 'accepted' ? 'Accepted' : 'Needs Improvement'}",
    "summary": "One sentence summary of the solution",
    "strengths": ["strength 1", "strength 2"],
    "improvements": ["improvement 1", "improvement 2"],
    "tips": ["tip for better code"],
    "timeComplexity": "O(?)",
    "spaceComplexity": "O(?)"
}`;

        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.3, maxOutputTokens: 1024 }
            })
        });

        if (!response.ok) throw new Error('AI unavailable');

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Invalid response');

        return JSON.parse(jsonMatch[0]);
    };

    const handleReset = () => {
        setCode(getStarterCode(language));
        setRunResult(null);
        setSubmissionResult(null);
        setIsSubmitted(false);
        setAiFeedback(null);
    };

    return (
        <div className="bg-[#0a0a0b] rounded-2xl overflow-hidden border border-white/10">
            {/* Editor Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <Code2 className="w-5 h-5 text-indigo-400" />
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                        <option value="python" className="bg-gray-900">Python 3</option>
                        <option value="javascript" className="bg-gray-900">JavaScript</option>
                        <option value="java" className="bg-gray-900">Java</option>
                        <option value="cpp" className="bg-gray-900">C++</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                    </button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleRun}
                        disabled={isRunning || isSubmitting}
                        className="bg-white/10 hover:bg-white/20"
                    >
                        {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        <span className="ml-1">Run</span>
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSubmit}
                        disabled={isRunning || isSubmitting}
                        className="bg-emerald-600 hover:bg-emerald-500"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        <span className="ml-1">Submit</span>
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-col lg:flex-row" style={{ height: '500px' }}>
                {/* Code Editor */}
                <div className="flex-1 min-w-0 border-b lg:border-b-0 lg:border-r border-white/10">
                    <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        spellCheck={false}
                        className="w-full h-full p-4 bg-transparent text-white font-mono text-sm resize-none focus:outline-none leading-relaxed"
                        placeholder="Write your code here..."
                        style={{ tabSize: 4 }}
                    />
                </div>

                {/* Test Cases Panel */}
                <div className="w-full lg:w-96 flex flex-col min-h-[200px] lg:min-h-0">
                    {/* Tabs */}
                    <div className="flex border-b border-white/10">
                        <button
                            onClick={() => setActiveTab('testcases')}
                            className={cn(
                                "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                                activeTab === 'testcases' ? "text-white border-b-2 border-indigo-500" : "text-gray-500"
                            )}
                        >
                            Test Cases
                        </button>
                        <button
                            onClick={() => setActiveTab('output')}
                            className={cn(
                                "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                                activeTab === 'output' ? "text-white border-b-2 border-indigo-500" : "text-gray-500"
                            )}
                        >
                            Output
                            {submissionResult && (
                                <Badge
                                    variant={submissionResult.overall_status === 'accepted' ? 'success' : 'danger'}
                                    size="sm"
                                    className="ml-2"
                                >
                                    {submissionResult.passed_tests}/{submissionResult.total_tests}
                                </Badge>
                            )}
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {activeTab === 'testcases' && (
                            <div className="space-y-4">
                                <div className="flex gap-2 flex-wrap">
                                    {visibleTestCases.map((tc, i) => (
                                        <button
                                            key={tc.id || i}
                                            onClick={() => setSelectedTestCase(i)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                                                selectedTestCase === i
                                                    ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                                                    : "bg-white/5 text-gray-400 border border-white/10"
                                            )}
                                        >
                                            Case {i + 1}
                                        </button>
                                    ))}
                                </div>
                                {visibleTestCases[selectedTestCase] && (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">Input</label>
                                            <pre className="p-2 bg-black/40 rounded text-sm text-white font-mono overflow-x-auto whitespace-pre-wrap">
                                                {visibleTestCases[selectedTestCase].input || '(empty)'}
                                            </pre>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">Expected Output</label>
                                            <pre className="p-2 bg-black/40 rounded text-sm text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap">
                                                {visibleTestCases[selectedTestCase].expected_output}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'output' && (
                            <div>
                                {submissionResult ? (
                                    <div className="space-y-3">
                                        {/* Score Header */}
                                        <div className={cn(
                                            "p-4 rounded-xl",
                                            submissionResult.overall_status === 'accepted'
                                                ? "bg-emerald-500/10 border border-emerald-500/20"
                                                : "bg-red-500/10 border border-red-500/20"
                                        )}>
                                            <div className="flex items-center gap-2">
                                                {submissionResult.overall_status === 'accepted' ? (
                                                    <Trophy className="w-6 h-6 text-emerald-400" />
                                                ) : (
                                                    <X className="w-6 h-6 text-red-400" />
                                                )}
                                                <div className="flex-1">
                                                    <h3 className={cn(
                                                        "font-bold",
                                                        submissionResult.overall_status === 'accepted' ? "text-emerald-400" : "text-red-400"
                                                    )}>
                                                        {submissionResult.overall_status === 'accepted' ? 'All Tests Passed!' : 'Some Tests Failed'}
                                                    </h3>
                                                    <p className="text-sm text-gray-400">
                                                        {submissionResult.passed_tests}/{submissionResult.total_tests} passed ({submissionResult.score}%)
                                                    </p>
                                                </div>
                                                {isSubmitted && (
                                                    <Badge variant="success" size="sm">Submitted</Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* AI Feedback (shown after submit) */}
                                        {isSubmitted && aiFeedback && (
                                            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-3">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Sparkles className="w-5 h-5 text-indigo-400" />
                                                    <h4 className="font-bold text-white">AI Feedback</h4>
                                                </div>

                                                <p className="text-gray-300 text-sm">{aiFeedback.summary}</p>

                                                {aiFeedback.timeComplexity && (
                                                    <div className="flex gap-4 text-xs">
                                                        <span className="text-gray-400">Time: <span className="text-white">{aiFeedback.timeComplexity}</span></span>
                                                        <span className="text-gray-400">Space: <span className="text-white">{aiFeedback.spaceComplexity}</span></span>
                                                    </div>
                                                )}

                                                {aiFeedback.strengths.length > 0 && (
                                                    <div>
                                                        <p className="text-xs font-bold text-emerald-400 mb-1">✓ Strengths</p>
                                                        <ul className="text-xs text-gray-300 space-y-1">
                                                            {aiFeedback.strengths.map((s, i) => (
                                                                <li key={i}>• {s}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {aiFeedback.improvements.length > 0 && (
                                                    <div>
                                                        <p className="text-xs font-bold text-amber-400 mb-1">↑ Improvements</p>
                                                        <ul className="text-xs text-gray-300 space-y-1">
                                                            {aiFeedback.improvements.map((s, i) => (
                                                                <li key={i}>• {s}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {aiFeedback.tips.length > 0 && (
                                                    <div>
                                                        <p className="text-xs font-bold text-blue-400 mb-1">💡 Tips</p>
                                                        <ul className="text-xs text-gray-300 space-y-1">
                                                            {aiFeedback.tips.map((s, i) => (
                                                                <li key={i}>• {s}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {isSubmitting && (
                                            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-3">
                                                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                                                <span className="text-sm text-gray-300">Getting AI feedback...</span>
                                            </div>
                                        )}

                                        {/* Test Case Results */}
                                        <div className="space-y-2">
                                            <p className="text-xs font-bold text-gray-500 uppercase">Test Results</p>
                                            {submissionResult.results.map((r, i) => {
                                                // Check if this test case is hidden
                                                const testCase = allTestCases.find(tc => tc.id === r.test_case_id || `tc_${allTestCases.indexOf(tc)}` === r.test_case_id);
                                                const isHidden = testCase?.is_hidden;

                                                return (
                                                    <div key={r.test_case_id} className={cn(
                                                        "flex items-center justify-between p-3 rounded-lg",
                                                        r.passed ? "bg-emerald-500/10" : "bg-red-500/10"
                                                    )}>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-white">Test Case {i + 1}</span>
                                                            {isHidden && (
                                                                <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400">Hidden</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-gray-500">{r.execution_time}ms</span>
                                                            {r.passed ? (
                                                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                                            ) : (
                                                                <X className="w-5 h-5 text-red-400" />
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : runResult ? (
                                    <div className={cn(
                                        "p-4 rounded-xl",
                                        runResult.passed ? "bg-emerald-500/10" : "bg-red-500/10"
                                    )}>
                                        <div className="flex items-center gap-2 mb-3">
                                            {runResult.passed ? (
                                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                            ) : (
                                                <X className="w-5 h-5 text-red-400" />
                                            )}
                                            <span className={runResult.passed ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                                                {runResult.passed ? 'Passed' : 'Failed'}
                                            </span>
                                            <span className="text-xs text-gray-500 ml-auto">{runResult.execution_time}ms</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div>
                                                <label className="text-xs text-gray-500">Your Output:</label>
                                                <pre className="p-2 bg-black/40 rounded text-sm text-white font-mono mt-1 overflow-x-auto">
                                                    {runResult.actual_output || '(empty)'}
                                                </pre>
                                            </div>
                                            {!runResult.passed && (
                                                <div>
                                                    <label className="text-xs text-gray-500">Expected:</label>
                                                    <pre className="p-2 bg-black/40 rounded text-sm text-emerald-400 font-mono mt-1 overflow-x-auto">
                                                        {runResult.expected_output}
                                                    </pre>
                                                </div>
                                            )}
                                            {runResult.error && (
                                                <div>
                                                    <label className="text-xs text-red-400">Error:</label>
                                                    <pre className="p-2 bg-red-500/10 rounded text-sm text-red-300 font-mono mt-1 overflow-x-auto">
                                                        {runResult.error}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        <TerminalIcon className="w-10 h-10 mx-auto mb-3 opacity-50" />
                                        <p className="text-sm">Run your code to test against sample inputs</p>
                                        <p className="text-xs text-gray-600 mt-1">No interactive input needed - test cases provide the input!</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const QuizTaker = ({
    assessment,
    onSubmit,
    onCancel
}: {
    assessment: Assessment;
    onSubmit: (answers: Record<string, string>) => void;
    onCancel: () => void;
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [showConfirm, setShowConfirm] = useState(false);

    const questions = assessment.questions || [];
    const currentQuestion = questions[currentIndex];
    const answeredCount = Object.keys(answers).filter(k => answers[k]).length;

    const handleAnswer = (value: string) => {
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
    };

    const handleTimeUp = useCallback(() => {
        onSubmit(answers);
    }, [answers, onSubmit]);

    const handleSubmitClick = () => {
        if (answeredCount < questions.length) {
            setShowConfirm(true);
        } else {
            onSubmit(answers);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white">{assessment.title}</h2>
                    <p className="text-sm text-gray-400 mt-1">
                        Question {currentIndex + 1} of {questions.length} • {answeredCount} answered
                    </p>
                </div>
                <Timer timeLimit={assessment.time_limit} onTimeUp={handleTimeUp} />
            </div>

            {/* Progress */}
            <div className="flex gap-1">
                {questions.map((q, i) => (
                    <button
                        key={q.id}
                        onClick={() => setCurrentIndex(i)}
                        className={cn(
                            "flex-1 h-2 rounded-full transition-all",
                            i === currentIndex ? "bg-indigo-500" :
                                answers[q.id] ? "bg-emerald-500" : "bg-white/20"
                        )}
                    />
                ))}
            </div>

            {/* Question */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentQuestion.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Badge variant="primary" size="sm">
                            {currentQuestion.type.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm text-gray-500">{currentQuestion.points} points</span>
                    </div>

                    <h3 className="text-xl text-white font-medium mb-6">{currentQuestion.content}</h3>

                    {/* MCQ Options */}
                    {currentQuestion.type === 'mcq' && currentQuestion.options && (
                        <div className="space-y-3">
                            {currentQuestion.options.map((option, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleAnswer(option)}
                                    className={cn(
                                        "w-full p-4 rounded-xl text-left transition-all flex items-center gap-3",
                                        answers[currentQuestion.id] === option
                                            ? "bg-indigo-500/20 border-2 border-indigo-500 text-white"
                                            : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"
                                    )}
                                >
                                    <span className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                                        answers[currentQuestion.id] === option
                                            ? "bg-indigo-500 text-white"
                                            : "bg-white/10 text-gray-400"
                                    )}>
                                        {String.fromCharCode(65 + i)}
                                    </span>
                                    {option}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* True/False */}
                    {currentQuestion.type === 'true_false' && (
                        <div className="flex gap-4">
                            {['True', 'False'].map(option => (
                                <button
                                    key={option}
                                    onClick={() => handleAnswer(option)}
                                    className={cn(
                                        "flex-1 p-4 rounded-xl text-center transition-all",
                                        answers[currentQuestion.id] === option
                                            ? "bg-indigo-500/20 border-2 border-indigo-500 text-white"
                                            : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"
                                    )}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Short/Long Answer */}
                    {(currentQuestion.type === 'short_answer' || currentQuestion.type === 'long_answer') && (
                        <textarea
                            value={answers[currentQuestion.id] || ''}
                            onChange={(e) => handleAnswer(e.target.value)}
                            rows={currentQuestion.type === 'long_answer' ? 6 : 3}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 resize-none"
                            placeholder="Type your answer here..."
                        />
                    )}

                    {/* Coding Challenge */}
                    {currentQuestion.type === 'coding' && (
                        <CodingQuestionView
                            question={currentQuestion}
                            value={answers[currentQuestion.id] || ''}
                            onChange={(code, testResults) => {
                                handleAnswer(JSON.stringify({ code, testResults }));
                            }}
                        />
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                    Previous
                </Button>

                <div className="flex gap-2">
                    <Button variant="ghost" onClick={onCancel}>
                        Cancel
                    </Button>
                    {currentIndex === questions.length - 1 ? (
                        <Button onClick={handleSubmitClick} leftIcon={<Send className="w-4 h-4" />}>
                            Submit Assessment
                        </Button>
                    ) : (
                        <Button
                            onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                            rightIcon={<ArrowRight className="w-4 h-4" />}
                        >
                            Next
                        </Button>
                    )}
                </div>
            </div>

            {/* Confirm Dialog */}
            <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)} title="Submit Assessment?" size="md">
                <div className="text-center py-4">
                    <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                    <p className="text-white text-lg mb-2">
                        You have {questions.length - answeredCount} unanswered questions
                    </p>
                    <p className="text-gray-400">Are you sure you want to submit?</p>
                </div>
                <div className="flex justify-center gap-4 mt-6">
                    <Button variant="ghost" onClick={() => setShowConfirm(false)}>
                        Go Back
                    </Button>
                    <Button onClick={() => onSubmit(answers)}>
                        Submit Anyway
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

// Results Component
const ResultsView = ({
    assessment,
    result,
    studentAnswers,
    onClose
}: {
    assessment: Assessment;
    result: GradingResult;
    studentAnswers: Record<string, string>;
    onClose: () => void;
}) => {
    const passed = result.percentage >= (assessment.passing_score || 70);

    return (
        <div className="space-y-6">
            {/* Score Header */}
            <div className={cn(
                "text-center py-8 rounded-2xl",
                passed ? "bg-gradient-to-br from-emerald-500/20 to-green-500/10" : "bg-gradient-to-br from-red-500/20 to-orange-500/10"
            )}>
                <div className={cn(
                    "w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center",
                    passed ? "bg-emerald-500/20" : "bg-red-500/20"
                )}>
                    {passed ? (
                        <Trophy className="w-12 h-12 text-emerald-400" />
                    ) : (
                        <Target className="w-12 h-12 text-red-400" />
                    )}
                </div>
                <h2 className="text-4xl font-bold text-white mb-2">{result.percentage}%</h2>
                <p className={cn("text-lg font-medium", passed ? "text-emerald-400" : "text-red-400")}>
                    Grade: {result.grade} • {passed ? 'Passed!' : 'Not Passed'}
                </p>
                <p className="text-gray-400 mt-2">
                    {result.total_score} / {result.max_score} points
                </p>
            </div>

            {/* AI Feedback */}
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-medium text-white">AI Feedback</h3>
                </div>
                <p className="text-gray-300">{result.overall_feedback}</p>
            </div>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-2 gap-4">
                {result.strengths.length > 0 && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                        <h4 className="font-medium text-emerald-400 mb-2">Strengths</h4>
                        <ul className="space-y-1">
                            {result.strengths.map((s, i) => (
                                <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                    {s}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {result.areas_to_improve.length > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                        <h4 className="font-medium text-amber-400 mb-2">Areas to Improve</h4>
                        <ul className="space-y-1">
                            {result.areas_to_improve.map((s, i) => (
                                <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                    {s}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Question Results */}
            <div>
                <h3 className="font-medium text-white mb-4">Question Breakdown</h3>
                <div className="space-y-4">
                    {result.question_results.map((qr, i) => {
                        const question = assessment.questions?.find(q => q.id === qr.question_id);
                        const studentAnswer = studentAnswers[qr.question_id];
                        const correctAnswerIndex = question?.correct_answer ? parseInt(question.correct_answer) : -1;
                        const studentAnswerIndex = studentAnswer ? parseInt(studentAnswer) : -1;
                        
                        return (
                            <div key={qr.question_id} className={cn(
                                "p-4 rounded-xl border",
                                qr.is_correct
                                    ? "bg-emerald-500/10 border-emerald-500/20"
                                    : "bg-red-500/10 border-red-500/20"
                            )}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-400">Question {i + 1}</span>
                                    <span className={cn(
                                        "text-sm font-bold",
                                        qr.is_correct ? "text-emerald-400" : "text-red-400"
                                    )}>
                                        {qr.score}/{qr.max_score} pts
                                    </span>
                                </div>
                                <p className="text-white text-sm mb-3">{question?.content}</p>
                                
                                {/* Options with answer highlighting */}
                                {question?.options && question.options.length > 0 && (
                                    <div className="space-y-2 mb-3">
                                        {question.options.map((option, optIndex) => {
                                            const isCorrect = optIndex === correctAnswerIndex;
                                            const isSelected = optIndex === studentAnswerIndex;
                                            const letter = String.fromCharCode(65 + optIndex); // A, B, C, D
                                            
                                            return (
                                                <div 
                                                    key={optIndex}
                                                    className={cn(
                                                        "flex items-center gap-2 p-2 rounded-lg text-sm",
                                                        isCorrect && "bg-emerald-500/20 border border-emerald-500/40",
                                                        isSelected && !isCorrect && "bg-red-500/20 border border-red-500/40",
                                                        !isCorrect && !isSelected && "bg-white/5"
                                                    )}
                                                >
                                                    <span className={cn(
                                                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                                        isCorrect && "bg-emerald-500 text-white",
                                                        isSelected && !isCorrect && "bg-red-500 text-white",
                                                        !isCorrect && !isSelected && "bg-white/10 text-gray-400"
                                                    )}>
                                                        {letter}
                                                    </span>
                                                    <span className={cn(
                                                        "flex-1",
                                                        isCorrect && "text-emerald-300",
                                                        isSelected && !isCorrect && "text-red-300",
                                                        !isCorrect && !isSelected && "text-gray-400"
                                                    )}>
                                                        {option}
                                                    </span>
                                                    {isCorrect && (
                                                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                                                    )}
                                                    {isSelected && !isCorrect && (
                                                        <XCircle className="w-4 h-4 text-red-400" />
                                                    )}
                                                    {isSelected && (
                                                        <span className="text-xs text-gray-500 ml-1">Your answer</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                
                                <p className="text-gray-400 text-sm italic">{qr.feedback}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            <Button className="w-full" onClick={onClose}>
                Done
            </Button>
        </div>
    );
};

export const StudentAssessmentsPage: React.FC = () => {
    const { user } = useAuthStore();
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [submissions, setSubmissions] = useState<AssessmentSubmission[]>([]);
    const [codingSubmissions, setCodingSubmissions] = useState<CodingSubmission[]>([]);
    const [codingChallenges, setCodingChallenges] = useState<CodingChallenge[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
    const [showQuiz, setShowQuiz] = useState(false);
    const [isGrading, setIsGrading] = useState(false);
    const [gradingResult, setGradingResult] = useState<GradingResult | null>(null);
    const [showResults, setShowResults] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState<AssessmentSubmission | null>(null);
    const [showSubmissionDetails, setShowSubmissionDetails] = useState(false);
    const [activeTab, setActiveTab] = useState<'assessments' | 'challenges' | 'coding'>('assessments');
    const [selectedChallenge, setSelectedChallenge] = useState<CodingChallenge | null>(null);
    const [challengeTestCases, setChallengeTestCases] = useState<ChallengeTestCase[]>([]);
    const [allChallengeTestCases, setAllChallengeTestCases] = useState<ChallengeTestCase[]>([]);
    const [isLoadingChallenge, setIsLoadingChallenge] = useState(false);
    const [challengeSubmittedNow, setChallengeSubmittedNow] = useState(false);
    const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, string>>({});

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [assessmentsData, submissionsData, challengesData, codingSubmissionsData] = await Promise.all([
                assessmentService.getAll(),
                user ? assessmentService.getStudentSubmissions(user.id) : Promise.resolve([]),
                codingChallengeService.getAll(),
                user ? codingChallengeService.getMySubmissions(user.id) : Promise.resolve([])
            ]);
            // Filter to only show assessments with questions
            setAssessments(assessmentsData.filter(a => a.questions && a.questions.length > 0));
            setSubmissions(submissionsData);
            setCodingChallenges(challengesData);
            setCodingSubmissions(codingSubmissionsData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to get coding submission for a challenge
    const getCodingSubmission = (challengeId: string): CodingSubmission | undefined => {
        return codingSubmissions.find(s => s.challenge_id === challengeId);
    };

    // Helper to check if assessment was completed
    const getSubmissionForAssessment = (assessmentId: string): AssessmentSubmission | undefined => {
        return submissions.find(s => s.assessment_id === assessmentId);
    };

    const startAssessment = (assessment: Assessment) => {
        setSelectedAssessment(assessment);
        setShowQuiz(true);
    };

    const selectChallenge = async (challenge: CodingChallenge) => {
        setIsLoadingChallenge(true);
        setChallengeTestCases([]);
        setAllChallengeTestCases([]);
        setChallengeSubmittedNow(false); // Reset for new challenge

        try {
            // Fetch challenge with test cases
            const fullChallenge = await codingChallengeService.getById(challenge.id);
            setSelectedChallenge(fullChallenge);

            // Store all test cases for execution
            setAllChallengeTestCases(fullChallenge.test_cases || []);

            // Only show non-hidden test cases to students
            const visibleTestCases = (fullChallenge.test_cases || []).filter(tc => !tc.is_hidden);
            setChallengeTestCases(visibleTestCases);
            setActiveTab('coding');
        } catch (error) {
            console.error('Error fetching challenge details:', error);
            // Fallback: use basic challenge info
            setSelectedChallenge(challenge);
            setActiveTab('coding');
        } finally {
            setIsLoadingChallenge(false);
        }
    };

    const handleChallengeSubmit = async (code: string, language: string, passed: boolean, passedCount?: number) => {
        if (!selectedChallenge || !user) return;

        try {
            const testsPassed = passedCount ?? (passed ? allChallengeTestCases.length : 0);
            const score = Math.round((testsPassed / allChallengeTestCases.length) * (selectedChallenge.points || 100));

            // Save submission to database
            await codingChallengeService.submit({
                challenge_id: selectedChallenge.id,
                student_id: user.id,
                code: code,
                language: language,
                test_cases_passed: testsPassed,
                total_test_cases: allChallengeTestCases.length,
                score: score,
                status: passed ? 'passed' : 'failed'
            });

            // Mark as submitted in current session
            setChallengeSubmittedNow(true);

            // Refresh submissions to update list
            fetchData();
        } catch (error) {
            console.error('Error saving submission:', error);
        }
    };


    const handleSubmitAssessment = async (answers: Record<string, string>) => {
        if (!selectedAssessment || !user) return;

        setShowQuiz(false);
        setIsGrading(true);
        setSubmittedAnswers(answers); // Save answers for results view

        try {
            // Convert answers to the format expected by Gemini
            const studentAnswers = Object.entries(answers).map(([question_id, answer]) => ({
                question_id,
                answer
            }));

            // Convert questions to the format expected by Gemini
            const questions = (selectedAssessment.questions || []).map(q => ({
                id: q.id,
                type: q.type as 'mcq' | 'short_answer' | 'long_answer' | 'true_false',
                question: q.content,
                options: q.options,
                correct_answer: q.correct_answer,
                points: q.points
            }));

            // Grade with AI
            const result = await geminiService.gradeAssessment(
                questions,
                studentAnswers,
                selectedAssessment.title
            );

            setGradingResult(result);

            // Save submission to database
            try {
                await assessmentService.submit({
                    assessment_id: selectedAssessment.id,
                    student_id: user.id,
                    answers: answers,
                    score: result.percentage,
                    ai_score: result.percentage,
                    ai_feedback: {
                        grade: result.grade,
                        overall_feedback: result.overall_feedback,
                        strengths: result.strengths,
                        areas_to_improve: result.areas_to_improve,
                        question_results: result.question_results,
                        total_score: result.total_score,
                        max_score: result.max_score
                    }
                });
            } catch (saveError) {
                console.error('Error saving submission:', saveError);
            }

            setShowResults(true);
        } catch (error) {
            console.error('Error grading assessment:', error);
            alert('Error grading assessment. Please try again.');
        } finally {
            setIsGrading(false);
        }
    };

    const handleCloseResults = () => {
        setShowResults(false);
        setGradingResult(null);
        setSelectedAssessment(null);
        // Refresh data to show updated submission status
        fetchData();
    };

    const viewSubmissionDetails = (submission: AssessmentSubmission, assessment: Assessment) => {
        setSelectedSubmission(submission);
        setSelectedAssessment(assessment);
        setShowSubmissionDetails(true);
    };

    // Separate completed and available assessments
    const completedAssessmentIds = new Set(submissions.map(s => s.assessment_id));

    // Available assessments (not expired and not completed)
    const availableAssessments = assessments.filter(a =>
        (!a.due_date || new Date(a.due_date) > new Date()) && !completedAssessmentIds.has(a.id)
    );

    // Completed assessments
    const completedAssessments = assessments.filter(a => completedAssessmentIds.has(a.id));

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* Quiz Modal */}
            <Modal
                isOpen={showQuiz}
                onClose={() => setShowQuiz(false)}
                title=""
                size="xl"
                closable={false}
            >
                {selectedAssessment && (
                    <QuizTaker
                        assessment={selectedAssessment}
                        onSubmit={handleSubmitAssessment}
                        onCancel={() => setShowQuiz(false)}
                    />
                )}
            </Modal>

            {/* Grading Loading */}
            <Modal isOpen={isGrading} onClose={() => { }} title="AI Grading in Progress" size="md" closable={false}>
                <div className="text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-6">
                        <Sparkles className="w-10 h-10 text-indigo-400 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Analyzing Your Answers</h3>
                    <p className="text-gray-400">Our AI is grading your assessment...</p>
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mt-6" />
                </div>
            </Modal>

            {/* Results Modal */}
            <Modal
                isOpen={showResults}
                onClose={handleCloseResults}
                title="Assessment Results"
                size="lg"
            >
                {selectedAssessment && gradingResult && (
                    <ResultsView
                        assessment={selectedAssessment}
                        result={gradingResult}
                        studentAnswers={submittedAnswers}
                        onClose={handleCloseResults}
                    />
                )}
            </Modal>

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Assessments & Labs</h1>
                <p className="text-gray-400 mt-1">Take quizzes and practice coding in the lab</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-white/10 pb-1">
                <button
                    onClick={() => setActiveTab('assessments')}
                    className={cn(
                        "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative",
                        activeTab === 'assessments' ? "text-white" : "text-gray-400 hover:text-white"
                    )}
                >
                    <FileCheck className="w-4 h-4" />
                    Assessments
                    {activeTab === 'assessments' && (
                        <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('challenges')}
                    className={cn(
                        "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative",
                        activeTab === 'challenges' ? "text-white" : "text-gray-400 hover:text-white"
                    )}
                >
                    <Trophy className="w-4 h-4" />
                    Coding Challenges
                    {codingChallenges.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-indigo-500/20 text-indigo-400 rounded-full">
                            {codingChallenges.length}
                        </span>
                    )}
                    {activeTab === 'challenges' && (
                        <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('coding')}
                    className={cn(
                        "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative",
                        activeTab === 'coding' ? "text-white" : "text-gray-400 hover:text-white"
                    )}
                >
                    <Code2 className="w-4 h-4" />
                    Coding Lab
                    {activeTab === 'coding' && (
                        <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
                    )}
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'assessments' ? (
                    <motion.div
                        key="assessments"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {/* Stats */}
                        <div className="grid grid-cols-4 gap-4">
                            <Card variant="default" padding="md">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-400">Available</p>
                                        <p className="text-2xl font-bold text-white mt-1">{availableAssessments.length}</p>
                                    </div>
                                    <FileCheck className="w-8 h-8 text-blue-400" />
                                </div>
                            </Card>
                            <Card variant="default" padding="md">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-400">Completed</p>
                                        <p className="text-2xl font-bold text-emerald-400 mt-1">{submissions.length}</p>
                                    </div>
                                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                                </div>
                            </Card>
                            <Card variant="default" padding="md">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-400">Avg Score</p>
                                        <p className="text-2xl font-bold text-white mt-1">
                                            {submissions.length > 0
                                                ? Math.round(submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length)
                                                : 0}%
                                        </p>
                                    </div>
                                    <BarChart2 className="w-8 h-8 text-amber-400" />
                                </div>
                            </Card>
                            <Card variant="default" padding="md">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-400">Best Score</p>
                                        <p className="text-2xl font-bold text-white mt-1">
                                            {submissions.length > 0
                                                ? Math.max(...submissions.map(s => s.score || 0))
                                                : 0}%
                                        </p>
                                    </div>
                                    <Trophy className="w-8 h-8 text-rose-400" />
                                </div>
                            </Card>
                        </div>

                        {/* Loading */}
                        {isLoading && (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                            </div>
                        )}

                        {/* Assessment List */}
                        {!isLoading && (
                            <div className="space-y-4">
                                {availableAssessments.map((assessment, index) => {
                                    const moduleColor = getModuleColor(assessment.module || 'python');
                                    const questionCount = assessment.questions?.length || 0;
                                    const totalPoints = assessment.questions?.reduce((sum, q) => sum + q.points, 0) || 0;
                                    const dueDate = assessment.due_date ? new Date(assessment.due_date) : null;
                                    const isDueSoon = dueDate && dueDate <= new Date(Date.now() + 24 * 60 * 60 * 1000);

                                    return (
                                        <motion.div
                                            key={assessment.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
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
                                                                {assessment.ai_grading_enabled && (
                                                                    <Badge variant="primary" size="sm">
                                                                        <Sparkles className="w-3 h-3 mr-1" />
                                                                        AI Graded
                                                                    </Badge>
                                                                )}
                                                                {isDueSoon && (
                                                                    <Badge variant="danger" size="sm">
                                                                        Due Soon
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <h3 className="text-lg font-semibold text-white">{assessment.title}</h3>
                                                            <p className="text-gray-400 text-sm mt-1">{assessment.description}</p>

                                                            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                                                                <span className="flex items-center gap-1">
                                                                    <BarChart2 className="w-4 h-4" />
                                                                    {questionCount} questions • {totalPoints} pts
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="w-4 h-4" />
                                                                    {assessment.time_limit} min
                                                                </span>
                                                                {dueDate && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Calendar className="w-4 h-4" />
                                                                        Due: {formatDate(assessment.due_date)}
                                                                    </span>
                                                                )}
                                                                <span className="flex items-center gap-1">
                                                                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                                                                    Pass: {assessment.passing_score || 70}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <Button
                                                        onClick={() => startAssessment(assessment)}
                                                        leftIcon={<Play className="w-4 h-4" />}
                                                    >
                                                        Start
                                                    </Button>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}

                        {!isLoading && availableAssessments.length === 0 && completedAssessments.length === 0 && (
                            <Card variant="default" padding="lg" className="text-center">
                                <FileCheck className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-white">No assessments available</h3>
                                <p className="text-gray-400 mt-1">Check back later for new quizzes and tests</p>
                            </Card>
                        )}

                        {/* Completed Assessments Section */}
                        {!isLoading && completedAssessments.length > 0 && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                    Completed Assessments
                                </h2>
                                {completedAssessments.map((assessment, index) => {
                                    const submission = getSubmissionForAssessment(assessment.id);
                                    const moduleColor = getModuleColor(assessment.module || 'python');
                                    const passed = (submission?.score || 0) >= (assessment.passing_score || 70);

                                    return (
                                        <motion.div
                                            key={assessment.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <Card variant="default" padding="md" className={cn(
                                                "border-l-4",
                                                passed ? "border-l-emerald-500" : "border-l-red-500"
                                            )}>
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-start gap-4 flex-1">
                                                        <div className={cn(
                                                            'w-12 h-12 rounded-xl flex items-center justify-center',
                                                            passed ? 'bg-emerald-500/20' : 'bg-red-500/20'
                                                        )}>
                                                            {passed ? (
                                                                <Trophy className="w-6 h-6 text-emerald-400" />
                                                            ) : (
                                                                <Target className="w-6 h-6 text-red-400" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                <Badge className={cn(moduleColor.bg, moduleColor.text, moduleColor.border)} size="sm">
                                                                    {(assessment.module || 'python').replace('_', ' ')}
                                                                </Badge>
                                                                <Badge
                                                                    variant={passed ? "success" : "danger"}
                                                                    size="sm"
                                                                    className={passed ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}
                                                                >
                                                                    {passed ? 'Passed' : 'Not Passed'}
                                                                </Badge>
                                                            </div>
                                                            <h3 className="text-lg font-semibold text-white">{assessment.title}</h3>
                                                            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="w-4 h-4" />
                                                                    Completed {submission?.submitted_at ? formatRelativeTime(submission.submitted_at) : 'recently'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-end gap-2">
                                                        <div className={cn(
                                                            "text-3xl font-bold",
                                                            passed ? "text-emerald-400" : "text-red-400"
                                                        )}>
                                                            {submission?.score || 0}%
                                                        </div>
                                                        <span className="text-sm text-gray-500">
                                                            Pass: {assessment.passing_score || 70}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                ) : activeTab === 'challenges' ? (
                    <motion.div
                        key="challenges"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {/* Challenges Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-white">Available Challenges</h2>
                                <p className="text-sm text-gray-400">Solve coding problems to earn points</p>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                            </div>
                        ) : codingChallenges.length === 0 ? (
                            <Card variant="default" padding="lg" className="text-center">
                                <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-white mb-2">No Challenges Yet</h3>
                                <p className="text-gray-400">Check back later for new coding challenges!</p>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {codingChallenges.map((challenge, index) => {
                                    const moduleColor = getModuleColor(challenge.module || 'python');
                                    const difficultyColors = {
                                        easy: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                                        medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                                        hard: 'bg-red-500/20 text-red-400 border-red-500/30'
                                    };

                                    // Check if this challenge has been completed
                                    const submission = getCodingSubmission(challenge.id);
                                    const isCompleted = !!submission;
                                    const isPassed = submission?.status === 'passed';

                                    return (
                                        <motion.div
                                            key={challenge.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <Card variant="default" padding="md" className={cn(
                                                "hover:ring-1 transition-all cursor-pointer group",
                                                isCompleted
                                                    ? isPassed
                                                        ? "ring-1 ring-emerald-500/30 hover:ring-emerald-500/50"
                                                        : "ring-1 ring-amber-500/30 hover:ring-amber-500/50"
                                                    : "hover:ring-indigo-500/50"
                                            )}>
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <Badge className={cn(moduleColor.bg, moduleColor.text, moduleColor.border)} size="sm">
                                                            {(challenge.module || 'python').replace('_', ' ')}
                                                        </Badge>
                                                        <Badge className={difficultyColors[challenge.difficulty || 'medium']} size="sm">
                                                            {challenge.difficulty || 'medium'}
                                                        </Badge>
                                                        {isCompleted && (
                                                            <Badge
                                                                className={isPassed
                                                                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                                                    : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                                                }
                                                                size="sm"
                                                            >
                                                                {isPassed ? (
                                                                    <><CheckCircle2 className="w-3 h-3 mr-1" />Completed</>
                                                                ) : (
                                                                    <><AlertCircle className="w-3 h-3 mr-1" />Attempted</>
                                                                )}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-indigo-400 font-bold">
                                                        <Trophy className="w-4 h-4" />
                                                        {isCompleted ? `${submission?.score || 0}/` : ''}{challenge.points || 0} pts
                                                    </div>
                                                </div>

                                                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                                                    {challenge.title}
                                                </h3>

                                                <p className="text-sm text-gray-400 line-clamp-2 mb-4">
                                                    {challenge.description || 'No description available'}
                                                </p>

                                                {isCompleted && submission && (
                                                    <div className="mb-3 p-2 rounded-lg bg-white/5 text-xs text-gray-400">
                                                        <div className="flex justify-between">
                                                            <span>Tests Passed:</span>
                                                            <span className={isPassed ? "text-emerald-400" : "text-amber-400"}>
                                                                {submission.test_cases_passed}/{submission.total_test_cases}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between mt-1">
                                                            <span>Submitted:</span>
                                                            <span>{formatRelativeTime(submission.submitted_at)}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                                                    <span className="text-xs text-gray-500">
                                                        {challenge.time_limit ? `${challenge.time_limit} min` : 'No time limit'}
                                                    </span>
                                                    <Button
                                                        size="sm"
                                                        variant={isCompleted ? "secondary" : "primary"}
                                                        onClick={() => selectChallenge(challenge)}
                                                    >
                                                        {isCompleted ? (
                                                            <><Eye className="w-4 h-4 mr-1" />Review</>
                                                        ) : (
                                                            <><Play className="w-4 h-4 mr-1" />Solve</>
                                                        )}
                                                    </Button>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="coding"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        {selectedChallenge ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => {
                                                setSelectedChallenge(null);
                                                setChallengeTestCases([]);
                                            }}
                                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                        >
                                            <ArrowLeft className="w-5 h-5 text-gray-400" />
                                        </button>
                                        <div>
                                            <h2 className="text-lg font-semibold text-white">{selectedChallenge.title}</h2>
                                            <p className="text-sm text-gray-400">{selectedChallenge.points} points • {selectedChallenge.difficulty}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Challenge Description */}
                                <Card variant="default" padding="md">
                                    <h3 className="text-sm font-medium text-gray-400 mb-2">Problem Description</h3>
                                    <p className="text-white whitespace-pre-wrap">{selectedChallenge.description}</p>

                                    {selectedChallenge.constraints && (
                                        <div className="mt-4 pt-4 border-t border-white/10">
                                            <h4 className="text-sm font-medium text-gray-400 mb-2">Constraints</h4>
                                            <p className="text-gray-300 text-sm whitespace-pre-wrap">{selectedChallenge.constraints}</p>
                                        </div>
                                    )}

                                    {/* Sample Test Cases */}
                                    {challengeTestCases.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-white/10">
                                            <h4 className="text-sm font-medium text-gray-400 mb-3">Sample Test Cases</h4>
                                            <div className="space-y-3">
                                                {challengeTestCases.map((tc, idx) => (
                                                    <div key={tc.id || idx} className="bg-[#0d1117] rounded-lg p-4 border border-white/10">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-xs font-bold text-indigo-400">Example {idx + 1}</span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Input</p>
                                                                <pre className="text-sm text-emerald-400 font-mono bg-black/30 p-2 rounded whitespace-pre-wrap">{tc.input || '(no input)'}</pre>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Expected Output</p>
                                                                <pre className="text-sm text-cyan-400 font-mono bg-black/30 p-2 rounded whitespace-pre-wrap">{tc.expected_output}</pre>
                                                            </div>
                                                        </div>
                                                        {tc.explanation && (
                                                            <div className="mt-2 pt-2 border-t border-white/5">
                                                                <p className="text-xs text-gray-500">{tc.explanation}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-600 mt-2 italic">
                                                Note: Your code will be tested against additional hidden test cases.
                                            </p>
                                        </div>
                                    )}
                                </Card>

                                {/* Code Editor with Test Cases */}
                                <ChallengeCodeEditor
                                    challenge={selectedChallenge}
                                    testCases={allChallengeTestCases.length > 0 ? allChallengeTestCases : challengeTestCases}
                                    visibleTestCases={challengeTestCases}
                                    previousSubmission={getCodingSubmission(selectedChallenge.id)}
                                    alreadySubmitted={challengeSubmittedNow || !!getCodingSubmission(selectedChallenge.id)}
                                    onSubmit={handleChallengeSubmit}
                                />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <Code2 className="w-6 h-6 text-indigo-400" />
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">Practice Playground</h2>
                                        <p className="text-sm text-gray-400">Write and run code freely - no test cases, just practice!</p>
                                    </div>
                                </div>
                                <CodePlayground mode="playground" />
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
