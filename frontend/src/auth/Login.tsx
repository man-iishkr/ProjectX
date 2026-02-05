import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { User, Shield } from 'lucide-react';

type LoginMode = 'employee' | 'admin';

const Login: React.FC = () => {
    const [mode, setMode] = useState<LoginMode>('employee');
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
            await login({ username, password });
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-slate-50">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-12 flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center">
                            <span className="font-bold text-xl text-blue-600">F</span>
                        </div>
                        <span className="text-2xl font-bold text-white">Field ERP</span>
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
                    <p className="text-blue-200 text-sm">
                        © 2026 Field ERP. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <Card className="w-full max-w-md shadow-xl border-0">
                    <CardHeader className="space-y-4">
                        <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
                            <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center">
                                <span className="font-bold text-lg text-white">F</span>
                            </div>
                            <span className="text-xl font-bold text-slate-800">Field ERP</span>
                        </div>
                        <CardTitle className="text-2xl font-bold text-center text-slate-800">
                            Welcome Back
                        </CardTitle>
                        <CardDescription className="text-center text-slate-500">
                            Sign in to access your dashboard
                        </CardDescription>

                        {/* Mode Tabs */}
                        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                            <button
                                type="button"
                                onClick={() => {
                                    setMode('employee');
                                    setError('');
                                }}
                                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition-all ${mode === 'employee'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                <User className="h-4 w-4" />
                                Employee
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setMode('admin');
                                    setError('');
                                }}
                                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition-all ${mode === 'admin'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                <Shield className="h-4 w-4" />
                                Admin
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
                                <label htmlFor="username" className="text-sm font-medium text-slate-700">
                                    {mode === 'admin' ? 'Admin / HQ Username' : 'Employee ID'}
                                </label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder={mode === 'admin' ? 'Enter admin username' : 'Enter your ID'}
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={isLoading}
                                    className="bg-white border-slate-200 focus-visible:ring-blue-600"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="password" className="text-sm font-medium text-slate-700">
                                    Password
                                </label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                    className="bg-white border-slate-200 focus-visible:ring-blue-600"
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 shadow-md transition-all duration-200"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Signing in...' : `Sign in as ${mode === 'admin' ? 'Admin' : 'Employee'}`}
                            </Button>

                            <p className="text-xs text-slate-400 text-center pt-4">
                                {mode === 'admin'
                                    ? 'Admin access required for system configuration'
                                    : 'Contact your administrator for access'}
                            </p>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Login;
