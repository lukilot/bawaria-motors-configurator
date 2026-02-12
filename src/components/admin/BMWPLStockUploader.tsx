'use client';

import { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { parseBMWPLStock } from '@/lib/excel-parser';
import { syncStockToSupabase, analyzeStockDiff, markCarsAsSold } from '@/lib/stock-sync';

// Separate uploader for "BMW PL" stock source.
// This handles a different Excel structure and tags cars with source='BMW PL'.

interface BMWPLStockUploaderProps {
    onSyncSuccess?: () => void;
}

export function BMWPLStockUploader({ onSyncSuccess }: BMWPLStockUploaderProps) {
    const [status, setStatus] = useState<string>('Idle');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setStatus('Reading File...');
        setError(null);

        try {
            const buffer = await file.arrayBuffer();

            // 1. Parse File (BMW PL Format)
            const result = await parseBMWPLStock(buffer);

            if (result.errors.length > 0) {
                // Show critical errors
                setError(result.errors.join('\n'));
                setLoading(false);
                return;
            }

            const cars = result.cars;
            setStatus(`Parsed ${cars.length} valid cars. Syncing to DB...`);

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
            console.error(err);
            setError(err.message || 'Unknown error occurred');
            setStatus('Failed');
        } finally {
            setLoading(false);
            // Reset file input
            e.target.value = '';
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto bg-white p-6 rounded-lg border border-blue-100 shadow-sm mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                BMW PL Stock Upload
            </h2>

            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        className="relative overflow-hidden group border-blue-200 hover:border-blue-400 hover:bg-blue-50"
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
                            <span className="text-blue-700">Select BMW PL Stock File</span>
                        </div>
                    </Button>

                    <span className="text-xs text-gray-400">
                        {status === 'Idle' ? 'Waiting for file...' : status}
                    </span>
                </div>

                {error && (
                    <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription className="whitespace-pre-wrap text-xs">
                            {error}
                        </AlertDescription>
                    </Alert>
                )}
            </div>
        </div>
    );
}
