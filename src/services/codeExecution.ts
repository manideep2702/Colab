// Code Execution Service for Coding Challenges
// Uses Piston API for secure code execution (free, open-source)

const PISTON_API_URL = 'https://emkc.org/api/v2/piston';

// Types for CodePlayground compatibility
export type SupportedLanguage = 'python' | 'javascript' | 'java' | 'cpp' | 'c' | 'sql';

export interface CodeExecutionResult {
    output: string;
    error?: string;
    executionTime: number;
    exitCode?: number;
}

export const LANGUAGE_SNIPPETS: Record<SupportedLanguage, string> = {
    python: `# Python Solution
def solution():
    # Your code here
    pass

# Read input
import sys
data = sys.stdin.read().strip()
print(solution())`,
    javascript: `// JavaScript Solution
function solution() {
    // Your code here
    return null;
}

const data = require('fs').readFileSync('/dev/stdin', 'utf8').trim();
console.log(solution());`,
    java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // Your code here
    }
}`,
    cpp: `#include <iostream>
using namespace std;

int main() {
    // Your code here
    return 0;
}`,
    c: `#include <stdio.h>

int main() {
    // Your code here
    return 0;
}`,
    sql: `-- SQL Query
SELECT * FROM table_name;`,
};

// Helper functions for input detection
export function detectsInputCalls(language: SupportedLanguage, code: string): boolean {
    if (language === 'python') {
        return /input\s*\(/.test(code);
    }
    if (language === 'javascript') {
        return /readline\s*\(/.test(code) || /prompt\s*\(/.test(code);
    }
    if (language === 'java') {
        return /Scanner/.test(code) && /next/.test(code);
    }
    if (language === 'cpp' || language === 'c') {
        return /cin\s*>>/.test(code) || /scanf\s*\(/.test(code) || /getline\s*\(/.test(code);
    }
    return false;
}

export function extractPythonInputPrompts(code: string): string[] {
    const prompts: string[] = [];
    const regex = /input\s*\(\s*["']([^"']*)["']\s*\)/g;
    let match;
    while ((match = regex.exec(code)) !== null) {
        prompts.push(match[1] || 'Input:');
    }
    // If no prompts found but input() calls exist, add generic prompts
    if (prompts.length === 0 && /input\s*\(/.test(code)) {
        const inputCount = (code.match(/input\s*\(/g) || []).length;
        for (let i = 0; i < inputCount; i++) {
            prompts.push(`Input ${i + 1}:`);
        }
    }
    return prompts;
}

export interface TestCase {
    id: string;
    input: string;
    expected_output: string;
    is_hidden?: boolean;
    description?: string;
}

export interface ExecutionResult {
    passed: boolean;
    actual_output: string;
    expected_output: string;
    execution_time?: number;
    error?: string;
}

export interface TestResult {
    test_case_id: string;
    passed: boolean;
    actual_output: string;
    expected_output: string;
    execution_time: number;
    error?: string;
}

export interface SubmissionResult {
    total_tests: number;
    passed_tests: number;
    failed_tests: number;
    score: number;
    results: TestResult[];
    overall_status: 'accepted' | 'wrong_answer' | 'runtime_error' | 'compilation_error' | 'time_limit_exceeded';
}

const LANGUAGE_VERSIONS: Record<string, string> = {
    python: '3.10.0',
    javascript: '18.15.0',
    java: '15.0.2',
    cpp: '10.2.0',
    c: '10.2.0',
};

const LANGUAGE_IDS: Record<string, string> = {
    python: 'python',
    javascript: 'javascript',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
};

export const codeExecutionService = {
    /**
     * Execute code (compatible with CodePlayground)
     */
    execute: async (
        language: SupportedLanguage,
        code: string,
        stdin: string = ''
    ): Promise<CodeExecutionResult> => {
        const startTime = Date.now();
        
        try {
            const response = await fetch(`${PISTON_API_URL}/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    language: LANGUAGE_IDS[language] || 'python',
                    version: LANGUAGE_VERSIONS[language] || '3.10.0',
                    files: [
                        {
                            name: getFileName(language),
                            content: code,
                        },
                    ],
                    stdin: stdin,
                    run_timeout: 5000,
                }),
            });

            if (!response.ok) {
                throw new Error(`Execution failed: ${response.status}`);
            }

            const data = await response.json();
            const executionTime = Date.now() - startTime;

            if (data.compile && data.compile.code !== 0) {
                return {
                    output: '',
                    error: data.compile.stderr || 'Compilation error',
                    executionTime,
                    exitCode: data.compile.code,
                };
            }

            return {
                output: data.run.stdout?.trim() || '',
                error: data.run.stderr || undefined,
                executionTime,
                exitCode: data.run.code,
            };
        } catch (error) {
            return {
                output: '',
                error: error instanceof Error ? error.message : 'Execution failed',
                executionTime: Date.now() - startTime,
            };
        }
    },

    /**
     * Execute code with a single input
     */
    executeCode: async (
        code: string,
        language: string,
        input: string
    ): Promise<{ output: string; error?: string; executionTime: number }> => {
        const startTime = Date.now();
        
        try {
            const response = await fetch(`${PISTON_API_URL}/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    language: LANGUAGE_IDS[language] || 'python',
                    version: LANGUAGE_VERSIONS[language] || '3.10.0',
                    files: [
                        {
                            name: getFileName(language),
                            content: code,
                        },
                    ],
                    stdin: input,
                    run_timeout: 5000, // 5 second timeout
                }),
            });

            if (!response.ok) {
                throw new Error(`Execution failed: ${response.status}`);
            }

            const data = await response.json();
            const executionTime = Date.now() - startTime;

            if (data.compile && data.compile.code !== 0) {
                return {
                    output: '',
                    error: data.compile.stderr || 'Compilation error',
                    executionTime,
                };
            }

            if (data.run.code !== 0) {
                return {
                    output: data.run.stdout || '',
                    error: data.run.stderr || 'Runtime error',
                    executionTime,
                };
            }

            return {
                output: data.run.stdout?.trim() || '',
                executionTime,
            };
        } catch (error) {
            return {
                output: '',
                error: error instanceof Error ? error.message : 'Execution failed',
                executionTime: Date.now() - startTime,
            };
        }
    },

    /**
     * Run code against all test cases
     */
    runTestCases: async (
        code: string,
        language: string,
        testCases: TestCase[]
    ): Promise<SubmissionResult> => {
        const results: TestResult[] = [];
        let passedCount = 0;

        for (const testCase of testCases) {
            const { output, error, executionTime } = await codeExecutionService.executeCode(
                code,
                language,
                testCase.input
            );

            const normalizedOutput = normalizeOutput(output);
            const normalizedExpected = normalizeOutput(testCase.expected_output);
            const passed = !error && normalizedOutput === normalizedExpected;

            if (passed) passedCount++;

            results.push({
                test_case_id: testCase.id,
                passed,
                actual_output: output,
                expected_output: testCase.expected_output,
                execution_time: executionTime,
                error,
            });

            // If there's a compilation error, don't run remaining tests
            if (error?.includes('Compilation error')) {
                break;
            }
        }

        const totalTests = testCases.length;
        const failedTests = totalTests - passedCount;
        const score = Math.round((passedCount / totalTests) * 100);

        let overallStatus: SubmissionResult['overall_status'] = 'accepted';
        if (passedCount === 0 && results.some(r => r.error?.includes('Compilation'))) {
            overallStatus = 'compilation_error';
        } else if (results.some(r => r.error?.includes('Runtime'))) {
            overallStatus = 'runtime_error';
        } else if (results.some(r => r.error?.includes('timeout'))) {
            overallStatus = 'time_limit_exceeded';
        } else if (failedTests > 0) {
            overallStatus = 'wrong_answer';
        }

        return {
            total_tests: totalTests,
            passed_tests: passedCount,
            failed_tests: failedTests,
            score,
            results,
            overall_status: overallStatus,
        };
    },

    /**
     * Get available languages
     */
    getLanguages: () => [
        { id: 'python', name: 'Python 3', extension: '.py' },
        { id: 'javascript', name: 'JavaScript', extension: '.js' },
        { id: 'java', name: 'Java', extension: '.java' },
        { id: 'cpp', name: 'C++', extension: '.cpp' },
        { id: 'c', name: 'C', extension: '.c' },
    ],

    /**
     * Get starter code template for a language
     */
    getStarterCode: (language: string, functionName: string = 'solution'): string => {
        const templates: Record<string, string> = {
            python: `def ${functionName}(input_data):
    # Your code here
    pass

# Read input
import sys
input_data = sys.stdin.read().strip()

# Call your function and print the result
result = ${functionName}(input_data)
print(result)`,

            javascript: `function ${functionName}(inputData) {
    // Your code here
    return null;
}

// Read input
const inputData = require('fs').readFileSync('/dev/stdin', 'utf8').trim();

// Call your function and print the result
console.log(${functionName}(inputData));`,

            java: `import java.util.Scanner;

public class Main {
    public static String ${functionName}(String inputData) {
        // Your code here
        return "";
    }

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        StringBuilder input = new StringBuilder();
        while (scanner.hasNextLine()) {
            input.append(scanner.nextLine()).append("\\n");
        }
        System.out.println(${functionName}(input.toString().trim()));
    }
}`,

            cpp: `#include <iostream>
#include <string>
using namespace std;

string ${functionName}(string inputData) {
    // Your code here
    return "";
}

int main() {
    string input;
    getline(cin, input);
    cout << ${functionName}(input) << endl;
    return 0;
}`,

            c: `#include <stdio.h>
#include <string.h>

void ${functionName}(char* inputData, char* result) {
    // Your code here
    strcpy(result, "");
}

int main() {
    char input[1000];
    char result[1000];
    fgets(input, sizeof(input), stdin);
    input[strcspn(input, "\\n")] = 0;
    ${functionName}(input, result);
    printf("%s\\n", result);
    return 0;
}`,
        };

        return templates[language] || templates.python;
    },
};

function getFileName(language: string): string {
    const extensions: Record<string, string> = {
        python: 'main.py',
        javascript: 'main.js',
        java: 'Main.java',
        cpp: 'main.cpp',
        c: 'main.c',
    };
    return extensions[language] || 'main.py';
}

function normalizeOutput(output: string): string {
    return output
        .trim()
        .replace(/\r\n/g, '\n')
        .replace(/\s+$/gm, '')
        .toLowerCase();
}
