'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    ChevronDown, ChevronUp, X, RotateCcw, SprayCan, Search,
    Car, Layout, Fuel, Zap, CircleDollarSign, Gauge, Palette, Armchair
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Slider } from '@/components/ui/slider';

interface FilterSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    resultsCount?: number;
    options: {
        series: string[];
        bodyTypes: string[];
        fuelTypes: string[];
        drivetrains: string[];
        powerLevels: string[];
        colorGroups?: string[];
        upholsteryGroups?: string[];
        minPrice: number;
        maxPrice: number;
        minPower: number;
        maxPower: number;
    };
}

import { getColor } from '@/lib/colors';



const Section = ({ id, title, children, expanded, onToggle }: { id: string, title: string, children: React.ReactNode, expanded: boolean, onToggle: (id: string) => void }) => (
    <div className="py-5">
        <button
            onClick={() => onToggle(id)}
            className="flex w-full items-center justify-between text-left group"
        >
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-900/60 group-hover:text-black transition-colors">
                {title}
            </span>
            {expanded ? (
                <ChevronUp className="w-3 h-3 text-gray-300 transition-transform group-hover:text-gray-600" />
            ) : (
                <ChevronDown className="w-3 h-3 text-gray-300 transition-transform group-hover:text-gray-600" />
            )}
        </button>

        <div className={cn(
            "overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
            expanded ? "max-h-[800px] opacity-100 mt-5" : "max-h-0 opacity-0"
        )}>
            {children}
        </div>
    </div>
);

const FilterPill = ({ label, active, onClick, isMSeries }: { label: string, active: boolean, onClick: () => void, isMSeries?: boolean }) => (
    <button
        onClick={onClick}
        className={cn(
            "relative px-3 py-2.5 text-[10px] uppercase font-semibold tracking-wider transition-all duration-300 text-center overflow-hidden rounded-[8px]",
            active
                ? "bg-gray-900 text-white shadow-md"
                : "bg-gray-50/50 text-gray-500 hover:bg-gray-100 hover:text-gray-900",
        )}
    >
        {isMSeries && (
            <div className={cn("absolute bottom-0 left-0 right-0 h-0.5 flex transition-opacity", active ? "opacity-100" : "opacity-80")}>
                <div className="flex-1 bg-[#53A0DE]" />
                <div className="flex-1 bg-[#02256E]" />
                <div className="flex-1 bg-[#E40424]" />
            </div>
        )}
        <span className="relative z-10">{label}</span>
    </button>
);

const FilterCheckbox = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: () => void }) => (
    <label className="flex items-center gap-3 cursor-pointer group select-none py-1">
        <div className={cn(
            "w-3 h-3 border flex items-center justify-center transition-colors duration-200",
            checked ? "bg-black border-black" : "bg-white border-gray-300 group-hover:border-black"
        )}>
            {checked && <div className="w-1.5 h-1.5 bg-white" />}
        </div>
        <span className={cn(
            "text-[11px] uppercase tracking-wider transition-colors",
            checked ? "text-black font-bold" : "text-gray-500 group-hover:text-black"
        )}>{label}</span>
        <input type="checkbox" className="hidden" checked={checked} onChange={onChange} />
    </label>
);

