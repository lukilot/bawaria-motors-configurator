'use client';

import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

const ADMIN_SESSION_KEY = 'bawaria_admin_session';

export function AdminAuth({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    // Check for existing session on mount
    useEffect(() => {
        const session = sessionStorage.getItem(ADMIN_SESSION_KEY);
        if (session === 'authenticated') {
            setIsAuthenticated(true);
        }
        setIsLoading(false);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            // Call API route to verify password
            const response = await fetch('/api/admin/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (data.authenticated) {
                sessionStorage.setItem(ADMIN_SESSION_KEY, 'authenticated');
                setIsAuthenticated(true);
                setPassword('');
            } else {
                setError('Nieprawidłowe hasło');
                setPassword('');
            }
        } catch (err) {
            setError('Błąd połączenia');
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        setIsAuthenticated(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="w-full max-w-md">
                    <div className="bg-white shadow-lg rounded-sm border border-gray-100 p-8">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-full mb-4">
                                <Lock className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-2xl font-light text-gray-900 mb-2">Panel Administracyjny</h1>
                            <p className="text-sm text-gray-500">Wprowadź hasło aby kontynuować</p>
                        </div>

                        {/* Login Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="password" className="block text-xs uppercase tracking-widest text-gray-500 font-semibold mb-2">
                                    Hasło
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:border-black transition-colors text-sm"
                                        placeholder="••••••••"
                                        autoFocus
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-sm text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full bg-black text-white py-3 rounded-sm font-medium hover:bg-gray-800 transition-colors text-sm uppercase tracking-wider"
                            >
                                Zaloguj się
                            </button>
                        </form>

                        {/* Footer */}
                        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                            <p className="text-xs text-gray-500">
                                Bawaria Motors Stock Buffer
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Authenticated - show admin content with logout button
    return (
        <>
            {children}
            <button
                onClick={handleLogout}
                className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-2 rounded-sm text-xs uppercase tracking-wider hover:bg-gray-700 transition-colors shadow-lg"
            >
                Wyloguj
            </button>
        </>
    );
}
