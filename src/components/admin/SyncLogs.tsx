'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { AlertCircle, CheckCircle2, History, RotateCw, Settings2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface SyncLog {
    id: string;
    vin: string;
    model_code: string;
    model_name: string;
    color_code: string;
    upholstery_code: string;
    added_options: string[];
    removed_options: string[];
    resolved: boolean;
    created_at: string;
}

export function SyncLogs() {
    const [logs, setLogs] = useState<SyncLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('sync_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) {
                if (error.code === '42P01') {
                    throw new Error("Tabela 'sync_logs' jeszcze nie istnieje. Zaloguj się do Supabase i uruchom skrypt SQL.");
                }
                throw error;
            }

            setLogs(data || []);
        } catch (err: any) {
            console.error('Error fetching logs:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const markResolved = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('sync_logs')
                .update({ resolved: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            setLogs(logs.map(log => log.id === id ? { ...log, resolved: !currentStatus } : log));
        } catch (err) {
            console.error("Failed to update status", err);
            alert("Błąd aktualizacji statusu.");
        }
    };

    const deleteLog = async (id: string) => {
        if (!confirm("Czy na pewno chcesz usunąć ten log trwale?")) return;
        try {
            const { error } = await supabase
                .from('sync_logs')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setLogs(logs.filter(log => log.id !== id));
        } catch (err) {
            console.error("Failed to delete log", err);
            alert("Błąd usuwania loga.");
        }
    };

    const wipeAllResolved = async () => {
        if (!confirm("Czy na pewno chcesz usunąć wszystkie rozwiązane alerty?")) return;
        try {
            const { error } = await supabase
                .from('sync_logs')
                .delete()
                .eq('resolved', true);

            if (error) throw error;
            fetchLogs();
        } catch (err) {
            console.error("Failed to clear resolved logs", err);
            alert("Błąd usuwania logów.");
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <RotateCw className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-500 text-sm">Wczytywanie logów synchronizacji...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-8 flex flex-col items-center text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-lg font-bold text-red-900 mb-2">Błąd połączenia z bazą</h3>
                <p className="text-red-700 text-sm max-w-md">{error}</p>
                <button
                    onClick={fetchLogs}
                    className="mt-6 px-6 py-2 bg-red-600 text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition"
                >
                    Spróbuj ponownie
                </button>
            </div>
        );
    }

    const unresolvedCount = logs.filter(l => !l.resolved).length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 md:p-8 rounded-[2rem] border border-black/5 shadow-sm">
                <div className="flex gap-5">
                    <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center shrink-0 border border-red-100/50">
                        <History className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-2">Raport Zmian Opcji</h2>
                        <p className="text-sm text-gray-500 max-w-xl leading-relaxed">
                            Poniższa lista zawiera pojazdy, których konfiguracja fabryczna (kody opcji)
                            <strong className="text-gray-900"> fizycznie zmieniła się</strong> podczas aktualizacji pliku Excel.
                            Może to skutkować utratą przypisanych zdjęć.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-red-50 rounded-xl border border-red-100 text-center">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-red-500 mb-0.5">Wymaga akcji</p>
                        <p className="text-2xl font-black text-red-600 leading-none">{unresolvedCount}</p>
                    </div>
                    <button onClick={wipeAllResolved} className="h-12 w-12 flex items-center justify-center bg-gray-50 hover:bg-red-50 hover:text-red-600 text-gray-500 rounded-xl border border-gray-100 transition-colors" title="Usuń rozwiązane">
                        <Trash2 className="w-5 h-5" />
                    </button>
                    <button onClick={fetchLogs} className="h-12 w-12 flex items-center justify-center bg-gray-50 hover:bg-blue-50 hover:text-blue-600 text-gray-500 rounded-xl border border-gray-100 transition-colors" title="Odśwież">
                        <RotateCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {logs.length === 0 ? (
                <div className="bg-gray-50 border border-dashed border-gray-200 rounded-[2rem] p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Wszystko jest aktualne</h3>
                    <p className="text-gray-500 text-sm max-w-sm">Nie wykryto żadnych niezgodności w kodach opcji podczas ostatnich synchronizacji.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <AnimatePresence>
                        {logs.map((log) => (
                            <motion.div
                                key={log.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={cn(
                                    "flex flex-col lg:flex-row gap-6 p-6 rounded-[2rem] border transition-all duration-300",
                                    log.resolved ? "bg-gray-50 border-gray-100 opacity-60" : "bg-white border-red-100 shadow-sm hover:shadow-md"
                                )}
                            >
                                {/* Left: Car Identity */}
                                <div className="lg:w-1/3 flex flex-col justify-center">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={cn("w-2 h-2 rounded-full", log.resolved ? "bg-gray-400" : "bg-red-500 animate-pulse")} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                            {format(new Date(log.created_at), "d MMM yyyy, HH:mm", { locale: pl })}
                                        </span>
                                    </div>
                                    <p className="text-[11px] font-mono text-gray-500 mb-1">{log.vin}</p>
                                    <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2">
                                        {log.model_name || `BMW ${log.model_code}`}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 bg-gray-100 rounded flex items-center text-[10px] font-bold uppercase tracking-wider text-gray-600">
                                            {log.color_code}
                                        </span>
                                        <span className="px-2 py-1 bg-gray-100 rounded flex items-center text-[10px] font-bold uppercase tracking-wider text-gray-600">
                                            {log.upholstery_code}
                                        </span>
                                    </div>
                                </div>

                                {/* Middle: Diff Options */}
                                <div className="lg:flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                                    {/* Added Options */}
                                    <div className="bg-green-50/50 rounded-2xl p-4 border border-green-100">
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-green-700 mb-3 flex items-center gap-2">
                                            <span className="w-4 h-4 rounded bg-green-200 text-green-800 flex items-center justify-center">+</span>
                                            Nowe opcje w pliku
                                        </h4>
                                        {log.added_options && log.added_options.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5">
                                                {log.added_options.map((opt, i) => (
                                                    <span key={i} className="px-2 py-1 bg-white border border-green-200 text-green-700 rounded text-[10px] font-mono font-bold shadow-sm">
                                                        {opt}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-green-600/50 italic">Brak nowych opcji</span>
                                        )}
                                    </div>

                                    {/* Removed Options */}
                                    <div className="bg-red-50/50 rounded-2xl p-4 border border-red-100">
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-red-700 mb-3 flex items-center gap-2">
                                            <span className="w-4 h-4 rounded bg-red-200 text-red-800 flex items-center justify-center">-</span>
                                            Opcje usunięte z pliku
                                        </h4>
                                        {log.removed_options && log.removed_options.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5">
                                                {log.removed_options.map((opt, i) => (
                                                    <span key={i} className="px-2 py-1 bg-white border border-red-200 text-red-700 rounded text-[10px] font-mono font-bold shadow-sm line-through decoration-red-300">
                                                        {opt}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-red-600/50 italic">Brak usuniętych opcji</span>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Actions */}
                                <div className="lg:w-48 flex lg:flex-col justify-center gap-2 shrink-0 border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-6">
                                    <button
                                        onClick={() => markResolved(log.id, log.resolved)}
                                        className={cn(
                                            "flex-1 lg:flex-none flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                                            log.resolved
                                                ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
                                                : "bg-green-50 text-green-600 border border-green-200 hover:bg-green-500 hover:text-white"
                                        )}
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        {log.resolved ? "Przywróć" : "Rozwiązane"}
                                    </button>
                                    <button
                                        onClick={() => deleteLog(log.id)}
                                        className="w-12 lg:w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-colors"
                                        title="Usuń trwale"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span className="hidden lg:inline text-xs font-bold uppercase tracking-wider">Usuń</span>
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
