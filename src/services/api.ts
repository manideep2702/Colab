import { supabase } from '@/lib/supabase';
import type {
    Announcement,
    Assessment,
    Project,
    Recording,
    LiveClass,
    User,
    ProjectSubmission,
    AssessmentSubmission,
    CodingChallenge,
    ChallengeTestCase,
    CodingSubmission
} from '@/types';

// ============================================
// ANNOUNCEMENTS SERVICE
// ============================================
export const announcementService = {
    getAll: async (): Promise<Announcement[]> => {
        const { data, error } = await supabase
            .from('announcements')
            .select('*')
            .order('is_pinned', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    create: async (announcement: {
        title: string;
        content: string;
        category: string;
        is_pinned: boolean;
        admin_id: string;
    }): Promise<Announcement> => {
        const { data, error } = await supabase
            .from('announcements')
            .insert(announcement)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    update: async (id: string, updates: Partial<Announcement>): Promise<Announcement> => {
        const { data, error } = await supabase
            .from('announcements')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    delete: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('announcements')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Real-time subscription
    subscribe: (callback: (payload: any) => void) => {
        return supabase
            .channel('announcements-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, callback)
            .subscribe();
    }
};

// ============================================
// ASSESSMENTS SERVICE
// ============================================
export const assessmentService = {
    getAll: async (): Promise<Assessment[]> => {
        const { data, error } = await supabase
            .from('assessments')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    create: async (assessment: {
        title: string;
        description?: string;
        type: string;
        module?: string;
        time_limit?: number;
        passing_score?: number;
        max_attempts?: number;
        due_date?: string;
        ai_grading_enabled?: boolean;
        questions: any[];
        admin_id: string;
    }): Promise<Assessment> => {
        const { data, error } = await supabase
            .from('assessments')
            .insert(assessment)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    update: async (id: string, updates: Partial<Assessment>): Promise<Assessment> => {
        const { data, error } = await supabase
            .from('assessments')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    delete: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('assessments')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Get submissions for an assessment
    getSubmissions: async (assessmentId: string): Promise<AssessmentSubmission[]> => {
        const { data, error } = await supabase
            .from('assessment_submissions')
            .select('*, student:profiles(*)')
            .eq('assessment_id', assessmentId)
            .order('submitted_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // Submit an assessment (for students)
    submit: async (submission: {
        assessment_id: string;
        student_id: string;
        answers: any;
        score?: number;
        ai_score?: number;
        ai_feedback?: any;
    }): Promise<AssessmentSubmission> => {
        const { data, error } = await supabase
            .from('assessment_submissions')
            .insert({
                ...submission,
                ai_graded_at: submission.ai_score !== undefined ? new Date().toISOString() : null,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Get student's submissions
    getStudentSubmissions: async (studentId: string): Promise<AssessmentSubmission[]> => {
        const { data, error } = await supabase
            .from('assessment_submissions')
            .select('*, assessment:assessments(*)')
            .eq('student_id', studentId)
            .order('submitted_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // Real-time subscription
    subscribe: (callback: (payload: any) => void) => {
        return supabase
            .channel('assessments-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'assessments' }, callback)
            .subscribe();
    }
};

// ============================================
// PROJECTS SERVICE
// ============================================
export const projectService = {
    getAll: async (): Promise<Project[]> => {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    create: async (project: {
        title: string;
        description: string;
        requirements?: string;
        resources?: string[];
        deadline?: string;
        grading_rubric?: string;
        module?: string;
        admin_id: string;
    }): Promise<Project> => {
        const { data, error } = await supabase
            .from('projects')
            .insert(project)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    update: async (id: string, updates: Partial<Project>): Promise<Project> => {
        const { data, error } = await supabase
            .from('projects')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    delete: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Get submissions for a project (admin view)
    getSubmissions: async (projectId: string): Promise<ProjectSubmission[]> => {
        const { data, error } = await supabase
            .from('project_submissions')
            .select('*, student:profiles(*)')
            .eq('project_id', projectId)
            .order('submitted_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // Submit a project (for students)
    submit: async (submission: {
        project_id: string;
        student_id: string;
        submission_url: string;
        github_url?: string;
        description?: string;
        screenshots?: string[];
        status?: string;
    }): Promise<ProjectSubmission> => {
        const { data, error } = await supabase
            .from('project_submissions')
            .insert(submission)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Real-time subscription
    subscribe: (callback: (payload: any) => void) => {
        return supabase
            .channel('projects-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, callback)
            .subscribe();
    }
};

// ============================================
// RECORDINGS SERVICE
// ============================================
export const recordingService = {
    getAll: async (): Promise<Recording[]> => {
        const { data, error } = await supabase
            .from('recordings')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    create: async (recording: {
        title: string;
        description?: string;
        video_url: string;
        thumbnail_url?: string;
        module?: string;
        duration?: number;
        allow_download?: boolean;
        admin_id: string;
    }): Promise<Recording> => {
        const { data, error } = await supabase
            .from('recordings')
            .insert(recording)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    update: async (id: string, updates: Partial<Recording>): Promise<Recording> => {
        const { data, error } = await supabase
            .from('recordings')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    delete: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('recordings')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Update student's progress on a recording
    updateProgress: async (recordingId: string, studentId: string, progress: number, completed: boolean) => {
        const { data, error } = await supabase
            .from('recording_progress')
            .upsert({
                recording_id: recordingId,
                student_id: studentId,
                progress_percentage: progress,
                completed,
                last_watched_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Real-time subscription
    subscribe: (callback: (payload: any) => void) => {
        return supabase
            .channel('recordings-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'recordings' }, callback)
            .subscribe();
    }
};

// ============================================
// LIVE CLASSES SERVICE
// ============================================
export const liveClassService = {
    getAll: async (): Promise<LiveClass[]> => {
        const { data, error } = await supabase
            .from('live_classes')
            .select('*')
            .order('scheduled_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    create: async (liveClass: {
        title: string;
        description?: string;
        meeting_link: string;
        scheduled_at: string;
        duration?: number;
        module?: string;
        admin_id: string;
    }): Promise<LiveClass> => {
        const { data, error } = await supabase
            .from('live_classes')
            .insert(liveClass)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    update: async (id: string, updates: Partial<LiveClass>): Promise<LiveClass> => {
        const { data, error } = await supabase
            .from('live_classes')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    delete: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('live_classes')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Real-time subscription
    subscribe: (callback: (payload: any) => void) => {
        return supabase
            .channel('live-classes-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'live_classes' }, callback)
            .subscribe();
    }
};

// ============================================
// STUDENTS/PROFILES SERVICE
// ============================================
export const userService = {
    getAll: async (): Promise<User[]> => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'student')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    getProfile: async (userId: string): Promise<User> => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data;
    },

    updateProfile: async (userId: string, updates: Partial<User>): Promise<User> => {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Real-time subscription
    subscribe: (callback: (payload: any) => void) => {
        return supabase
            .channel('profiles-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, callback)
            .subscribe();
    }
};

// ============================================
// NOTIFICATIONS SERVICE
// ============================================
export const notificationService = {
    getForUser: async (userId: string) => {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    markAsRead: async (notificationId: string) => {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (error) throw error;
    },

    create: async (notification: {
        user_id: string;
        type: string;
        title: string;
        message: string;
        link?: string;
    }) => {
        const { data, error } = await supabase
            .from('notifications')
            .insert(notification)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

// ============================================
// PROFILE/STUDENTS SERVICE
// ============================================
export const profileService = {
    // Get all students
    getAllStudents: async (): Promise<any[]> => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'student')
            .order('name', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    // Get a single profile by ID
    getById: async (id: string): Promise<any> => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    // Update a profile
    update: async (id: string, updates: any): Promise<any> => {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Get student with their submissions
    getStudentWithSubmissions: async (studentId: string): Promise<any> => {
        const [profile, submissions] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', studentId).single(),
            supabase.from('assessment_submissions').select('*, assessment:assessments(*)').eq('student_id', studentId)
        ]);

        if (profile.error) throw profile.error;

        return {
            ...profile.data,
            submissions: submissions.data || []
        };
    }
};

// ============================================
// CODING CHALLENGES SERVICE
// ============================================
export const codingChallengeService = {
    getAll: async (): Promise<CodingChallenge[]> => {
        const { data, error } = await supabase
            .from('coding_challenges')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    getById: async (id: string): Promise<CodingChallenge & { test_cases: ChallengeTestCase[] }> => {
        const { data, error } = await supabase
            .from('coding_challenges')
            .select('*, test_cases:challenge_test_cases(*)')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    create: async (challenge: Partial<CodingChallenge>): Promise<CodingChallenge> => {
        const { data, error } = await supabase
            .from('coding_challenges')
            .insert(challenge)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    update: async (id: string, updates: Partial<CodingChallenge>): Promise<CodingChallenge> => {
        const { data, error } = await supabase
            .from('coding_challenges')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    delete: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('coding_challenges')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Test Cases Management
    addTestCase: async (testCase: Partial<ChallengeTestCase>): Promise<ChallengeTestCase> => {
        const { data, error } = await supabase
            .from('challenge_test_cases')
            .insert(testCase)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    updateTestCase: async (id: string, updates: Partial<ChallengeTestCase>): Promise<ChallengeTestCase> => {
        const { data, error } = await supabase
            .from('challenge_test_cases')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    deleteTestCase: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('challenge_test_cases')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Submissions
    submit: async (submission: Partial<CodingSubmission>): Promise<CodingSubmission> => {
        const { data, error } = await supabase
            .from('coding_submissions')
            .insert(submission)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    getMySubmissions: async (studentId: string): Promise<CodingSubmission[]> => {
        const { data, error } = await supabase
            .from('coding_submissions')
            .select('*, challenge:coding_challenges(title)')
            .eq('student_id', studentId)
            .order('submitted_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }
};
