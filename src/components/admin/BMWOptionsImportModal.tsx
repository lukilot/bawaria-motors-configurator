'use client';

import { useState } from 'react';
import { Loader2, X, Download, CheckCircle, AlertCircle } from 'lucide-react';

interface BMWOptionsImportModalProps {
    bodyGroup?: string;  // pre-filled if coming from body-group page
    onClose: () => void;
    onSuccess: () => void;
}

export default function BMWOptionsImportModal({ bodyGroup: defaultBodyGroup, onClose, onSuccess }: BMWOptionsImportModalProps) {
    const [configuratorUrl, setConfiguratorUrl] = useState('');
    const [bodyGroup, setBodyGroup] = useState(defaultBodyGroup || '');
    const [isImporting, setIsImporting] = useState(false);
    const [result, setResult] = useState<{ success: boolean; imported?: number; skipped?: number; total?: number; error?: string } | null>(null);

    const handleImport = async () => {
        if (!configuratorUrl.trim() || !bodyGroup.trim()) return;
        setIsImporting(true);
        setResult(null);

        try {
            const res = await fetch('/api/admin/import-bmw-options', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ configuratorUrl: configuratorUrl.trim(), bodyGroup: bodyGroup.trim().toUpperCase() }),
            });
            const data = await res.json();
            if (!res.ok) {
                setResult({ success: false, error: data.error || 'Nieznany błąd' });
            } else {
                setResult({ success: true, ...data });
                onSuccess();
            }
        } catch (e: any) {
            setResult({ success: false, error: e.message });
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-sm font-bold text-gray-900">Importuj opcje z BMW</h2>
                        <p className="text-[11px] text-gray-400 mt-0.5">Wklej link do konfiguratora dla wybranej wersji silnikowej</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    {/* Body Group input */}
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                            Body Group (np. F74, G20, G30)
                        </label>
                        <input
                            type="text"
                            value={bodyGroup}
                            onChange={e => setBodyGroup(e.target.value.toUpperCase())}
                            placeholder="F74"
                            disabled={!!defaultBodyGroup}
                            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-gray-50 disabled:opacity-60 font-mono"
                        />
                    </div>

                    {/* URL input */}
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                            URL konfiguratora BMW
                        </label>
                        <textarea
                            value={configuratorUrl}
                            onChange={e => setConfiguratorUrl(e.target.value)}
                            placeholder="https://configure.bmw.pl/pl_PL/configure/F74/31GG/..."
                            rows={3}
                            className="w-full px-4 py-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-gray-50 font-mono resize-none"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">
                            Użyj URL z konfiguratora dla danej pochodnej (np. M235i). Możesz importować wiele pochodnych — opcje zostaną połączone.
                        </p>
                    </div>

                    {/* Status */}
                    {isImporting && (
                        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-500 flex-shrink-0" />
                            <div>
                                <p className="text-xs font-bold text-blue-700">Pobieranie opcji z BMW...</p>
                                <p className="text-[10px] text-blue-500 mt-0.5">Może potrwać 60–90 sekund. Zdjęcia są kompresowane i zapisywane.</p>
                            </div>
                        </div>
                    )}

                    {result && (
                        <div className={`flex items-start gap-3 p-4 rounded-lg ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
                            {result.success
                                ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                : <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                            }
                            <div>
                                {result.success ? (
                                    <>
                                        <p className="text-xs font-bold text-green-700">Zaimportowano {result.imported} opcji</p>
                                        {result.skipped! > 0 && <p className="text-[10px] text-green-600 mt-0.5">Pominięto {result.skipped} (błąd pobierania)</p>}
                                    </>
                                ) : (
                                    <p className="text-xs font-bold text-red-700">{result.error}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <button onClick={onClose} className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:text-gray-900 transition-colors">
                        {result?.success ? 'Zamknij' : 'Anuluj'}
                    </button>
                    {!result?.success && (
                        <button
                            onClick={handleImport}
                            disabled={isImporting || !configuratorUrl.trim() || !bodyGroup.trim()}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                            Importuj
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
