import { GoogleGenerativeAI } from '@google/generative-ai';

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

// Initialize Gemini AI
const getGeminiModel = () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your .env file.');
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
};

// Extract text from PDF file
export const extractTextFromPDF = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const arrayBuffer = e.target?.result as ArrayBuffer;
                // For browser environment, we'll use a simpler approach
                // Convert to base64 and send to Gemini directly
                const base64 = btoa(
                    new Uint8Array(arrayBuffer).reduce(
                        (data, byte) => data + String.fromCharCode(byte),
                        ''
                    )
                );
                resolve(base64);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
};

// Parse assessment document using Gemini AI
export const parseAssessmentDocument = async (file: File): Promise<ParsedAssessment> => {
    const model = getGeminiModel();

    // Read file content
    const fileContent = await extractTextFromPDF(file);
    const mimeType = file.type || 'application/pdf';

    const prompt = `You are an expert at extracting structured data from educational documents.

Analyze this document and extract ALL multiple-choice questions.

For each question, provide:
1. The complete question text
2. All options (A, B, C, D, etc.) with their full text
3. The correct answer letter
4. An explanation if available
5. Difficulty level (easy/medium/hard) based on complexity

Also extract:
- Document/Assessment title
- Overall description if present
- Suggested time limit in minutes
- Suggested passing score percentage

IMPORTANT: Return ONLY valid JSON in this exact format:
{
    "title": "Assessment Title",
    "description": "Optional description",
    "timeLimit": 30,
    "passingScore": 70,
    "questions": [
        {
            "question": "Full question text?",
            "options": [
                {"key": "A", "text": "Option A text"},
                {"key": "B", "text": "Option B text"},
                {"key": "C", "text": "Option C text"},
                {"key": "D", "text": "Option D text"}
            ],
            "correctAnswer": "A",
            "explanation": "Why this is correct",
            "difficulty": "medium"
        }
    ]
}

If you cannot determine certain values, use reasonable defaults.
Extract ALL questions found in the document.`;

    try {
        const result = await model.generateContent([
            { text: prompt },
            {
                inlineData: {
                    mimeType,
                    data: fileContent
                }
            }
        ]);

        const response = await result.response;
        const text = response.text();

        console.log('--- RAW AI RESPONSE ---');
        console.log(text);
        console.log('-----------------------');

        // Extract JSON from response
        // First, try to clean up markdown code blocks if present
        let cleanText = text.replace(/```json/g, '').replace(/```/g, '');

        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            console.error('Failed to match JSON pattern in response. Response was:', text);
            throw new Error('AI response was not in expected JSON format. Please try again.');
        }

        const parsed = JSON.parse(jsonMatch[0]) as ParsedAssessment;

        // Validate and set defaults
        return {
            title: parsed.title || 'Untitled Assessment',
            description: parsed.description,
            timeLimit: parsed.timeLimit || 30,
            passingScore: parsed.passingScore || 70,
            questions: parsed.questions.map(q => ({
                question: q.question,
                options: q.options || [],
                correctAnswer: q.correctAnswer || 'A',
                explanation: q.explanation,
                difficulty: q.difficulty || 'medium'
            }))
        };
    } catch (error: any) {
        console.error('Error parsing assessment:', error);
        
        // Provide more specific error messages
        if (error.message?.includes('API key')) {
            throw new Error('Gemini API key is missing or invalid. Please configure VITE_GEMINI_API_KEY.');
        }
        if (error.message?.includes('JSON')) {
            throw new Error('Failed to parse AI response. The document format may not be supported. Try a clearer document.');
        }
        if (error.message?.includes('quota') || error.message?.includes('rate')) {
            throw new Error('API rate limit exceeded. Please try again in a moment.');
        }
        
        throw new Error(`Failed to parse assessment document: ${error.message || 'Please ensure it contains valid questions.'}`);
    }
};

