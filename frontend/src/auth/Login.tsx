import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { User, Shield, Linkedin } from 'lucide-react';

type LoginMode = 'hq' | 'admin';

const Login: React.FC = () => {
    const [mode, setMode] = useState<LoginMode>('admin');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await login({ username, password, role: mode });
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-slate-50 dark:bg-background">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-12 flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <img src="/AppLogo.png" alt="SwaSarwam" className="h-12 w-12 object-contain bg-white rounded-xl" />
                        <span className="text-2xl font-bold text-white">SwaSarwam</span>
                    </div>
                    <div className="max-w-md">
                        <h1 className="text-4xl font-bold text-white mb-4">
                            Streamline Your Pharmaceutical Operations
                        </h1>
                        <p className="text-blue-100 text-lg">
                            Comprehensive field force management, inventory tracking, and sales analytics in one powerful platform.
                        </p>
                    </div>
                </div>
                <div className="relative z-10">
                    © 2026 SwaSarwam. All rights reserved.
                    <div className="mt-2">
                        <a
                            href="https://www.linkedin.com/in/manish-kumar-linked"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-100 hover:text-white transition-colors text-sm"
                        >
                            <Linkedin className="h-4 w-4" />
                            Contact the Developer
                        </a>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <Card className="w-full max-w-md shadow-xl border-0">
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

                            <Link
                                to="/employee-login"
                                className="flex w-full justify-center items-center gap-2 px-4 py-2 border border-slate-200 dark:border-border rounded-lg text-sm font-medium text-slate-700 dark:text-foreground hover:bg-slate-50 dark:hover:bg-muted hover:text-blue-600 transition-colors"
                            >
                                <User className="h-4 w-4" />
                                Go to Employee Login
                            </Link>
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
