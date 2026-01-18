import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Play, 
    RotateCcw, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    ChevronDown,
    Code2,
    Terminal,
    Loader2,
    AlertTriangle,
    Trophy,
    Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, Badge } from '@/components/ui';
import { codeExecutionService, type TestCase, type SubmissionResult, type TestResult } from '@/services/codeExecution';

interface CodeEditorProps {
    testCases: TestCase[];
    language?: string;
    starterCode?: string;
    onSubmit?: (result: SubmissionResult, code: string) => void;
    readOnly?: boolean;
    showHiddenTestCases?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
    testCases,
    language: initialLanguage = 'python',
    starterCode,
    onSubmit,
    readOnly = false,
    showHiddenTestCases = false,
}) => {
    const [language, setLanguage] = useState(initialLanguage);
    const [code, setCode] = useState(starterCode || codeExecutionService.getStarterCode(initialLanguage));
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'testcases' | 'output'>('testcases');
    const [selectedTestCase, setSelectedTestCase] = useState(0);
    const [runResult, setRunResult] = useState<TestResult | null>(null);
    const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
    const [output, setOutput] = useState<string>('');

    const languages = codeExecutionService.getLanguages();
    const visibleTestCases = showHiddenTestCases 
        ? testCases 
        : testCases.filter(tc => !tc.is_hidden);

    useEffect(() => {
        if (starterCode) {
            setCode(starterCode);
        }
    }, [starterCode]);

    const handleLanguageChange = (newLanguage: string) => {
        setLanguage(newLanguage);
        if (!starterCode) {
            setCode(codeExecutionService.getStarterCode(newLanguage));
        }
    };

    const handleRun = async () => {
        if (!visibleTestCases[selectedTestCase]) return;
        
        setIsRunning(true);
        setActiveTab('output');
        setRunResult(null);
        setOutput('Running...');

        try {
            const testCase = visibleTestCases[selectedTestCase];
            const { output: execOutput, error, executionTime } = await codeExecutionService.executeCode(
                code,
                language,
                testCase.input
            );

            const normalizedOutput = execOutput.trim().toLowerCase();
            const normalizedExpected = testCase.expected_output.trim().toLowerCase();
            const passed = !error && normalizedOutput === normalizedExpected;

            const result: TestResult = {
                test_case_id: testCase.id,
                passed,
                actual_output: execOutput || error || '',
                expected_output: testCase.expected_output,
                execution_time: executionTime,
                error,
            };

            setRunResult(result);
            setOutput(execOutput || error || 'No output');
        } catch (error) {
            setOutput('Execution failed. Please try again.');
        } finally {
            setIsRunning(false);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setActiveTab('output');
        setSubmissionResult(null);

        try {
            const result = await codeExecutionService.runTestCases(code, language, testCases);
            setSubmissionResult(result);
            
            if (onSubmit) {
                onSubmit(result, code);
            }
        } catch (error) {
            console.error('Submission failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setCode(starterCode || codeExecutionService.getStarterCode(language));
        setRunResult(null);
        setSubmissionResult(null);
        setOutput('');
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0a0b] rounded-2xl overflow-hidden border border-white/10">
            {/* Editor Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <Code2 className="w-5 h-5 text-indigo-400" />
                    <select
                        value={language}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        disabled={readOnly}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                        {languages.map(lang => (
                            <option key={lang.id} value={lang.id} className="bg-gray-900">
                                {lang.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleReset}
                        disabled={readOnly}
                        className="text-gray-400 hover:text-white"
                    >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Reset
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleRun}
                        disabled={isRunning || isSubmitting || readOnly}
                        className="bg-white/10 hover:bg-white/20"
                    >
                        {isRunning ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                            <Play className="w-4 h-4 mr-1" />
                        )}
                        Run
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSubmit}
                        disabled={isRunning || isSubmitting || readOnly}
                        className="bg-emerald-600 hover:bg-emerald-500"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                            <Zap className="w-4 h-4 mr-1" />
                        )}
                        Submit
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-col lg:flex-row flex-1 min-h-0">
                {/* Code Editor Area */}
                <div className="flex-1 flex flex-col min-w-0 border-b lg:border-b-0 lg:border-r border-white/10">
                    <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        disabled={readOnly}
                        spellCheck={false}
                        className={cn(
                            "flex-1 w-full p-4 bg-transparent text-white font-mono text-sm resize-none focus:outline-none",
                            "leading-relaxed placeholder:text-gray-600",
                            readOnly && "opacity-75"
                        )}
                        placeholder="Write your code here..."
                        style={{ tabSize: 4 }}
                    />
                </div>

                {/* Test Cases & Output Panel */}
                <div className="w-full lg:w-96 flex flex-col min-h-[300px] lg:min-h-0">
                    {/* Tabs */}
                    <div className="flex border-b border-white/10">
                        <button
                            onClick={() => setActiveTab('testcases')}
                            className={cn(
                                "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                                activeTab === 'testcases' 
                                    ? "text-white border-b-2 border-indigo-500" 
                                    : "text-gray-500 hover:text-gray-300"
                            )}
                        >
                            Test Cases
                        </button>
                        <button
                            onClick={() => setActiveTab('output')}
                            className={cn(
                                "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                                activeTab === 'output' 
                                    ? "text-white border-b-2 border-indigo-500" 
                                    : "text-gray-500 hover:text-gray-300"
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
                                {/* Test Case Selector */}
                                <div className="flex gap-2 flex-wrap">
                                    {visibleTestCases.map((tc, index) => (
                                        <button
                                            key={tc.id}
                                            onClick={() => setSelectedTestCase(index)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                                                selectedTestCase === index
                                                    ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                                                    : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                                            )}
                                        >
                                            Case {index + 1}
                                        </button>
                                    ))}
                                </div>

                                {/* Selected Test Case Details */}
                                {visibleTestCases[selectedTestCase] && (
                                    <div className="space-y-4">
                                        {visibleTestCases[selectedTestCase].description && (
                                            <div className="p-3 bg-white/5 rounded-lg">
                                                <p className="text-sm text-gray-400">
                                                    {visibleTestCases[selectedTestCase].description}
                                                </p>
                                            </div>
                                        )}
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                                                Input
                                            </label>
                                            <pre className="p-3 bg-black/40 rounded-lg text-sm text-white font-mono overflow-x-auto">
                                                {visibleTestCases[selectedTestCase].input || '(empty)'}
                                            </pre>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                                                Expected Output
                                            </label>
                                            <pre className="p-3 bg-black/40 rounded-lg text-sm text-white font-mono overflow-x-auto">
                                                {visibleTestCases[selectedTestCase].expected_output}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'output' && (
                            <div className="space-y-4">
                                {/* Submission Results */}
                                {submissionResult && (
                                    <SubmissionResultView result={submissionResult} testCases={testCases} />
                                )}

                                {/* Single Run Result */}
                                {!submissionResult && runResult && (
                                    <div className={cn(
                                        "p-4 rounded-xl border",
                                        runResult.passed 
                                            ? "bg-emerald-500/10 border-emerald-500/20" 
                                            : "bg-red-500/10 border-red-500/20"
                                    )}>
                                        <div className="flex items-center gap-2 mb-3">
                                            {runResult.passed ? (
                                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                            ) : (
                                                <XCircle className="w-5 h-5 text-red-400" />
                                            )}
                                            <span className={cn(
                                                "font-bold",
                                                runResult.passed ? "text-emerald-400" : "text-red-400"
                                            )}>
                                                {runResult.passed ? 'Accepted' : 'Wrong Answer'}
                                            </span>
                                            <span className="text-xs text-gray-500 ml-auto flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {runResult.execution_time}ms
                                            </span>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                                                    Your Output
                                                </label>
                                                <pre className="p-2 bg-black/40 rounded text-sm text-white font-mono overflow-x-auto">
                                                    {runResult.actual_output || '(empty)'}
                                                </pre>
                                            </div>
                                            {!runResult.passed && (
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                                                        Expected
                                                    </label>
                                                    <pre className="p-2 bg-black/40 rounded text-sm text-emerald-400 font-mono overflow-x-auto">
                                                        {runResult.expected_output}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Raw Output */}
                                {!submissionResult && !runResult && output && (
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block flex items-center gap-2">
                                            <Terminal className="w-4 h-4" />
                                            Console Output
                                        </label>
                                        <pre className="p-3 bg-black/40 rounded-lg text-sm text-white font-mono whitespace-pre-wrap overflow-x-auto">
                                            {output}
                                        </pre>
                                    </div>
                                )}

                                {/* Empty State */}
                                {!submissionResult && !runResult && !output && (
                                    <div className="text-center py-12 text-gray-500">
                                        <Terminal className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>Run your code to see output</p>
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

// Submission Result Component
const SubmissionResultView: React.FC<{ result: SubmissionResult; testCases: TestCase[] }> = ({ result, testCases }) => {
    const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());

    const toggleTest = (id: string) => {
        const newExpanded = new Set(expandedTests);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedTests(newExpanded);
    };

    const statusConfig = {
        accepted: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Accepted', icon: Trophy },
        wrong_answer: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Wrong Answer', icon: XCircle },
        runtime_error: { color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'Runtime Error', icon: AlertTriangle },
        compilation_error: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Compilation Error', icon: AlertTriangle },
        time_limit_exceeded: { color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Time Limit Exceeded', icon: Clock },
    };

    const config = statusConfig[result.overall_status];
    const StatusIcon = config.icon;

    return (
        <div className="space-y-4">
            {/* Status Header */}
            <div className={cn("p-4 rounded-xl border", config.bg, `border-${config.color.replace('text-', '')}/20`)}>
                <div className="flex items-center gap-3">
                    <StatusIcon className={cn("w-6 h-6", config.color)} />
                    <div>
                        <h3 className={cn("font-bold text-lg", config.color)}>{config.label}</h3>
                        <p className="text-sm text-gray-400">
                            {result.passed_tests} / {result.total_tests} test cases passed ({result.score}%)
                        </p>
                    </div>
                </div>
            </div>

            {/* Test Results */}
            <div className="space-y-2">
                {result.results.map((r, index) => {
                    const testCase = testCases.find(tc => tc.id === r.test_case_id);
                    const isExpanded = expandedTests.has(r.test_case_id);
                    const isHidden = testCase?.is_hidden;

                    return (
                        <div key={r.test_case_id} className="rounded-lg border border-white/10 overflow-hidden">
                            <button
                                onClick={() => toggleTest(r.test_case_id)}
                                className={cn(
                                    "w-full flex items-center justify-between p-3 text-left transition-colors",
                                    r.passed ? "bg-emerald-500/5" : "bg-red-500/5"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    {r.passed ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-red-400" />
                                    )}
                                    <span className="text-sm text-white">
                                        Test Case {index + 1}
                                        {isHidden && <span className="text-gray-500 ml-2">(Hidden)</span>}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">{r.execution_time}ms</span>
                                    <ChevronDown className={cn(
                                        "w-4 h-4 text-gray-500 transition-transform",
                                        isExpanded && "rotate-180"
                                    )} />
                                </div>
                            </button>

                            <AnimatePresence>
                                {isExpanded && !isHidden && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-white/10"
                                    >
                                        <div className="p-3 space-y-3 bg-black/20">
                                            {r.error && (
                                                <div>
                                                    <label className="text-xs font-bold text-red-400 uppercase mb-1 block">Error</label>
                                                    <pre className="p-2 bg-red-500/10 rounded text-xs text-red-300 font-mono overflow-x-auto">
                                                        {r.error}
                                                    </pre>
                                                </div>
                                            )}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Input</label>
                                                    <pre className="p-2 bg-black/40 rounded text-xs text-white font-mono overflow-x-auto max-h-24">
                                                        {testCase?.input || '(empty)'}
                                                    </pre>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Expected</label>
                                                    <pre className="p-2 bg-black/40 rounded text-xs text-emerald-400 font-mono overflow-x-auto max-h-24">
                                                        {r.expected_output}
                                                    </pre>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Your Output</label>
                                                <pre className={cn(
                                                    "p-2 bg-black/40 rounded text-xs font-mono overflow-x-auto max-h-24",
                                                    r.passed ? "text-emerald-400" : "text-red-400"
                                                )}>
                                                    {r.actual_output || '(empty)'}
                                                </pre>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CodeEditor;

