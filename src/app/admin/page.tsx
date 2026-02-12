'use client';

import { useState } from 'react';
import { StockUploader } from '@/components/admin/StockUploader';
import { BMWPLStockUploader } from '@/components/admin/BMWPLStockUploader';
import { AdminCarList } from '@/components/admin/AdminCarList';
import { DictionaryManager } from '@/components/admin/DictionaryManager';
import { PackagesManager } from '@/components/admin/PackagesManager';
import { SettingsEditor } from '@/components/admin/SettingsEditor';
import { AdminAuth } from '@/components/admin/AdminAuth';
import Link from 'next/link';
import { ArrowLeft, LayoutDashboard, Library, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminPage() {
    const [view, setView] = useState<'stock' | 'dictionaries' | 'pricing' | 'settings'>('stock');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    return (
        <AdminAuth>
            <main className="min-h-screen bg-white flex flex-col font-sans mb-20">
                <header className="bg-white border-b border-gray-100 py-6 px-8 sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
                        <div className="flex items-center gap-4">
                            <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <ArrowLeft className="w-5 h-5 text-gray-500" />
                            </Link>
                            <h1 className="text-xl font-light text-gray-900 tracking-tight">Administration</h1>
                        </div>

                        <nav className="flex bg-gray-50 p-1 rounded-sm border border-gray-100">
                            <button
                                onClick={() => setView('stock')}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-1.5 text-sm transition-all rounded-sm",
                                    view === 'stock' ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                Stock
                            </button>
                            <button
                                onClick={() => setView('dictionaries')}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-1.5 text-sm transition-all rounded-sm",
                                    view === 'dictionaries' ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                <Library className="w-4 h-4" />
                                Knowledge Base
                            </button>
                            <button
                                onClick={() => setView('pricing')}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-1.5 text-sm transition-all rounded-sm",
                                    view === 'pricing' ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                <Coins className="w-4 h-4" />
                                Service Packages
                            </button>
                            <button
                                onClick={() => setView('settings')}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-1.5 text-sm transition-all rounded-sm",
                                    view === 'settings' ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                <LayoutDashboard className="w-4 h-4 rotate-90" />
                                Config
                            </button>
                        </nav>
                    </div>
                </header>

                <div className="flex-1 w-full max-w-7xl mx-auto p-8">
                    {view === 'stock' ? (
                        <div className="animate-in fade-in duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                <StockUploader onSyncSuccess={() => setRefreshTrigger(prev => prev + 1)} />
                                <BMWPLStockUploader onSyncSuccess={() => setRefreshTrigger(prev => prev + 1)} />
                            </div>
                            <div className="my-12 h-px bg-gray-100" />
                            <AdminCarList refreshTrigger={refreshTrigger} />
                        </div>
                    ) : view === 'dictionaries' ? (
                        <div className="animate-in fade-in duration-500">
                            <DictionaryManager />
                        </div>
                    ) : view === 'pricing' ? (
                        <div className="animate-in fade-in duration-500">
                            <PackagesManager />
                        </div>
                    ) : (
                        <div className="animate-in fade-in duration-500">
                            <SettingsEditor />
                        </div>
                    )}
                </div>
            </main>
        </AdminAuth>
    );
}
