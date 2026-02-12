'use client';

import { useState } from 'react';
import { parseModelsFile } from '@/lib/excel-parser';
import { supabase } from '@/lib/supabase';
import { FileSpreadsheet, Loader2, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ModelUploader({ onComplete }: { onComplete: () => void }) {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ count: number; errors: string[] } | null>(null);
    const [status, setStatus] = useState<'IDLE' | 'PARSING' | 'UPLOADING' | 'SUCCESS' | 'ERROR'>('IDLE');

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setStatus('PARSING');
        try {
            const buffer = await file.arrayBuffer();
            const { results, errors } = await parseModelsFile(buffer);

            if (results.length === 0) {
                setStatus('ERROR');
                setResult({ count: 0, errors: ['No valid models found in file.'] });
                return;
            }

            setStatus('UPLOADING');

            // Deduplicate results based on type + code (Last wins)
            const uniqueResultsMap = new Map();
            results.forEach((item: any) => {
                const key = `${item.type}-${item.code}`;
                uniqueResultsMap.set(key, item);
            });
            const uniqueResults = Array.from(uniqueResultsMap.values());

            // Chunked upsert to avoid large request body
            const chunkSize = 50;
            for (let i = 0; i < uniqueResults.length; i += chunkSize) {
                const chunk = uniqueResults.slice(i, i + chunkSize);
                const { error } = await supabase
                    .from('dictionaries')
                    .upsert(chunk, { onConflict: 'type,code' });

                if (error) throw error;
            }

            setStatus('SUCCESS');
            setResult({ count: uniqueResults.length, errors });
            onComplete();
        } catch (e: any) {
            console.error(e);
            setStatus('ERROR');
            setResult({ count: 0, errors: [e.message] });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mb-8 p-6 border border-dashed border-gray-200 rounded-sm bg-gray-50/30">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h4 className="text-sm font-medium text-gray-900">Bulk Upload Models</h4>
                    <p className="text-xs text-gray-400">Upload your Model Codes Excel file to update the database.</p>
                </div>
                {status === 'SUCCESS' ? (
                    <div className="flex items-center gap-2 text-green-600 text-sm font-medium animate-in fade-in zoom-in">
                        <Check className="w-4 h-4" />
                        Processed {result?.count} models.
                        {result?.errors && result.errors.length === 0 && ' All good!'}
                    </div>
                ) : (
                    <label className={cn(
                        "relative cursor-pointer bg-white border border-gray-200 px-4 py-2 rounded-sm text-xs font-semibold hover:border-black transition-all flex items-center gap-2",
                        isLoading && "opacity-50 pointer-events-none"
                    )}>
                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileSpreadsheet className="w-3 h-3" />}
                        {status === 'PARSING' ? 'Parsing...' : status === 'UPLOADING' ? 'Uploading...' : 'Select Excel File'}
                        <input type="file" className="hidden" onChange={handleFile} accept=".xlsx,.xls" />
                    </label>
                )}
            </div>

            {status === 'ERROR' && result && (
                <div className="bg-red-50 border border-red-100 p-3 rounded-sm flex gap-3 animate-in slide-in-from-top-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-red-800">
                        <p className="font-semibold">Upload Failed</p>
                        <ul className="list-disc list-inside mt-1 space-y-0.5">
                            {result.errors.slice(0, 3).map((err, i) => <li key={i}>{err}</li>)}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
