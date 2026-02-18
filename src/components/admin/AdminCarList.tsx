'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { StockCar, ProductGroup } from '@/types/stock';
import Link from 'next/link';
import { Edit2, Eye, EyeOff, Loader2, Search, ChevronDown, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

import { deleteCarPermanently } from '@/lib/stock-sync';
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

// --- Components ---

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

function ProductGroupRow({ group, modelMap }: { group: ProductGroup, modelMap: Record<string, string> }) {
    const [expanded, setExpanded] = useState(false);

    const units = group.available_units || [];
    const availableCount = units.filter(u => u.status_code !== 500).length;
    const soldCount = units.filter(u => u.status_code === 500).length;

    const hasImages = (group.images && group.images.length > 0) || units.some(u => u.images && u.images.length > 0);
    // Resolve model name: dictionary first, then fallback to model_name from any unit
    const dictName = modelMap[group.model_code];
    const unitName = units.find(u => u.model_name)?.model_name;
    const modelName = dictName || unitName;
    const displayName = modelName ? `${group.model_code} - ${modelName}` : group.model_code;

    // Calculate price display: prefer manual_price (catalogue price), fallback to unit price range
    const cataloguePrice = group.manual_price && group.manual_price > 0 ? group.manual_price : 0;
    const prices = units.map(u => u.special_price || u.list_price).filter(p => p > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    const fmt = (v: number) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(v);

    let priceDisplay: string;
    if (cataloguePrice > 0) {
        priceDisplay = fmt(cataloguePrice);
    } else if (minPrice > 0) {
        priceDisplay = minPrice === maxPrice ? fmt(minPrice) : `${fmt(minPrice)} - ${fmt(maxPrice)}`;
    } else {
        priceDisplay = '—';
    }

    return (
        <>
            <tr className={cn("hover:bg-gray-50 transition-colors cursor-pointer", expanded && "bg-gray-50")} onClick={() => setExpanded(!expanded)}>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                        <div>
                            <div className="font-medium text-gray-900">
                                {displayName}
                            </div>
                            <div className="text-xs text-gray-400 font-mono mt-0.5 flex gap-2">
                                <span>{group.color_code}</span>
                                <span>•</span>
                                <span>{group.upholstery_code}</span>
                            </div>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="flex gap-2">
                        {availableCount > 0 && (
                            <span className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold uppercase rounded-sm border border-green-100">
                                {availableCount} Available
                            </span>
                        )}
                        {soldCount > 0 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded-sm border border-gray-200">
                                {soldCount} Sold
                            </span>
                        )}
                        {units.length === 0 && <span className="text-gray-400 text-xs italic">Empty Group</span>}
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        {hasImages ? (
                            <span className="text-green-600 flex items-center gap-1 text-[10px] uppercase font-bold">
                                <ImageIcon className="w-3 h-3" /> Img OK
                            </span>
                        ) : (
                            <span className="text-orange-500 flex items-center gap-1 text-[10px] uppercase font-bold">
                                <AlertTriangle className="w-3 h-3" /> No Img
                            </span>
                        )}
                    </div>
                </td>
                <td className="px-6 py-4 font-mono text-xs">
                    {priceDisplay}
                </td>
                <td className="px-6 py-4 text-right">
                    <Link
                        href={`/admin/groups/${group.id}`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-black hover:text-white hover:border-black transition-all text-xs font-medium uppercase tracking-wide rounded-sm shadow-sm"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Edit2 className="w-3 h-3" /> Edit Group
                    </Link>
                </td>
            </tr>
            {expanded && (
                <tr>
                    <td colSpan={5} className="bg-gray-50/50 p-0">
                        <div className="border-t border-b border-gray-100">
                            <table className="w-full text-sm text-left bg-gray-50/30">
                                <thead className="text-xs text-gray-400 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-2 pl-16">VIN</th>
                                        <th className="px-6 py-2">Status</th>
                                        <th className="px-6 py-2">Visibility</th>
                                        <th className="px-6 py-2">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {units.map(car => (
                                        <tr key={car.vin} className="hover:bg-gray-100/50">
                                            <td className="px-6 py-3 pl-16 font-mono text-xs text-gray-700">{car.vin}</td>
                                            <td className="px-6 py-3">
                                                <span className={cn(
                                                    "px-1.5 py-0.5 rounded-sm text-[10px] font-bold",
                                                    car.status_code >= 190 ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"
                                                )}>
                                                    {car.status_code}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1 text-[10px] font-bold",
                                                    car.visibility === 'PUBLIC' ? "text-blue-600" : "text-gray-400"
                                                )}>
                                                    {car.visibility === 'PUBLIC' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                                    {car.visibility}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <Link
                                                    href={`/admin/cars/${car.vin}`}
                                                    className="text-[10px] font-bold uppercase text-blue-600 hover:underline"
                                                >
                                                    Edit Car
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

// --- Main Container ---

export function AdminCarList({ refreshTrigger = 0 }: { refreshTrigger?: number }) {
    const [groups, setGroups] = useState<ProductGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modelMap, setModelMap] = useState<Record<string, string>>({});
    const [internalExpanded, setInternalExpanded] = useState(false);

    const fetchGroups = async () => {
        setLoading(true);

        // 1. Fetch Product Groups with Stock Units
        // We fetch ALL because pagination with nested objects + client side filtering is tricky.
        // If dataset is huge (>5000 cars), we might need better server-side querying, 
        // but for now let's fetch active groups.

        const { data, error } = await supabase
            .from('product_groups')
            .select(`
                *,
                stock_units(*)
            `)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error fetching groups:', error);
        } else {
            // Map stock_units to available_units property and ensure types
            const mappedGroups: ProductGroup[] = (data || []).map((g: any) => ({
                ...g,
                available_units: g.stock_units as StockCar[]
            }));
            setGroups(mappedGroups);
        }

        // 2. Fetch Model Dictionary from Knowledge Base
        const { data: dictData } = await supabase
            .from('dictionaries')
            .select('code, data')
            .eq('type', 'model');
        if (dictData) {
            const map: Record<string, string> = {};
            dictData.forEach((item: any) => {
                if (item.data?.name) map[item.code] = item.data.name;
            });
            setModelMap(map);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchGroups();
    }, [refreshTrigger]);

    // --- Derived State ---

    // Flatten all units for specific filtered views
    const allUnits = groups.flatMap(g => g.available_units || []);

    // 0. Sold Cars (Status 500)
    const soldCars = allUnits.filter(car => car.status_code === 500);

    // 1. Filter Groups (Inventory)
    // Show groups that match search criteria
    const filteredGroups = groups.filter(group => {
        const units = group.available_units || [];

        // Exclude empty groups (if any) or groups with ONLY sold cars?
        // Let's show group if it has ANY non-sold car.
        const hasActiveUnits = units.some(u => u.status_code !== 500);
        if (!hasActiveUnits) return false;

        if (!search) return true;
        const query = search.toLowerCase();

        // Search in Group Metadata + Unit VINs
        const matchesGroup =
            group.model_code.toLowerCase().includes(query) ||
            group.color_code.toLowerCase().includes(query) ||
            (modelMap[group.model_code] || '').toLowerCase().includes(query);

        const matchesVin = units.some(u => u.vin.toLowerCase().includes(query));

        return matchesGroup || matchesVin;
    });

    // Helper: a group is "internal" if ALL its non-sold units have visibility INTERNAL
    const isInternalGroup = (g: ProductGroup) => {
        const activeUnits = (g.available_units || []).filter(u => u.status_code !== 500);
        return activeUnits.length > 0 && activeUnits.every(u => u.visibility === 'INTERNAL');
    };

    // Groups with no images (Pending) — exclude internal groups
    const pendingGroups = filteredGroups.filter(g => {
        if (isInternalGroup(g)) return false;
        const hasGroupImages = g.images && g.images.length > 0;
        const hasUnitImages = (g.available_units || []).some(u => u.images && u.images.length > 0);
        return !hasGroupImages && !hasUnitImages;
    });

    // Internal Groups — separate section regardless of image status
    const internalGroups = filteredGroups.filter(g => isInternalGroup(g));

    // Active Groups (Main List) — exclude pending and internal
    const activeGroups = filteredGroups.filter(g => {
        if (isInternalGroup(g)) return false;
        const hasGroupImages = g.images && g.images.length > 0;
        const hasUnitImages = (g.available_units || []).some(u => u.images && u.images.length > 0);
        return hasGroupImages || hasUnitImages;
    });


    if (loading && groups.length === 0) return <div className="p-8 text-center text-gray-400">Loading inventory...</div>;

    return (
        <div className="space-y-8">
            {/* Search Bar */}
            <div className="bg-white border border-gray-200 p-4 rounded-sm flex flex-col md:flex-row justify-between items-center gap-4 sticky top-24 z-30 shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search VIN, Model, Color..."
                        className="w-full px-4 py-2 pl-9 border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-black transition-colors"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="text-sm text-gray-500">
                    Showing {filteredGroups.length} Product Groups
                </div>
            </div>

            {/* Sold Cars */}
            {soldCars.length > 0 && <SoldCarsList cars={soldCars} onRefresh={fetchGroups} />}

            {/* Pending Groups */}
            {pendingGroups.length > 0 && (
                <div className="bg-orange-50 border border-orange-100 rounded-sm overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-orange-100 flex justify-between items-center bg-orange-50/50">
                        <div>
                            <h3 className="text-lg font-medium text-orange-900">⚠️ Pending Setup (No Photos)</h3>
                            <p className="text-xs text-orange-700 mt-1">These product groups have no images (group or individual).</p>
                        </div>
                        <span className="text-xs font-mono text-orange-800 bg-orange-100 px-2 py-1 rounded-full">{pendingGroups.length}</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-orange-50/50 text-orange-900 uppercase text-xs font-semibold tracking-wider">
                                <tr>
                                    <th className="px-6 py-3">Model / Specs</th>
                                    <th className="px-6 py-3">Inventory</th>
                                    <th className="px-6 py-3">Images</th>
                                    <th className="px-6 py-3">Price</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-orange-100">
                                {pendingGroups.map(group => (
                                    <ProductGroupRow key={group.id} group={group} modelMap={modelMap} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Main Inventory */}
            <div className="bg-white border border-gray-100 rounded-sm overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-light">Inventory Management</h3>
                        <span className="text-xs font-mono text-gray-400">Total Active Groups: {activeGroups.length}</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold tracking-wider">
                            <tr>
                                <th className="px-6 py-3">Model / Specs</th>
                                <th className="px-6 py-3">Inventory</th>
                                <th className="px-6 py-3">Images</th>
                                <th className="px-6 py-3">Price</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {activeGroups.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                        No active product groups found.
                                    </td>
                                </tr>
                            ) : (
                                activeGroups.map(group => (
                                    <ProductGroupRow key={group.id} group={group} modelMap={modelMap} />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Internal Groups — collapsed by default, last on page */}
            {internalGroups.length > 0 && (
                <div className="bg-purple-50 border border-purple-100 rounded-sm overflow-hidden shadow-sm">
                    <div
                        className="p-6 flex justify-between items-center bg-purple-50/50 cursor-pointer hover:bg-purple-100/50 transition-colors"
                        onClick={() => setInternalExpanded(!internalExpanded)}
                    >
                        <div className="flex items-center gap-3">
                            {internalExpanded ? <ChevronDown className="w-4 h-4 text-purple-400" /> : <ChevronRight className="w-4 h-4 text-purple-400" />}
                            <div>
                                <h3 className="text-lg font-medium text-purple-900">🔒 Internal (DE / Not for Sale)</h3>
                                <p className="text-xs text-purple-700 mt-1">These groups contain only internal units — not visible on the public site.</p>
                            </div>
                        </div>
                        <span className="text-xs font-mono text-purple-800 bg-purple-100 px-2 py-1 rounded-full">{internalGroups.length}</span>
                    </div>
                    {internalExpanded && (
                        <div className="overflow-x-auto border-t border-purple-100">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-purple-50/50 text-purple-900 uppercase text-xs font-semibold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3">Model / Specs</th>
                                        <th className="px-6 py-3">Inventory</th>
                                        <th className="px-6 py-3">Images</th>
                                        <th className="px-6 py-3">Price</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-purple-100">
                                    {internalGroups.map(group => (
                                        <ProductGroupRow key={group.id} group={group} modelMap={modelMap} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
