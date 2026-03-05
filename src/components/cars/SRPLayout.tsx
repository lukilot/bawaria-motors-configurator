'use client';

import { useState, Suspense, useMemo, useEffect, useRef } from 'react';
import { StockCar } from '@/types/stock';
import { FilterSidebar } from '@/components/cars/FilterSidebar';
import { CarGrid } from '@/components/cars/CarGrid';
import { useSearchParams, usePathname } from 'next/navigation';
import { SlidersHorizontal, Warehouse } from 'lucide-react';
import { useGarageStore } from '@/store/garageStore';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const SEARCH_ALIASES: Record<string, string[]> = {
    'hak': ['towing', 'holowniczy', 'trailer'],
    'laser': ['laserowe', 'laserlight'],
    'skora': ['vernasca', 'merino', 'sensafin', 'sensatec', 'skórzana', 'skorzana'],
    'panorama': ['szklany', 'panoramiczny', 'szyberdach'],
    'kamera': ['kamery', 'surround', 'parking', 'cofania'],
    'harman': ['kardon', 'audio', 'nagłośnienie', 'naglosnienie'],
    'bowers': ['wilkins', 'audio', 'nagłośnienie', 'naglosnienie'],
    'tempomat': ['driving assistant', 'aktywny'],
    'pneumatyka': ['pneumatyczne'],
    'm pakiet': ['sportowy', 'aerodynamiczny', 'msport']
};

interface SRPLayoutProps {
    cars: StockCar[];
    dictionaries: {
        model: Record<string, Record<string, unknown>>;
        color: Record<string, Record<string, unknown>>;
        upholstery: Record<string, Record<string, unknown>>;
        option: Record<string, Record<string, unknown>>;
        drivetrain: Record<string, Record<string, unknown>>;
    };
    bulletinPrices?: Record<string, number>;
}

const SESSION_KEY_SORT = 'bawaria_sort';
const SESSION_KEY_LAYOUT = 'bawaria_layout';
const SESSION_KEY_COUNT = 'bawaria_display_count';
const SESSION_KEY_SCROLL = 'bawaria_scroll_pos';
const SESSION_KEY_SRP = 'bawaria_last_srp';

function readSession<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
        const v = sessionStorage.getItem(key);
        return v !== null ? JSON.parse(v) as T : fallback;
    } catch { return fallback; }
}

