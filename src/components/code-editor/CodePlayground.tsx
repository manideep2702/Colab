

import React, { useState, useCallback, useEffect } from 'react';
import { Play, RotateCcw, Copy, Check, Info, Send, Loader2, Trophy, XCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CodeEditor } from './CodeEditor';
import { LanguageSelector } from './LanguageSelector';
import { Terminal } from './Terminal';
import {
    codeExecutionService,
    type SupportedLanguage,
    LANGUAGE_SNIPPETS,
    type CodeExecutionResult,
    detectsInputCalls,
    extractPythonInputPrompts
} from '@/services/codeExecution';
import type { ChallengeTestCase } from '@/types';

type InputMode = 'collecting' | 'ready' | 'running' | 'done';

interface CodePlaygroundProps {
    mode?: 'playground' | 'challenge';
    initialCode?: string;
    testCases?: ChallengeTestCase[];
    onSubmit?: (code: string, language: string, passed: boolean) => Promise<void>;
}

export const CodePlayground: React.FC<CodePlaygroundProps> = ({
    mode = 'playground',
    initialCode,
    testCases = [],
    onSubmit
}) => {
    const [language, setLanguage] = useState<SupportedLanguage>('python');
    const [code, setCode] = useState<string>(initialCode || LANGUAGE_SNIPPETS['python']);
    const [stdin, setStdin] = useState<string>('');
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<CodeExecutionResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isTerminalOpen, setIsTerminalOpen] = useState(false);
    const [isLangSelectorOpen, setIsLangSelectorOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    // Submission State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionResult, setSubmissionResult] = useState<{
        passed: boolean;
        results: {
            input: string;
            expected: string;
            actual: string;
            passed: boolean;
            error?: string;
        }[];
        passedCount: number;
        totalCount: number;
    } | null>(null);
    const [showSubmissionModal, setShowSubmissionModal] = useState(false);

    // Interactive input state
    const [inputMode, setInputMode] = useState<InputMode>('ready');
    const [inputPrompts, setInputPrompts] = useState<string[]>([]);
    const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
    const [collectedInputs, setCollectedInputs] = useState<string[]>([]);

    useEffect(() => {
        if (initialCode) {
            setCode(initialCode);
        }
    }, [initialCode]);

    const handleLanguageChange = (newLang: SupportedLanguage) => {
        setLanguage(newLang);
        if (code === LANGUAGE_SNIPPETS[language] && !initialCode) {
            setCode(LANGUAGE_SNIPPETS[newLang]);
        }
    };

    const executeCode = useCallback(async (finalStdin: string) => {
        setInputMode('running');
        setIsRunning(true);
        setError(null);
        setResult(null);

        try {
            const res = await codeExecutionService.execute(language, code, finalStdin);
            setResult(res);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred during execution.');
        } finally {
            setIsRunning(false);
            setInputMode('done');
        }
    }, [language, code]);

    const handleRunCode = async () => {
        setIsTerminalOpen(true);
        setResult(null);
        setError(null);
        setCollectedInputs([]);
        setCurrentPromptIndex(0);

        // Check if code needs input
        const needsInput = detectsInputCalls(language, code);

        if (needsInput && !stdin.trim()) {
            // Extract prompts and start collecting
            if (language === 'python') {
                const prompts = extractPythonInputPrompts(code);
                if (prompts.length > 0) {
                    setInputPrompts(prompts);
                    setInputMode('collecting');
                    return; // Wait for user to provide inputs
                }
            } else {
                // For other languages, collect 3 generic inputs
                setInputPrompts(['Enter input #1:', 'Enter input #2:', 'Enter input #3:']);
                setInputMode('collecting');
                return;
            }
        }

        // No input needed or stdin already provided
        executeCode(stdin);
    };

    const handleInputSubmit = (value: string) => {
        const newInputs = [...collectedInputs, value];
        setCollectedInputs(newInputs);

        const nextIndex = currentPromptIndex + 1;

        if (nextIndex < inputPrompts.length) {
            // More prompts to collect
            setCurrentPromptIndex(nextIndex);
        } else {
            // All inputs collected, execute
            const finalStdin = newInputs.join('\n');
            setStdin(finalStdin);
            executeCode(finalStdin);
        }
    };

    const handleSubmitSolution = async () => {
        if (testCases.length === 0) {
            alert("No test cases to check against.");
            return;
        }

        setIsSubmitting(true);
        setSubmissionResult(null);
        setShowSubmissionModal(true);

        try {
            // Convert testCases to the format expected by runTestCases
            const formattedTestCases = testCases.map((tc, idx) => ({
                id: tc.id || `tc_${idx}`,
                input: tc.input || '',
                expected_output: tc.expected_output || '',
                is_hidden: tc.is_hidden,
            }));
            
            // Run code against all test cases
            const apiResults = await codeExecutionService.runTestCases(code, language, formattedTestCases);
            
            // Convert to the format expected by our UI
            const convertedResults = {
                passed: apiResults.overall_status === 'accepted',
                passedCount: apiResults.passed_tests,
                totalCount: apiResults.total_tests,
                results: apiResults.results.map(r => ({
                    input: formattedTestCases.find(tc => tc.id === r.test_case_id)?.input || '',
                    expected: r.expected_output,
                    actual: r.actual_output,
                    passed: r.passed,
                    error: r.error,
                })),
            };
            
            setSubmissionResult(convertedResults);

            if (onSubmit) {
                await onSubmit(code, language, convertedResults.passed);
            }
        } catch (err) {
            console.error(err);
            // Handle error in UI
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleResetCode = () => {
        if (confirm('Are you sure you want to reset the code? You will lose any changes.')) {
            setCode(LANGUAGE_SNIPPETS[language]);
            setResult(null);
            setError(null);
            setIsTerminalOpen(false);
            setInputMode('ready');
            setCollectedInputs([]);
            setInputPrompts([]);
            setCurrentPromptIndex(0);
            setStdin('');
        }
    };

    const currentPrompt = inputPrompts[currentPromptIndex] || '';

    return (
        <div className="flex flex-col h-[600px] bg-[#0A0A0B] rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/5 backdrop-blur-xl z-20">
                <div className="flex items-center gap-4">
                    <LanguageSelector
                        currentLanguage={language}
                        onSelect={handleLanguageChange}
                        isOpen={isLangSelectorOpen}
                        onToggle={() => setIsLangSelectorOpen(!isLangSelectorOpen)}
                    />

                    <div className="h-6 w-px bg-white/10" />

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleResetCode}
                            title="Reset Code"
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleCopyCode}
                            title="Copy Code"
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <span className="hidden sm:flex items-center gap-2 text-xs text-zinc-500 font-mono">
                        <Info className="w-3 h-3" />
                        Powered by Piston
                    </span>

                    <button
                        onClick={handleRunCode}
                        disabled={isRunning || inputMode === 'collecting' || isSubmitting}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95",
                            isRunning || inputMode === 'collecting'
                                ? "bg-white/10 cursor-wait text-gray-400"
                                : "bg-white/10 hover:bg-white/20 text-white"
                        )}
                    >
                        {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                        {isRunning ? 'Running...' : 'Run Code'}
                    </button>

                    {mode === 'challenge' && (
                        <button
                            onClick={handleSubmitSolution}
                            disabled={isSubmitting || isRunning || inputMode === 'collecting'}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95",
                                isSubmitting
                                    ? "bg-emerald-500/50 cursor-wait text-emerald-100"
                                    : "bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-emerald-500/25"
                            )}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Submit
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Main Editor Area */}
            <div className="flex-1 relative bg-[#0f0f11]">
                <CodeEditor
                    language={language}
                    code={code}
                    onChange={(val) => setCode(val || '')}
                />
            </div>

            {/* Terminal Drawer (Overlay) */}
            <div className="absolute bottom-0 left-0 right-0 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                <Terminal
                    isOpen={isTerminalOpen}
                    onClose={() => {
                        setIsTerminalOpen(false);
                        if (inputMode === 'collecting') {
                            setInputMode('ready');
                            setCollectedInputs([]);
                            setCurrentPromptIndex(0);
                        }
                    }}
                    isRunning={isRunning}
                    result={result}
                    error={error}
                    stdin={stdin}
                    onStdinChange={setStdin}
                    inputMode={inputMode}
                    currentPrompt={currentPrompt}
                    collectedInputs={collectedInputs}
                    inputPrompts={inputPrompts}
                    onInputSubmit={handleInputSubmit}
                />

                {/* Minimized Terminal Bar */}
                {!isTerminalOpen && (result || error) && (
                    <div
                        onClick={() => setIsTerminalOpen(true)}
                        className="bg-[#1e1e2e] border-t border-white/10 px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-[#27273a] transition-colors"
                    >
                        <div className="flex items-center gap-2 text-xs font-mono">
                            <div className={cn("w-2 h-2 rounded-full", error || (result?.run.code !== 0) ? "bg-red-500" : "bg-emerald-500")} />
                            <span className="text-gray-300">Execution finished</span>
                        </div>
                        <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Show Output</span>
                    </div>
                )}
            </div>

            {/* Submission Result Modal */}
            {mode === 'challenge' && showSubmissionModal && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-[#161b22] rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden border border-white/10 flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#0d1117]">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                                        Running Test Cases...
                                    </>
                                ) : submissionResult?.passed ? (
                                    <>
                                        <Trophy className="w-6 h-6 text-emerald-400" />
                                        <span className="text-emerald-400">Challenge Solved!</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="w-6 h-6 text-red-400" />
                                        <span className="text-red-400">Wrong Answer</span>
                                    </>
                                )}
                            </h3>
                            {!isSubmitting && (
                                <button
                                    onClick={() => setShowSubmissionModal(false)}
                                    className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"
                                >
                                    <XCircle className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {isSubmitting ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                    <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
                                    <p>Evaluating your solution against {testCases.length} test cases...</p>
                                </div>
                            ) : submissionResult ? (
                                <div className="space-y-4">
                                    {/* Stats */}
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className={cn(
                                            "px-4 py-2 rounded-lg text-sm font-bold border",
                                            submissionResult.passed
                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                : "bg-red-500/10 text-red-400 border-red-500/20"
                                        )}>
                                            Status: {submissionResult.passed ? 'Accepted' : 'Rejected'}
                                        </div>
                                        <div className="text-gray-400 text-sm">
                                            {submissionResult.results.filter(r => r.passed).length} / {submissionResult.results.length} Test Cases Passed
                                        </div>
                                    </div>

                                    {/* Test Cases List */}
                                    {submissionResult.results.map((res, idx) => (
                                        <div key={idx} className={cn(
                                            "border rounded-xl p-4 transition-all",
                                            res.passed
                                                ? "bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/30"
                                                : "bg-red-500/5 border-red-500/10 hover:border-red-500/30"
                                        )}>
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className={cn(
                                                    "font-bold text-sm flex items-center gap-2",
                                                    res.passed ? "text-emerald-400" : "text-red-400"
                                                )}>
                                                    {res.passed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                    Test Case #{idx + 1}
                                                </h4>
                                                {!res.passed && (
                                                    <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded">Failed</span>
                                                )}
                                            </div>

                                            <div className="space-y-3 pl-6 border-l-2 border-white/5">
                                                <div>
                                                    <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Input</span>
                                                    <div className="bg-[#0d1117] p-2 rounded text-sm text-gray-300 font-mono whitespace-pre-wrap">
                                                        {res.input || '(empty)'}
                                                    </div>
                                                </div>

                                                {!res.passed && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Expected Output</span>
                                                            <div className="bg-[#0d1117] p-2 rounded text-sm text-emerald-400/80 font-mono whitespace-pre-wrap">
                                                                {res.expected}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Your Output</span>
                                                            <div className="bg-[#0d1117] p-2 rounded text-sm text-red-400/80 font-mono whitespace-pre-wrap">
                                                                {res.actual || '(no output/error)'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {res.error && (
                                                    <div>
                                                        <span className="text-xs text-red-500 uppercase tracking-wider block mb-1">Error</span>
                                                        <div className="bg-red-950/30 p-2 rounded text-xs text-red-300 font-mono whitespace-pre-wrap">
                                                            {res.error}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </div>

                        {!isSubmitting && (
                            <div className="p-4 border-t border-white/10 bg-[#0d1117] flex justify-end">
                                <button
                                    onClick={() => setShowSubmissionModal(false)}
                                    className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium text-sm"
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
