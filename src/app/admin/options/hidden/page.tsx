'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Plus, Trash2, EyeOff } from 'lucide-react';
import { AdminAuth } from '@/components/admin/AdminAuth';
import { cn } from '@/lib/utils';

interface OptionItem {
    id?: string;
    code: string;
    data: any;
}

export default function HiddenOptionsPage() {
    const router = useRouter();
    const [options, setOptions] = useState<OptionItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newCode, setNewCode] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const fetchHiddenOptions = async () => {
        setIsLoading(true);
        // Pobieramy opcje i filtrujemy lokalnie te, które mają wpis visible: false
        const { data, error } = await supabase
            .from('dictionaries')
            .select('id, code, data')
            .eq('type', 'option')
            .limit(10000);

        if (!error && data) {
            const hidden = data.filter(opt => opt.data?.visible === false);
            // Sortujemy alfabetycznie
            hidden.sort((a, b) => a.code.localeCompare(b.code));
            setOptions(hidden);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchHiddenOptions();
    }, []);

    const handleAddHidden = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = newCode.trim().toUpperCase();
        if (!code) return;

        setIsSaving(true);
        try {
            // Sprawdź czy opcja już istnieje w słowniku
            const { data: existing } = await supabase
                .from('dictionaries')
                .select('id, data')
                .eq('type', 'option')
                .eq('code', code)
                .maybeSingle();

            if (existing) {
                // Aktualizuj na ukrytą
                const newData = { ...existing.data, visible: false };
                await supabase
                    .from('dictionaries')
                    .update({ data: newData })
                    .eq('id', existing.id);
            } else {
                // Stwórz nową jako ukrytą
                await supabase
                    .from('dictionaries')
                    .insert({
                        type: 'option',
                        code: code,
                        data: { visible: false, name: 'Opcja ukryta (dodana ręcznie)' }
                    });
            }

            setNewCode('');
            await fetchHiddenOptions();
        } catch (err: any) {
            alert('Błąd dodawania: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveHidden = async (opt: OptionItem) => {
        if (!opt.id) return;
        setIsSaving(true);
        try {
            const newData = { ...opt.data };
            delete newData.visible; // Usuwamy flagę visible: false (domyślnie jest widoczna)
            
            await supabase
                .from('dictionaries')
                .update({ data: newData })
                .eq('id', opt.id);

            await fetchHiddenOptions();
        } catch (err: any) {
            alert('Błąd usuwania ukrycia: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AdminAuth>
            <main className="min-h-screen bg-white font-sans pt-20 pb-20">
                <div className="max-w-[1200px] mx-auto px-8 md:px-12">
                    {/* Header */}
                    <div className="mb-8 pt-6">
                        <button
                            onClick={() => router.push('/admin/options')}
                            className="flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors mb-6 uppercase tracking-wider font-bold"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Powrót do opcji
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                <EyeOff className="w-6 h-6 text-gray-500" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Globalnie Ukryte Opcje</h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    Kody opcji dodane tutaj nie będą widoczne na stronie na żadnym modelu.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Formularz dodawania */}
                        <div className="md:col-span-1">
                            <div className="bg-gray-50/50 border border-gray-100 p-6 rounded-lg sticky top-28">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-4">Dodaj kod do ukrycia</h2>
                                <form onSubmit={handleAddHidden} className="space-y-4">
                                    <div>
                                        <input
                                            type="text"
                                            value={newCode}
                                            onChange={(e) => setNewCode(e.target.value)}
                                            placeholder="np. 475 lub S0475"
                                            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-sm focus:outline-none focus:border-black transition-colors text-sm font-mono uppercase"
                                            required
                                        />
                                        <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-wide">
                                            Wpisz dokładny kod (np. S01CA). Zostanie on globalnie zablokowany we front-end.
                                        </p>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSaving || !newCode.trim()}
                                        className={cn(
                                            "w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-sm transition-all shadow-md",
                                            (isSaving || !newCode.trim()) ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-800"
                                        )}
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                        Zablokuj Opcję
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Lista ukrytych opcji */}
                        <div className="md:col-span-2">
                            <div className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm">
                                <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                                    <span className="text-xs font-bold uppercase tracking-widest text-gray-600">Zablokowane Kody</span>
                                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-mono">{options.length}</span>
                                </div>
                                {isLoading ? (
                                    <div className="flex justify-center p-12">
                                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                    </div>
                                ) : options.length === 0 ? (
                                    <div className="p-12 text-center text-gray-500">
                                        <EyeOff className="w-8 h-8 mx-auto text-gray-300 mb-3" />
                                        <p className="text-sm">Brak zablokowanych opcji.</p>
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-gray-50">
                                        {options.map((opt) => (
                                            <li key={opt.id} className="flex justify-between items-center p-4 hover:bg-gray-50/50 transition-colors">
                                                <div className="flex flex-col">
                                                    <span className="font-mono font-bold text-gray-900">{opt.code}</span>
                                                    <span className="text-xs text-gray-500 mt-0.5">{opt.data?.name || "Brak nazwy (ukryta ręcznie)"}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveHidden(opt)}
                                                    disabled={isSaving}
                                                    title="Usuń blokadę (Pokaż opcję)"
                                                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-sm transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </AdminAuth>
    );
}
