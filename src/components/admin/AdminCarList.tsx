'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { StockCar } from '@/types/stock';
import Link from 'next/link';
import { Edit2, Eye, EyeOff, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

import { deleteCarPermanently } from '@/lib/stock-sync';
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

function SoldCarsList({ cars, onRefresh }: { cars: StockCar[], onRefresh: () => void }) {
    const [processing, setProcessing] = useState<string | null>(null); // VIN or 'ALL'

    const handleDelete = async (vin: string) => {
        if (!confirm('Are you sure you want to permanently delete this car and its images?')) return;
        setProcessing(vin);
        try {
            await deleteCarPermanently(vin);
            onRefresh();
        } catch (e: any) {
            alert('Failed to delete: ' + e.message);
        } finally {
            setProcessing(null);
        }
    };

    const handleDeleteAll = async () => {
        if (!confirm(`Are you sure you want to PERMANENTLY DELETE ALL ${cars.length} sold cars? This cannot be undone.`)) return;
        setProcessing('ALL');
        try {
            for (const car of cars) {
                await deleteCarPermanently(car.vin);
            }
            onRefresh();
        } catch (e: any) {
            alert('Failed to delete some cars: ' + e.message);
        } finally {
            setProcessing(null);
        }
    };

    if (cars.length === 0) return null;

    return (
        <div className="bg-orange-50 border border-orange-200 rounded-sm overflow-hidden shadow-sm animate-in fade-in">
            <div className="p-6 border-b border-orange-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-orange-100/50">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-orange-100 rounded-full text-orange-600 mt-1">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-orange-900">Sold / To Delete ({cars.length})</h3>
                        <p className="text-sm text-orange-800 mt-1 max-w-2xl">
                            These cars were marked as sold during stock sync. They are hidden from the public site.
                            Review them here and delete them permanently when you are ready.
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleDeleteAll}
                    disabled={!!processing}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition-colors rounded-sm text-sm font-medium shadow-sm whitespace-nowrap",
                        processing && "opacity-75 cursor-wait"
                    )}
                >
                    {processing === 'ALL' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Delete All ({cars.length})
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-orange-50/50 text-orange-900 uppercase text-xs font-semibold tracking-wider">
                        <tr>
                            <th className="px-6 py-3">VIN</th>
                            <th className="px-6 py-3">Model</th>
                            <th className="px-6 py-3">Marked Sold At</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-100">
                        {cars.map((car) => (
                            <tr key={car.vin} className="hover:bg-orange-100/50 transition-colors">
                                <td className="px-6 py-4 font-mono text-xs text-orange-900">{car.vin}</td>
                                <td className="px-6 py-4 text-orange-900 font-medium">{car.model_name || car.model_code}</td>
                                <td className="px-6 py-4 text-xs text-orange-800">
                                    {/* Using checks to avoid crashes if last_synced_at is missing */}
                                    {(car as any).last_synced_at ? new Date((car as any).last_synced_at).toLocaleDateString() : 'Unknown'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDelete(car.vin)}
                                        disabled={!!processing}
                                        className={cn(
                                            "text-red-600 hover:text-red-800 font-medium text-xs uppercase tracking-wide disabled:opacity-50",
                                            processing === car.vin && "cursor-wait"
                                        )}
                                    >
                                        {processing === car.vin ? 'Deleting...' : 'Delete Permanently'}
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

export function AdminCarList({ refreshTrigger = 0 }: { refreshTrigger?: number }) {
    const [cars, setCars] = useState<StockCar[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showInternal, setShowInternal] = useState(true);
    const [modelMap, setModelMap] = useState<Record<string, string>>({});

    const fetchCars = async () => {
        setLoading(true);

        let allCars: StockCar[] = [];
        let from = 0;
        const batchSize = 1000;
        let more = true;

        // 1. Fetch Cars with Pagination
        while (more) {
            const { data, error } = await supabase
                .from('stock_units')
                .select('*')
                .order('created_at', { ascending: false })
                .range(from, from + batchSize - 1);

            if (error) {
                console.error('Error fetching cars:', error);
                // If error occurs, stop fetching and show what we have (or handle error UI)
                break;
            }

            if (data && data.length > 0) {
                allCars = [...allCars, ...data as any];

                // If we got fewer than batchSize, we've reached the end
                if (data.length < batchSize) {
                    more = false;
                } else {
                    from += batchSize;
                }
            } else {
                more = false;
            }
        }

        setCars(allCars);

        // 2. Fetch Model Dictionary for enrichment
        const { data: dictData, error: dictError } = await supabase
            .from('dictionary_models')
            .select('code, name');

        if (!dictError && dictData) {
            const map: Record<string, string> = {};
            dictData.forEach((item: any) => {
                map[item.code] = item.name;
            });
            setModelMap(map);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchCars();
    }, [refreshTrigger]);

    // 0. Sold / To Delete Logic (Status 500)
    const soldCars = cars.filter(car => {
        if (car.status_code !== 500) return false;

        if (!search) return true;
        const query = search.toLowerCase();
        return (
            (car.vin || '').toLowerCase().includes(query) ||
            (car.model_name || '').toLowerCase().includes(query)
        );
    });

    // 1. Internal / Demo Cars (DE)
    // Status != 500, Type == DE
    const internalCars = cars.filter(car => {
        if (car.status_code === 500) return false;
        if (car.processing_type !== 'DE') return false;

        const query = search.toLowerCase();
        const matchesSearch = !search || (car.vin || '').toLowerCase().includes(query) ||
            (car.model_name || '').toLowerCase().includes(query);

        return matchesSearch;
    });

    // 2. Identify "New/Pending" Cars (No images uploaded)
    // Only includes PUBLIC types (SH, ST). Internal (DE) ignored.
    const pendingCars = cars.filter(car => {
        const isInternal = car.processing_type === 'DE';
        if (isInternal) return false;
        if (car.status_code === 500) return false; // Exclude sold

        const hasImages = car.images && car.images.length > 0;
        const query = search.toLowerCase();
        const matchesSearch = !search || (car.vin || '').toLowerCase().includes(query) ||
            (car.model_name || '').toLowerCase().includes(query);

        return !hasImages && matchesSearch;
    });

    // 2. Main Inventory (Everything else, or everything?)
    const inventoryCars = cars.filter(car => {
        if (car.status_code === 500) return false; // Exclude sold

        const hasImages = car.images && car.images.length > 0;

        // Filter Logic
        const query = search.toLowerCase();
        const matchesSearch = (
            (car.vin || '').toLowerCase().includes(query) ||
            (car.model_name || '').toLowerCase().includes(query) ||
            (car.model_code || '').toLowerCase().includes(query)
        );

        const matchesType = showInternal || car.processing_type !== 'DE';

        return hasImages && matchesSearch && matchesType;
    });

    // Auto-expand Internal section if search matches
    const [isInternalOpen, setIsInternalOpen] = useState(false);
    useEffect(() => {
        if (search && internalCars.length > 0) {
            setIsInternalOpen(true);
        }
    }, [search, internalCars.length]);

    if (loading && cars.length === 0) return <div className="p-8 text-center text-gray-400">Loading inventory...</div>;

    const CarTable = ({ data, emptyMsg }: { data: StockCar[], emptyMsg: string }) => (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold tracking-wider">
                    <tr>
                        <th className="px-6 py-3">VIN / Model</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Visibility</th>
                        <th className="px-6 py-3">Price (List)</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                {emptyMsg}
                            </td>
                        </tr>
                    ) : (
                        data.map((car) => {
                            // Enriched Model Name: DB Name > Dictionary Name > Code
                            const displayName = car.model_name || modelMap[car.model_code] || car.model_code;

                            return (
                                <tr key={car.vin} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{displayName}</div>
                                        <div className="text-xs text-gray-400 font-mono bg-gray-50 inline-block px-1 rounded">{car.vin}</div>
                                    </td>
                                    {/* ... rest of columns */}
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "px-2 py-1 rounded-sm text-[10px] uppercase font-bold tracking-wide",
                                            car.status_code >= 190 ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
                                        )}>
                                            Code {car.status_code}
                                        </span>
                                        <div className="text-xs text-gray-400 mt-1 truncate max-w-[150px]">{car.processing_type}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "inline-flex items-center gap-1.5 px-2 py-1 rounded-sm text-[10px] uppercase font-bold tracking-wide border",
                                            car.visibility === 'PUBLIC'
                                                ? "bg-blue-50 text-blue-700 border-blue-100"
                                                : "bg-red-50 text-red-700 border-red-100"
                                        )}>
                                            {car.visibility === 'PUBLIC' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                            {car.visibility}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs">
                                        {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(car.list_price)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/admin/cars/${car.vin}`}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-black hover:text-white hover:border-black transition-all text-xs font-medium uppercase tracking-wide rounded-sm shadow-sm"
                                        >
                                            <Edit2 className="w-3 h-3" />
                                            Edit
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Global Search & Filter Bar */}
            <div className="bg-white border border-gray-200 p-4 rounded-sm flex flex-col md:flex-row justify-between items-center gap-4 sticky top-24 z-30 shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search VIN or Model (Status 500, Pending, Active)..."
                        className="w-full px-4 py-2 pl-9 border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-black transition-colors"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={showInternal}
                        onChange={(e) => setShowInternal(e.target.checked)}
                        className="rounded-sm border-gray-300 text-black focus:ring-0"
                    />
                    Show Internal (DE)
                </label>
            </div>

            {/* Sold Cars Section (New) */}
            {soldCars.length > 0 && (
                <SoldCarsList cars={soldCars} onRefresh={fetchCars} />
            )}

            {/* Pending Section */}
            {pendingCars.length > 0 && (
                <div className="bg-orange-50 border border-orange-100 rounded-sm overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-orange-100 flex justify-between items-center bg-orange-50/50">
                        <div>
                            <h3 className="text-lg font-medium text-orange-900">⚠️ Pending Setup (No Photos)</h3>
                            <p className="text-xs text-orange-700 mt-1">These cars need photos and configuration before they look good on the site.</p>
                        </div>
                        <span className="text-xs font-mono text-orange-800 bg-orange-100 px-2 py-1 rounded-full">{pendingCars.length}</span>
                    </div>
                    <CarTable data={pendingCars} emptyMsg="No pending cars." />
                </div>
            )}

            {/* Main Inventory */}
            <div className="bg-white border border-gray-100 rounded-sm overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h3 className="text-lg font-light">Inventory Management</h3>
                        <span className="text-xs font-mono text-gray-400">Total Active: {inventoryCars.length}</span>
                    </div>
                    {/* Search was here, now moved up */}
                </div>

                <CarTable data={inventoryCars} emptyMsg="No active cars found matching criteria." />
            </div>

            {/* Internal / Demo (DE) Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-sm overflow-hidden">
                <button
                    onClick={() => setIsInternalOpen(!isInternalOpen)}
                    className="w-full p-6 flex justify-between items-center text-left hover:bg-gray-100 transition-colors"
                >
                    <div>
                        <h3 className="text-lg font-light text-gray-700">Internal / Demo (DE)</h3>
                        <p className="text-xs text-gray-500 mt-1">Cars with 'DE' processing type. Hidden from main inventory unless customized.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded-full">
                            {internalCars.length}
                        </span>
                        <div className={cn("transition-transform duration-200", isInternalOpen ? "rotate-180" : "")}>
                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </button>

                {isInternalOpen && (
                    <div className="border-t border-gray-200">
                        <CarTable data={internalCars} emptyMsg="No internal (DE) cars found." />
                    </div>
                )}
            </div>
        </div>
    );
}
