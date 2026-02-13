import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { User, Lock, ArrowRight, Linkedin } from 'lucide-react';

const EmployeeLogin: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await login({ username, password, role: 'employee' });
            navigate('/employee/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed. Please check your ID and password.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background flex flex-col justify-center sm:py-12">
            <div className="p-4 sm:p-0 mx-auto md:w-full md:max-w-md">

                {/* Brand Header */}
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
                        <img src="/AppLogo.png" alt="SwaSarwam" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="font-bold text-3xl text-slate-800 dark:text-foreground mb-2">SwaSarwam</h1>
                    <p className="text-slate-500 dark:text-muted-foreground">Employee Portal</p>
                </div>

                <div className="bg-white dark:bg-card shadow-xl w-full rounded-2xl divide-y divide-slate-100 dark:divide-border overflow-hidden border border-slate-100 dark:border-border">
                    <div className="px-8 py-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 flex items-start gap-2">
                                    <div className="mt-0.5">⚠️</div>
                                    <div>{error}</div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 dark:text-foreground mb-1.5 block">Employee ID</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-slate-400 dark:text-muted-foreground" />
                                        </div>
                                        <Input
                                            type="text"
                                            placeholder="EMP-12345"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="pl-10 h-12 bg-slate-50 dark:bg-muted/30 border-slate-200 dark:border-border focus:bg-white dark:focus:bg-muted/50 transition-colors dark:text-foreground"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-slate-700 dark:text-foreground mb-1.5 block">Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-slate-400 dark:text-muted-foreground" />
                                        </div>
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-10 h-12 bg-slate-50 dark:bg-muted/30 border-slate-200 dark:border-border focus:bg-white dark:focus:bg-muted/50 transition-colors dark:text-foreground"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-colors"
                                    />
                                    <span className="text-sm text-slate-600 dark:text-muted-foreground">Remember me</span>
                                </label>
                                <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                                    Forgot password?
                                </a>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold rounded-xl text-base shadow-md shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    'Signing in...'
                                ) : (
                                    <>
                                        Sign In <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>

                    <div className="px-8 py-6 bg-slate-50 dark:bg-muted/30 text-center">
                        <p className="text-sm text-slate-500 mb-4">Admin or HQ User?</p>
                        <Link
                            to="/login"
                            className="inline-flex items-center justify-center text-sm font-medium text-slate-700 dark:text-foreground hover:text-blue-600 transition-colors"
                        >
                            Log in to Admin Portal
                        </Link>
                    </div>
                </div>

                {/* Quick Help Footer */}


                <p className="text-center text-xs text-slate-400 mt-8">
                    SwaSarwam Mobile v1.0.0
                </p>
                <div className="mt-4 flex justify-center">
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

export default EmployeeLogin;
