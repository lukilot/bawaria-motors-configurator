'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Loader2, ArrowLeft, Download, Pencil, Check, X } from 'lucide-react';
import { AdminAuth } from '@/components/admin/AdminAuth';
import BMWOptionsImportModal from '@/components/admin/BMWOptionsImportModal';
import Image from 'next/image';

interface OptionItem {
    id: string;
    code: string;
    data: {
        name?: string;
        category?: string;
        body_groups?: string[];
        image_url?: string;
    };
}

const CATEGORY_FILTERS = [
    { label: 'Wszystkie', value: null },
    { label: 'Lakier', value: 'paint' },
    { label: 'Tapicerka', value: 'upholstery' },
    { label: 'Wyposażenie', value: 'equipment' },
];

function getCategory(code: string, category?: string): 'paint' | 'upholstery' | 'equipment' {
    if (code.startsWith('P0') || code.startsWith('P1')) return 'paint';
    if (category?.toLowerCase().includes('tapic') || code.startsWith('PIU')) return 'upholstery';
    return 'equipment';
}

export default function BodyGroupOptionsPage() {
    const params = useParams();
    const router = useRouter();
    const bodyGroup = params?.bodyGroup as string;

    const [options, setOptions] = useState<OptionItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [showImport, setShowImport] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [savingId, setSavingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchOptions = useCallback(async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('dictionaries')
            .select('id, code, data')
            .eq('type', 'option')
            .contains('data', { body_groups: [bodyGroup] })
            .order('code');

        if (!error && data) setOptions(data);
        setIsLoading(false);
    }, [bodyGroup]);

    useEffect(() => { fetchOptions(); }, [fetchOptions]);

    const filteredOptions = options.filter(opt => {
        const cat = getCategory(opt.code, opt.data?.category);
        const matchesFilter = !activeFilter || cat === activeFilter;
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q || opt.code.toLowerCase().includes(q) || opt.data?.name?.toLowerCase().includes(q);
        return matchesFilter && matchesSearch;
    });

    const startEdit = (opt: OptionItem) => {
        setEditingId(opt.id);
        setEditName(opt.data?.name || opt.code);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName('');
    };

    const saveEdit = async (opt: OptionItem) => {
        setSavingId(opt.id);
        await supabase
            .from('dictionaries')
            .update({ data: { ...opt.data, name: editName } })
            .eq('id', opt.id);
        setOptions(prev => prev.map(o => o.id === opt.id ? { ...o, data: { ...o.data, name: editName } } : o));
        setSavingId(null);
        setEditingId(null);
    };

    const categoryCounts = {
        paint: options.filter(o => getCategory(o.code, o.data?.category) === 'paint').length,
        upholstery: options.filter(o => getCategory(o.code, o.data?.category) === 'upholstery').length,
        equipment: options.filter(o => getCategory(o.code, o.data?.category) === 'equipment').length,
    };

    return (
        <AdminAuth>
            <main className="min-h-screen bg-white flex flex-col font-sans pt-20 pb-20">
                <div className="flex-1 w-full max-w-[1800px] mx-auto px-8 md:px-12">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6 pt-6">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/admin/options')}
                                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Options
                            </button>
                            <div className="w-px h-5 bg-gray-200" />
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Body Group</p>
                                <h1 className="text-xl font-bold tracking-tight text-gray-900">{bodyGroup}</h1>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowImport(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-blue-700 transition-colors"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Importuj pochodną
                        </button>
                    </div>

                    {/* Filters + Search */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center bg-black/[0.03] p-1 rounded-full border border-black/[0.05]">
                            {CATEGORY_FILTERS.map(f => (
                                <button
                                    key={f.label}
                                    onClick={() => setActiveFilter(f.value)}
                                    className={cn(
                                        "px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all rounded-full whitespace-nowrap",
                                        activeFilter === f.value
                                            ? "bg-white text-black shadow-sm"
                                            : "text-gray-500 hover:text-gray-900"
                                    )}
                                >
                                    {f.label}
                                    {f.value && (
                                        <span className="ml-1.5 text-gray-400">
                                            {f.value === 'paint' ? categoryCounts.paint :
                                             f.value === 'upholstery' ? categoryCounts.upholstery :
                                             categoryCounts.equipment}
                                        </span>
                                    )}
                                    {!f.value && <span className="ml-1.5 text-gray-400">{options.length}</span>}
                                </button>
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="Szukaj kodu lub nazwy..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="flex-1 max-w-xs px-4 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:border-blue-400 bg-gray-50"
                        />
                    </div>

                    {/* Options Grid */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-32">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                            {filteredOptions.map(opt => {
                                const isEditing = editingId === opt.id;
                                const isSaving = savingId === opt.id;
                                const cat = getCategory(opt.code, opt.data?.category);

                                return (
                                    <div
                                        key={opt.id}
                                        className={cn(
                                            "group relative flex flex-col border rounded-lg overflow-hidden transition-all duration-200",
                                            isEditing ? "border-blue-300 shadow-md" : "border-gray-100 hover:border-gray-200 hover:shadow-sm"
                                        )}
                                    >
                                        {/* Image */}
                                        <div className="relative aspect-square bg-gray-50">
                                            {opt.data?.image_url ? (
                                                <Image
                                                    src={opt.data.image_url}
                                                    alt={opt.data?.name || opt.code}
                                                    fill
                                                    className="object-contain p-1"
                                                    sizes="160px"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-[9px] text-gray-300 font-bold uppercase">Brak</span>
                                                </div>
                                            )}
                                            {/* Category badge */}
                                            <div className={cn(
                                                "absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded",
                                                cat === 'paint' ? "bg-amber-50 text-amber-600" :
                                                cat === 'upholstery' ? "bg-purple-50 text-purple-600" :
                                                "bg-blue-50 text-blue-600"
                                            )}>
                                                {cat === 'paint' ? 'L' : cat === 'upholstery' ? 'T' : 'W'}
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="p-2">
                                            <p className="text-[9px] font-bold text-gray-400 tracking-wider mb-0.5">{opt.code}</p>
                                            {isEditing ? (
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        autoFocus
                                                        value={editName}
                                                        onChange={e => setEditName(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && saveEdit(opt)}
                                                        className="flex-1 text-[10px] border-b border-blue-400 outline-none bg-transparent pb-0.5"
                                                    />
                                                    <button onClick={() => saveEdit(opt)} disabled={isSaving} className="text-green-500 hover:text-green-600">
                                                        {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                                    </button>
                                                    <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-start justify-between gap-1">
                                                    <p className="text-[10px] text-gray-700 leading-tight line-clamp-2">
                                                        {opt.data?.name || <span className="text-gray-300 italic">Brak nazwy</span>}
                                                    </p>
                                                    <button
                                                        onClick={() => startEdit(opt)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5"
                                                    >
                                                        <Pencil className="w-3 h-3 text-gray-400 hover:text-blue-500" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {showImport && (
                    <BMWOptionsImportModal
                        bodyGroup={bodyGroup}
                        onClose={() => setShowImport(false)}
                        onSuccess={fetchOptions}
                    />
                )}
            </main>
        </AdminAuth>
    );
}
