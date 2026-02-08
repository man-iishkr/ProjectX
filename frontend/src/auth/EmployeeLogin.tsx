import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { User, Lock, ArrowRight, Activity, MapPin, Phone } from 'lucide-react';

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
            await login({ username, password });
            navigate('/employee/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed. Please check your ID and password.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center sm:py-12">
            <div className="p-10 xs:p-0 mx-auto md:w-full md:max-w-md">

                {/* Brand Header */}
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-400 mb-4 shadow-lg shadow-blue-200">
                        <Activity className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="font-bold text-3xl text-slate-800 mb-2">Field Force</h1>
                    <p className="text-slate-500">Employee Portal</p>
                </div>

                <div className="bg-white shadow-xl w-full rounded-2xl divide-y divide-slate-100 overflow-hidden border border-slate-100">
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
                                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Employee ID</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <Input
                                            type="text"
                                            placeholder="EMP-12345"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
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
                                    <span className="text-sm text-slate-600">Remember me</span>
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

                    <div className="px-8 py-6 bg-slate-50 text-center">
                        <p className="text-sm text-slate-500 mb-4">Admin or HQ User?</p>
                        <Link
                            to="/login"
                            className="inline-flex items-center justify-center text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
                        >
                            Log in to Admin Portal
                        </Link>
                    </div>
                </div>

                {/* Quick Help Footer */}
                <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-2">
                            <Phone className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-medium text-slate-600">Support</span>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-2">
                            <MapPin className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-medium text-slate-600">Check In</span>
                    </div>
                </div>

                <p className="text-center text-xs text-slate-400 mt-8">
                    Field ERP Mobile v1.0.0
                </p>
            </div>
        </div>
    );
};

export default EmployeeLogin;