export function FilterSidebar({ isOpen, onClose, options, resultsCount }: FilterSidebarProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const isTypingRef = useRef(false);

    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        series: false,
        body: false,
        colorGroup: false,
        upholsteryGroup: false,
        fuel: false,
        drivetrain: false,
        power: false,
        price: false
    });

    const [activeMobileCategory, setActiveMobileCategory] = useState<string | null>(null);

    const toggleSection = (id: string) => {
        setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Body scroll lock on mobile
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (isOpen && window.innerWidth < 1024) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(price);

    // URL State Helpers
    const toggleFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        const current = params.getAll(key);
        if (current.includes(value)) {
            const updated = current.filter(v => v !== value);
            params.delete(key);
            updated.forEach(v => params.append(key, v));
        } else {
            params.append(key, value);
        }
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const clearFilters = () => {
        router.replace(pathname, { scroll: false });
    };

    const removeSearchTerm = (termToRemove: string) => {
        const params = new URLSearchParams(searchParams.toString());
        const currentQ = params.get('q') || '';
        const newTerms = currentQ.split(/[\s,]+/).filter(Boolean).filter(t => t.toLowerCase() !== termToRemove.toLowerCase());

        if (newTerms.length > 0) {
            params.set('q', newTerms.join(' '));
        } else {
            params.delete('q');
        }
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const activeSearchTerms = (searchParams.get('q') || '').split(/[\s,]+/).filter(Boolean);
    const activeSeries = searchParams.getAll('series');
    const activeBody = searchParams.getAll('body');
    const activeColorGroup = searchParams.getAll('colorGroup');
    const activeUpholsteryGroup = searchParams.getAll('upholsteryGroup');
    const activeFuel = searchParams.getAll('fuel');
    const activeDrivetrain = searchParams.getAll('drivetrain');
    const safeMinPrice = options.minPrice ?? 0;
    const safeMaxPrice = options.maxPrice ?? 1000000;
    const safeMaxPower = options.maxPower ?? 600;

    const [sliderMax, setSliderMax] = useState(parseInt(searchParams.get('max') || safeMaxPrice.toString()));
    const [search, setSearch] = useState(searchParams.get('q') || '');

    // Power range state
    const [pmin, setPmin] = useState(parseInt(searchParams.get('pmin') || '120'));
    const [pmax, setPmax] = useState(parseInt(searchParams.get('pmax') || safeMaxPower.toString()));

    // Synchronize local states with URL (only when not actively typing)
    useEffect(() => {
        if (!isTypingRef.current) {
            setSearch(searchParams.get('q') || '');
        }
    }, [searchParams]);

    useEffect(() => {
        setSliderMax(parseInt(searchParams.get('max') || safeMaxPrice.toString()));
    }, [searchParams, safeMaxPrice]);

    useEffect(() => {
        const urlMin = parseInt(searchParams.get('pmin') || '120');
        const urlMax = parseInt(searchParams.get('pmax') || safeMaxPower.toString());
        if (pmin !== urlMin) setPmin(urlMin);
        if (pmax !== urlMax) setPmax(urlMax);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, safeMaxPower]);

    // Debounced URL updates for Sliders and Search
    useEffect(() => {
        if (!isTypingRef.current) return;

        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());

            // Search
            if (search) params.set('q', search);
            else params.delete('q');

            // Price
            if (sliderMax < safeMaxPrice) params.set('max', sliderMax.toString());
            else params.delete('max');

            // Power
            if (pmin > 120) params.set('pmin', pmin.toString());
            else params.delete('pmin');

            if (pmax < safeMaxPower) params.set('pmax', pmax.toString());
            else params.delete('pmax');

            if (params.toString() !== searchParams.toString()) {
                router.replace(`${pathname}?${params.toString()}`, { scroll: false });
            }

            // Allow URL to override local state again after we pushed the update
            isTypingRef.current = false;
        }, 300);
        return () => clearTimeout(timer);
    }, [search, sliderMax, pmin, pmax, safeMaxPrice, safeMaxPower, pathname, router, searchParams]);

    const activeMax = sliderMax;
    const sliderMin = Math.max(100000, safeMinPrice);
    const activeMin = parseInt(searchParams.get('min') || safeMinPrice.toString());

    const hasActiveFilters = activeSeries.length > 0 ||
        activeBody.length > 0 ||
        activeColorGroup.length > 0 ||
        activeUpholsteryGroup.length > 0 ||
        activeFuel.length > 0 ||
        activeDrivetrain.length > 0 ||
        searchParams.has('q') ||
        searchParams.has('min') ||
        searchParams.has('max') ||
        searchParams.has('pmin') ||
        searchParams.has('pmax');

    const content = (
        <>
            {/* Sidebar Content — fullscreen on mobile, sticky sidebar on desktop */}
            <aside className={cn(
                "fixed lg:sticky top-0 lg:top-24 left-0 h-full lg:h-[calc(100vh-8rem)] w-full lg:w-[280px] bg-white lg:bg-transparent z-[500] lg:z-0 hidden lg:block overflow-y-auto lg:px-0 lg:py-0 px-0 py-0 lg:shadow-none transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] scrollbar-hide",
                isOpen ? "translate-x-0 !flex flex-col" : "-translate-x-full lg:translate-x-0 lg:!block"
            )}>
                {/* Mobile Header - Improved layout to avoid status bar / site header conflict */}
                <div className="lg:hidden flex items-start justify-between px-6 pb-6 pt-20 border-b border-gray-100 shrink-0 bg-white z-[600]">
                    <div className="pt-2">
                        <h2 className="text-[13px] font-black uppercase tracking-[0.4em] text-gray-900 mb-2">Filtrowanie</h2>
                        {hasActiveFilters && !activeMobileCategory && (
                            <button onClick={clearFilters} className="text-[10px] font-bold uppercase tracking-widest text-red-600 flex items-center gap-2 active:scale-95 transition-transform">
                                <RotateCcw className="w-3.5 h-3.5" /> Resetuj wszystkie
                            </button>
                        )}
                        {activeMobileCategory && (
                            <button onClick={() => setActiveMobileCategory(null)} className="text-[11px] font-bold uppercase tracking-widest text-blue-600 flex items-center gap-2 active:scale-95 transition-transform">
                                ← Powrót
                            </button>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="w-14 h-14 flex items-center justify-center rounded-full bg-gray-50 border border-gray-100 shadow-sm active:scale-90 transition-all"
                    >
                        <X className="w-7 h-7 text-gray-900" />
                    </button>
                </div>

                {/* Scrollable content area */}
                <div className="flex-1 overflow-y-auto px-6 py-6 lg:px-0 lg:py-8 relative">
                    {/* Mobile Only: Category Grid Main View */}
                    {!activeMobileCategory && (
                        <div className="lg:hidden space-y-10">
                            {/* Search prominent for mobile */}
                            <div className="relative">
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Search className="w-4 h-4" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Wyszukaj model lub opcję..."
                                    className="w-full pl-7 py-4 bg-transparent border-b border-gray-100 focus:outline-none focus:border-black transition-colors text-[14px] font-semibold text-gray-900 tracking-wide placeholder:text-gray-300 placeholder:font-normal"
                                    value={search}
                                    onChange={(e) => {
                                        isTypingRef.current = true;
                                        setSearch(e.target.value);
                                    }}
                                />
                            </div>

                            {/* Two Column Grid with minimalist icons */}
                            <div className="grid grid-cols-2 gap-4">
                                <div onClick={() => setActiveMobileCategory('series')} className={cn("p-6 rounded-2xl border flex flex-col justify-between h-36 transition-all active:scale-95", activeSeries.length > 0 ? "bg-black border-black text-white shadow-lg" : "bg-gray-50 border-gray-100 text-gray-900")}>
                                    <div className="flex justify-between items-start">
                                        <div className="text-[9px] font-bold uppercase tracking-widest opacity-60">Model</div>
                                        <Car className={cn("w-4 h-4", activeSeries.length > 0 ? "text-white/40" : "text-gray-300")} />
                                    </div>
                                    <div className="text-[11px] font-black uppercase tracking-widest leading-tight">
                                        {activeSeries.length > 0 ? activeSeries.join(', ') : 'Wszystkie serie'}
                                    </div>
                                </div>
                                <div onClick={() => setActiveMobileCategory('body')} className={cn("p-6 rounded-2xl border flex flex-col justify-between h-36 transition-all active:scale-95", activeBody.length > 0 ? "bg-black border-black text-white shadow-lg" : "bg-gray-50 border-gray-100 text-gray-900")}>
                                    <div className="flex justify-between items-start">
                                        <div className="text-[9px] font-bold uppercase tracking-widest opacity-60">Nadwozie</div>
                                        <Layout className={cn("w-4 h-4", activeBody.length > 0 ? "text-white/40" : "text-gray-300")} />
                                    </div>
                                    <div className="text-[11px] font-black uppercase tracking-widest leading-tight">
                                        {activeBody.length > 0 ? activeBody.join(', ') : 'Wszystkie'}
                                    </div>
                                </div>
                                <div onClick={() => setActiveMobileCategory('fuel')} className={cn("p-6 rounded-2xl border flex flex-col justify-between h-36 transition-all active:scale-95", activeFuel.length > 0 ? "bg-black border-black text-white shadow-lg" : "bg-gray-50 border-gray-100 text-gray-900")}>
                                    <div className="flex justify-between items-start">
                                        <div className="text-[9px] font-bold uppercase tracking-widest opacity-60">Paliwo</div>
                                        <Fuel className={cn("w-4 h-4", activeFuel.length > 0 ? "text-white/40" : "text-gray-300")} />
                                    </div>
                                    <div className="text-[11px] font-black uppercase tracking-widest leading-tight">
                                        {activeFuel.length > 0 ? activeFuel.join(', ') : 'Dowolne'}
                                    </div>
                                </div>
                                <div onClick={() => setActiveMobileCategory('drivetrain')} className={cn("p-6 rounded-2xl border flex flex-col justify-between h-36 transition-all active:scale-95", activeDrivetrain.length > 0 ? "bg-black border-black text-white shadow-lg" : "bg-gray-50 border-gray-100 text-gray-900")}>
                                    <div className="flex justify-between items-start">
                                        <div className="text-[9px] font-bold uppercase tracking-widest opacity-60">Napęd</div>
                                        <Zap className={cn("w-4 h-4", activeDrivetrain.length > 0 ? "text-white/40" : "text-gray-300")} />
                                    </div>
                                    <div className="text-[11px] font-black uppercase tracking-widest leading-tight">
                                        {activeDrivetrain.length > 0 ? activeDrivetrain.join(', ') : 'Dowolny'}
                                    </div>
                                </div>
                                <div onClick={() => setActiveMobileCategory('price')} className={cn("p-6 rounded-2xl border flex flex-col justify-between h-36 transition-all active:scale-95", searchParams.has('max') ? "bg-black border-black text-white shadow-lg" : "bg-gray-50 border-gray-100 text-gray-900")}>
                                    <div className="flex justify-between items-start">
                                        <div className="text-[9px] font-bold uppercase tracking-widest opacity-60">Cena max</div>
                                        <CircleDollarSign className={cn("w-4 h-4", searchParams.has('max') ? "text-white/40" : "text-gray-300")} />
                                    </div>
                                    <div className="text-[11px] font-black uppercase tracking-widest leading-tight">
                                        {searchParams.has('max') ? formatPrice(sliderMax) : 'Bez limitu'}
                                    </div>
                                </div>
                                <div onClick={() => setActiveMobileCategory('power')} className={cn("p-6 rounded-2xl border flex flex-col justify-between h-36 transition-all active:scale-95", (searchParams.has('pmin') || searchParams.has('pmax')) ? "bg-black border-black text-white shadow-lg" : "bg-gray-50 border-gray-100 text-gray-900")}>
                                    <div className="flex justify-between items-start">
                                        <div className="text-[9px] font-bold uppercase tracking-widest opacity-60">KM</div>
                                        <Gauge className={cn("w-4 h-4", (searchParams.has('pmin') || searchParams.has('pmax')) ? "text-white/40" : "text-gray-300")} />
                                    </div>
                                    <div className="text-[11px] font-black uppercase tracking-widest leading-tight">
                                        {(searchParams.has('pmin') || searchParams.has('pmax')) ? `${pmin}-${pmax} KM` : 'Dowolna moc'}
                                    </div>
                                </div>
                                <div onClick={() => setActiveMobileCategory('colorGroup')} className={cn("p-6 rounded-2xl border flex flex-col justify-between h-36 transition-all active:scale-95", activeColorGroup.length > 0 ? "bg-black border-black text-white shadow-lg" : "bg-gray-50 border-gray-100 text-gray-900")}>
                                    <div className="flex justify-between items-start">
                                        <div className="text-[9px] font-bold uppercase tracking-widest opacity-60">Kolor</div>
                                        <Palette className={cn("w-4 h-4", activeColorGroup.length > 0 ? "text-white/40" : "text-gray-300")} />
                                    </div>
                                    <div className="text-[11px] font-black uppercase tracking-widest leading-tight">
                                        {activeColorGroup.length > 0 ? activeColorGroup.join(', ') : 'Dowolny'}
                                    </div>
                                </div>
                                <div onClick={() => setActiveMobileCategory('upholsteryGroup')} className={cn("p-6 rounded-2xl border flex flex-col justify-between h-36 transition-all active:scale-95", activeUpholsteryGroup.length > 0 ? "bg-black border-black text-white shadow-lg" : "bg-gray-50 border-gray-100 text-gray-900")}>
                                    <div className="flex justify-between items-start">
                                        <div className="text-[9px] font-bold uppercase tracking-widest opacity-60">Tapicerka</div>
                                        <Armchair className={cn("w-4 h-4", activeUpholsteryGroup.length > 0 ? "text-white/40" : "text-gray-300")} />
                                    </div>
                                    <div className="text-[11px] font-black uppercase tracking-widest leading-tight">
                                        {activeUpholsteryGroup.length > 0 ? activeUpholsteryGroup.join(', ') : 'Dowolna'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Mobile Only: Sub-panel categories */}
                    {activeMobileCategory && (
                        <div className="lg:hidden animate-in slide-in-from-right duration-300">
                            {activeMobileCategory === 'series' && (
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 opacity-40">Wybierz serię</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {options.series.map((s: string) => (
                                            <button key={s} onClick={() => toggleFilter('series', s)} className={cn("relative py-4 px-4 text-[11px] font-bold uppercase tracking-widest text-center rounded-xl border transition-all active:scale-95", activeSeries.includes(s) ? "bg-black border-black text-white" : "bg-gray-50 border-gray-100 text-gray-900")}>
                                                {s.includes('Seria M') && <div className="absolute top-0 inset-x-0 h-1 flex"><div className="flex-1 bg-[#53A0DE]" /><div className="flex-1 bg-[#02256E]" /><div className="flex-1 bg-[#E40424]" /></div>}
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {activeMobileCategory === 'body' && (
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 opacity-40">Rodzaj nadwozia</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {options.bodyTypes.map((b: string) => (
                                            <button key={b} onClick={() => toggleFilter('body', b)} className={cn("py-4 px-4 text-[11px] font-bold uppercase tracking-widest text-center rounded-xl border transition-all active:scale-95", activeBody.includes(b) ? "bg-black border-black text-white" : "bg-gray-50 border-gray-100 text-gray-900")}>
                                                {b}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {activeMobileCategory === 'fuel' && (
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 opacity-40">Typ paliwa</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {options.fuelTypes.map((f: string) => (
                                            <button key={f} onClick={() => toggleFilter('fuel', f)} className={cn("py-4 px-4 text-[11px] font-bold uppercase tracking-widest text-center rounded-xl border transition-all active:scale-95", activeFuel.includes(f) ? "bg-black border-black text-white" : "bg-gray-50 border-gray-100 text-gray-900")}>
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {activeMobileCategory === 'drivetrain' && (
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 opacity-40">Układ napędowy</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {options.drivetrains.map((d: string) => (
                                            <button key={d} onClick={() => toggleFilter('drivetrain', d)} className={cn("py-4 px-4 text-[11px] font-bold uppercase tracking-widest text-center rounded-xl border transition-all active:scale-95", activeDrivetrain.includes(d) ? "bg-black border-black text-white" : "bg-gray-50 border-gray-100 text-gray-900")}>
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {activeMobileCategory === 'price' && (
                                <div className="space-y-8 pt-4">
                                    <div className="flex justify-between items-end mb-4">
                                        <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Budżet do</div>
                                        <div className="text-[18px] font-black tracking-tight">{formatPrice(sliderMax)}</div>
                                    </div>
                                    <Slider defaultValue={[sliderMax]} value={[sliderMax]} min={100000} max={options.maxPrice} step={5000} onValueChange={([v]) => { isTypingRef.current = true; setSliderMax(v); }} />
                                </div>
                            )}
                            {activeMobileCategory === 'power' && (
                                <div className="space-y-8 pt-4">
                                    <div className="flex justify-between items-end mb-4">
                                        <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Zakres mocy</div>
                                        <div className="text-[18px] font-black tracking-tight">{pmin} - {pmax} KM</div>
                                    </div>
                                    <div className="space-y-12">
                                        <div>
                                            <div className="text-[9px] font-bold uppercase mb-2 text-gray-400">Min: {pmin} KM</div>
                                            <Slider defaultValue={[pmin]} value={[pmin]} min={120} max={pmax} step={10} onValueChange={([v]) => { isTypingRef.current = true; setPmin(v); }} />
                                        </div>
                                        <div>
                                            <div className="text-[9px] font-bold uppercase mb-2 text-gray-400">Max: {pmax} KM</div>
                                            <Slider defaultValue={[pmax]} value={[pmax]} min={pmin} max={options.maxPower} step={10} onValueChange={([v]) => { isTypingRef.current = true; setPmax(v); }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            {activeMobileCategory === 'colorGroup' && (
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 opacity-40">Kolor nadwozia</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {options.colorGroups?.map((c: string) => {
                                            const colorValue = getColor(c);
                                            const isMColor = c.toLowerCase().includes('m ');
                                            const isActive = activeColorGroup.includes(c);
                                            return (
                                                <button key={c} onClick={() => toggleFilter('colorGroup', c)} className={cn("flex flex-col items-center gap-4 p-5 rounded-2xl border transition-all active:scale-95", isActive ? "bg-black border-black text-white shadow-lg" : "bg-gray-50 border-gray-100 text-gray-900")}>
                                                    <div className="w-12 h-12 rounded-full border border-black/10 shadow-sm overflow-hidden relative">
                                                        {isMColor ? <div className="absolute inset-0 flex"><div className="flex-1 bg-[#53A0DE]" /><div className="flex-1 bg-[#02256E]" /><div className="flex-1 bg-[#E40424]" /></div> : <div className="absolute inset-0" style={{ backgroundColor: colorValue }} />}
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">{c}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            {activeMobileCategory === 'upholsteryGroup' && (
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 opacity-40">Typ tapicerki</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {options.upholsteryGroups?.map((u: string) => {
                                            const colorValue = getColor(u);
                                            const isActive = activeUpholsteryGroup.includes(u);
                                            return (
                                                <button key={u} onClick={() => toggleFilter('upholsteryGroup', u)} className={cn("flex flex-col items-center gap-4 p-5 rounded-2xl border transition-all active:scale-95", isActive ? "bg-black border-black text-white shadow-lg" : "bg-gray-50 border-gray-100 text-gray-900")}>
                                                    <div className="w-12 h-12 rounded-full border border-black/10 shadow-sm overflow-hidden relative">
                                                        <div className="absolute inset-0" style={{ backgroundColor: colorValue }} />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">{u}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Desktop Content (untouched, legacy scroll) */}
                    <div className="hidden lg:block space-y-2">

                        {/* Active Filters & Reset */}
                        {hasActiveFilters && (
                            <div className="mb-10 space-y-5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">Aktywne filtry</span>
                                    <button
                                        onClick={clearFilters}
                                        className="text-[9px] font-bold uppercase tracking-widest text-[#E40424] hover:text-[#b3031c] flex items-center gap-1.5 transition-colors"
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                        Reset
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {/* Text Search Terms */}
                                    {activeSearchTerms.map((term, i) => (
                                        <button
                                            key={`q-${term}-${i}`}
                                            onClick={() => removeSearchTerm(term)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 border border-gray-900 hover:bg-black text-white rounded-[8px] text-[9px] font-bold uppercase tracking-wider transition-colors group shadow-sm"
                                        >
                                            <span className="opacity-70 font-normal pr-1 border-r border-white/20">Tag</span>
                                            {term}
                                            <X className="w-3 h-3 text-white/50 group-hover:text-white" />
                                        </button>
                                    ))}

                                    {/* Series */}
                                    {activeSeries.map(s => (
                                        <button
                                            key={`s-${s}`}
                                            onClick={() => toggleFilter('series', s)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-[8px] text-[9px] font-bold uppercase tracking-wider transition-colors group"
                                        >
                                            {s}
                                            <X className="w-3 h-3 text-gray-300 group-hover:text-gray-900" />
                                        </button>
                                    ))}

                                    {/* Body */}
                                    {activeBody.map(b => (
                                        <button
                                            key={`b-${b}`}
                                            onClick={() => toggleFilter('body', b)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-[8px] text-[9px] font-bold uppercase tracking-wider transition-colors group"
                                        >
                                            {b}
                                            <X className="w-3 h-3 text-gray-300 group-hover:text-gray-900" />
                                        </button>
                                    ))}

                                    {/* Color */}
                                    {activeColorGroup.map(c => (
                                        <button
                                            key={`c-${c}`}
                                            onClick={() => toggleFilter('colorGroup', c)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-[8px] text-[9px] font-bold uppercase tracking-wider transition-colors group"
                                            title="Kolor nadwozia"
                                        >
                                            <div className="flex items-center gap-1 opacity-50 border-r border-gray-200 pr-1.5 mr-0.5">
                                                <SprayCan className="w-3 h-3" />
                                            </div>
                                            <div className="w-2.5 h-2.5 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: getColor(c) }} />
                                            {c}
                                            <X className="w-3 h-3 text-gray-300 group-hover:text-gray-900" />
                                        </button>
                                    ))}

                                    {/* Upholstery */}
                                    {activeUpholsteryGroup.map(u => (
                                        <button
                                            key={`u-${u}`}
                                            onClick={() => toggleFilter('upholsteryGroup', u)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-[8px] text-[9px] font-bold uppercase tracking-wider transition-colors group"
                                            title="Tapicerka"
                                        >
                                            <div className="flex items-center gap-1 opacity-50 border-r border-gray-200 pr-1.5 mr-0.5">
                                                <svg
                                                    width="12"
                                                    height="12"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="w-3 h-3"
                                                >
                                                    {/* Car Seat Front View */}
                                                    <path d="M8 2h8a2 2 0 0 1 2 2v3h-12v-3a2 2 0 0 1 2-2z" />
                                                    <path d="M5 9h14a2 2 0 0 1 2 2v7a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3v-7a2 2 0 0 1 2-2z" />
                                                </svg>
                                            </div>
                                            <div className="w-2.5 h-2.5 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: getColor(u) }} />
                                            {u}
                                            <X className="w-3 h-3 text-gray-300 group-hover:text-gray-900" />
                                        </button>
                                    ))}

                                    {/* Fuel */}
                                    {activeFuel.map(f => (
                                        <button
                                            key={`f-${f}`}
                                            onClick={() => toggleFilter('fuel', f)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-[8px] text-[9px] font-bold uppercase tracking-wider transition-colors group"
                                        >
                                            {f}
                                            <X className="w-3 h-3 text-gray-300 group-hover:text-gray-900" />
                                        </button>
                                    ))}

                                    {/* Drivetrain */}
                                    {activeDrivetrain.map(d => (
                                        <button
                                            key={`d-${d}`}
                                            onClick={() => toggleFilter('drivetrain', d)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-[8px] text-[9px] font-bold uppercase tracking-wider transition-colors group"
                                        >
                                            {d}
                                            <X className="w-3 h-3 text-gray-300 group-hover:text-gray-900" />
                                        </button>
                                    ))}

                                    {/* Price Range (Min/Max) */}
                                    {(activeMin > safeMinPrice || activeMax < safeMaxPrice) && (
                                        <button
                                            onClick={() => {
                                                const params = new URLSearchParams(searchParams.toString());
                                                params.delete('min');
                                                params.delete('max');
                                                router.replace(`${pathname}?${params.toString()}`, { scroll: false });
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-[8px] text-[9px] font-bold uppercase tracking-wider transition-colors group"
                                        >
                                            Cena
                                            <X className="w-3 h-3 text-gray-300 group-hover:text-gray-900" />
                                        </button>
                                    )}

                                    {/* Power Range (Min/Max) */}
                                    {(pmin > 120 || pmax < safeMaxPower) && (
                                        <button
                                            onClick={() => {
                                                const params = new URLSearchParams(searchParams.toString());
                                                params.delete('pmin');
                                                params.delete('pmax');
                                                router.replace(`${pathname}?${params.toString()}`, { scroll: false });
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-[8px] text-[9px] font-bold uppercase tracking-wider transition-colors group"
                                        >
                                            Moc
                                            <X className="w-3 h-3 text-gray-300 group-hover:text-gray-900" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Filter Controls Header - Configuration Text */}
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">Pojazd & Opcje</span>
                        </div>

                        <div className="space-y-4">
                            {/* Text Search (Desktop only) */}
                            <div className="hidden lg:block relative mb-6">
                                <input
                                    type="text"
                                    placeholder="Szukaj modelu, kodów, opcji..."
                                    className="w-full px-0 py-3 bg-transparent border-b border-gray-200 focus:outline-none focus:border-black transition-colors text-[11px] font-semibold text-gray-900 tracking-wider placeholder:text-gray-300 placeholder:font-normal"
                                    value={search}
                                    onChange={(e) => {
                                        isTypingRef.current = true;
                                        setSearch(e.target.value);
                                    }}
                                />
                            </div>

                            <div className="space-y-1">
                                {/* Series Filter */}
                                <Section id="series" title="Seria" expanded={expandedSections.series} onToggle={toggleSection}>
                                    <div className="grid grid-cols-2 gap-2">
                                        {options.series.map(s => (
                                            <FilterPill
                                                key={s}
                                                label={s}
                                                active={activeSeries.includes(s)}
                                                onClick={() => toggleFilter('series', s)}
                                                isMSeries={s.includes('Seria M')}
                                            />
                                        ))}
                                    </div>
                                </Section>

                                {/* Body Type Filter - PILLS */}
                                <Section id="body" title="Nadwozie" expanded={expandedSections.body} onToggle={toggleSection}>
                                    <div className="grid grid-cols-2 gap-2">
                                        {options.bodyTypes.map(b => (
                                            <FilterPill
                                                key={b}
                                                label={b}
                                                active={activeBody.includes(b)}
                                                onClick={() => toggleFilter('body', b)}
                                            />
                                        ))}
                                    </div>
                                </Section>

                                {/* Color Group Filter - VISUAL */}
                                {options.colorGroups && options.colorGroups.length > 0 && (
                                    <Section id="colorGroup" title="Kolor" expanded={expandedSections.colorGroup} onToggle={toggleSection}>
                                        <div className="grid grid-cols-4 gap-3 px-1 py-1">
                                            {options.colorGroups.map(c => (
                                                <div key={c} className="flex flex-col items-center gap-1.5">
                                                    <button
                                                        onClick={() => toggleFilter('colorGroup', c)}
                                                        className={cn(
                                                            "w-8 h-8 rounded-full shadow-sm border transaction-all duration-200 relative",
                                                            activeColorGroup.includes(c) ? "ring-2 ring-blue-600 ring-offset-2 border-transparent" : "border-gray-200 hover:border-gray-400"
                                                        )}
                                                        style={{ backgroundColor: getColor(c) }}
                                                        title={c}
                                                    >
                                                        {/* Checkmark for active state */}
                                                        {activeColorGroup.includes(c) && (
                                                            <span className="absolute inset-0 flex items-center justify-center text-white drop-shadow-md">
                                                                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                                            </span>
                                                        )}
                                                    </button>
                                                    <span className="text-[9px] uppercase tracking-wider text-gray-500 text-center leading-tight truncate w-full">{c}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </Section>
                                )}

                                {/* Upholstery Group Filter - VISUAL/PILLS */}
                                {options.upholsteryGroups && options.upholsteryGroups.length > 0 && (
                                    <Section id="upholsteryGroup" title="Tapicerka" expanded={expandedSections.upholsteryGroup} onToggle={toggleSection}>
                                        <div className="grid grid-cols-4 gap-3 px-1 py-1">
                                            {options.upholsteryGroups.map(c => (
                                                <div key={c} className="flex flex-col items-center gap-1.5">
                                                    <button
                                                        onClick={() => toggleFilter('upholsteryGroup', c)}
                                                        className={cn(
                                                            "w-8 h-8 rounded-full shadow-sm border transaction-all duration-200 relative",
                                                            activeUpholsteryGroup.includes(c) ? "ring-2 ring-blue-600 ring-offset-2 border-transparent" : "border-gray-200 hover:border-gray-400"
                                                        )}
                                                        style={{ backgroundColor: getColor(c) }}
                                                        title={c}
                                                    >
                                                        {/* Checkmark for active state */}
                                                        {activeUpholsteryGroup.includes(c) && (
                                                            <span className="absolute inset-0 flex items-center justify-center text-white drop-shadow-md">
                                                                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                                            </span>
                                                        )}
                                                    </button>
                                                    <span className="text-[9px] uppercase tracking-wider text-gray-500 text-center leading-tight truncate w-full">{c}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </Section>
                                )}

                                {/* Fuel Type Filter - PILLS */}
                                <Section id="fuel" title="Paliwo" expanded={expandedSections.fuel} onToggle={toggleSection}>
                                    <div className="grid grid-cols-2 gap-2">
                                        {options.fuelTypes.map(f => (
                                            <FilterPill
                                                key={f}
                                                label={f}
                                                active={activeFuel.includes(f)}
                                                onClick={() => toggleFilter('fuel', f)}
                                            />
                                        ))}
                                    </div>
                                </Section>

                                {/* Drivetrain Filter - PILLS */}
                                <Section id="drivetrain" title="Napęd" expanded={expandedSections.drivetrain} onToggle={toggleSection}>
                                    <div className="grid grid-cols-2 gap-2">
                                        {options.drivetrains.map(d => (
                                            <FilterPill
                                                key={d}
                                                label={d}
                                                active={activeDrivetrain.includes(d)}
                                                onClick={() => toggleFilter('drivetrain', d)}
                                            />
                                        ))}
                                    </div>
                                </Section>

                                {/* Power Filter */}
                                <Section id="power" title="Moc" expanded={expandedSections.power} onToggle={toggleSection}>
                                    <div className="space-y-6 px-1 pt-2">
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-900 font-mono">
                                            <span>{pmin} KM</span>
                                            <span>{pmax} KM</span>
                                        </div>

                                        <div className="px-1">
                                            <Slider
                                                defaultValue={[120, safeMaxPower]}
                                                value={[pmin, pmax]}
                                                min={120}
                                                max={safeMaxPower}
                                                step={10}
                                                minStepsBetweenThumbs={1}
                                                onValueChange={([min, max]) => {
                                                    isTypingRef.current = true;
                                                    setPmin(min);
                                                    setPmax(max);
                                                }}
                                            />
                                        </div>
                                    </div>
                                </Section>

                                {/* Price Range Slider */}
                                <Section id="price" title="Cena Max" expanded={expandedSections.price} onToggle={toggleSection}>
                                    <div className="space-y-6 px-1 pt-2">
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-900 font-mono">
                                            <span>{formatPrice(activeMin)}</span>
                                            <span>{formatPrice(activeMax)}</span>
                                        </div>

                                        <div className="px-1">
                                            <Slider
                                                defaultValue={[sliderMax]}
                                                value={[sliderMax]}
                                                min={sliderMin}
                                                max={safeMaxPrice}
                                                step={5000}
                                                onValueChange={([val]) => {
                                                    isTypingRef.current = true;
                                                    setSliderMax(val);
                                                }}
                                            />
                                        </div>
                                    </div>
                                </Section>
                            </div>
                        </div>
                    </div>
                </div>{/* end scrollable content area */}

                {/* Apply Button (Mobile) — sticky at bottom */}
                <div className="lg:hidden shrink-0 px-6 py-4 border-t border-gray-100 bg-white z-[600]">
                    {activeMobileCategory ? (
                        <button
                            onClick={() => setActiveMobileCategory(null)}
                            className="w-full bg-blue-600 text-white py-4 rounded-xl uppercase text-[11px] font-black tracking-[0.2em] shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            Zastosuj i wróć
                        </button>
                    ) : (
                        <button
                            onClick={onClose}
                            className="w-full bg-black text-white py-4 rounded-xl uppercase text-[11px] font-black tracking-[0.2em] shadow-lg active:scale-[0.98] transition-all"
                        >
                            Pokaż wyniki {resultsCount !== undefined && `(${resultsCount})`}
                        </button>
                    )}
                </div>
            </aside>
        </>
    );

    if (typeof document !== 'undefined' && isOpen && window.innerWidth < 1024) {
        return createPortal(content, document.body);
    }

    return content;
}
