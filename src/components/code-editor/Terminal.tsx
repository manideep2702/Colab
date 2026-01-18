import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal as TerminalIcon, X, Loader2, AlertCircle, CheckCircle2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type CodeExecutionResult } from '@/services/codeExecution';

interface TerminalProps {
    isOpen: boolean;
    onClose: () => void;
    isRunning: boolean;
    result: CodeExecutionResult | null;
    error: string | null;
    stdin: string;
    onStdinChange: (value: string) => void;
    // Interactive input props
    inputMode: 'collecting' | 'ready' | 'running' | 'done';
    currentPrompt: string;
    collectedInputs: string[];
    inputPrompts: string[];
    onInputSubmit: (value: string) => void;
}

export const Terminal: React.FC<TerminalProps> = ({
    isOpen,
    onClose,
    isRunning,
    result,
    error,
    stdin,
    onStdinChange,
    inputMode,
    currentPrompt,
    collectedInputs,
    inputPrompts,
    onInputSubmit
}) => {
    const [currentInput, setCurrentInput] = React.useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const outputRef = useRef<HTMLDivElement>(null);

    // Focus input when in collecting mode
    useEffect(() => {
        if (inputMode === 'collecting' && inputRef.current) {
            inputRef.current.focus();
        }
    }, [inputMode, currentPrompt]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [collectedInputs, result, currentPrompt]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onInputSubmit(currentInput);
            setCurrentInput('');
        }
    };

    const handleSubmitClick = () => {
        onInputSubmit(currentInput);
        setCurrentInput('');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 300, opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="border-t border-white/10 bg-[#0d1117] flex flex-col"
                >
                    {/* Terminal Header */}
                    <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                            </div>
                            <div className="flex items-center gap-2">
                                <TerminalIcon className="w-4 h-4 text-gray-400" />
                                <span className="text-xs font-mono text-gray-400">Terminal</span>
                            </div>
                            {inputMode === 'collecting' && (
                                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded animate-pulse">
                                    WAITING FOR INPUT
                                </span>
                            )}
                        </div>

                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Terminal Output Area */}
                    <div
                        ref={outputRef}
                        className="flex-1 p-4 font-mono text-sm overflow-auto bg-[#0d1117]"
                        style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace" }}
                    >
                        {/* Show interaction history - prompts with their inputs */}
                        {collectedInputs.map((input, idx) => (
                            <div key={idx} className="mb-1">
                                <span className="text-cyan-400">{inputPrompts[idx] || 'Input:'}</span>
                                <span className="text-green-400 ml-1">{input}</span>
                            </div>
                        ))}

                        {/* Current prompt being collected */}
                        {inputMode === 'collecting' && currentPrompt && (
                            <div className="flex items-center">
                                <span className="text-cyan-400">{currentPrompt}</span>
                                <span className="text-green-400 ml-1 animate-pulse">▌</span>
                            </div>
                        )}

                        {/* Running state */}
                        {inputMode === 'running' && (
                            <div className="flex items-center gap-2 text-gray-400 mt-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Executing...</span>
                            </div>
                        )}

                        {/* Results */}
                        {inputMode === 'done' && (
                            <div className="mt-2">
                                {error ? (
                                    <div className="text-red-400">
                                        <div className="flex items-center gap-2 mb-1">
                                            <AlertCircle className="w-4 h-4" />
                                            <span className="font-bold">Error</span>
                                        </div>
                                        <pre className="whitespace-pre-wrap text-xs pl-6 opacity-90">{error}</pre>
                                    </div>
                                ) : result ? (
                                    <div>
                                        {/* Status line */}
                                        <div className={cn(
                                            "flex items-center gap-2 text-xs mb-2 pb-2 border-b border-white/10",
                                            result.run.code === 0 ? "text-emerald-400" : "text-red-400"
                                        )}>
                                            {result.run.code === 0 ? (
                                                <><CheckCircle2 className="w-3 h-3" /> Program exited successfully</>
                                            ) : (
                                                <><AlertCircle className="w-3 h-3" /> Exit code: {result.run.code}</>
                                            )}
                                        </div>

                                        {/* stdout - filter out prompts if we collected inputs */}
                                        {result.run.stdout && (() => {
                                            let output = result.run.stdout;

                                            // If we collected inputs interactively, filter out the prompts from output
                                            if (collectedInputs.length > 0) {
                                                // Remove each prompt+input combo from the output
                                                inputPrompts.forEach((prompt, idx) => {
                                                    const input = collectedInputs[idx] || '';
                                                    // The output contains "prompt: input" without newline
                                                    output = output.replace(prompt + input, '');
                                                    // Also try with just the prompt
                                                    output = output.replace(prompt, '');
                                                });
                                                // Clean up any leading/trailing whitespace
                                                output = output.trim();
                                            }

                                            if (!output) return null;

                                            return (
                                                <div className="text-gray-100">
                                                    {output.split('\n').map((line, i) => (
                                                        <div key={i} className="min-h-[1.25rem]">
                                                            {line || '\u00A0'}
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })()}

                                        {/* stderr */}
                                        {result.run.stderr && (
                                            <div className="text-red-300 mt-2 pl-2 border-l-2 border-red-500/50">
                                                {result.run.stderr.split('\n').map((line, i) => (
                                                    <div key={i}>{line}</div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Footer */}
                                        <div className="mt-4 pt-2 border-t border-white/5 text-[10px] text-gray-600">
                                            {result.language} v{result.version}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        )}

                        {/* Ready state */}
                        {inputMode === 'ready' && !result && !error && (
                            <div className="text-gray-600">
                                <span className="text-gray-500">$</span> Ready. Click "Run Code" to execute.
                            </div>
                        )}
                    </div>

                    {/* Input Field - shown when collecting inputs */}
                    {inputMode === 'collecting' && (
                        <div className="px-4 py-3 bg-[#161b22] border-t border-white/10 flex items-center gap-3">
                            <span className="text-emerald-400 font-mono text-lg">❯</span>
                            <input
                                ref={inputRef}
                                type="text"
                                value={currentInput}
                                onChange={(e) => setCurrentInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type your input here..."
                                className="flex-1 bg-[#0d1117] border border-white/10 rounded-lg px-4 py-2 text-white font-mono text-sm placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
                                autoFocus
                            />
                            <button
                                onClick={handleSubmitClick}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-2 text-white text-sm font-medium"
                            >
                                <Send className="w-4 h-4" />
                                Enter
                            </button>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};
