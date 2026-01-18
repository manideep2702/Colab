// Gemini AI Service for Assessment Grading

const GEMINI_API_KEY = 'AIzaSyC_kXHb3WddEkUOMz01ClNDisMd83IeDAs';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

interface Question {
    id: string;
    type: 'mcq' | 'short_answer' | 'long_answer' | 'true_false' | 'coding';
    question: string;
    options?: string[];
    correct_answer?: string;
    points: number;
    test_cases?: Array<{ input: string; expected_output: string }>;
}

interface StudentAnswer {
    question_id: string;
    answer: string;
}

interface GradingResult {
    total_score: number;
    max_score: number;
    percentage: number;
    grade: string;
    question_results: Array<{
        question_id: string;
        score: number;
        max_score: number;
        is_correct: boolean;
        feedback: string;
    }>;
    overall_feedback: string;
    strengths: string[];
    areas_to_improve: string[];
}

export const geminiService = {
    /**
     * Grade an assessment using Gemini AI
     */
    gradeAssessment: async (
        questions: Question[],
        studentAnswers: StudentAnswer[],
        assessmentTitle: string
    ): Promise<GradingResult> => {
        // Build the prompt for Gemini
        const prompt = buildGradingPrompt(questions, studentAnswers, assessmentTitle);

        try {
            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.3,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 2048,
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.status}`);
            }

            const data = await response.json();
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!textResponse) {
                throw new Error('No response from Gemini');
            }

            // Parse the JSON response from Gemini
            return parseGradingResponse(textResponse, questions, studentAnswers);
        } catch (error) {
            console.error('Error grading with Gemini:', error);
            // Fallback to basic grading if AI fails
            return fallbackGrading(questions, studentAnswers);
        }
    },

    /**
     * Generate feedback for a single answer
     */
    generateFeedback: async (
        question: string,
        correctAnswer: string,
        studentAnswer: string
    ): Promise<string> => {
        const prompt = `
You are an educational AI assistant. Provide brief, constructive feedback for a student's answer.

Question: ${question}
Correct Answer: ${correctAnswer}
Student's Answer: ${studentAnswer}

Provide 1-2 sentences of constructive feedback. Be encouraging but accurate.`;

        try {
            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: 0.5,
                        maxOutputTokens: 256,
                    }
                })
            });

            if (!response.ok) {
                return 'Unable to generate feedback at this time.';
            }

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Good effort!';
        } catch {
            return 'Good effort! Review the correct answer for improvement.';
        }
    }
};

function buildGradingPrompt(
    questions: Question[],
    studentAnswers: StudentAnswer[],
    assessmentTitle: string
): string {
    let questionsText = questions.map((q, index) => {
        const studentAnswer = studentAnswers.find(a => a.question_id === q.id);
        return `
Question ${index + 1} (${q.points} points):
Type: ${q.type}
Question: ${q.question}
${q.options ? `Options: ${q.options.join(', ')}` : ''}
${q.correct_answer ? `Correct Answer: ${q.correct_answer}` : ''}
Student's Answer: ${studentAnswer?.answer || '[No answer provided]'}
`;
    }).join('\n---\n');

    return `
You are an expert educational assessor. Grade the following assessment and provide detailed feedback.

Assessment Title: ${assessmentTitle}

${questionsText}

INSTRUCTIONS:
1. Grade each question based on correctness and understanding
2. For MCQ and True/False: Award full points for correct, 0 for incorrect
3. For Short/Long answers: Award partial credit based on understanding shown
4. Provide constructive feedback for each answer

Respond ONLY with a valid JSON object in this exact format (no markdown, no extra text):
{
    "question_results": [
        {
            "question_id": "question_id_here",
            "score": 0,
            "max_score": 0,
            "is_correct": true,
            "feedback": "Brief feedback here"
        }
    ],
    "overall_feedback": "Overall performance summary",
    "strengths": ["Strength 1", "Strength 2"],
    "areas_to_improve": ["Area 1", "Area 2"]
}
`;
}

function parseGradingResponse(
    response: string,
    questions: Question[],
    studentAnswers: StudentAnswer[]
): GradingResult {
    try {
        // Try to extract JSON from the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in response');
        }

        const parsed = JSON.parse(jsonMatch[0]);
        
        let totalScore = 0;
        let maxScore = 0;

        const questionResults = parsed.question_results?.map((result: any) => {
            const question = questions.find(q => q.id === result.question_id);
            const qMaxScore = question?.points || result.max_score || 1;
            const qScore = Math.min(result.score || 0, qMaxScore);
            
            totalScore += qScore;
            maxScore += qMaxScore;

            return {
                question_id: result.question_id,
                score: qScore,
                max_score: qMaxScore,
                is_correct: result.is_correct ?? (qScore === qMaxScore),
                feedback: result.feedback || 'No feedback available'
            };
        }) || [];

        // If question_results is empty, calculate from questions
        if (questionResults.length === 0) {
            questions.forEach(q => {
                maxScore += q.points;
            });
        }

        const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

        return {
            total_score: totalScore,
            max_score: maxScore,
            percentage,
            grade: getGrade(percentage),
            question_results: questionResults,
            overall_feedback: parsed.overall_feedback || 'Assessment completed.',
            strengths: parsed.strengths || [],
            areas_to_improve: parsed.areas_to_improve || []
        };
    } catch (error) {
        console.error('Error parsing Gemini response:', error);
        return fallbackGrading(questions, studentAnswers);
    }
}

function fallbackGrading(questions: Question[], studentAnswers: StudentAnswer[]): GradingResult {
    let totalScore = 0;
    let maxScore = 0;

    const questionResults = questions.map(q => {
        const studentAnswer = studentAnswers.find(a => a.question_id === q.id);
        maxScore += q.points;

        // Simple exact match for MCQ and true/false
        let isCorrect = false;
        let score = 0;
        let feedback = 'Review this answer.';

        if (q.type === 'mcq' || q.type === 'true_false') {
            isCorrect = studentAnswer?.answer?.toLowerCase().trim() === q.correct_answer?.toLowerCase().trim();
            score = isCorrect ? q.points : 0;
            feedback = isCorrect ? 'Correct!' : 'Review this answer.';
        } else if (q.type === 'coding') {
            // Coding questions are graded by test case results
            try {
                const parsed = JSON.parse(studentAnswer?.answer || '{}');
                if (parsed.testResults) {
                    const testScore = parsed.testResults.score || 0;
                    score = Math.round((testScore / 100) * q.points);
                    isCorrect = testScore === 100;
                    feedback = isCorrect 
                        ? 'All test cases passed!' 
                        : `${parsed.testResults.passed_tests}/${parsed.testResults.total_tests} test cases passed.`;
                }
            } catch {
                score = 0;
                feedback = 'Code submission could not be evaluated.';
            }
        } else {
            // For short/long answers, give partial credit if something was written
            if (studentAnswer?.answer && studentAnswer.answer.length > 10) {
                score = Math.round(q.points * 0.5); // 50% for attempting
                isCorrect = false;
                feedback = 'Answer received. AI will evaluate for full credit.';
            } else {
                feedback = 'No answer provided.';
            }
        }

        totalScore += score;

        return {
            question_id: q.id,
            score,
            max_score: q.points,
            is_correct: isCorrect,
            feedback
        };
    });

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    return {
        total_score: totalScore,
        max_score: maxScore,
        percentage,
        grade: getGrade(percentage),
        question_results: questionResults,
        overall_feedback: 'Assessment has been graded.',
        strengths: [],
        areas_to_improve: []
    };
}

function getGrade(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
}

export type { Question, StudentAnswer, GradingResult };

