'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Slider } from '@/components/ui/slider';

interface FilterSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    options: {
        series: string[];
        bodyTypes: string[];
        fuelTypes: string[];
        drivetrains: string[];
        powerLevels: string[];
        minPrice: number;
        maxPrice: number;
        minPower: number;
        maxPower: number;
    };
}

const Section = ({ id, title, children, expanded, onToggle }: { id: string, title: string, children: React.ReactNode, expanded: boolean, onToggle: (id: string) => void }) => (
    <div className="border-b border-gray-100 py-6">
        <button
            onClick={() => onToggle(id)}
            className="flex w-full items-center justify-between text-left group"
        >
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-900 group-hover:text-blue-600 transition-colors">
                {title}
            </span>
            {expanded ? (
                <ChevronUp className="w-3 h-3 text-gray-400" />
            ) : (
                <ChevronDown className="w-3 h-3 text-gray-400" />
            )}
        </button>

        <div className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            expanded ? "max-h-[800px] opacity-100 mt-6" : "max-h-0 opacity-0"
        )}>
            {children}
        </div>
    </div>
);

export function FilterSidebar({ isOpen, onClose, options }: FilterSidebarProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const isTypingRef = useRef(false);

    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        series: true,
        body: true,
        fuel: true,
        drivetrain: true,
        power: false,
        price: true
    });

    const toggleSection = (id: string) => {
        setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

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

    const activeSeries = searchParams.getAll('series');
    const activeBody = searchParams.getAll('body');
    const activeFuel = searchParams.getAll('fuel');
    const activeDrivetrain = searchParams.getAll('drivetrain');
    const [sliderMax, setSliderMax] = useState(parseInt(searchParams.get('max') || options.maxPrice.toString()));
    const [search, setSearch] = useState(searchParams.get('q') || '');

    // Power range state
    const [pmin, setPmin] = useState(parseInt(searchParams.get('pmin') || '120'));
    const [pmax, setPmax] = useState(parseInt(searchParams.get('pmax') || options.maxPower.toString()));

    // Synchronize local states with URL (only when not actively typing)
    useEffect(() => {
        if (!isTypingRef.current) {
            setSearch(searchParams.get('q') || '');
        }
    }, [searchParams]);

    useEffect(() => {
        setSliderMax(parseInt(searchParams.get('max') || options.maxPrice.toString()));
    }, [searchParams, options.maxPrice]);

    useEffect(() => {
        const urlMin = parseInt(searchParams.get('pmin') || '120');
        const urlMax = parseInt(searchParams.get('pmax') || options.maxPower.toString());
        if (pmin !== urlMin) setPmin(urlMin);
        if (pmax !== urlMax) setPmax(urlMax);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, options.maxPower]);

    // Debounced URL updates for Sliders and Search
    useEffect(() => {
        isTypingRef.current = true;
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());

            // Search
            if (search) params.set('q', search);
            else params.delete('q');

            // Price
            if (sliderMax < options.maxPrice) params.set('max', sliderMax.toString());
            else params.delete('max');

            // Power
            if (pmin > 120) params.set('pmin', pmin.toString());
            else params.delete('pmin');

            if (pmax < options.maxPower) params.set('pmax', pmax.toString());
            else params.delete('pmax');

            if (params.toString() !== searchParams.toString()) {
                router.replace(`${pathname}?${params.toString()}`, { scroll: false });
            }
            isTypingRef.current = false;
        }, 300);
        return () => clearTimeout(timer);
    }, [search, sliderMax, pmin, pmax, options.maxPrice, options.maxPower, pathname, router, searchParams]);

    const activeMax = sliderMax;
    const sliderMin = Math.max(100000, options.minPrice);
    const activeMin = parseInt(searchParams.get('min') || options.minPrice.toString());

    const hasActiveFilters = activeSeries.length > 0 ||
        activeBody.length > 0 ||
        activeFuel.length > 0 ||
        activeDrivetrain.length > 0 ||
        searchParams.has('q') ||
        searchParams.has('min') ||
        searchParams.has('max') ||
        searchParams.has('pmin') ||
        searchParams.has('pmax');

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Content */}
            <aside className={cn(
                "fixed lg:sticky top-0 lg:top-24 left-0 h-full lg:h-[calc(100vh-8rem)] w-[320px] bg-white lg:bg-transparent z-50 lg:z-0 hidden lg:block overflow-y-auto px-8 py-8 border-r border-gray-100 lg:border-none shadow-2xl lg:shadow-none transition-transform duration-500 ease-porsche",
                isOpen ? "translate-x-0 !block" : "-translate-x-full lg:translate-x-0"
            )}>
                <div className="flex items-center justify-between lg:hidden mb-10">
                    <h2 className="text-sm font-bold uppercase tracking-widest">Filtry</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Filter Controls Header */}
                <div className="flex items-center justify-between mb-8">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Konfiguracja</span>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors"
                        >
                            <RotateCcw className="w-3 h-3" />
                            Wyczyść
                        </button>
                    )}
                </div>

                <div className="space-y-6">
                    {/* Text Search */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Szukaj modelu lub VIN..."
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-sm focus:outline-none focus:border-black transition-colors text-xs font-medium placeholder:text-gray-400 placeholder:uppercase placeholder:tracking-widest"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1">
                        {/* Series Filter */}
                        <Section id="series" title="Seria Modelowa" expanded={expandedSections.series} onToggle={toggleSection}>
                            <div className="grid grid-cols-1 gap-3">
                                {options.series.map(s => (
                                    <label key={s} className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={activeSeries.includes(s)}
                                            onChange={() => toggleFilter('series', s)}
                                            className="w-4 h-4 rounded-sm border-gray-300 text-black focus:ring-black cursor-pointer"
                                        />
                                        <span className={cn(
                                            "text-xs uppercase tracking-wider transition-colors",
                                            activeSeries.includes(s) ? "text-black font-bold" : "text-gray-500 group-hover:text-black"
                                        )}>{s}</span>
                                    </label>
                                ))}
                            </div>
                        </Section>

                        {/* Body Type Filter */}
                        <Section id="body" title="Typ Nadwozia" expanded={expandedSections.body} onToggle={toggleSection}>
                            <div className="grid grid-cols-1 gap-3">
                                {options.bodyTypes.map(b => (
                                    <label key={b} className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={activeBody.includes(b)}
                                            onChange={() => toggleFilter('body', b)}
                                            className="w-4 h-4 rounded-sm border-gray-300 text-black focus:ring-black cursor-pointer"
                                        />
                                        <span className={cn(
                                            "text-xs uppercase tracking-wider transition-colors",
                                            activeBody.includes(b) ? "text-black font-bold" : "text-gray-500 group-hover:text-black"
                                        )}>{b}</span>
                                    </label>
                                ))}
                            </div>
                        </Section>

                        {/* Fuel Type Filter */}
                        <Section id="fuel" title="Rodzaj Paliwa" expanded={expandedSections.fuel} onToggle={toggleSection}>
                            <div className="grid grid-cols-1 gap-3">
                                {options.fuelTypes.map(f => (
                                    <label key={f} className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={activeFuel.includes(f)}
                                            onChange={() => toggleFilter('fuel', f)}
                                            className="w-4 h-4 rounded-sm border-gray-300 text-black focus:ring-black cursor-pointer"
                                        />
                                        <span className={cn(
                                            "text-xs uppercase tracking-wider transition-colors",
                                            activeFuel.includes(f) ? "text-black font-bold" : "text-gray-500 group-hover:text-black"
                                        )}>{f}</span>
                                    </label>
                                ))}
                            </div>
                        </Section>

                        {/* Drivetrain Filter */}
                        <Section id="drivetrain" title="Napęd" expanded={expandedSections.drivetrain} onToggle={toggleSection}>
                            <div className="grid grid-cols-1 gap-3">
                                {options.drivetrains.map(d => (
                                    <label key={d} className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={activeDrivetrain.includes(d)}
                                            onChange={() => toggleFilter('drivetrain', d)}
                                            className="w-4 h-4 rounded-sm border-gray-300 text-black focus:ring-black cursor-pointer"
                                        />
                                        <span className={cn(
                                            "text-xs uppercase tracking-wider transition-colors",
                                            activeDrivetrain.includes(d) ? "text-black font-bold" : "text-gray-500 group-hover:text-black"
                                        )}>{d}</span>
                                    </label>
                                ))}
                            </div>
                        </Section>

                        {/* Power Filter */}
                        <Section id="power" title="Moc [KM]" expanded={expandedSections.power} onToggle={toggleSection}>
                            <div className="space-y-6 px-1">
                                <div className="flex justify-between text-[11px] font-bold text-gray-900 tracking-tight">
                                    <span>{pmin} KM</span>
                                    <span>{pmax} KM</span>
                                </div>

                                <div className="mt-4 px-1">
                                    <Slider
                                        defaultValue={[120, options.maxPower]}
                                        value={[pmin, pmax]}
                                        min={120}
                                        max={options.maxPower}
                                        step={10}
                                        minStepsBetweenThumbs={1}
                                        onValueChange={([min, max]) => {
                                            setPmin(min);
                                            setPmax(max);
                                        }}
                                    />
                                </div>
                                <p className="text-[9px] text-gray-400 uppercase font-medium mt-4">Zakres: 120 KM - {options.maxPower} KM (Skok 10)</p>
                            </div>
                        </Section>

                        {/* Price Range Slider */}
                        <Section id="price" title="Cena" expanded={expandedSections.price} onToggle={toggleSection}>
                            <div className="space-y-6 px-1">
                                <div className="flex justify-between text-[11px] font-bold text-gray-900 tracking-tight">
                                    <span>{formatPrice(activeMin)}</span>
                                    <span>{formatPrice(activeMax)}</span>
                                </div>

                                <div className="mt-4 px-1">
                                    <Slider
                                        defaultValue={[sliderMax]}
                                        value={[sliderMax]}
                                        min={sliderMin}
                                        max={options.maxPrice}
                                        step={5000}
                                        onValueChange={([val]) => setSliderMax(val)}
                                    />
                                </div>
                                <p className="text-[9px] text-gray-400 uppercase font-medium mt-4">Przesuń, aby ustawić budżet maksymalny</p>
                            </div>
                        </Section>
                    </div>
                </div>

                {/* Apply Button (Mobile only) */}
                <div className="mt-12 lg:hidden">
                    <button
                        onClick={onClose}
                        className="w-full bg-black text-white py-4 uppercase text-xs font-bold tracking-[0.2em] shadow-xl hover:bg-gray-900 active:scale-[0.98] transition-all"
                    >
                        Pokaż Wyniki
                    </button>
                </div>
            </aside>
        </>
    );
}
