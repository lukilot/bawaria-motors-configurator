'use client';

import { useState } from 'react';
import { StockUploader } from '@/components/admin/StockUploader';
import { BMWPLStockUploader } from '@/components/admin/BMWPLStockUploader';
import { AdminCarList } from '@/components/admin/AdminCarList';
import { DictionaryManager } from '@/components/admin/DictionaryManager';
import { PackagesManager } from '@/components/admin/PackagesManager';
import { BulletinManager } from '@/components/admin/BulletinManager';
import { SettingsEditor } from '@/components/admin/SettingsEditor';
import { AdminAuth } from '@/components/admin/AdminAuth';
import { useAdminStore } from '@/store/adminStore';
import { cn } from '@/lib/utils';

export default function AdminPage() {
    const { currentView } = useAdminStore();
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    return (
        <AdminAuth>
            <main className="min-h-screen bg-white flex flex-col font-sans pt-20 pb-20">
                <div className="flex-1 w-full max-w-[1800px] mx-auto px-8 md:px-12">
                    {currentView === 'stock' ? (
                        <div className="animate-in fade-in duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                <StockUploader onSyncSuccess={() => setRefreshTrigger(prev => prev + 1)} />
                                <BMWPLStockUploader onSyncSuccess={() => setRefreshTrigger(prev => prev + 1)} />
                            </div>
                            <div className="my-12 h-px bg-gray-100" />
                            <AdminCarList refreshTrigger={refreshTrigger} />
                        </div>
                    ) : currentView === 'dictionaries' ? (
                        <div className="animate-in fade-in duration-500">
                            <DictionaryManager />
                        </div>
                    ) : currentView === 'pricing' ? (
                        <div className="animate-in fade-in duration-500">
                            <PackagesManager />
                        </div>
                    ) : currentView === 'bulletins' ? (
                        <div className="animate-in fade-in duration-500">
                            <BulletinManager />
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
