import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Loader2,
    CheckCircle,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Trash2,
    Code
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    type ParsedAssessment,
    type ParsedCodingChallenge,
    type ParsedTestCase
} from '@/services/DocumentParserService';

interface DocumentUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'assessment' | 'coding';
    onImport: (data: ParsedAssessment | ParsedCodingChallenge) => void;
}

type ParseStatus = 'idle' | 'uploading' | 'parsing' | 'success' | 'error';

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
    isOpen,
    onClose,
    type,
    onImport
}) => {
    const [status, setStatus] = useState<ParseStatus>('idle');
    const [error, setError] = useState<string>('');
    const [parsedData, setParsedData] = useState<ParsedAssessment | ParsedCodingChallenge | null>(null);
    const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
    const [jsonText, setJsonText] = useState('');

    const handleReset = () => {
        setStatus('idle');
        setError('');
        setParsedData(null);
        setExpandedQuestions(new Set());
        setJsonText('');
    };

    const handleParseJson = async () => {
        if (!jsonText.trim()) {
            setError('Please paste JSON content');
            return;
        }

        setStatus('parsing');
        setError('');

        try {
            // Clean up common issues with pasted JSON
            let cleanedJson = jsonText
                .replace(/[\u201C\u201D]/g, '"')  // Replace smart double quotes
                .replace(/[\u2018\u2019]/g, "'")  // Replace smart single quotes
                .replace(/\t/g, '  ')              // Replace tabs with spaces
                .trim();

            const json = JSON.parse(cleanedJson);

            if (type === 'assessment') {
                if (!json.questions || !Array.isArray(json.questions)) {
                    throw new Error('Invalid JSON: Must contain "questions" array.');
                }

                const result: ParsedAssessment = {
                    title: json.title || 'Imported Assessment',
                    description: json.description,
                    timeLimit: json.timeLimit || 30,
                    passingScore: json.passingScore || 70,
                    questions: json.questions.map((q: any) => ({
                        question: q.question,
                        options: q.options || [],
                        correctAnswer: q.correctAnswer || 'A',
                        difficulty: q.difficulty || 'medium'
                    }))
                };
                setParsedData(result);
            } else {
                const result: ParsedCodingChallenge = {
                    title: json.title || 'Untitled Challenge',
                    description: json.description || '',
                    constraints: json.constraints || 'Time Limit: 1s',
                    difficulty: json.difficulty || 'medium',
                    testCases: (json.testCases || []).map((tc: any) => ({
                        input: tc.input || '',
                        expectedOutput: tc.expectedOutput || '',
                        explanation: tc.explanation,
                        isHidden: tc.isHidden || false
                    })),
                    starterCode: json.starterCode || {
                        python: '# Your code here\n',
                        javascript: '// Your code here\n'
                    },
                    points: json.points || 100
                };
                setParsedData(result);
            }

            setStatus('success');
        } catch (err: any) {
            console.error('JSON Parse Error:', err);
            if (err instanceof SyntaxError) {
                // Try to extract position info from error message
                const posMatch = err.message.match(/position (\d+)/i);
                if (posMatch) {
                    const pos = parseInt(posMatch[1]);
                    const context = jsonText.substring(Math.max(0, pos - 20), pos + 20);
                    setError(`Invalid JSON at position ${pos}. Near: "...${context}..."`);
                } else {
                    setError(`Invalid JSON: ${err.message}`);
                }
            } else {
                setError(err.message || 'Failed to parse JSON');
            }
            setStatus('error');
        }
    };

    const handleImport = () => {
        try {
            if (parsedData) {
                onImport(parsedData);
            }
        } catch (error) {
            console.error('Error importing data:', error);
        } finally {
            onClose();
        }
    };

    const toggleQuestion = (index: number) => {
        setExpandedQuestions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const deleteQuestion = (index: number) => {
        if (parsedData && 'questions' in parsedData) {
            const updated = {
                ...parsedData,
                questions: parsedData.questions.filter((_, i) => i !== index)
            };
            setParsedData(updated);
        }
    };

    const updateTestCase = (index: number, field: keyof ParsedTestCase, value: any) => {
        if (parsedData && 'testCases' in parsedData) {
            const updated = {
                ...parsedData,
                testCases: parsedData.testCases.map((tc, i) =>
                    i === index ? { ...tc, [field]: value } : tc
                )
            };
            setParsedData(updated);
        }
    };

    const deleteTestCase = (index: number) => {
        if (parsedData && 'testCases' in parsedData) {
            const updated = {
                ...parsedData,
                testCases: parsedData.testCases.filter((_, i) => i !== index)
            };
            setParsedData(updated);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={(e) => { e.stopPropagation(); onClose(); }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-[#0a0a0b] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/10">
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                Import {type === 'assessment' ? 'Assessment' : 'Coding Challenge'}
                            </h2>
                            <p className="text-sm text-zinc-500 mt-1">
                                Paste JSON to import {type === 'assessment' ? 'questions' : 'problem details'}
                            </p>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); onClose(); }}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-zinc-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                        {status === 'idle' && (
                            <>
                                {/* Paste JSON */}
                                <div className="space-y-4">
                                    <textarea
                                        value={jsonText}
                                        onChange={(e) => setJsonText(e.target.value)}
                                        placeholder={type === 'assessment' ? `{
  "title": "My Assessment",
  "questions": [
    {
      "question": "What is 2 + 2?",
      "options": [
        {"key": "A", "text": "3"},
        {"key": "B", "text": "4"},
        {"key": "C", "text": "5"},
        {"key": "D", "text": "6"}
      ],
      "correctAnswer": "B",
      "difficulty": "easy"
    }
  ]
}` : `{
  "title": "Two Sum",
  "description": "Find two numbers that add up to target",
  "testCases": [
    {"input": "[2,7,11,15]\\n9", "expectedOutput": "[0,1]", "isHidden": false}
  ]
}`}
                                        className="w-full h-64 px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-indigo-500 resize-none"
                                    />
                                    <p className="text-xs text-zinc-500">
                                        Paste your JSON data above. The format should match the placeholder example.
                                    </p>
                                </div>

                                {error && (
                                    <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-400" />
                                        <p className="text-sm text-red-400">{error}</p>
                                    </div>
                                )}
                            </>
                        )}

                        {status === 'parsing' && (
                            <div className="flex flex-col items-center justify-center py-12 gap-4">
                                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                                <div className="text-center">
                                    <p className="text-white font-medium">Parsing document locally...</p>
                                    <p className="text-sm text-zinc-500 mt-1">
                                        Extracting text and identifying patterns
                                    </p>
                                </div>
                            </div>
                        )}


                        {status === 'error' && (
                            <div className="flex flex-col items-center justify-center py-12 gap-4">
                                <AlertCircle className="w-12 h-12 text-red-400" />
                                <div className="text-center">
                                    <p className="text-white font-medium">Failed to parse document</p>
                                    <p className="text-sm text-red-400 mt-1">{error}</p>
                                </div>
                                <button
                                    onClick={handleReset}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
                                >
                                    Try again
                                </button>
                            </div>
                        )}

                        {status === 'success' && parsedData && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                                    <p className="text-sm text-emerald-400">
                                        Successfully extracted content! Review and edit below before importing.
                                    </p>
                                </div>

                                {/* Title & Description */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-1">Title</label>
                                        <input
                                            type="text"
                                            value={parsedData.title}
                                            onChange={e => setParsedData({ ...parsedData, title: e.target.value })}
                                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    {'description' in parsedData && (
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-1">Description</label>
                                            <textarea
                                                value={parsedData.description || ''}
                                                onChange={e => setParsedData({ ...parsedData, description: e.target.value })}
                                                rows={3}
                                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500 resize-none"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Assessment Questions Preview */}
                                {'questions' in parsedData && (
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            Questions ({parsedData.questions.length})
                                        </h3>
                                        {parsedData.questions.map((q, i) => (
                                            <div key={i} className="border border-white/10 rounded-lg overflow-hidden">
                                                <button
                                                    onClick={() => toggleQuestion(i)}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                                                >
                                                    <span className="text-white text-left flex-1 truncate">
                                                        Q{i + 1}: {q.question}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded text-xs font-medium",
                                                            q.difficulty === 'easy' && "bg-emerald-500/20 text-emerald-400",
                                                            q.difficulty === 'medium' && "bg-amber-500/20 text-amber-400",
                                                            q.difficulty === 'hard' && "bg-red-500/20 text-red-400"
                                                        )}>
                                                            {q.difficulty}
                                                        </span>
                                                        {expandedQuestions.has(i) ? (
                                                            <ChevronUp className="w-4 h-4 text-zinc-500" />
                                                        ) : (
                                                            <ChevronDown className="w-4 h-4 text-zinc-500" />
                                                        )}
                                                    </div>
                                                </button>
                                                {expandedQuestions.has(i) && (
                                                    <div className="p-4 border-t border-white/10 space-y-3 bg-white/[0.02]">
                                                        <div className="space-y-2">
                                                            {q.options.map((opt, oi) => (
                                                                <div
                                                                    key={oi}
                                                                    className={cn(
                                                                        "p-3 rounded-lg border",
                                                                        opt.key === q.correctAnswer
                                                                            ? "border-emerald-500/50 bg-emerald-500/10"
                                                                            : "border-white/10"
                                                                    )}
                                                                >
                                                                    <span className="text-zinc-400 mr-2">{opt.key}.</span>
                                                                    <span className="text-white">{opt.text}</span>
                                                                    {opt.key === q.correctAnswer && (
                                                                        <span className="ml-2 text-emerald-400 text-xs">(Correct)</span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="flex justify-end">
                                                            <button
                                                                onClick={() => deleteQuestion(i)}
                                                                className="flex items-center gap-1 text-red-400 hover:text-red-300 text-sm transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Coding Challenge Preview */}
                                {'testCases' in parsedData && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-1">Constraints</label>
                                            <textarea
                                                value={parsedData.constraints}
                                                onChange={e => setParsedData({ ...parsedData, constraints: e.target.value })}
                                                rows={3}
                                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-indigo-500 resize-none"
                                            />
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-bold text-white mb-3">
                                                Test Cases ({parsedData.testCases.length})
                                            </h3>
                                            <div className="space-y-3">
                                                {parsedData.testCases.map((tc, i) => (
                                                    <div key={i} className="border border-white/10 rounded-lg p-4 space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-white font-medium">
                                                                Test Case {i + 1}
                                                                {tc.isHidden && (
                                                                    <span className="ml-2 px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400">
                                                                        Hidden
                                                                    </span>
                                                                )}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <label className="flex items-center gap-2 text-sm text-zinc-400">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={tc.isHidden}
                                                                        onChange={e => updateTestCase(i, 'isHidden', e.target.checked)}
                                                                        className="rounded"
                                                                    />
                                                                    Hidden
                                                                </label>
                                                                <button
                                                                    onClick={() => deleteTestCase(i)}
                                                                    className="p-1 hover:bg-red-500/20 rounded text-red-400 transition-colors"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="block text-xs text-zinc-500 mb-1">Input</label>
                                                                <textarea
                                                                    value={tc.input}
                                                                    onChange={e => updateTestCase(i, 'input', e.target.value)}
                                                                    rows={3}
                                                                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded text-white font-mono text-sm focus:outline-none focus:border-indigo-500 resize-none"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs text-zinc-500 mb-1">Expected Output</label>
                                                                <textarea
                                                                    value={tc.expectedOutput}
                                                                    onChange={e => updateTestCase(i, 'expectedOutput', e.target.value)}
                                                                    rows={3}
                                                                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded text-white font-mono text-sm focus:outline-none focus:border-indigo-500 resize-none"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between p-6 border-t border-white/10 bg-white/[0.02]">
                        <button
                            onClick={(e) => { e.stopPropagation(); status === 'success' ? handleReset() : onClose(); }}
                            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                        >
                            {status === 'success' ? 'Start Over' : 'Cancel'}
                        </button>
                        <div className="flex items-center gap-3">
                            {/* Parse JSON button */}
                            {status === 'idle' && jsonText.trim() && (
                                <button
                                    onClick={handleParseJson}
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                >
                                    <Code className="w-4 h-4" />
                                    Parse JSON
                                </button>
                            )}
                            {status === 'success' && (
                                <button
                                    onClick={handleImport}
                                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Import {type === 'assessment' ? 'Assessment' : 'Challenge'}
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default DocumentUploadModal;
