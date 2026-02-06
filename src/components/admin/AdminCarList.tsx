'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { StockCar } from '@/types/stock';
import Link from 'next/link';
import { Edit2, Eye, EyeOff, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminCarList() {
    const [cars, setCars] = useState<StockCar[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showInternal, setShowInternal] = useState(true);

    const fetchCars = async () => {
        const { data, error } = await supabase
            .from('stock_units')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setCars(data as any);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCars();
    }, []);

    // 1. Identify "New/Pending" Cars (No images uploaded)
    // Only includes PUBLIC types (SH, ST). Internal (DE) ignored.
    const pendingCars = cars.filter(car => {
        const isInternal = car.processing_type === 'DE';
        if (isInternal) return false;

        const hasImages = car.images && car.images.length > 0;
        const matchesSearch = !search || (car.vin || '').toLowerCase().includes(search.toLowerCase()) ||
            (car.model_name || '').toLowerCase().includes(search.toLowerCase());

        return !hasImages && matchesSearch;
    });

    // 2. Main Inventory (Everything else, or everything?)
    const inventoryCars = cars.filter(car => {
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

    if (loading) return <div className="p-8 text-center text-gray-400">Loading inventory...</div>;

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
                        data.map((car) => (
                            <tr key={car.vin} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{car.model_name || car.model_code}</div>
                                    <div className="text-xs text-gray-400 font-mono bg-gray-50 inline-block px-1 rounded">{car.vin}</div>
                                </td>
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
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="space-y-12">
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

                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={showInternal}
                                onChange={(e) => setShowInternal(e.target.checked)}
                                className="rounded-sm border-gray-300 text-black focus:ring-0"
                            />
                            Show Internal (DE)
                        </label>

                        <div className="h-6 w-px bg-gray-200" />

                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search VIN or Model..."
                                className="px-4 py-2 pl-9 border border-gray-200 rounded-sm text-sm min-w-[250px] focus:outline-none focus:border-black transition-colors"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <CarTable data={inventoryCars} emptyMsg="No active cars found matching criteria." />
            </div>
        </div>
    );
}
