import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Card } from '@/components/ui';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { signUpWithEmail } from '@/lib/supabase';

const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterForm) => {
        setIsLoading(true);

        try {
            // Default role is 'student'
            const { data: authData, error } = await signUpWithEmail(data.email, data.password, data.name, 'student');

            if (error) {
                console.error('Registration failed:', error.message);
                // Could add toast notification here
                setIsLoading(false);
                return;
            }

            if (authData.user) {
                // Successful registration
                // Redirect to login or directly to dashboard if auto-login is enabled by Supabase settings (usually requires email confirmation first)
                // For now, let's redirect to login with a success indicator? Or just login.
                // If email confirmation is off, they might be logged in. 
                // Typically Supabase requires email confirmation by default.
                navigate('/login');
            }
        } catch (err) {
            console.error('Registration error:', err);
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
                        <h1 className="text-2xl font-bold text-white">Create Account</h1>
                        <p className="text-gray-400 mt-1">Join the learning community</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <Input
                            label="Full Name"
                            type="text"
                            placeholder="Enter your name"
                            leftIcon={<User className="w-4 h-4" />}
                            error={errors.name?.message}
                            {...register('name')}
                        />

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
                            placeholder="Create a password"
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

                        <Input
                            label="Confirm Password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Confirm your password"
                            leftIcon={<Lock className="w-4 h-4" />}
                            error={errors.confirmPassword?.message}
                            {...register('confirmPassword')}
                        />

                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            isLoading={isLoading}
                        >
                            Sign Up
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-400 text-sm">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary-400 hover:text-primary-300 transition-colors font-medium">
                                Sign in
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
