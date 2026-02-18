'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, X, RotateCcw, SprayCan } from 'lucide-react';
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
        colorGroups?: string[];
        upholsteryGroups?: string[];
        minPrice: number;
        maxPrice: number;
        minPower: number;
        maxPower: number;
    };
}

const COLOR_MAP: Record<string, string> = {
    // Polish
    'Czarny': '#000000',
    'Biały': '#ffffff',
    'Szary': '#9ca3af', // Gray-400
    'Grafitowy': '#374151', // Gray-700
    'Srebrny': '#e5e7eb', // Gray-200 (Silver)
    'Niebieski': '#2563eb', // Blue-600
    'Błękitny': '#93c5fd', // Blue-300
    'Granatowy': '#1e3a8a', // Blue-900
    'Turkusowy': '#2dd4bf', // Teal-400
    'Czerwony': '#dc2626', // Red-600
    'Bordowy': '#7f1d1d', // Red-900
    'Brązowy': '#78350f', // Amber-900
    'Beżowy': '#f5f5dc', // Beige
    'Kremowy': '#fef3c7', // Amber-100
    'Zielony': '#15803d', // Green-700
    'Oliwkowy': '#3f6212', // Lime-800
    'Pomarańczowy': '#ea580c', // Orange-600
    'Żółty': '#eab308', // Yellow-500
    'Złoty': '#ca8a04', // Yellow-600
    'Miedziany': '#b45309', // Amber-700
    'Fioletowy': '#7e22ce', // Purple-700
    'Różowy': '#db2777', // Pink-600

    // English (just in case)
    'Black': '#000000',
    'White': '#ffffff',
    'Gray': '#9ca3af',
    'Grey': '#9ca3af',
    'Silver': '#e5e7eb',
    'Blue': '#2563eb',
    'Red': '#dc2626',
    'Brown': '#78350f',
    'Beige': '#f5f5dc',
    'Green': '#15803d',
    'Orange': '#ea580c',
    'Yellow': '#eab308',
    'Gold': '#ca8a04',
    'Purple': '#7e22ce',
};

// Helper to safely get color (case-insensitive)
const getColor = (name: string) => {
    if (!name) return '#e5e7eb';
    const trimmed = name.trim();
    // Try exact match
    if (COLOR_MAP[trimmed]) return COLOR_MAP[trimmed];
    // Try capitalized
    const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    if (COLOR_MAP[capitalized]) return COLOR_MAP[capitalized];

    // Fallback based on substring
    const lower = trimmed.toLowerCase();
    if (lower.includes('czarn')) return COLOR_MAP['Czarny'];
    if (lower.includes('biał')) return COLOR_MAP['Biały'];
    if (lower.includes('szar')) return COLOR_MAP['Szary'];
    if (lower.includes('srebr')) return COLOR_MAP['Srebrny'];
    if (lower.includes('niebies')) return COLOR_MAP['Niebieski'];
    if (lower.includes('czerwo')) return COLOR_MAP['Czerwony'];
    if (lower.includes('brąz')) return COLOR_MAP['Brązowy'];
    if (lower.includes('beż')) return COLOR_MAP['Beżowy'];
    if (lower.includes('ziel')) return COLOR_MAP['Zielony'];

    return '#e5e7eb'; // Default gray
};



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
        colorGroup: false,
        upholsteryGroup: false,
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
        isTypingRef.current = true;
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

                {/* Active Filters & Reset */}
                {hasActiveFilters && (
                    <div className="mb-8 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Aktywne filtry</span>
                            <button
                                onClick={clearFilters}
                                className="text-[10px] font-bold uppercase tracking-widest text-red-600 hover:text-red-800 flex items-center gap-1.5 transition-colors"
                            >
                                <RotateCcw className="w-3 h-3" />
                                Reset
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {/* Series */}
                            {activeSeries.map(s => (
                                <button
                                    key={`s-${s}`}
                                    onClick={() => toggleFilter('series', s)}
                                    className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors group"
                                >
                                    {s}
                                    <X className="w-3 h-3 text-gray-400 group-hover:text-gray-900" />
                                </button>
                            ))}

                            {/* Body */}
                            {activeBody.map(b => (
                                <button
                                    key={`b-${b}`}
                                    onClick={() => toggleFilter('body', b)}
                                    className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors group"
                                >
                                    {b}
                                    <X className="w-3 h-3 text-gray-400 group-hover:text-gray-900" />
                                </button>
                            ))}

                            {/* Color */}
                            {activeColorGroup.map(c => (
                                <button
                                    key={`c-${c}`}
                                    onClick={() => toggleFilter('colorGroup', c)}
                                    className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors group"
                                    title="Kolor nadwozia"
                                >
                                    <div className="flex items-center gap-1 opacity-50 border-r border-gray-300 pr-1.5 mr-0.5">
                                        <SprayCan className="w-3 h-3" />
                                    </div>
                                    <div className="w-2 h-2 rounded-full border border-gray-300" style={{ backgroundColor: getColor(c) }} />
                                    {c}
                                    <X className="w-3 h-3 text-gray-400 group-hover:text-gray-900" />
                                </button>
                            ))}

                            {/* Upholstery */}
                            {activeUpholsteryGroup.map(u => (
                                <button
                                    key={`u-${u}`}
                                    onClick={() => toggleFilter('upholsteryGroup', u)}
                                    className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors group"
                                    title="Tapicerka"
                                >
                                    <div className="flex items-center gap-1 opacity-50 border-r border-gray-300 pr-1.5 mr-0.5">
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
                                    <div className="w-2 h-2 rounded-full border border-gray-300" style={{ backgroundColor: getColor(u) }} />
                                    {u}
                                    <X className="w-3 h-3 text-gray-400 group-hover:text-gray-900" />
                                </button>
                            ))}

                            {/* Fuel */}
                            {activeFuel.map(f => (
                                <button
                                    key={`f-${f}`}
                                    onClick={() => toggleFilter('fuel', f)}
                                    className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors group"
                                >
                                    {f}
                                    <X className="w-3 h-3 text-gray-400 group-hover:text-gray-900" />
                                </button>
                            ))}

                            {/* Drivetrain */}
                            {activeDrivetrain.map(d => (
                                <button
                                    key={`d-${d}`}
                                    onClick={() => toggleFilter('drivetrain', d)}
                                    className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors group"
                                >
                                    {d}
                                    <X className="w-3 h-3 text-gray-400 group-hover:text-gray-900" />
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
                                    className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors group"
                                >
                                    Cena
                                    <X className="w-3 h-3 text-gray-400 group-hover:text-gray-900" />
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
                                    className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors group"
                                >
                                    Moc
                                    <X className="w-3 h-3 text-gray-400 group-hover:text-gray-900" />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Filter Controls Header - Configuration Text */}
                {!hasActiveFilters && (
                    <div className="flex items-center justify-between mb-8">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Konfiguracja</span>
                    </div>
                )}

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
                            <div className="grid grid-cols-2 gap-2">
                                {options.series.map(s => (
                                    <FilterPill
                                        key={s}
                                        label={s}
                                        active={activeSeries.includes(s)}
                                        onClick={() => toggleFilter('series', s)}
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
