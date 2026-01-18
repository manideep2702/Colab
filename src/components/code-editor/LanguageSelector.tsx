import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type SupportedLanguage } from '@/services/codeExecution';

interface LanguageSelectorProps {
    currentLanguage: SupportedLanguage;
    onSelect: (lang: SupportedLanguage) => void;
    isOpen: boolean;
    onToggle: () => void;
}

const languages: { id: SupportedLanguage; name: string }[] = [
    { id: 'python', name: 'Python' },
    { id: 'javascript', name: 'JavaScript' },
    { id: 'typescript', name: 'TypeScript' },
    { id: 'java', name: 'Java' },
    { id: 'cpp', name: 'C++' },
    { id: 'c', name: 'C' },
    { id: 'go', name: 'Go' },
    { id: 'rust', name: 'Rust' },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
    currentLanguage,
    onSelect,
    isOpen,
    onToggle
}) => {
    return (
        <div className="relative z-50">
            <button
                onClick={onToggle}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-sm font-medium text-gray-200"
            >
                <Code2 className="w-4 h-4 text-indigo-400" />
                <span>{languages.find(l => l.id === currentLanguage)?.name || 'Language'}</span>
                <ChevronDown className={cn("w-3 h-3 transition-transform", isOpen ? "rotate-180" : "")} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={onToggle} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 5 }}
                            className="absolute top-full left-0 mt-2 w-48 bg-[#1e1e2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 py-1"
                        >
                            {languages.map((lang) => (
                                <button
                                    key={lang.id}
                                    onClick={() => {
                                        onSelect(lang.id);
                                        onToggle();
                                    }}
                                    className={cn(
                                        "w-full px-4 py-2 text-left text-sm transition-colors flex items-center justify-between group",
                                        currentLanguage === lang.id
                                            ? "bg-indigo-500/10 text-indigo-400"
                                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    {lang.name}
                                    {currentLanguage === lang.id && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                                    )}
                                </button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
