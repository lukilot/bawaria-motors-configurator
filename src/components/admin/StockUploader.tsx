'use client';

import { useState, useCallback } from 'react';
import { parseStockFile } from '@/lib/excel-parser';
import { useStockStore } from '@/store/stock-store';
import { FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StockUploader() {
    const { setImportResult, importResult, setIsLoading, isLoading } = useStockStore();
    const [dragActive, setDragActive] = useState(false);

    const handleFile = async (file: File) => {
        setIsLoading(true);
        try {
            const buffer = await file.arrayBuffer();
            const result = await parseStockFile(buffer);
            setImportResult(result);
        } catch (e: any) {
            console.error(e);
            alert('Failed to parse file: ' + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    }, []);

    return (
        <div className="w-full max-w-4xl mx-auto p-6">
            <div
                className={cn(
                    "border-2 border-dashed border-gray-200 rounded-sm p-12 text-center transition-all relative cursor-pointer hover:border-blue-500 hover:bg-gray-50",
                    dragActive && "border-blue-600 bg-blue-50 scale-[1.01]",
                    isLoading && "opacity-50 pointer-events-none"
                )}
                onDragEnter={onDragOver}
                onDragLeave={() => setDragActive(false)}
                onDragOver={onDragOver}
                onDrop={onDrop}
            >
                <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    accept=".xlsx,.xls"
                />
                <div className="flex flex-col items-center gap-4">
                    <div className="bg-gray-50 p-4 rounded-full">
                        <FileSpreadsheet className="w-8 h-8 text-gray-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-light text-gray-900">Upload Stock File</h3>
                        <p className="text-sm text-gray-500 mt-1">Drag and drop your .xlsx file here</p>
                    </div>
                </div>
            </div>

            {importResult && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white border border-gray-100 p-4 shadow-sm rounded-sm">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Processed</p>
                        <p className="text-3xl font-light mt-2">{importResult.processed}</p>
                    </div>
                    <div className="bg-white border border-gray-100 p-4 shadow-sm rounded-sm border-l-4 border-l-red-500">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Skipped (Low Status)</p>
                        <p className="text-3xl font-light mt-2 text-red-900">{importResult.skipped_status}</p>
                    </div>
                    <div className="bg-white border border-gray-100 p-4 shadow-sm rounded-sm border-l-4 border-l-orange-400">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Internal (DE)</p>
                        <p className="text-3xl font-light mt-2 text-orange-900">{importResult.hidden_de}</p>
                    </div>
                    <div className="bg-white border border-gray-100 p-4 shadow-sm rounded-sm">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Errors</p>
                        <p className="text-3xl font-light mt-2 text-red-600">{importResult.errors.length}</p>
                    </div>

                    {importResult.errors.length > 0 && (
                        <div className="col-span-1 md:col-span-4 bg-red-50 border border-red-100 p-4 rounded-sm mt-4">
                            <h4 className="text-red-900 font-medium mb-2">Error Log</h4>
                            <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                                {importResult.errors.slice(0, 10).map((err, i) => (
                                    <li key={i}>{err}</li>
                                ))}
                                {importResult.errors.length > 10 && (
                                    <li className="list-none pt-2 opacity-75">...and {importResult.errors.length - 10} more</li>
                                )}
                            </ul>
                        </div>
                    )}

                    {/* Sync Button Area */}
                    <div className="col-span-1 md:col-span-4 flex justify-center border-t border-gray-100 pt-8 mt-4">
                        {importResult.processed > 0 ? (
                            <SyncButton cars={importResult.cars} />
                        ) : (
                            <p className="text-gray-400 text-sm">No valid cars found to sync.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

import { syncStockToSupabase } from '@/lib/stock-sync';
import { StockCar } from '@/types/stock';
import { Check, Loader2, Database } from 'lucide-react';

function SyncButton({ cars }: { cars: StockCar[] }) {
    const [status, setStatus] = useState<'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [errorMsg, setErrorMsg] = useState('');

    const handleSync = async () => {
        setStatus('SYNCING');
        try {
            await syncStockToSupabase(cars);
            setStatus('SUCCESS');
        } catch (e: any) {
            setStatus('ERROR');
            setErrorMsg(e.message);
        }
    };

    if (status === 'SUCCESS') {
        return (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-6 py-3 rounded-full animate-in fade-in">
                <Check className="w-5 h-5" />
                <span className="font-medium">Synced {cars.length} cars to Database</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-2">
            <button
                onClick={handleSync}
                disabled={status === 'SYNCING'}
                className={cn(
                    "flex items-center gap-3 px-8 py-3 bg-black text-white hover:bg-gray-800 transition-all shadow-md rounded-sm font-medium tracking-wide",
                    status === 'SYNCING' && "opacity-75 cursor-wait"
                )}
            >
                {status === 'SYNCING' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <Database className="w-5 h-5" />
                )}
                {status === 'SYNCING' ? 'Syncing...' : 'Sync to Database'}
            </button>
            {status === 'ERROR' && (
                <p className="text-red-500 text-sm mt-2">Error: {errorMsg}</p>
            )}
        </div>
    );
}
