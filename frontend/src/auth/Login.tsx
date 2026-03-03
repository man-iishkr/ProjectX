import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { User, Shield, Linkedin } from 'lucide-react';
import { PharmacyScene } from '../components/3d/PharmacyScene';

type LoginMode = 'hq' | 'admin';

const Login: React.FC = () => {
    const [mode, setMode] = useState<LoginMode>('admin');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    // Animation state
    const [animatingOut, setAnimatingOut] = useState<'left' | 'right' | ''>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await login({ username, password, role: mode });

            // Set animation to slide out to the left and down
            setAnimatingOut('left');

            // Wait for animation before navigating (a quick delay is good so it's snappy)
            setTimeout(() => {
                navigate('/');
            }, 550);

        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed');
            setIsLoading(false);
        }
    };

    const handleEmployeeLoginClick = () => {
        // Set animation to slide out to the right
        setAnimatingOut('right');

        // Wait for animation before navigating
        setTimeout(() => {
            navigate('/employee-login');
        }, 550);
    };

    // Determine the animation class to apply for modal
    let animationClass = '';
    if (animatingOut === 'left') animationClass = 'slide-out-left';
    if (animatingOut === 'right') animationClass = 'slide-out-right';

    return (
        <div className="min-h-screen flex bg-slate-950 overflow-hidden relative">
            {/* Left Side - 3D Branding Scene */}
            <div className={`hidden lg:flex flex-col lg:w-1/2 p-12 justify-between z-50 ${animatingOut === 'left' ? 'slide-out-right' : animatingOut === 'right' ? 'slide-out-left' : ''} relative`}>
                {/* 3D Scene Layer */}
                <PharmacyScene />

                {/* Content Overlay */}
                <div className="relative z-10 pointer-events-none">
                    <div className="flex items-center gap-3 mb-8">
                        <img src="/AppLogo.png" alt="SwaSarwam" className="h-12 w-12 object-contain bg-white rounded-xl shadow-lg" />
                        <span className="text-2xl font-bold text-white tracking-widest uppercase">SwaSarwam</span>
                    </div>
                    <div className="max-w-md mt-16 backdrop-blur-sm bg-black/10 p-6 rounded-2xl border border-white/5">
                        <h1 className="text-3xl font-light text-white mb-4 leading-tight">
                            Streamline your <br /><span className="font-bold text-blue-400">Pharmaceutical</span> Operations
                        </h1>
                        <p className="text-blue-100/70 text-base font-light">
                            Comprehensive field force management, inventory tracking, and sales analytics powered by fluid design.
                        </p>
                    </div>
                </div>
                <div className="relative z-10 pointer-events-none mt-auto">
                    <p className="text-white/50 text-sm font-light">© 2026 SwaSarwam. All rights reserved.</p>
                    <div className="mt-2 pointer-events-auto inline-block">
                        <a
                            href="https://www.linkedin.com/in/manish-kumar-linked"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-300 hover:text-white transition-colors text-sm font-light"
                        >
                            <Linkedin className="h-4 w-4" />
                            Contact the Developer
                        </a>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className={`flex-1 flex flex-col items-center justify-center p-4 lg:p-8 overflow-hidden z-[99]`}>
                <Card className={`w-full max-w-md shadow-xl border-0 z-[99] ${animationClass}`}>
                    <CardHeader className="space-y-4">
                        <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
                            <img src="/AppLogo.png" alt="SwaSarwam" className="h-10 w-10 object-contain bg-blue-600 rounded-xl" />
                            <span className="text-xl font-bold text-slate-800 dark:text-foreground">SwaSarwam</span>
                        </div>
                        <CardTitle className="text-2xl font-bold text-center text-slate-800 dark:text-foreground">
                            Welcome Back
                        </CardTitle>
                        <CardDescription className="text-center text-slate-500 dark:text-muted-foreground">
                            Sign in to access your dashboard
                        </CardDescription>

                        {/* Mode Tabs */}
                        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-muted rounded-lg">
                            <button
                                type="button"
                                onClick={() => {
                                    setMode('admin');
                                    setError('');
                                }}
                                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition-all ${mode === 'admin'
                                    ? 'bg-white dark:bg-background text-blue-600 shadow-sm'
                                    : 'text-slate-600 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground'
                                    }`}
                            >
                                <Shield className="h-4 w-4" />
                                Admin
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setMode('hq');
                                    setError('');
                                }}
                                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition-all ${mode === 'hq'
                                    ? 'bg-white dark:bg-background text-blue-600 shadow-sm'
                                    : 'text-slate-600 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground'
                                    }`}
                            >
                                <User className="h-4 w-4" />
                                HQ Manager
                            </button>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-100">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label htmlFor="username" className="text-sm font-medium text-slate-700 dark:text-foreground">
                                    {mode === 'admin' ? 'Admin / HQ Username' : 'Employee ID'}
                                </label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder={mode === 'admin' ? 'Enter admin username' : 'Enter your ID'}
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={isLoading}
                                    className="bg-white dark:bg-background border-slate-200 dark:border-border focus-visible:ring-blue-600"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-foreground">
                                    Password
                                </label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                    className="bg-white dark:bg-background border-slate-200 dark:border-border focus-visible:ring-blue-600"
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 shadow-md transition-all duration-200"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Signing in...' : `Sign in as ${mode === 'admin' ? 'Admin' : 'HQ Manager'}`}
                            </Button>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200 dark:border-border"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white dark:bg-background text-slate-500 dark:text-muted-foreground">Are you a Field Employee?</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleEmployeeLoginClick}
                                className="flex w-full justify-center items-center gap-2 px-4 py-2 border border-slate-200 dark:border-border rounded-lg text-sm font-medium text-slate-700 dark:text-foreground hover:bg-slate-50 dark:hover:bg-muted hover:text-blue-600 transition-colors"
                            >
                                <User className="h-4 w-4" />
                                Go to Employee Login
                            </button>
                        </form>
                    </CardContent>
                </Card>
                <div className="lg:hidden mt-8 text-center space-y-2">
                    <p className="text-sm text-slate-500">© 2026 SwaSarwam</p>
                    <a
                        href="https://www.linkedin.com/in/manish-kumar-linked"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium"
                    >
                        <Linkedin className="h-4 w-4" />
                        Contact the Developer
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Login;
