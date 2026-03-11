'use client';

import { useState, useEffect } from 'react';
import { Loader2, Palette, Layers, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLOR_GROUPS = [
    'Biały', 'Czarny', 'Szary', 'Srebrny', 'Niebieski', 'Zielony', 'Czerwony', 'Fioletowy', 'Pomarańczowy', 'Żółty', 'Złoty', 'Inny'
];

const UPHOLSTERY_GROUPS = [
    'Czarny', 'Beżowy', 'Brązowy', 'Czerwony', 'Biały', 'Szary', 'Niebieski', 'Zielony', 'Inny'
];

export function MappingManager() {
    const [unmapped, setUnmapped] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState<string | null>(null);

    const fetchUnmapped = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/mappings');
            const data = await res.json();
            if (data.unmapped) {
                setUnmapped(data.unmapped.map((item: any) => ({
                    ...item,
                    group: ''
                })));
            }
        } catch (e) {
            console.error('Failed to fetch unmapped items:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (item: any) => {
        if (!item.group) return;
        
        setIsSaving(`${item.type}:${item.code}`);
        try {
            const res = await fetch('/api/admin/mappings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: item.type,
                    code: item.code,
                    name: item.name,
                    group: item.group
                })
            });

            if (res.ok) {
                setUnmapped(prev => prev.filter(i => !(i.type === item.type && i.code === item.code)));
            }
        } catch (e) {
            console.error('Failed to save mapping:', e);
        } finally {
            setIsSaving(null);
        }
    };

    useEffect(() => { fetchUnmapped(); }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-gray-300 mb-4" />
                <p className="text-sm text-gray-400">Analizowanie słowników...</p>
            </div>
        );
    }

    if (unmapped.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                    <Check className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">Wszystkie kody są zmapowane</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-xs text-center">
                    System nie wykrył nowych kolorów ani tapicerek wymagających przypisania do grup filtrów.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <h2 className="text-xl font-bold tracking-tight text-gray-900">Brakujące Mapowania Filtrów</h2>
                </div>
                <p className="text-sm text-gray-500">
                    Poniższe kody pochodzą z importu "Options & Packages" i muszą zostać ręcznie przypisane do grup kolorystycznych, aby filtry na stronie działały poprawnie.
                </p>
            </header>

            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 w-16">Typ</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 w-24">Kod</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Marketingowa Nazwa</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 w-64">Grupa Filtra (SRP)</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 w-32"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {unmapped.map((item) => (
                            <tr key={`${item.type}:${item.code}`} className="group hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-5">
                                    {item.type === 'color' ? (
                                        <Palette className="w-4 h-4 text-blue-500" />
                                    ) : (
                                        <Layers className="w-4 h-4 text-orange-500" />
                                    )}
                                </td>
                                <td className="px-6 py-5">
                                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 bg-gray-100 rounded text-gray-700">
                                        {item.code}
                                    </span>
                                </td>
                                <td className="px-6 py-5 font-medium text-gray-900 text-sm">
                                    {item.name}
                                </td>
                                <td className="px-6 py-5">
                                    <select
                                        value={item.group}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setUnmapped(prev => prev.map(i => 
                                                (i.type === item.type && i.code === item.code) ? { ...i, group: val } : i
                                            ));
                                        }}
                                        className="w-full h-10 px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:bg-white focus:border-blue-300 outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">Wybierz grupę...</option>
                                        {(item.type === 'color' ? COLOR_GROUPS : UPHOLSTERY_GROUPS).map(g => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <button
                                        onClick={() => handleSave(item)}
                                        disabled={!item.group || isSaving === `${item.type}:${item.code}`}
                                        className={cn(
                                            "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                                            item.group 
                                                ? "bg-black text-white hover:bg-gray-800 shadow-sm"
                                                : "bg-gray-100 text-gray-300 cursor-not-allowed"
                                        )}
                                    >
                                        {isSaving === `${item.type}:${item.code}` ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            'Zapisz'
                                        )}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
