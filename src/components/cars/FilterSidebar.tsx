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
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-900 group-hover:text-blue-600 transition-colors">
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

const FilterPill = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={cn(
            "px-3 py-2 text-[10px] font-bold uppercase tracking-widest border transition-all duration-200 text-center",
            active
                ? "bg-black text-white border-black"
                : "bg-transparent text-gray-500 border-gray-200 hover:border-gray-900 hover:text-gray-900"
        )}
    >
        {label}
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

export function FilterSidebar({ isOpen, onClose, options }: FilterSidebarProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const isTypingRef = useRef(false);

    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        series: false,
        body: false,
        fuel: false,
        drivetrain: false,
        power: false,
        price: false
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
                "fixed lg:sticky top-0 lg:top-24 left-0 h-full lg:h-[calc(100vh-8rem)] w-[320px] bg-white lg:bg-transparent z-50 lg:z-0 hidden lg:block overflow-y-auto px-6 py-8 border-r border-gray-100 lg:border-none shadow-2xl lg:shadow-none transition-transform duration-500 ease-porsche scrollbar-hide",
                isOpen ? "translate-x-0 !block" : "-translate-x-full lg:translate-x-0"
            )}>
                <div className="flex items-center justify-between lg:hidden mb-10">
                    <h2 className="text-xs font-bold uppercase tracking-widest">Filtry</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Filter Controls Header */}
                <div className="flex items-center justify-between mb-8">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Konfiguracja</span>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors"
                        >
                            <RotateCcw className="w-3 h-3" />
                            Reset
                        </button>
                    )}
                </div>

                <div className="space-y-2">
                    {/* Text Search */}
                    <div className="relative mb-6">
                        <input
                            type="text"
                            placeholder="SZUKAJ..."
                            className="w-full px-0 py-2 bg-transparent border-b border-gray-200 focus:outline-none focus:border-black transition-colors text-xs font-bold uppercase tracking-widest placeholder:text-gray-300"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1">
                        {/* Series Filter */}
                        <Section id="series" title="Seria" expanded={expandedSections.series} onToggle={toggleSection}>
                            <div className="grid grid-cols-1 gap-1">
                                {options.series.map(s => (
                                    <FilterCheckbox
                                        key={s}
                                        label={s}
                                        checked={activeSeries.includes(s)}
                                        onChange={() => toggleFilter('series', s)}
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
                                        max={options.maxPrice}
                                        step={5000}
                                        onValueChange={([val]) => setSliderMax(val)}
                                    />
                                </div>
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
