import * as pdfjsLib from 'pdfjs-dist';

// Configure worker for Vite
// using a CDN for the worker to avoid complex bundler configuration issues
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

// Types for parsed content
export interface ParsedQuestion {
    question: string;
    options: { key: string; text: string }[];
    correctAnswer: string;
    explanation?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
}

export interface ParsedTestCase {
    input: string;
    expectedOutput: string;
    explanation?: string;
    isHidden: boolean;
}

export interface ParsedCodingChallenge {
    title: string;
    description: string;
    constraints: string;
    inputFormat?: string;
    outputFormat?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    testCases: ParsedTestCase[];
    starterCode?: Record<string, string>;
    hints?: string[];
    timeLimit?: number;
    points?: number;
}

export interface ParsedAssessment {
    title: string;
    description?: string;
    questions: ParsedQuestion[];
    timeLimit?: number;
    passingScore?: number;
}

// Extract text from PDF file using pdfjs-dist
export const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            // Join items with a space to preserve words, but try to respect layout
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n\n';
        }

        return fullText;
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw new Error('Failed to read PDF file. Please ensure it is a valid PDF.');
    }
};

// Parse assessment document using Regex or JSON (Client-Side)
export const parseAssessmentDocument = async (file: File): Promise<ParsedAssessment> => {
    if (file.type === 'application/json' || file.name.endsWith('.json')) {
        const text = await file.text();
        const json = JSON.parse(text);

        if (!json.questions || !Array.isArray(json.questions)) {
            throw new Error('Invalid JSON: Must contain "questions" array.');
        }

        return {
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
    }

    const text = await extractTextFromPDF(file);

    // 1. Extract Title (First line or clearly marked)
    const titleMatch = text.match(/^(.+)(\r?\n|$)/);
    const title = titleMatch ? titleMatch[1].trim() : file.name.replace('.pdf', '');

    // 2. Identify Questions
    // Pattern: Number followed by dot or parenthesis, then text
    // Matches "1.", "1)", "Q1." anywhere, separated by whitespace
    const questionRegex = /(?:^|\s)((?:Q|Question)?\s*\d+)\s*[\.\)]\s+(.+?)(?=(?:\s(?:Q|Question)?\s*\d+\s*[\.\)]|$))/gis;

    // Normalize text: limit excessive newlines/spaces
    const normalizedText = text.replace(/\s+/g, ' ').trim();

    const questions: ParsedQuestion[] = [];
    const items: { num: string, fullText: string }[] = [];

    let match;
    while ((match = questionRegex.exec(normalizedText)) !== null) {
        items.push({
            num: match[1].trim(),
            fullText: match[2].trim()
        });
    }

    // Process each block to find options and answer
    items.forEach(item => {
        let fullContent = item.fullText;

        // Extract Options: Look for A. B. C. D. surrounded by spaces
        // Regex: (space)(Letter)(dot/paren)(space)
        // We iterate to find them in order
        const options: { key: string; text: string }[] = [];

        // Find all option start positions
        const optionRegex = /(?:^|\s)([A-D])\s*[\.\)]\s+/gi;
        const optionMatches: { key: string, index: number, matchLength: number }[] = [];

        let optMatch;
        while ((optMatch = optionRegex.exec(fullContent)) !== null) {
            optionMatches.push({
                key: optMatch[1].toUpperCase(),
                index: optMatch.index,
                matchLength: optMatch[0].length
            });
        }

        // If options found, split the text
        let questionText = fullContent;
        if (optionMatches.length > 0) {
            // Sort by index just in case
            optionMatches.sort((a, b) => a.index - b.index);

            // Question text is everything before the first option
            // Note: optionMatches[0].index might include the leading space/newline matched by (?:^|\s)
            // We need to be careful not to cut off the last word of the question.
            // But strict regex logic says the match starts at the delimiter.
            questionText = fullContent.substring(0, optionMatches[0].index).trim();

            // Extract option texts
            for (let i = 0; i < optionMatches.length; i++) {
                const current = optionMatches[i];
                const next = optionMatches[i + 1];

                // Text starts after the marker
                // e.g. " A. " -> start index is match.index, content starts at match.index + match[0].length
                const startContent = current.index + current.matchLength;

                let content = '';
                if (next) {
                    content = fullContent.substring(startContent, next.index);
                } else {
                    // Last option, goes until end or until "Answer:"
                    content = fullContent.substring(startContent);
                    // Check for trailing "Answer:"
                    const ansIndex = content.search(/(?:Answer|Ans|Correct)[\s:-]*[A-D]/i);
                    if (ansIndex !== -1) {
                        content = content.substring(0, ansIndex);
                    }
                }

                options.push({
                    key: current.key,
                    text: content.trim()
                });
            }
        } else {
            // fallback for boolean or if options failed parsing
            // Check if it's a True/False question implicitly?
            if (fullContent.toLowerCase().includes('true') && fullContent.toLowerCase().includes('false')) {
                options.push({ key: 'A', text: 'True' }, { key: 'B', text: 'False' });
            }
        }

        // Look for answer markings
        let correctAnswer = '';
        const ansMatch = fullContent.match(/(?:Answer|Ans|Correct)[\s:-]*([A-D])/i);
        if (ansMatch) {
            correctAnswer = ansMatch[1].toUpperCase();
        } else {
            // Try to assume explicit pattern like "Option B is correct" or *B
            const asteriskMatch = fullContent.match(/\*([A-D])/i);
            if (asteriskMatch) correctAnswer = asteriskMatch[1].toUpperCase();
        }

        // Fallback: Default to A if still empty (so form works), but 'A' is safer than empty string
        if (!correctAnswer) correctAnswer = 'A';

        questions.push({
            question: questionText,
            options: options.length > 0 ? options : [
                { key: 'A', text: 'True' }, // Default dummies so UI doesn't crash
                { key: 'B', text: 'False' }
            ],
            correctAnswer,
            difficulty: 'medium'
        });
    });

    if (questions.length === 0) {
        throw new Error('No questions found. Please format questions like "1. Question text" and options like "A. Option".');
    }

    return {
        title: title || 'Imported Assessment',
        description: 'Imported from PDF',
        questions,
        timeLimit: 30,
        passingScore: 70
    };
};

