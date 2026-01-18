import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Card } from '@/components/ui';
import { admissionService } from '@/services/admission';
import {
    User,
    Mail,
    Phone,
    Brain,
    MessageSquare,
    CheckCircle2,
    ArrowRight,
    Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

const admissionSchema = z.object({
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    phone: z.string().optional(),
    experience_level: z.enum(['beginner', 'intermediate', 'advanced']),
    motivation: z.string().min(20, 'Please provide a bit more detail (min 20 characters)'),
});

type AdmissionForm = z.infer<typeof admissionSchema>;

export const AdmissionPage: React.FC = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<AdmissionForm>({
        resolver: zodResolver(admissionSchema),
        defaultValues: {
            experience_level: 'beginner'
        }
    });

    const onSubmit = async (data: AdmissionForm) => {
        setIsSubmitting(true);
        try {
            await admissionService.submit(data);
            setIsSuccess(true);
        } catch (error) {
            console.error('Submission failed:', error);
            // In a real app, show a toast here
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-[#020203] flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full text-center"
                >
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">Application Received!</h1>
                    <p className="text-zinc-400 mb-8 leading-relaxed">
                        Thank you for applying to DataLearn. Our admissions team will review your application and get back to you via email within 24-48 hours.
                    </p>
                    <Button
                        variant="primary"
                        size="lg"
                        className="w-full"
                        onClick={() => navigate('/')}
                    >
                        Back to Home
                    </Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020203] relative overflow-hidden flex items-center justify-center py-20 px-6">
            {/* Background Decor */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-2xl w-full">
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] mb-6"
                    >
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Admissions Open Jan 2026</span>
                    </motion.div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tightest mb-4">
                        APPLY FOR <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">ADMISSION</span>
                    </h1>
                    <p className="text-zinc-500 font-medium">Join an elite cohort of data practitioners and AI engineers.</p>
                </div>

                <Card variant="glass" className="p-8 md:p-12 border-white/[0.05]">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                {...register('full_name')}
                                label="Full Name"
                                placeholder="John Doe"
                                leftIcon={<User className="w-4 h-4" />}
                                error={errors.full_name?.message}
                                className="bg-white/[0.02]"
                            />
                            <Input
                                {...register('email')}
                                label="Email Address"
                                type="email"
                                placeholder="john@example.com"
                                leftIcon={<Mail className="w-4 h-4" />}
                                error={errors.email?.message}
                                className="bg-white/[0.02]"
                            />
                        </div>

                        <Input
                            {...register('phone')}
                            label="Phone Number (Optional)"
                            placeholder="+1 (555) 000-0000"
                            leftIcon={<Phone className="w-4 h-4" />}
                            error={errors.phone?.message}
                            className="bg-white/[0.02]"
                        />

                        <div className="space-y-3">
                            <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                <Brain className="w-4 h-4" /> Experience Level
                            </label>
                            <div className="grid grid-cols-3 gap-4">
                                {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                                    <label
                                        key={level}
                                        className={cn(
                                            "relative flex flex-col items-center p-4 rounded-2xl border cursor-pointer transition-all duration-300",
                                            "hover:bg-white/[0.05]",
                                            (errors.experience_level?.message ? "border-red-500/50" : "border-white/[0.05]"),
                                            "bg-white/[0.02]"
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            value={level}
                                            {...register('experience_level')}
                                            className="absolute opacity-0"
                                        />
                                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">{level}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" /> Why do you want to join?
                            </label>
                            <textarea
                                {...register('motivation')}
                                rows={4}
                                className={cn(
                                    "w-full px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all",
                                    errors.motivation && "border-red-500/50"
                                )}
                                placeholder="Tell us about your goals and what you hope to achieve..."
                            />
                            {errors.motivation && (
                                <p className="text-xs text-red-500 mt-1">{errors.motivation.message}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            className="w-full py-6 text-lg font-black tracking-widest uppercase italic group"
                            isLoading={isSubmitting}
                        >
                            Submit Application
                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </form>
                </Card>

                <p className="text-center mt-8 text-zinc-600 text-sm font-medium">
                    By submitting this application, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    );
};