// Parse coding challenge document using Gemini AI
export const parseCodingChallengeDocument = async (file: File): Promise<ParsedCodingChallenge> => {
    const model = getGeminiModel();

    const fileContent = await extractTextFromPDF(file);
    const mimeType = file.type || 'application/pdf';

    const prompt = `You are an expert at extracting coding problems from documents.

Analyze this document and extract the coding challenge details.

Extract:
1. Problem title
2. Full problem description
3. Constraints (time/space limits, input ranges, etc.)
4. Input format explanation
5. Output format explanation
6. ALL sample test cases with inputs and expected outputs
7. Hidden test cases if mentioned (mark isHidden: true)
8. Difficulty level (easy/medium/hard)
9. Starter code if provided (for Python, JavaScript, etc.)
10. Hints if available
11. Time limit in minutes
12. Points value

IMPORTANT: Return ONLY valid JSON in this exact format:
{
    "title": "Problem Title",
    "description": "Full problem description with examples",
    "constraints": "1 <= n <= 10^5\\nTime limit: 1 second",
    "inputFormat": "First line contains n, second line contains n integers",
    "outputFormat": "Print the result on a single line",
    "difficulty": "medium",
    "timeLimit": 30,
    "points": 100,
    "testCases": [
        {
            "input": "5\\n1 2 3 4 5",
            "expectedOutput": "15",
            "explanation": "Sum of all elements",
            "isHidden": false
        },
        {
            "input": "3\\n10 20 30",
            "expectedOutput": "60",
            "explanation": "",
            "isHidden": true
        }
    ],
    "starterCode": {
        "python": "def solve(n, arr):\\n    # Your code here\\n    pass",
        "javascript": "function solve(n, arr) {\\n    // Your code here\\n}"
    },
    "hints": ["Think about the pattern", "Consider edge cases"]
}

If you cannot determine certain values, use reasonable defaults.
Make sure test cases are properly formatted with \\n for newlines.`;

    try {
        const result = await model.generateContent([
            { text: prompt },
            {
                inlineData: {
                    mimeType,
                    data: fileContent
                }
            }
        ]);

        const response = await result.response;
        const text = response.text();

        console.log('--- RAW AI RESPONSE (Coding) ---');
        console.log(text);
        console.log('------------------------------');

        // Extract JSON from response
        let cleanText = text.replace(/```json/g, '').replace(/```/g, '');
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            console.error('Failed to match JSON pattern in coding response. Response was:', text);
            throw new Error('AI response was not in expected JSON format. Please try again.');
        }

        const parsed = JSON.parse(jsonMatch[0]) as ParsedCodingChallenge;

        // Validate and set defaults
        return {
            title: parsed.title || 'Untitled Challenge',
            description: parsed.description || '',
            constraints: parsed.constraints || '',
            inputFormat: parsed.inputFormat,
            outputFormat: parsed.outputFormat,
            difficulty: parsed.difficulty || 'medium',
            timeLimit: parsed.timeLimit || 30,
            points: parsed.points || 100,
            testCases: (parsed.testCases || []).map(tc => ({
                input: tc.input || '',
                expectedOutput: tc.expectedOutput || '',
                explanation: tc.explanation,
                isHidden: tc.isHidden || false
            })),
            starterCode: parsed.starterCode || {
                python: '# Your code here\n',
                javascript: '// Your code here\n'
            },
            hints: parsed.hints || []
        };
    } catch (error: any) {
        console.error('Error parsing coding challenge:', error);
        
        // Provide more specific error messages
        if (error.message?.includes('API key')) {
            throw new Error('Gemini API key is missing or invalid. Please configure VITE_GEMINI_API_KEY.');
        }
        if (error.message?.includes('JSON')) {
            throw new Error('Failed to parse AI response. The document format may not be supported. Try a clearer document.');
        }
        if (error.message?.includes('quota') || error.message?.includes('rate')) {
            throw new Error('API rate limit exceeded. Please try again in a moment.');
        }
        
        throw new Error(`Failed to parse coding challenge: ${error.message || 'Please ensure it contains valid problem details.'}`);
    }
};

// Utility to detect document type based on content
export const detectDocumentType = async (file: File): Promise<'assessment' | 'coding' | 'unknown'> => {
    const model = getGeminiModel();

    const fileContent = await extractTextFromPDF(file);
    const mimeType = file.type || 'application/pdf';

    const prompt = `Analyze this document and determine if it contains:
1. Multiple choice questions (assessment/quiz)
2. A coding problem with test cases
3. Neither

Respond with ONLY one word: "assessment", "coding", or "unknown"`;

    try {
        const result = await model.generateContent([
            { text: prompt },
            {
                inlineData: {
                    mimeType,
                    data: fileContent
                }
            }
        ]);

        const response = await result.response;
        const text = response.text().toLowerCase().trim();

        if (text.includes('assessment')) return 'assessment';
        if (text.includes('coding')) return 'coding';
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