// Parse coding challenge document using Regex or JSON (Client-Side)
export const parseCodingChallengeDocument = async (file: File): Promise<ParsedCodingChallenge> => {
    if (file.type === 'application/json' || file.name.endsWith('.json')) {
        const text = await file.text();
        const json = JSON.parse(text);

        return {
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
    }

    const text = await extractTextFromPDF(file);
    const normalizedText = text.replace(/\r\n/g, '\n');

    // Simple heuristic extraction

    // Title: First line
    const titleMatch = normalizedText.match(/^(.+)(\n|$)/);
    const title = titleMatch ? titleMatch[1].trim() : 'New Challenge';

    // Difficulty
    let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
    if (normalizedText.toLowerCase().includes('easy')) difficulty = 'easy';
    if (normalizedText.toLowerCase().includes('hard')) difficulty = 'hard';

    // Description: Everything until "Input" or "Example"
    let description = normalizedText;
    const descEndIndex = normalizedText.search(/(?:Input Format|Example|Constraints)/i);
    if (descEndIndex !== -1) {
        description = normalizedText.substring(0, descEndIndex).trim();
        // Remove title from description
        description = description.replace(title, '').trim();
    }

    // Test Cases: Look for "Input:"... "Output:"
    const testCases: ParsedTestCase[] = [];
    const exampleRegex = /(?:Example|Test Case)\s*\d*[:\s]*Input:?\s*([\s\S]+?)Output:?\s*([\s\S]+?)(?=(?:Example|Test Case|Explanation)|$)/gi;

    let match;
    while ((match = exampleRegex.exec(normalizedText)) !== null) {
        testCases.push({
            input: match[1].trim(),
            expectedOutput: match[2].trim(),
            isHidden: false,
            explanation: 'Extracted from document'
        });
    }

    // Fallback if no structured test cases found
    if (testCases.length === 0) {
        testCases.push({
            input: "Sample Input",
            expectedOutput: "Sample Output",
            isHidden: false,
            explanation: "Please edit this test case"
        });
    }

    return {
        title,
        description,
        constraints: "Time Limit: 1s\nSee document for details",
        difficulty,
        testCases,
        starterCode: {
            python: "def solve():\n    # Your code here\n    pass",
            javascript: "function solve() {\n    // Your code here\n}"
        },
        points: 100
    };
};

// Utility to detect document type based on content
export const detectDocumentType = async (file: File): Promise<'assessment' | 'coding' | 'unknown'> => {
    try {
        if (file.type === 'application/json' || file.name.endsWith('.json')) {
            const text = await file.text();
            const json = JSON.parse(text);
            if (json.questions && Array.isArray(json.questions)) return 'assessment';
            if (json.testCases && Array.isArray(json.testCases)) return 'coding';
            return 'unknown';
        }

        const text = await extractTextFromPDF(file);

        // Simple keywords check
        if (text.match(/\d+[\.\)]\s+/)) return 'assessment'; // Has numbered list
        if (text.toLowerCase().includes('input format') || text.toLowerCase().includes('output format')) return 'coding';

        return 'unknown';
    } catch {
        return 'unknown';
    }
};

export const documentParserService = {
    extractTextFromPDF,
    parseAssessmentDocument,
    parseCodingChallengeDocument,
    detectDocumentType
};

export default documentParserService;
