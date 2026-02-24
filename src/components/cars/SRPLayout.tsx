'use client';

import { useState, Suspense, useMemo, useEffect, useRef } from 'react';
import { StockCar } from '@/types/stock';
import { FilterSidebar } from '@/components/cars/FilterSidebar';
import { CarGrid } from '@/components/cars/CarGrid';
import { useSearchParams } from 'next/navigation';

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
    useEffect(() => {
        const url = window.location.pathname + window.location.search;
        sessionStorage.setItem(SESSION_KEY_SRP, url);
    }, [searchParams]);

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
        const query = searchParams.get('q')?.toLowerCase() || '';
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
            const carPrice = car.special_price || car.list_price;
            const modelName = (car.model_name || '').toLowerCase();
            const vin = (car.vin || '').toLowerCase();

            const matchesQuery = !query || modelName.includes(query) || vin.includes(query);
            const matchesSeries = selectedSeries.length === 0 || (car.series && selectedSeries.includes(car.series));
            const matchesBody = selectedBody.length === 0 || (car.body_type && selectedBody.includes(car.body_type));
            const matchesFuel = selectedFuel.length === 0 || (car.fuel_type && selectedFuel.includes(car.fuel_type));
            const matchesDrivetrain = selectedDrivetrain.length === 0 || (car.drivetrain && selectedDrivetrain.includes(car.drivetrain));
            const matchesColorGroup = selectedColorGroups.length === 0 || ((car as any).color_group && selectedColorGroups.includes((car as any).color_group));
            const matchesUpholsteryGroup = selectedUpholsteryGroups.length === 0 || ((car as any).upholstery_group && selectedUpholsteryGroups.includes((car as any).upholstery_group));
            const matchesPrice = carPrice >= minP && carPrice <= maxP;
            const pValue = car.power ? parseInt(car.power) : 0;
            const matchesPowerRange = pValue >= minPower && pValue <= maxPower;

            return matchesQuery && matchesSeries && matchesBody && matchesFuel && matchesDrivetrain && matchesColorGroup && matchesUpholsteryGroup && matchesPrice && matchesPowerRange;
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

    return (
        <div className="max-w-[1600px] mx-auto px-6 flex flex-col-reverse lg:flex-row gap-12 pt-8">
            <FilterSidebar
                isOpen={isFiltersOpen}
                onClose={() => setIsFiltersOpen(false)}
                options={filterOptions}
            />

            <div className="flex-1" ref={gridRef}>
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
    );
}
