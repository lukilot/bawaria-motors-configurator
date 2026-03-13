'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Loader2, ArrowLeft, Download, Pencil, Check, X, Trash2, Image as ImageIcon, Upload, Eye, EyeOff } from 'lucide-react';
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
        hidden?: boolean;
        variations?: Array<{
            body_groups: string[];
            name?: string;
            image_url?: string;
        }>;
    };
}

const CATEGORY_FILTERS = [
    { label: 'Wszystkie', value: null },
    { label: 'Lakier', value: 'paint' },
    { label: 'Tapicerka', value: 'upholstery' },
    { label: 'Pakiety', value: 'package' },
    { label: 'Wyposażenie', value: 'equipment' },
];

function getCategory(code: string, dsCategory?: string): 'paint' | 'upholstery' | 'equipment' | 'package' {
    if (dsCategory === 'paint' || dsCategory === 'upholstery' || dsCategory === 'package' || dsCategory === 'equipment') {
        return dsCategory;
    }
    if (code.startsWith('P0') || code.startsWith('P1') || code.startsWith('PIC')) return 'paint';
    if (dsCategory?.toLowerCase().includes('tapic') || code.startsWith('PIU') || code.match(/^[FKZ][A-Z0-9]{4}$/)) return 'upholstery';
    if (code.startsWith('PIP') || code.startsWith('P0C')) return 'package';
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
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const isAll = bodyGroup === 'all';

    const fetchOptions = useCallback(async () => {
        setIsLoading(true);
        let query = supabase
            .from('dictionaries')
            .select('id, code, data')
            .eq('type', 'option')
            .order('code');

        if (!isAll) {
            query = query.contains('data', { body_groups: [bodyGroup] });
        }

        const { data, error } = await query;

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
        
        let newData = { ...opt.data };
        if (!isAll && newData.variations) {
            const vIdx = newData.variations.findIndex(v => v.body_groups.includes(bodyGroup));
            if (vIdx >= 0) {
                newData.variations[vIdx] = { ...newData.variations[vIdx], name: editName };
            }
        }
        newData.name = editName; // Sync global for safety

        await supabase
            .from('dictionaries')
            .update({ data: newData })
            .eq('id', opt.id);
            
        setOptions(prev => prev.map(o => o.id === opt.id ? { ...o, data: newData } : o));
        setSavingId(null);
        setEditingId(null);
    };

    const handleDeleteOption = async (opt: OptionItem) => {
        if (isAll) {
            if (!confirm(`Czy na pewno chcesz CAŁKOWICIE usunąć opcję ${opt.code}? Spowoduje to usunięcie jej ze wszystkich modeli.`)) return;
        } else {
            if (!confirm(`Czy na pewno chcesz usunąć opcję ${opt.code} z modelu ${bodyGroup}? Spowoduje to również usunięcie zdjęcia dla tego modelu.`)) return;
        }
        
        const res = await fetch('/api/admin/options/delete', {
            method: 'POST',
            body: JSON.stringify({ ids: [opt.id], bodyGroup: isAll ? null : bodyGroup }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (res.ok) {
            setOptions(prev => prev.filter(o => o.id !== opt.id));
        } else {
            const err = await res.json();
            alert('Błąd podczas usuwania: ' + (err.error || 'Nieznany błąd'));
        }
    };

    const handleImageUpload = async (opt: OptionItem, file: File) => {
        setSavingId(opt.id);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('bodyGroup', bodyGroup);
            formData.append('code', opt.code);

            const res = await fetch('/api/admin/upload-option-image', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            const publicUrl = data.publicUrl;

            let newData = { ...opt.data };
            if (newData.variations) {
                const vIdx = newData.variations.findIndex(v => v.body_groups.includes(bodyGroup));
                if (vIdx >= 0) {
                    newData.variations[vIdx] = { ...newData.variations[vIdx], image_url: publicUrl };
                }
            }
            newData.image_url = publicUrl; // Sync global

            const { error: updateError } = await supabase
                .from('dictionaries')
                .update({ data: newData })
                .eq('id', opt.id);

            if (updateError) throw updateError;

            setOptions(prev => prev.map(o => o.id === opt.id ? { ...o, data: newData } : o));
        } catch (err) {
            console.error('Upload failed:', err);
            alert('Błąd podczas wgrywania zdjęcia');
        } finally {
            setSavingId(null);
        }
    };

    const toggleVisibility = async (opt: OptionItem) => {
        setSavingId(opt.id);
        const isHidden = !opt.data.hidden;
        const { error } = await supabase
            .from('dictionaries')
            .update({ data: { ...opt.data, hidden: isHidden } })
            .eq('id', opt.id);

        if (!error) {
            setOptions(prev => prev.map(o => o.id === opt.id ? { ...o, data: { ...o.data, hidden: isHidden } } : o));
        }
        setSavingId(null);
    };

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredOptions.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredOptions.map(o => o.id)));
        }
    };

    const handleDeleteSelected = async () => {
        if (isAll) {
            if (!confirm(`Czy na pewno chcesz CAŁKOWICIE usunąć ${selectedIds.size} zaznaczonych opcji? Operacja ta usunie je ze wszystkich modeli i opróżni powiązane zdjęcia.`)) return;
        } else {
            if (!confirm(`Czy na pewno chcesz usunąć ${selectedIds.size} zaznaczonych opcji z modelu ${bodyGroup}? Operacja ta usunie również powiązane zdjęcia.`)) return;
        }
        
        setIsLoading(true);
        const ids = Array.from(selectedIds);
        
        const res = await fetch('/api/admin/options/delete', {
            method: 'POST',
            body: JSON.stringify({ ids, bodyGroup: isAll ? null : bodyGroup }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (res.ok) {
            setOptions(prev => prev.filter(o => !selectedIds.has(o.id)));
            setSelectedIds(new Set());
        } else {
            const err = await res.json();
            alert('Błąd podczas usuwania zaznaczonych: ' + (err.error || 'Nieznany błąd'));
        }
        
        setIsLoading(false);
    };

    const handleVisibilityBulk = async (hide: boolean) => {
        setIsLoading(true);
        for (const id of Array.from(selectedIds)) {
            const opt = options.find(o => o.id === id);
            if (!opt) continue;
            
            await supabase
                .from('dictionaries')
                .update({ data: { ...opt.data, hidden: hide } })
                .eq('id', opt.id);
        }
        
        setOptions(prev => prev.map(o => selectedIds.has(o.id) ? { ...o, data: { ...o.data, hidden: hide } } : o));
        setSelectedIds(new Set());
        setIsLoading(false);
    };

    const categoryCounts = {
        paint: options.filter(o => getCategory(o.code, o.data?.category) === 'paint').length,
        upholstery: options.filter(o => getCategory(o.code, o.data?.category) === 'upholstery').length,
        package: options.filter(o => getCategory(o.code, o.data?.category) === 'package').length,
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
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">{isAll ? 'Global' : 'Body Group'}</p>
                                <h1 className="text-xl font-bold tracking-tight text-gray-900">{isAll ? 'Wszystkie Opcje' : bodyGroup}</h1>
                            </div>
                        </div>
                        {!isAll && (
                            <button
                                onClick={() => setShowImport(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-blue-700 transition-colors"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Importuj pochodną
                            </button>
                        )}
                    </div>

                    {/* Filters + Search + Bulk Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center bg-black/[0.03] p-1 rounded-full border border-black/[0.05]">
                                {CATEGORY_FILTERS.map(f => (
                                    <button
                                        key={f.label}
                                        onClick={() => { setActiveFilter(f.value); setSelectedIds(new Set()); }}
                                        className={cn(
                                            "px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all rounded-full whitespace-nowrap",
                                            activeFilter === f.value
                                                ? "bg-white text-black shadow-sm"
                                                : "text-gray-500 hover:text-gray-900"
                                        )}
                                    >
                                        {f.label}
                                        {f.value && (
                                            <span className="ml-1.5 text-gray-500">
                                                {f.value === 'paint' ? categoryCounts.paint :
                                                 f.value === 'upholstery' ? categoryCounts.upholstery :
                                                 f.value === 'package' ? categoryCounts.package :
                                                 categoryCounts.equipment}
                                            </span>
                                        )}
                                        {!f.value && <span className="ml-1.5 text-gray-500">{options.length}</span>}
                                    </button>
                                ))}
                            </div>
                            <input
                                type="text"
                                placeholder="Szukaj kodu lub nazwy..."
                                value={searchQuery}
                                onChange={e => { setSearchQuery(e.target.value); setSelectedIds(new Set()); }}
                                className="px-4 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:border-blue-400 bg-gray-50 max-w-[200px]"
                            />
                        </div>

                        {selectedIds.size > 0 && (
                            <div className="flex items-center gap-4 bg-blue-50 px-4 py-2 rounded-full border border-blue-100 animate-in fade-in slide-in-from-top-2 duration-200">
                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                                    Zaznaczono: {selectedIds.size}
                                </span>
                                <div className="w-px h-3 bg-blue-200" />
                                <button
                                    onClick={() => handleVisibilityBulk(true)}
                                    className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
                                >
                                    <EyeOff className="w-3.5 h-3.5" />
                                    Ukryj
                                </button>
                                <button
                                    onClick={() => handleVisibilityBulk(false)}
                                    className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                    Pokaż
                                </button>
                                <div className="w-px h-3 bg-blue-200" />
                                <button
                                    onClick={handleDeleteSelected}
                                    className="flex items-center gap-1.5 text-[10px] font-bold text-red-600 uppercase tracking-widest hover:text-red-700 transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Usuń zaznaczone
                                </button>
                                <button
                                    onClick={() => setSelectedIds(new Set())}
                                    className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-gray-600 transition-colors"
                                >
                                    Anuluj
                                </button>
                            </div>
                        )}
                        
                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleSelectAll}
                                className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors"
                            >
                                {selectedIds.size === filteredOptions.length ? 'Odznacz wszystko' : 'Zaznacz wszystkie widoczne'}
                            </button>
                        </div>
                    </div>

                    {/* Options Grid */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-32">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
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
                                                isEditing ? "border-blue-300 shadow-md" : 
                                                selectedIds.has(opt.id) ? "border-blue-400 bg-blue-50/30 shadow-sm" :
                                                opt.data.hidden ? "border-gray-100 opacity-60 grayscale-[0.5]" :
                                                "border-gray-100 hover:border-gray-200 hover:shadow-sm"
                                            )}
                                        >
                                            {/* Selection Checkbox */}
                                            <div 
                                                onClick={() => toggleSelect(opt.id)}
                                                className={cn(
                                                    "absolute top-1.5 right-1.5 w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-all z-20",
                                                    selectedIds.has(opt.id) ? "bg-blue-500 border-blue-500" : "bg-white/80 border-gray-200 opacity-0 group-hover:opacity-100"
                                                )}
                                            >
                                                {selectedIds.has(opt.id) && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            {/* Image overlay with upload */}
                                            <div className="relative aspect-square bg-gray-50 group/img">
                                                {(() => {
                                                    const variant = !isAll ? opt.data.variations?.find(v => v.body_groups.includes(bodyGroup)) : null;
                                                    const displayImage = variant?.image_url || opt.data.image_url;
                                                    const displayName = variant?.name || opt.data.name || opt.code;

                                                    return displayImage ? (
                                                        <Image
                                                            src={displayImage}
                                                            alt={displayName}
                                                            fill
                                                            className="object-contain p-1"
                                                            sizes="160px"
                                                        />
                                                    ) : (
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                                                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Brak</span>
                                                            <ImageIcon className="w-4 h-4 text-gray-300" />
                                                        </div>
                                                    );
                                                })()}
                                                
                                                {/* Upload overlay */}
                                                {!isAll && (
                                                    <label className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 cursor-pointer">
                                                        <Upload className="w-5 h-5 text-white" />
                                                        <span className="text-[8px] font-bold text-white uppercase tracking-wider">Zmień zdjęcie</span>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={e => {
                                                                const file = e.target.files?.[0];
                                                                if (file) handleImageUpload(opt, file);
                                                            }}
                                                        />
                                                    </label>
                                                )}
    
                                                {/* Category badge */}
                                                <div className={cn(
                                                    "absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded z-10",
                                                    cat === 'paint' ? "bg-amber-50 text-amber-600" :
                                                    cat === 'upholstery' ? "bg-rose-50 text-rose-600" :
                                                    cat === 'package' ? "bg-purple-50 text-purple-600" :
                                                    "bg-blue-50 text-blue-600"
                                                )}>
                                                    {cat === 'paint' ? 'L' : cat === 'upholstery' ? 'T' : cat === 'package' ? 'P' : 'W'}
                                                </div>
    
                                                {/* Controls overlay */}
                                                <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); toggleVisibility(opt); }}
                                                        className={cn(
                                                            "p-1.5 bg-white/90 shadow-sm border border-gray-100 rounded hover:text-blue-500 transition-colors",
                                                            opt.data.hidden ? "text-amber-500" : "text-gray-500"
                                                        )}
                                                        title={opt.data.hidden ? "Pokaż na stronie" : "Ukryj na stronie"}
                                                    >
                                                        {opt.data.hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteOption(opt); }}
                                                        className="p-1.5 bg-white/90 shadow-sm border border-gray-100 rounded hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-3 h-3 text-gray-500 group-hover:text-red-500" />
                                                    </button>
                                                </div>
    
                                                {savingId === opt.id && (
                                                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-20">
                                                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                                    </div>
                                                )}
                                            </div>

                                        {/* Info */}
                                        <div className="p-2">
                                            <p className="text-[9px] font-bold text-gray-500 tracking-wider mb-0.5">{opt.code}</p>
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
                                                    <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-600">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-start justify-between gap-1">
                                                    <p className="text-[10px] text-gray-700 leading-tight line-clamp-2">
                                                        {(() => {
                                                            const variant = !isAll ? opt.data.variations?.find(v => v.body_groups.includes(bodyGroup)) : null;
                                                            return variant?.name || opt.data.name || <span className="text-gray-500 italic">Brak nazwy</span>;
                                                        })()}
                                                    </p>
                                                    <button
                                                        onClick={() => startEdit(opt)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5"
                                                    >
                                                        <Pencil className="w-3 h-3 text-gray-500 hover:text-blue-500" />
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
            </main>

            {showImport && (
                <BMWOptionsImportModal
                    bodyGroup={bodyGroup}
                    onClose={() => setShowImport(false)}
                    onSuccess={fetchOptions}
                />
            )}
        </AdminAuth>
    );
}
