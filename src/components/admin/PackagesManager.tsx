'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ServicePackage, getAllServicePrices, upsertServicePrice } from '@/lib/service-packages';
import { Loader2, Plus, Edit, Save, Trash2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PackagesManager() {
    const [packages, setPackages] = useState<ServicePackage[]>([]);
    const [prices, setPrices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPkg, setEditingPkg] = useState<ServicePackage | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);

    // Filter states
    const [activeTab, setActiveTab] = useState<'BRI' | 'BSI' | 'BSI_PLUS'>('BRI');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [{ data: pkgData }, priceData] = await Promise.all([
            supabase.from('service_packages').select('*').order('code'),
            getAllServicePrices()
        ]);

        if (pkgData) setPackages(pkgData);
        if (priceData) setPrices(priceData);
        setLoading(false);
    };

    const handleSavePackage = async (pkg: ServicePackage) => {
        const { error } = await supabase.from('service_packages').upsert(pkg);
        if (error) {
            alert('Error saving package: ' + error.message);
            return;
        }
        setIsModalOpen(false);
        setEditingPkg(null);
        loadData();
    };

    const handleDeletePackage = async (code: string) => {
        if (!confirm('Are you sure you want to delete this package?')) return;
        const { error } = await supabase.from('service_packages').delete().eq('code', code);
        if (error) {
            alert('Error deleting: ' + error.message);
        } else {
            loadData();
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Zarządzanie Pakietami Serwisowymi</h1>
                    <p className="text-gray-500 text-sm">Edytuj pakiety BRI / BSI oraz ich ceny dla poszczególnych serii.</p>
                </div>
                <button
                    onClick={() => { setEditingPkg(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-sm hover:bg-gray-800 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Dodaj Pakiet
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200 pb-1">
                {(['BRI', 'BSI', 'BSI_PLUS'] as const).map(type => (
                    <button
                        key={type}
                        onClick={() => setActiveTab(type)}
                        className={cn(
                            "px-4 py-2 text-sm font-medium transition-colors relative",
                            activeTab === type ? "text-black" : "text-gray-400 hover:text-gray-600"
                        )}
                    >
                        {type === 'BRI' ? 'Przedłużona Gwarancja (BRI)' : type === 'BSI' ? 'Service Inclusive (BSI)' : 'Service Inclusive Plus'}
                        {activeTab === type && <div className="absolute bottom-[-5px] left-0 w-full h-0.5 bg-black" />}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-300" /></div>
            ) : (
                <div className="grid gap-4">
                    {packages.filter(p => p.type === activeTab).map(pkg => (
                        <div key={pkg.code} className="bg-white border border-gray-200 rounded-sm p-4 hover:shadow-sm transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-gray-900">{pkg.name}</h3>
                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">{pkg.code}</span>
                                        {((pkg as any).vehicle_type && (pkg as any).vehicle_type !== 'ALL') && (
                                            <span className={cn(
                                                "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase",
                                                (pkg as any).vehicle_type === 'ELECTRIC' ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                                            )}>
                                                {(pkg as any).vehicle_type} Only
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {pkg.duration_months} miesięcy / {pkg.mileage_limit.toLocaleString()} km
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setEditingPkg(pkg); setIsModalOpen(true); }}
                                        className="p-2 hover:bg-gray-100 rounded text-gray-600"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeletePackage(pkg.code)}
                                        className="p-2 hover:bg-red-50 rounded text-red-500"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                <span className="text-xs text-gray-400">
                                    {prices.filter(p => p.package_code === pkg.code).length} zdefiniowanych cen
                                </span>
                                <button
                                    onClick={() => { setEditingPkg(pkg); setIsPriceModalOpen(true); }}
                                    className="text-xs font-bold text-black border border-gray-200 px-3 py-1.5 rounded-sm hover:bg-gray-50 bg-white"
                                >
                                    Zarządzaj Cenami
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <PackageModal
                    pkg={editingPkg}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSavePackage}
                />
            )}

            {/* Price Modal */}
            {isPriceModalOpen && editingPkg && (
                <PriceModal
                    pkg={editingPkg}
                    allPrices={prices.filter(p => p.package_code === editingPkg.code)}
                    onClose={() => { setIsPriceModalOpen(false); setEditingPkg(null); }}
                    onUpdate={loadData}
                />
            )}
        </div>
    );
}

function PackageModal({ pkg, onClose, onSave }: { pkg: ServicePackage | null, onClose: () => void, onSave: (pkg: ServicePackage) => void }) {
    const [formData, setFormData] = useState<Partial<ServicePackage>>({
        code: '',
        name: '',
        type: 'BRI',
        duration_months: 24,
        mileage_limit: 200000,
        description: '',
        plus: false,
        vehicle_type: 'ALL'
    } as any);

    useEffect(() => {
        if (pkg) setFormData(pkg);
    }, [pkg]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <h2 className="text-lg font-bold mb-4">{pkg ? 'Edytuj Pakiet' : 'Dodaj Nowy Pakiet'}</h2>
                <div className="space-y-4">
                    {/* Fields... copied from previous step for consistency if overwriting */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kod (Unique)</label>
                            <input className="w-full border border-gray-300 rounded p-2 text-sm" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} disabled={!!pkg} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Typ</label>
                            <select className="w-full border border-gray-300 rounded p-2 text-sm" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })}>
                                <option value="BRI">BRI</option>
                                <option value="BSI">BSI</option>
                                <option value="BSI_PLUS">BSI Plus</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nazwa</label>
                        <input className="w-full border border-gray-300 rounded p-2 text-sm" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Miesiące</label>
                            <input type="number" className="w-full border border-gray-300 rounded p-2 text-sm" value={formData.duration_months} onChange={e => setFormData({ ...formData, duration_months: parseInt(e.target.value) })} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Limit km</label>
                            <input type="number" className="w-full border border-gray-300 rounded p-2 text-sm" value={formData.mileage_limit} onChange={e => setFormData({ ...formData, mileage_limit: parseInt(e.target.value) })} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dostępność dla napędu</label>
                        <select className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50" value={(formData as any).vehicle_type || 'ALL'} onChange={e => setFormData({ ...formData, vehicle_type: e.target.value } as any)}>
                            <option value="ALL">Wszystkie (All)</option>
                            <option value="ELECTRIC">Tylko Elektryczne (BEV)</option>
                            <option value="ICE_PHEV">Spalinowe / Hybrydy (ICE/PHEV)</option>
                        </select>
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">Anuluj</button>
                    <button onClick={() => onSave(formData as ServicePackage)} className="px-4 py-2 text-sm bg-black text-white hover:bg-gray-800 rounded">Zapisz</button>
                </div>
            </div>
        </div>
    );
}

function PriceModal({ pkg, allPrices, onClose, onUpdate }: { pkg: ServicePackage, allPrices: any[], onClose: () => void, onUpdate: () => void }) {
    const [seriesCode, setSeriesCode] = useState('');
    const [price, setPrice] = useState('0');
    const [loading, setLoading] = useState(false);

    const handleAddPrice = async () => {
        if (!seriesCode) return;
        setLoading(true);
        const { error } = await supabase.from('service_prices').upsert({
            package_code: pkg.code,
            series_code: seriesCode.toUpperCase(),
            price: parseFloat(price)
        });
        setLoading(false);
        if (error) alert(error.message);
        else {
            setSeriesCode('');
            setPrice('0');
            onUpdate();
        }
    };

    const handleDelete = async (series: string) => {
        if (!confirm(`Delete price for ${series}?`)) return;
        await supabase.from('service_prices').delete().match({ package_code: pkg.code, series_code: series });
        onUpdate();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-lg font-bold">Ceny: {pkg.name}</h2>
                        <p className="text-xs text-gray-400">{pkg.code}</p>
                    </div>
                    <button onClick={onClose}><X className="w-5 h-5" /></button>
                </div>

                <div className="flex gap-2 mb-4 p-4 bg-gray-50 rounded-sm items-end">
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Seria (np. G60)</label>
                        <input className="border p-2 rounded text-sm w-32 uppercase" placeholder="G60" value={seriesCode} onChange={e => setSeriesCode(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Cena (PLN)</label>
                        <input type="number" className="border p-2 rounded text-sm w-32" value={price} onChange={e => setPrice(e.target.value)} />
                    </div>
                    <button onClick={handleAddPrice} disabled={loading} className="bg-black text-white px-4 py-2 rounded text-sm hover:bg-gray-800 disabled:opacity-50">
                        {loading ? '...' : 'Dodaj / Aktualizuj'}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto border border-gray-100 rounded-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="text-left p-3 font-medium text-gray-500 text-xs uppercase">Seria</th>
                                <th className="text-right p-3 font-medium text-gray-500 text-xs uppercase">Cena</th>
                                <th className="w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {allPrices.sort((a, b) => a.series_code.localeCompare(b.series_code)).map(p => (
                                <tr key={p.id || p.series_code}>
                                    <td className="p-3 font-bold">{p.series_code}</td>
                                    <td className="p-3 text-right">{p.price.toLocaleString()} PLN</td>
                                    <td className="p-3">
                                        <button onClick={() => handleDelete(p.series_code)} className="text-red-400 hover:text-red-600">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {allPrices.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-gray-400">Brak zdefiniowanych cen dla poszczególnych serii.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
