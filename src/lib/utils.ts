import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, formatStr: string = 'MMM d, yyyy') {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, formatStr);
}

export function formatDateTime(date: string | Date) {
    return formatDate(date, 'MMM d, yyyy h:mm a');
}

export function formatRelativeTime(date: string | Date) {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(d, { addSuffix: true });
}

export function formatDuration(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function formatMinutes(minutes: number) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
        return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
}

export function getInitials(name: string) {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function getModuleColor(module: string) {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
        python: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
        sql: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
        machine_learning: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
        deep_learning: { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
    };
    return colors[module] || colors.python;
}

export function getStatusColor(status: string) {
    const colors: Record<string, { bg: string; text: string }> = {
        draft: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
        submitted: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
        under_review: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
        feedback_received: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
        approved: { bg: 'bg-green-500/20', text: 'text-green-400' },
        revision_requested: { bg: 'bg-red-500/20', text: 'text-red-400' },
    };
    return colors[status] || colors.draft;
}

export function getCategoryColor(category: string) {
    const colors: Record<string, { bg: string; text: string }> = {
        general: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
        urgent: { bg: 'bg-red-500/20', text: 'text-red-400' },
        course_update: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
        assignment: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
        event: { bg: 'bg-green-500/20', text: 'text-green-400' },
    };
    return colors[category] || colors.general;
}

export function truncate(str: string, length: number) {
    if (str.length <= length) return str;
    return str.slice(0, length) + '...';
}

export function getGradeFromScore(score: number): { grade: string; color: string } {
    if (score >= 90) return { grade: 'A+', color: 'text-green-400' };
    if (score >= 80) return { grade: 'A', color: 'text-green-400' };
    if (score >= 70) return { grade: 'B', color: 'text-blue-400' };
    if (score >= 60) return { grade: 'C', color: 'text-yellow-400' };
    if (score >= 50) return { grade: 'D', color: 'text-orange-400' };
    return { grade: 'F', color: 'text-red-400' };
}
