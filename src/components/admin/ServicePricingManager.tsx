'use client';

import { useState, useEffect } from 'react';
import {
    ServicePackage,
    ServicePrice,
    getServicePackages,
    getAllServicePrices,
    upsertServicePrice
} from '@/lib/service-packages';
import { Loader2, Plus, Save, Search, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export function ServicePricingManager() {
    const [packages, setPackages] = useState<ServicePackage[]>([]);
    const [prices, setPrices] = useState<ServicePrice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'BRI' | 'BSI'>('BRI');
    const [search, setSearch] = useState('');

    // Edit State
    const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
    const [editPriceValue, setEditPriceValue] = useState<number>(0);

    // Add State
    const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
    const [newSeriesCode, setNewSeriesCode] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        const [pkgData, priceData] = await Promise.all([
            getServicePackages(),
            getAllServicePrices()
        ]);
        setPackages(pkgData);
        setPrices(priceData);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredPackages = packages.filter(p => {
        if (activeTab === 'BRI') return p.type === 'BRI';
        return p.type === 'BSI' || p.type === 'BSI_PLUS';
    }).filter(p =>
        p.code.toLowerCase().includes(search.toLowerCase()) ||
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleAddPrice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPackage || !newSeriesCode || !newPrice) return;

        setIsSaving(true);
        try {
            await upsertServicePrice(selectedPackage.code, newSeriesCode.toUpperCase(), parseInt(newPrice));
            await fetchData();
            setNewSeriesCode('');
            setNewPrice('');
            setMessage({ type: 'success', text: 'Cena została zapisana' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Błąd podczas zapisywania' });
        } finally {
            setIsSaving(false);
        }
    };

    const getPricesForPackage = (code: string) => {
        return prices.filter(p => p.package_code === code).sort((a, b) => a.series_code.localeCompare(b.series_code));
    };

    if (isLoading) {
        return <div className="flex items-center justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

            {/* LEFT: Package List */}
            <div className="lg:col-span-1 bg-white border border-gray-100 rounded-sm overflow-hidden flex flex-col h-[calc(100vh-200px)]">
                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => { setActiveTab('BRI'); setSelectedPackage(null); }}
                        className={cn(
                            "flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors",
                            activeTab === 'BRI' ? "bg-black text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                        )}
                    >
                        Repair (BRI)
                    </button>
                    <button
                        onClick={() => { setActiveTab('BSI'); setSelectedPackage(null); }}
                        className={cn(
                            "flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors",
                            activeTab === 'BSI' ? "bg-black text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                        )}
                    >
                        Service (BSI)
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Szukaj kodu lub nazwy..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-black"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredPackages.map(pkg => (
                        <button
                            key={pkg.code}
                            onClick={() => setSelectedPackage(pkg)}
                            className={cn(
                                "w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors flex flex-col gap-1",
                                selectedPackage?.code === pkg.code ? "bg-blue-50 border-l-4 border-l-blue-500" : "border-l-4 border-l-transparent"
                            )}
                        >
                            <div className="flex justify-between items-center w-full">
                                <span className={cn(
                                    "text-xs font-bold px-1.5 py-0.5 rounded-sm",
                                    pkg.type === 'BRI' ? "bg-orange-100 text-orange-700" :
                                        pkg.plus ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                                )}>
                                    {pkg.code}
                                </span>
                                <span className="text-[10px] text-gray-700">
                                    {getPricesForPackage(pkg.code).length} cen
                                </span>
                            </div>
                            <span className="text-sm font-medium text-gray-900 line-clamp-1">{pkg.name}</span>
                            <div className="flex gap-2 text-[10px] text-gray-600 uppercase tracking-wide">
                                <span>{pkg.duration_months / 12} lat</span>
                                <span>•</span>
                                <span>{pkg.mileage_limit.toLocaleString()} km</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* RIGHT: Detail & Pricing */}
            <div className="lg:col-span-2 space-y-6">
                {selectedPackage ? (
                    <>
                        {/* Header */}
                        <div className="bg-white p-6 border border-gray-100 rounded-sm">
                            <div className="flex gap-3 mb-2">
                                <span className="text-2xl font-bold">{selectedPackage.code}</span>
                                <span className={cn(
                                    "self-center text-xs font-bold px-2 py-1 rounded-sm uppercase tracking-wide",
                                    selectedPackage.type === 'BRI' ? "bg-orange-100 text-orange-800" :
                                        selectedPackage.plus ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                                )}>
                                    {selectedPackage.type === 'BSI_PLUS' ? 'Service Inclusive PLUS' : selectedPackage.type === 'BSI' ? 'Service Inclusive' : 'Repair Inclusive'}
                                </span>
                            </div>
                            <h2 className="text-lg text-gray-700 mb-4">{selectedPackage.name}</h2>
                            <div className="flex gap-6 text-sm text-gray-500 border-t border-gray-100 pt-4">
                                <div>
                                    <span className="block text-[10px] uppercase tracking-wider text-gray-600">Czas trwania</span>
                                    <span className="font-medium text-black">{selectedPackage.duration_months / 12} lat</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] uppercase tracking-wider text-gray-600">Limit przebiegu</span>
                                    <span className="font-medium text-black">{selectedPackage.mileage_limit.toLocaleString()} km</span>
                                </div>
                            </div>
                        </div>

                        {/* Add Price Form */}
                        <div className="bg-gray-50 p-6 border border-gray-100 rounded-sm">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-4 flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Dodaj nową cenę
                            </h3>
                            <form onSubmit={handleAddPrice} className="flex gap-4 items-end">
                                <div className="w-32">
                                    <label className="block text-[10px] uppercase tracking-widest text-gray-700 font-semibold mb-2">Seria (np. G60)</label>
                                    <input
                                        type="text"
                                        value={newSeriesCode}
                                        onChange={(e) => setNewSeriesCode(e.target.value)}
                                        placeholder="G.."
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-sm text-sm uppercase"
                                        required
                                    />
                                </div>
                                <div className="w-40">
                                    <label className="block text-[10px] uppercase tracking-widest text-gray-700 font-semibold mb-2">Cena (PLN)</label>
                                    <input
                                        type="number"
                                        value={newPrice}
                                        onChange={(e) => setNewPrice(e.target.value)}
                                        placeholder="0"
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-sm text-sm"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-6 py-2 bg-black text-white text-sm font-bold uppercase tracking-wider rounded-sm hover:bg-gray-800 disabled:opacity-50 transition-colors"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Doaj'}
                                </button>
                            </form>
                            {message && (
                                <div className={cn(
                                    "mt-4 p-3 rounded-sm flex items-center gap-2 text-sm",
                                    message.type === 'success' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                                )}>
                                    {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                    {message.text}
                                </div>
                            )}
                        </div>

                        {/* Prices List */}
                        <div className="bg-white border border-gray-100 rounded-sm overflow-hidden">
                            <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-700">Zdefiniowane ceny</h3>
                                <span className="text-xs text-gray-700">{getPricesForPackage(selectedPackage.code).length} serii</span>
                            </div>

                            {getPricesForPackage(selectedPackage.code).length === 0 ? (
                                <div className="p-8 text-center text-gray-500 text-sm">
                                    Brak zdefiniowanych cen dla tego pakietu.
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-gray-50 text-left">
                                        <tr>
                                            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-700 w-32">Seria</th>
                                            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-700">Cena</th>
                                            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-700 text-right">Akcje</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {getPricesForPackage(selectedPackage.code).map(price => (
                                            <tr key={price.package_code + price.series_code} className="hover:bg-gray-50 group">
                                                <td className="px-6 py-4 font-mono font-bold text-gray-900">{price.series_code}</td>
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(price.price)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {/* Placeholder for future delete/edit */}
                                                    <span className="text-xs text-gray-500 group-hover:text-gray-500">
                                                        {new Date(0).toLocaleDateString()} {/* Just a placeholder for date if needed */}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 p-12 text-center border ransparent">
                        <Search className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-sm uppercase tracking-widest font-semibold">Wybierz pakiet z listy aby zarządzać cenami</p>
                    </div>
                )}
            </div>
        </div>
    );
}
