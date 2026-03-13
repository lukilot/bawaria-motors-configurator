'use client';

import { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { parseBMWPLStock } from '@/lib/excel-parser';
import { syncStockToSupabase, analyzeStockDiff, markCarsAsSold } from '@/lib/stock-sync';
import { ImportResult } from '@/types/stock';

// Separate uploader for "BMW PL" stock source.
// This handles a different Excel structure and tags cars with source='BMW PL'.

interface BMWPLStockUploaderProps {
    onSyncSuccess?: () => void;
}

export function BMWPLStockUploader({ onSyncSuccess }: BMWPLStockUploaderProps) {
    const [status, setStatus] = useState<string>('Idle');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setStatus('Reading File...');
        setError(null);
        setImportResult(null);

        try {
            const buffer = await file.arrayBuffer();

            // 1. Parse File (BMW PL Format)
            const result = await parseBMWPLStock(buffer);
            setImportResult(result);

            if (result.errors.length > 0 && result.cars.length === 0) {
                setError(result.errors.join('\n'));
                setLoading(false);
                return;
            }

            const cars = result.cars;
            setStatus(`Parsed ${cars.length} valid cars. READY TO SYNC.`);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Unknown error occurred');
            setStatus('Failed');
        } finally {
            setLoading(false);
            e.target.value = '';
        }
    };

    const handleSync = async () => {
        if (!importResult) return;
        setLoading(true);
        setStatus('Syncing to Database...');

        try {
            const cars = importResult.cars;
            // 2. Sync to Supabase (Source: 'BMW PL')
            await syncStockToSupabase(cars, 'BMW PL');

            // 3. Mark missing cars as sold (Source Scoped: 'BMW PL')
            const missing = await analyzeStockDiff(cars, 'BMW PL');

            if (missing.length > 0) {
                await markCarsAsSold(missing.map(c => c.vin));
                setStatus(`Sync Complete. Updated ${cars.length} cars. Marked ${missing.length} missing as Sold.`);
            } else {
                setStatus(`Sync Complete. Updated ${cars.length} cars.`);
            }

            if (onSyncSuccess) onSyncSuccess();
        } catch (err: any) {
            setError(err.message || 'Sync failed');
            setStatus('Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto bg-white p-8 rounded-2xl border border-blue-100 shadow-sm mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <FileSpreadsheet className="w-6 h-6" />
                </div>
                BMW PL Stock Upload
            </h2>

            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            className="relative overflow-hidden h-12 px-6 border-blue-200 hover:border-blue-400 hover:bg-white shadow-sm transition-all"
                            disabled={loading}
                        >
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            />
                            <div className="flex items-center gap-2">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> : <Upload className="w-4 h-4 text-blue-600" />}
                                <span className="text-blue-700 font-semibold">Wybierz plik BMW PL</span>
                            </div>
                        </Button>
                        <span className="text-sm font-medium text-gray-600 italic">
                            {status === 'Idle' ? 'Oczekiwanie na plik...' : status}
                        </span>
                    </div>

                    {importResult && importResult.cars.length > 0 && !status.includes('Complete') && (
                        <Button
                            onClick={handleSync}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 px-8 font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            Rozpocznij Synchronizację
                        </Button>
                    )}
                </div>

                {importResult && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
                            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Przetworzone</p>
                            <p className="text-2xl font-black text-gray-900">{importResult.processed}</p>
                        </div>
                        <div className="bg-white border border-red-50 p-4 rounded-xl shadow-sm border-l-4 border-l-red-400">
                            <p className="text-[10px] uppercase font-bold text-red-400 tracking-wider">Niski Status</p>
                            <p className="text-2xl font-black text-red-600">{importResult.skipped_status}</p>
                        </div>
                        <div className="bg-white border border-orange-50 p-4 rounded-xl shadow-sm border-l-4 border-l-orange-400">
                            <p className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">Inny Dealer</p>
                            <p className="text-2xl font-black text-orange-600">{importResult.skipped_type}</p>
                        </div>
                        <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
                            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Błędy</p>
                            <p className="text-2xl font-black text-red-500">{importResult.errors.length}</p>
                        </div>
                    </div>
                )}

                {error && (
                    <Alert variant="destructive" className="rounded-2xl border-red-100 bg-red-50">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="font-bold">Błąd krytyczny</AlertTitle>
                        <AlertDescription className="whitespace-pre-wrap text-[11px] leading-tight">
                            {error}
                        </AlertDescription>
                    </Alert>
                )}

                {importResult?.errors && importResult.errors.length > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-h-40 overflow-y-auto">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Logi błędów</h4>
                        <ul className="space-y-1">
                            {importResult.errors.map((err: string, i: number) => (
                                <li key={i} className="text-[10px] text-red-600 font-mono">{err}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
