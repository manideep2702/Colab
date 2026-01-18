import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Card } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { signInWithEmail } from '@/lib/supabase';

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { setUser } = useAuthStore(); // Now we use this!
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginForm) => {
        setIsLoading(true);

        try {
            const { data: authData, error } = await signInWithEmail(data.email, data.password);

            if (error) {
                console.error('Login failed:', error.message);
                // Ideally, show an error toast or message here
                setIsLoading(false);
                return;
            }

            if (authData.session) {
                const sessionUser = authData.user;
                const email = sessionUser?.email;
                const metaRole = sessionUser?.user_metadata?.role;

                // Determine effective role
                const effectiveRole = email === 'admin@tech.com' ? 'admin' : (metaRole || 'student');

                // MANUALLY UPDATE STORE TO AVOID RACE CONDITION
                // We construct a User object similar to how authStore does it
                if (sessionUser) {
                    setUser({
                        id: sessionUser.id,
                        email: email || '',
                        name: sessionUser.user_metadata?.name || email?.split('@')[0] || 'User',
                        avatar_url: sessionUser.user_metadata?.avatar_url,
                        role: effectiveRole,
                        created_at: sessionUser.created_at,
                    });
                }

                if (effectiveRole === 'admin') {
                    navigate('/admin');
                } else {
                    navigate('/student');
                }
            }
        } catch (err) {
            console.error('Login error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-gray-950 to-secondary-900/20" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <Card variant="glass" padding="lg" className="backdrop-blur-xl">
                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <motion.div
                            className="mb-4"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 10 }}
                        >
                            <img src="/logo.png" alt="Logo" className="w-20 h-auto" />
                        </motion.div>
                        <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
                        <p className="text-gray-400 mt-1">Sign in to continue learning</p>
                    </div>



                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <Input
                            label="Email"
                            type="email"
                            placeholder="Enter your email"
                            leftIcon={<Mail className="w-4 h-4" />}
                            error={errors.email?.message}
                            {...register('email')}
                        />

                        <Input
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            leftIcon={<Lock className="w-4 h-4" />}
                            rightIcon={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            }
                            error={errors.password?.message}
                            {...register('password')}
                        />

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 text-gray-400">
                                <input type="checkbox" className="rounded border-gray-700 bg-gray-800 text-primary-500 focus:ring-primary-500" />
                                Remember me
                            </label>
                            <a href="#" className="text-primary-400 hover:text-primary-300 transition-colors">
                                Forgot password?
                            </a>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            isLoading={isLoading}
                        >
                            Sign In
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-400 text-sm">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-primary-400 hover:text-primary-300 transition-colors font-medium">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </Card>

                {/* Footer */}
                <p className="text-center text-gray-500 text-sm mt-6">
                    Data Science Learning Platform • Powered by AI
                </p>
            </motion.div>
        </div>
    );
};
