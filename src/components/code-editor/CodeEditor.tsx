import React, { useRef } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { Loader2 } from 'lucide-react';
import { type SupportedLanguage } from '@/services/codeExecution';

interface CodeEditorProps {
    language: SupportedLanguage;
    code: string;
    onChange: (value: string | undefined) => void;
    editorRef?: React.MutableRefObject<any>;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
    language,
    code,
    onChange,
    editorRef
}) => {
    const handleEditorDidMount: OnMount = (editor, monaco) => {
        if (editorRef) {
            editorRef.current = editor;
        }

        // Define a custom dark theme that matches our app
        monaco.editor.defineTheme('lms-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {
                'editor.background': '#0f0f11', // Matches card bg
                'editor.lineHighlightBackground': '#1f1f2e',
                'editorLineNumber.foreground': '#52525b',
                'editorCursor.foreground': '#6366f1', // Indigo-500
                'editor.selectionBackground': '#6366f130',
                'editor.inactiveSelectionBackground': '#6366f115'
            }
        });

        monaco.editor.setTheme('lms-dark');
    };

    return (
        <div className="h-full w-full overflow-hidden rounded-xl border border-white/5 shadow-inner">
            <Editor
                height="100%"
                language={language === 'c' || language === 'cpp' ? 'cpp' : language}
                value={code}
                onChange={onChange}
                theme="lms-dark"
                onMount={handleEditorDidMount}
                loading={
                    <div className="flex items-center justify-center h-full text-indigo-400 gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm font-medium">Loading Editor...</span>
                    </div>
                }
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineHeight: 24,
                    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                    fontLigatures: true,
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    padding: { top: 20, bottom: 20 },
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: 'on',
                    renderLineHighlight: 'line',
                }}
            />
        </div>
    );
};
