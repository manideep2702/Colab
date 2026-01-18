import { supabase } from '@/lib/supabase';

export interface AdmissionApplication {
    full_name: string;
    email: string;
    phone?: string;
    experience_level: 'beginner' | 'intermediate' | 'advanced';
    motivation: string;
}

export const admissionService = {
    async submit(data: AdmissionApplication) {
        const { error } = await supabase
            .from('admissions')
            .insert([data]);

        if (error) throw error;
        return true;
    },

    async getAll() {
        const { data, error } = await supabase
            .from('admissions')
            .select('*')
            .order('applied_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async updateStatus(id: string, status: 'pending' | 'under_review' | 'accepted' | 'rejected') {
        const { error } = await supabase
            .from('admissions')
            .update({ status })
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};
