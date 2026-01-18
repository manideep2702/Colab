// User Types
export type UserRole = 'admin' | 'student';

export interface User {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
    role: UserRole;
    created_at: string;
}

// Announcement Types
export type AnnouncementCategory = 'general' | 'urgent' | 'course_update' | 'assignment' | 'event';

export interface Announcement {
    id: string;
    admin_id: string;
    title: string;
    content: string;
    is_pinned: boolean;
    category: AnnouncementCategory;
    created_at: string;
    scheduled_at?: string;
    admin?: User;
}

// Assessment Types
export type AssessmentType = 'daily_quiz' | 'weekly_test' | 'module_assessment';
export type QuestionType = 'mcq' | 'short_answer' | 'long_answer' | 'true_false' | 'coding' | 'file_upload';

export interface TestCase {
    id: string;
    input: string;
    expected_output: string;
    is_hidden?: boolean;
    description?: string;
}

export interface Question {
    id: string;
    type: QuestionType;
    content: string;
    options?: string[];
    correct_answer?: string;
    points: number;
    coding_language?: 'python' | 'sql' | 'javascript' | 'java' | 'cpp' | 'c';
    test_cases?: TestCase[];
    function_name?: string;
}

export interface Assessment {
    id: string;
    admin_id: string;
    title: string;
    description: string;
    type: AssessmentType;
    questions: Question[];
    time_limit: number; // in minutes
    due_date: string;
    max_attempts: number;
    passing_score: number;
    ai_grading_enabled: boolean;
    grading_criteria_weights?: {
        correctness: number;
        code_quality: number;
        efficiency: number;
        best_practices: number;
        creativity: number;
    };
    created_at: string;
    module: CurriculumModule;
}

export interface AssessmentSubmission {
    id: string;
    assessment_id: string;
    student_id: string;
    answers: Record<string, string | string[]>;
    score?: number;
    ai_score?: number;
    ai_feedback?: AIFeedback;
    ai_graded_at?: string;
    human_reviewed: boolean;
    human_score?: number;
    submitted_at: string;
    assessment?: Assessment;
    student?: User;
}

export interface AIFeedback {
    score: number;
    max_score: number;
    grade: string;
    breakdown: {
        correctness: number;
        code_quality: number;
        efficiency: number;
        best_practices: number;
        creativity: number;
    };
    feedback: {
        strengths: string[];
        improvements: string[];
        learning_resources: Array<{ topic: string; url: string }>;
    };
    plagiarism_flag: boolean;
    similarity_score: number;
}

// Coding Challenge Types
export interface CodingChallenge {
    id: string;
    admin_id: string;
    title: string;
    description: string; // Markdown
    constraints?: string;
    starter_code: Record<string, string>; // Language -> Code
    difficulty: 'easy' | 'medium' | 'hard';
    points: number;
    time_limit?: number; // in minutes
    module: CurriculumModule;
    created_at: string;
    test_cases?: ChallengeTestCase[];
}

export interface ChallengeTestCase {
    id: string;
    challenge_id: string;
    input: string;
    expected_output: string;
    is_hidden: boolean;
    explanation?: string;
    created_at: string;
}

export interface CodingSubmission {
    id: string;
    challenge_id: string;
    student_id: string;
    code: string;
    language: string;
    test_cases_passed: number;
    total_test_cases: number;
    score: number;
    status: 'pending' | 'passed' | 'failed';
    submitted_at: string;
    execution_time?: number;
    // Joined properties
    student?: User;
    challenge?: CodingChallenge;
}

// Project Types
export type ProjectStatus = 'draft' | 'submitted' | 'under_review' | 'feedback_received' | 'approved' | 'revision_requested';

export interface Project {
    id: string;
    admin_id: string;
    title: string;
    description: string;
    requirements: string;
    resources: string[];
    deadline: string;
    grading_rubric: string;
    module: CurriculumModule;
    created_at: string;
}

export interface ProjectSubmission {
    id: string;
    project_id: string;
    student_id: string;
    submission_url: string;
    github_url?: string;
    description?: string;
    screenshots?: string[];
    status: ProjectStatus;
    feedback?: string;
    score?: number;
    submitted_at: string;
    updated_at: string;
    project?: Project;
    student?: User;
}

// Recording Types
export type CurriculumModule = 'python' | 'sql' | 'machine_learning' | 'deep_learning';

export interface Recording {
    id: string;
    admin_id: string;
    title: string;
    description: string;
    video_url: string;
    thumbnail_url?: string;
    module: CurriculumModule;
    duration: number; // in seconds
    allow_download: boolean;
    created_at: string;
    allow_preview?: boolean; // Added optional property
}

export interface RecordingProgress {
    id: string;
    recording_id: string;
    student_id: string;
    progress_percentage: number;
    completed: boolean;
    last_watched_at: string;
}

// Live Class Types
export interface LiveClass {
    id: string;
    admin_id: string;
    title: string;
    description: string;
    meeting_link: string;
    scheduled_at: string;
    duration: number; // in minutes
    recorded_video_url?: string;
    module: CurriculumModule;
    created_at: string;
    admin?: User;
}

export interface LiveClassAttendance {
    id: string;
    live_class_id: string;
    student_id: string;
    joined_at: string;
    left_at?: string;
}

// Notification Types
export type NotificationType = 'announcement' | 'assessment' | 'project' | 'live_class' | 'grade' | 'reminder';

export interface Notification {
    id: string;
    user_id: string;
    type: NotificationType;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    link?: string;
}

// Analytics Types
export interface StudentProgress {
    student_id: string;
    completed_recordings: number;
    total_recordings: number;
    completed_assessments: number;
    total_assessments: number;
    average_score: number;
    projects_submitted: number;
    projects_approved: number;
    attendance_rate: number;
}

// Dashboard Stats
export interface AdminDashboardStats {
    total_students: number;
    total_announcements: number;
    total_assessments: number;
    total_projects: number;
    total_recordings: number;
    upcoming_live_classes: number;
    pending_submissions: number;
}

export interface StudentDashboardStats {
    upcoming_deadlines: number;
    unread_announcements: number;
    pending_assessments: number;
    completed_recordings: number;
    overall_progress: number;
    current_streak: number;
}