export function SRPLayout({ cars, dictionaries, bulletinPrices }: SRPLayoutProps) {
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const searchParams = useSearchParams();

    // ── Persistent state ─────────────────────────────────────────────────────
    const [sortOrder, setSortOrder] = useState<'newest' | 'price_asc' | 'price_desc'>(
        () => readSession(SESSION_KEY_SORT, 'newest')
    );
    const [layout, setLayout] = useState<'grid' | 'list'>(
        () => readSession(SESSION_KEY_LAYOUT, 'list')
    );
    const [displayCount, setDisplayCount] = useState<number>(
        () => readSession(SESSION_KEY_COUNT, 12)
    );

    // Persist sort/layout/count on change
    useEffect(() => { sessionStorage.setItem(SESSION_KEY_SORT, JSON.stringify(sortOrder)); }, [sortOrder]);
    useEffect(() => { sessionStorage.setItem(SESSION_KEY_LAYOUT, JSON.stringify(layout)); }, [layout]);
    useEffect(() => { sessionStorage.setItem(SESSION_KEY_COUNT, JSON.stringify(displayCount)); }, [displayCount]);

    // ── SRP URL tracking ──────────────────────────────────────────────────────
    const pathname = usePathname();
    useEffect(() => {
        const qs = searchParams.toString();
        const url = pathname + (qs ? `?${qs}` : '');
        sessionStorage.setItem(SESSION_KEY_SRP, url);
    }, [pathname, searchParams]);

    // ── Scroll save ───────────────────────────────────────────────────────────
    useEffect(() => {
        let tid: ReturnType<typeof setTimeout>;
        const handleScroll = () => {
            clearTimeout(tid);
            tid = setTimeout(() => {
                sessionStorage.setItem(SESSION_KEY_SCROLL, window.scrollY.toString());
            }, 80);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(tid);
        };
    }, []);

    // ── Scroll restore ────────────────────────────────────────────────────────
    // We must wait until displayCount items are actually painted in the DOM.
    // Use a ref on the grid container and a ResizeObserver to detect when
    // the height stabilises, then fire the scroll.
    const gridRef = useRef<HTMLDivElement>(null);
    const scrollRestored = useRef(false);

    useEffect(() => {
        // Only restore once per page visit
        scrollRestored.current = false;
    }, []); // reset when component mounts (new visit to SRP)

    useEffect(() => {
        if (scrollRestored.current) return;

        const savedScroll = parseInt(sessionStorage.getItem(SESSION_KEY_SCROLL) || '0', 10);
        if (!savedScroll || savedScroll < 50) {
            scrollRestored.current = true;
            return;
        }

        const el = gridRef.current;
        if (!el) return;

        // Use ResizeObserver — fires every time the grid grows.
        // Once the content is tall enough to accommodate savedScroll, restore.
        const ro = new ResizeObserver(() => {
            const totalHeight = document.documentElement.scrollHeight;
            if (totalHeight >= savedScroll + window.innerHeight) {
                ro.disconnect();
                if (!scrollRestored.current) {
                    scrollRestored.current = true;
                    window.scrollTo({ top: savedScroll, behavior: 'instant' });
                }
            }
        });
        ro.observe(el);

        // Safety timeout — restore after 2s regardless
        const fallback = setTimeout(() => {
            if (!scrollRestored.current) {
                scrollRestored.current = true;
                window.scrollTo({ top: savedScroll, behavior: 'instant' });
            }
            ro.disconnect();
        }, 2000);

        return () => { ro.disconnect(); clearTimeout(fallback); };
    }, [displayCount]); // re-run if displayCount changes (in case it was restored from session)

    // 0. Enrich cars with dictionary data
    const enrichedCars = useMemo(() => {
        return cars.map(car => {
            const modelDict = dictionaries.model[car.model_code];
            if (!modelDict) return car;

            const rawFuel = (modelDict.fuel as string) || car.fuel_type || '';
            const rawDrive = (modelDict.drivetrain as string) || car.drivetrain || '';

            let fuel = rawFuel;
            if (['Gasoline', 'Benzyna'].includes(rawFuel)) fuel = 'Benzyna';
            if (['Diesel'].includes(rawFuel)) fuel = 'Diesel';
            if (['Electric', 'BEV', 'Elektryczny'].includes(rawFuel)) fuel = 'Elektryczny';
            if (['Hybrid', 'PHEV', 'Plug-In Hybrid'].includes(rawFuel)) fuel = 'Plug-In Hybrid';

            let drive = rawDrive;
            if (['xDrive', 'AWD', 'XDRIVE'].includes(rawDrive)) drive = 'xDrive';
            if (['FWD', 'Na przód'].includes(rawDrive)) drive = 'Na przód';
            if (['RWD', 'Na tył'].includes(rawDrive)) drive = 'Na tył';

            return {
                ...car,
                model_name: (modelDict.name as string) || car.model_name,
                series: (modelDict.series as string) || car.series,
                body_type: (modelDict.body_type as string) || car.body_type,
                power: (modelDict.power as string) || car.power,
                fuel_type: fuel,
                drivetrain: drive,
                acceleration: modelDict.acceleration as string,
                max_speed: modelDict.max_speed as string,
                trunk_capacity: modelDict.trunk_capacity as string,
                color_group: (dictionaries.color[car.color_code] as any)?.group,
                upholstery_group: (dictionaries.upholstery[car.upholstery_code] as any)?.group,
                special_price: bulletinPrices?.[car.vin] || car.special_price
            };
        });
    }, [cars, dictionaries.model, dictionaries.color, dictionaries.upholstery, bulletinPrices]);

    const sortSeries = (a: string, b: string) => {
        const matchA = a.match(/\d+/);
        const matchB = b.match(/\d+/);
        const numA = matchA ? parseInt(matchA[0], 10) : 999;
        const numB = matchB ? parseInt(matchB[0], 10) : 999;
        if (numA !== numB) return numA - numB;
        return a.localeCompare(b);
    };

    const filterOptions = useMemo(() => {
        const series = new Set<string>();
        const bodyTypes = new Set<string>();
        const powerLevels = new Set<string>();
        const fuelTypes = new Set<string>();
        const drivetrains = new Set<string>();
        const colorGroups = new Set<string>();
        const upholsteryGroups = new Set<string>();
        let minPrice = Infinity;
        let maxPrice = 0;

        enrichedCars.forEach(car => {
            if (car.series) series.add(car.series as string);
            if (car.body_type) bodyTypes.add(car.body_type as string);
            if (car.power) powerLevels.add(car.power as string);
            if (car.fuel_type) fuelTypes.add(car.fuel_type as string);
            if (car.drivetrain) drivetrains.add(car.drivetrain as string);
            if ((car as any).color_group) colorGroups.add((car as any).color_group as string);
            if ((car as any).upholstery_group) upholsteryGroups.add((car as any).upholstery_group as string);

            const price = car.special_price || car.list_price;
            if (price < minPrice) minPrice = price;
            if (price > maxPrice) maxPrice = price;
        });

        return {
            series: Array.from(series).sort(sortSeries),
            bodyTypes: Array.from(bodyTypes).sort(),
            powerLevels: Array.from(powerLevels).sort((a, b) => parseInt(a) - parseInt(b)),
            fuelTypes: Array.from(fuelTypes).filter(f => ['Benzyna', 'Diesel', 'Elektryczny', 'Plug-In Hybrid'].includes(f)).sort(),
            drivetrains: Array.from(drivetrains).filter(d => ['xDrive', 'Na przód', 'Na tył'].includes(d)).sort(),
            colorGroups: Array.from(colorGroups).sort(),
            upholsteryGroups: Array.from(upholsteryGroups).sort(),
            minPrice: minPrice === Infinity ? 0 : minPrice,
            maxPrice: maxPrice,
            minPower: powerLevels.size > 0 ? Math.min(...Array.from(powerLevels).map(p => parseInt(p))) : 0,
            maxPower: powerLevels.size > 0 ? Math.max(...Array.from(powerLevels).map(p => parseInt(p))) : 600
        };
    }, [enrichedCars]);

    // Filter + sort
    const filteredCars = useMemo(() => {
        // Normalize query to ignore diacritics
        const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const rawQuery = searchParams.get('q') || '';
        const query = normalize(rawQuery);
        const searchTerms = query.split(/[\s,]+/).filter(term => term.length > 0);

        const selectedSeries = searchParams.getAll('series');
        const selectedBody = searchParams.getAll('body');
        const selectedFuel = searchParams.getAll('fuel');
        const selectedDrivetrain = searchParams.getAll('drivetrain');
        const selectedColorGroups = searchParams.getAll('colorGroup');
        const selectedUpholsteryGroups = searchParams.getAll('upholsteryGroup');
        const minP = parseInt(searchParams.get('min') || '0');
        const maxP = parseInt(searchParams.get('max') || '9999999');
        const minPower = parseInt(searchParams.get('pmin') || '0');
        const maxPower = parseInt(searchParams.get('pmax') || '1000');

        const filtered = enrichedCars.filter(car => {
            // Build search string for this car: vin + model + all option codes + all option names
            if (searchTerms.length > 0) {
                const rawOptions = car.option_codes || [];
                const carOptionsStr = rawOptions.map((optCode: string) => {
                    const entry = dictionaries.option[optCode];
                    // entry can be a plain object OR an array (when body_groups exist)
                    const optName: string = Array.isArray(entry)
                        ? (entry[0]?.name || '')
                        : (entry?.name || '');
                    return `${optCode.toLowerCase()} ${normalize(optName)}`;
                }).join(' ');
                const colorName = normalize((dictionaries.color[car.color_code]?.name as string) || '');
                const individualColorName = car.individual_color
                    ? normalize((dictionaries.color[car.individual_color]?.name as string) || car.individual_color)
                    : '';
                const combined = `${(car.vin || '').toLowerCase()} ${normalize(car.model_name || '')} ${carOptionsStr} ${colorName} ${individualColorName}`;

                // ALL terms must match. Each term can match itself OR any of its aliases.
                const allMatch = searchTerms.every(term => {
                    const aliases = (SEARCH_ALIASES[term] || []).map(normalize);
                    const candidates = [term, ...aliases];
                    return candidates.some(c => combined.includes(c));
                });

                if (!allMatch) return false;
            }

            const carPrice = car.special_price || car.list_price;
            const matchesSeries = selectedSeries.length === 0 || (car.series && selectedSeries.includes(car.series));
            const matchesBody = selectedBody.length === 0 || (car.body_type && selectedBody.includes(car.body_type));
            const matchesFuel = selectedFuel.length === 0 || (car.fuel_type && selectedFuel.includes(car.fuel_type));
            const matchesDrivetrain = selectedDrivetrain.length === 0 || (car.drivetrain && selectedDrivetrain.includes(car.drivetrain));
            const matchesColorGroup = selectedColorGroups.length === 0 || ((car as any).color_group && selectedColorGroups.includes((car as any).color_group));
            const matchesUpholsteryGroup = selectedUpholsteryGroups.length === 0 || ((car as any).upholstery_group && selectedUpholsteryGroups.includes((car as any).upholstery_group));
            const matchesPrice = carPrice >= minP && carPrice <= maxP;
            const pValue = car.power ? parseInt(car.power) : 0;
            const matchesPowerRange = pValue >= minPower && pValue <= maxPower;

            return matchesSeries && matchesBody && matchesFuel && matchesDrivetrain && matchesColorGroup && matchesUpholsteryGroup && matchesPrice && matchesPowerRange;
        });

        return filtered.sort((a, b) => {
            const getStatusPriority = (car: typeof a) => {
                const isSold = (car.order_status || '').includes('Sprzedany');
                const hasImages = car.images && car.images.length > 0;
                if (isSold) return 3;
                if (!hasImages) return 2;
                return 1;
            };

            const statusA = getStatusPriority(a);
            const statusB = getStatusPriority(b);
            if (statusA !== statusB) return statusA - statusB;

            if (sortOrder === 'newest') {
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return dateB - dateA;
            }
            if (sortOrder === 'price_asc') {
                const getPrice = (c: typeof a) => (c.special_price && c.special_price < c.list_price) ? c.special_price : c.list_price;
                return getPrice(a) - getPrice(b);
            }
            if (sortOrder === 'price_desc') {
                const getPrice = (c: typeof a) => (c.special_price && c.special_price < c.list_price) ? c.special_price : c.list_price;
                return getPrice(b) - getPrice(a);
            }
            return 0;
        });
    }, [enrichedCars, searchParams, sortOrder]);

    const activeFilterCount = [
        ...searchParams.getAll('series'),
        ...searchParams.getAll('body'),
        ...searchParams.getAll('fuel'),
        ...searchParams.getAll('drivetrain'),
        ...searchParams.getAll('colorGroup'),
        ...searchParams.getAll('upholsteryGroup'),
        searchParams.has('q') ? ['q'] : [],
        searchParams.has('min') || searchParams.has('max') ? ['price'] : [],
        searchParams.has('pmin') || searchParams.has('pmax') ? ['power'] : [],
    ].flat().length;

    return (
        <>
            {/* Mobile Sticky Filter Bar — Floating Pill centered under header */}
            <div className="lg:hidden sticky top-24 z-[100] px-4 flex justify-center pointer-events-none">
                <button
                    onClick={() => setIsFiltersOpen(true)}
                    className="pointer-events-auto flex items-center gap-3 px-6 py-3 rounded-full border border-gray-100/50 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-900 bg-white/95 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] ring-1 ring-black/5 hover:scale-[1.02] active:scale-95 transition-all"
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>Filtry</span>
                    {activeFilterCount > 0 && (
                        <div className="flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded-full bg-gray-900 text-white text-[9px] font-bold ml-1">
                            {activeFilterCount}
                        </div>
                    )}
                </button>
            </div>

            <div className="max-w-[1600px] mx-auto px-6 flex flex-col-reverse lg:flex-row gap-12 pt-8">
                <FilterSidebar
                    isOpen={isFiltersOpen}
                    onClose={() => setIsFiltersOpen(false)}
                    options={filterOptions}
                    resultsCount={filteredCars.length}
                />

                <div className="flex-1 relative" ref={gridRef}>
                    <Suspense fallback={<div className="animate-pulse bg-gray-100 h-96 rounded-sm" />}>
                        <CarGrid
                            cars={filteredCars}
                            totalCount={cars.length}
                            onOpenFilters={() => setIsFiltersOpen(true)}
                            isFiltersOpen={isFiltersOpen}
                            dictionaries={dictionaries}
                            sortOrder={sortOrder}
                            onSortChange={setSortOrder}
                            bulletinPrices={bulletinPrices}
                            layout={layout}
                            onLayoutChange={setLayout}
                            displayCount={displayCount}
                            onDisplayCountChange={setDisplayCount}
                        />
                    </Suspense>
                </div>
            </div>

            {/* Floating Garage Button for SRP (Persistent Bottom Right / Top Right depending on layout) */}
            <GarageFloatingButton />
        </>
    );
}

// Extract to sub-component to prevent full SRP re-renders on garage count change

function GarageFloatingButton() {
    const { savedCars, toggleGarage } = useGarageStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const count = savedCars?.length || 0;

    return (
        <button
            onClick={toggleGarage}
            className={cn(
                "fixed bottom-8 right-6 lg:bottom-12 lg:right-12 z-[100] flex items-center justify-center w-14 h-14 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.15)] border transition-all cursor-pointer hover:scale-105 active:scale-95 duration-200",
                count > 0 ? "bg-black text-white border-black ring-2 ring-black/10" : "bg-white text-black border-black/10 hover:bg-gray-50 ring-1 ring-black/5"
            )}
            aria-label="Otwórz garaż"
        >
            <div className="relative">
                <Warehouse className="w-6 h-6" />
                {count > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-blue-600 text-[10px] font-black text-white flex items-center justify-center border-2 border-black">
                        {count}
                    </span>
                )}
            </div>
        </button>
    );
}
