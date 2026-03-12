'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Loader2, ChevronRight, Package, Plus, Trash2 } from 'lucide-react';
import { AdminAuth } from '@/components/admin/AdminAuth';
import BMWOptionsImportModal from '@/components/admin/BMWOptionsImportModal';

interface BodyGroupOption {
    bodyGroup: string;
    count: number;
    withImages: number;
}

export default function OptionsPage() {
    const router = useRouter();
    const [groups, setGroups] = useState<BodyGroupOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showImport, setShowImport] = useState(false);

    const fetchGroups = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('dictionaries')
            .select('code, data')
            .eq('type', 'option');

        if (error || !data) { setIsLoading(false); return; }

        // Group by body_groups
        const groupMap: Record<string, { count: number; withImages: number }> = {};
        for (const item of data) {
            const bodyGroups: string[] = item.data?.body_groups || [];
            const hasImage = !!item.data?.image_url;
            for (const bg of bodyGroups) {
                if (!groupMap[bg]) groupMap[bg] = { count: 0, withImages: 0 };
                groupMap[bg].count++;
                if (hasImage) groupMap[bg].withImages++;
            }
        }

        const sorted = Object.entries(groupMap)
            .map(([bg, stats]) => ({ bodyGroup: bg, ...stats }))
            .sort((a, b) => b.count - a.count);

        setGroups(sorted);
        setIsLoading(false);
    };

    const handleDeleteGroup = async (bodyGroup: string) => {
        if (!confirm(`Czy na pewno chcesz usunąć całą grupę ${bodyGroup}? Spowoduje to usunięcie wszystkich powiązanych zdjęć i danych dla tego modelu.`)) return;
        
        setIsLoading(true);
        // 1. Get all IDs belonging to this group
        const { data: items } = await supabase
            .from('dictionaries')
            .select('id')
            .eq('type', 'option')
            .contains('data', { body_groups: [bodyGroup] });

        if (items && items.length > 0) {
            const ids = items.map(i => i.id);
            
            // 2. Call the new robust delete API
            const res = await fetch('/api/admin/options/delete', {
                method: 'POST',
                body: JSON.stringify({ ids, bodyGroup }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!res.ok) {
                const err = await res.json();
                alert('Błąd podczas usuwania: ' + (err.error || 'Nieznany błąd'));
            }
        }

        await fetchGroups();
    };

    useEffect(() => { fetchGroups(); }, []);

    return (
        <AdminAuth>
            <main className="min-h-screen bg-white flex flex-col font-sans pt-20 pb-20">
                <div className="flex-1 w-full max-w-[1800px] mx-auto px-8 md:px-12">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8 pt-6">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">Admin Panel</p>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Options & Packages</h1>
                            <p className="text-sm text-gray-500 mt-1">Zarządzaj zdjęciami opcji wyposażenia per model BMW</p>
                        </div>
                        <button
                            onClick={() => setShowImport(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-gray-800 transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Importuj model
                        </button>
                    </div>

                    {/* Body Groups Grid */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-32">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                    ) : groups.length === 0 ? (
                        <div className="text-center py-32 border border-dashed border-gray-200 rounded-lg">
                            <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                            <p className="text-sm font-medium text-gray-400">Brak zaimportowanych opcji</p>
                            <p className="text-xs text-gray-300 mt-1">Kliknij &ldquo;Importuj model&rdquo; aby rozpocząć</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {groups.map((group) => {
                                const pct = group.count > 0 ? Math.round((group.withImages / group.count) * 100) : 0;
                                return (
                                    <button
                                        key={group.bodyGroup}
                                        onClick={() => router.push(`/admin/options/${group.bodyGroup}`)}
                                        className="group relative flex flex-col p-5 border border-gray-100 rounded-lg hover:border-blue-200 hover:shadow-md transition-all duration-200 text-left bg-white"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                                                <Package className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.bodyGroup); }}
                                                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
                                            </div>
                                        </div>
                                        <p className="text-lg font-bold text-gray-900 tracking-tight">{group.bodyGroup}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{group.count} opcji</p>

                                        {/* Image coverage bar */}
                                        <div className="mt-3">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Zdjęcia</span>
                                                <span className={cn(
                                                    "text-[9px] font-bold",
                                                    pct === 100 ? "text-green-500" : pct > 50 ? "text-blue-500" : "text-gray-400"
                                                )}>{pct}%</span>
                                            </div>
                                            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-all",
                                                        pct === 100 ? "bg-green-400" : "bg-blue-400"
                                                    )}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {showImport && (
                    <BMWOptionsImportModal
                        onClose={() => setShowImport(false)}
                        onSuccess={fetchGroups}
                    />
                )}
            </main>
        </AdminAuth>
    );
}
