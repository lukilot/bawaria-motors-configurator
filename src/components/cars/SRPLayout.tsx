'use client';

import { useState, Suspense, useMemo, useEffect } from 'react';
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
}

export function SRPLayout({ cars, dictionaries }: SRPLayoutProps) {
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const searchParams = useSearchParams();

    // Track last visited SRP URL for BackButton logic
    useEffect(() => {
        // We save the full path including query params
        const url = window.location.pathname + window.location.search;
        sessionStorage.setItem('bawaria_last_srp', url);
    }, [searchParams]);

    // Handle scroll persistence
    useEffect(() => {
        // Restore scroll if returning to same SRP
        const savedUrl = sessionStorage.getItem('bawaria_last_srp');
        const currentUrl = window.location.pathname + window.location.search;
        const savedScroll = sessionStorage.getItem('bawaria_scroll_pos');

        if (savedUrl === currentUrl && savedScroll) {
            // Small timeout to allow layout to settle
            setTimeout(() => {
                window.scrollTo(0, parseInt(savedScroll));
            }, 100);
        }

        // Save scroll on change
        const handleScroll = () => {
            sessionStorage.setItem('bawaria_scroll_pos', window.scrollY.toString());
        };

        // Debounce scroll event
        let timeoutId: NodeJS.Timeout;
        const debouncedScroll = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(handleScroll, 100);
        };

        window.addEventListener('scroll', debouncedScroll);
        return () => {
            window.removeEventListener('scroll', debouncedScroll);
            clearTimeout(timeoutId);
        };
    }, []);

    // 0. Enrich cars with dictionary data
    const enrichedCars = useMemo(() => {
        return cars.map(car => {
            const modelDict = dictionaries.model[car.model_code];
            if (!modelDict) return car;

            return {
                ...car,
                model_name: (modelDict.name as string) || car.model_name,
                series: (modelDict.series as string) || car.series,
                body_type: (modelDict.body_type as string) || car.body_type,
                power: (modelDict.power as string) || car.power,
                fuel_type: (modelDict.fuel as string) || car.fuel_type,
                drivetrain: (modelDict.drivetrain as string) || car.drivetrain,
                acceleration: modelDict.acceleration as string,
                max_speed: modelDict.max_speed as string,
                trunk_capacity: modelDict.trunk_capacity as string
            };
        });
    }, [cars, dictionaries.model]);

    // 1. Calculate available filters from the enriched car list
    const filterOptions = useMemo(() => {
        const series = new Set<string>();
        const bodyTypes = new Set<string>();
        const powerLevels = new Set<string>();
        const fuelTypes = new Set<string>();
        const drivetrains = new Set<string>();
        let minPrice = Infinity;
        let maxPrice = 0;

        enrichedCars.forEach(car => {
            if (car.series) series.add(car.series as string);
            if (car.body_type) bodyTypes.add(car.body_type as string);
            if (car.power) powerLevels.add(car.power as string);
            if (car.fuel_type) fuelTypes.add(car.fuel_type as string);
            if (car.drivetrain) drivetrains.add(car.drivetrain as string);

            const price = car.special_price || car.list_price;
            if (price < minPrice) minPrice = price;
            if (price > maxPrice) maxPrice = price;
        });

        return {
            series: Array.from(series).sort(),
            bodyTypes: Array.from(bodyTypes).sort(),
            powerLevels: Array.from(powerLevels).sort((a, b) => parseInt(a) - parseInt(b)),
            fuelTypes: Array.from(fuelTypes).sort(),
            drivetrains: Array.from(drivetrains).sort(),
            minPrice: minPrice === Infinity ? 0 : minPrice,
            maxPrice: maxPrice,
            minPower: powerLevels.size > 0 ? Math.min(...Array.from(powerLevels).map(p => parseInt(p))) : 0,
            maxPower: powerLevels.size > 0 ? Math.max(...Array.from(powerLevels).map(p => parseInt(p))) : 600
        };
    }, [enrichedCars]);

    // 2. Filter cars based on URL params
    const filteredCars = useMemo(() => {
        const query = searchParams.get('q')?.toLowerCase() || '';
        const selectedSeries = searchParams.getAll('series');
        const selectedBody = searchParams.getAll('body');
        const selectedFuel = searchParams.getAll('fuel');
        const selectedDrivetrain = searchParams.getAll('drivetrain');
        const minP = parseInt(searchParams.get('min') || '0');
        const maxP = parseInt(searchParams.get('max') || '9999999');
        const minPower = parseInt(searchParams.get('pmin') || '0');
        const maxPower = parseInt(searchParams.get('pmax') || '1000');

        const filtered = enrichedCars.filter(car => {
            const carPrice = car.special_price || car.list_price;
            const modelName = (car.model_name || '').toLowerCase();
            const vin = (car.vin || '').toLowerCase();

            // Search query
            const matchesQuery = !query || modelName.includes(query) || vin.includes(query);

            // Filters
            const matchesSeries = selectedSeries.length === 0 || (car.series && selectedSeries.includes(car.series));
            const matchesBody = selectedBody.length === 0 || (car.body_type && selectedBody.includes(car.body_type));
            const matchesFuel = selectedFuel.length === 0 || (car.fuel_type && selectedFuel.includes(car.fuel_type));
            const matchesDrivetrain = selectedDrivetrain.length === 0 || (car.drivetrain && selectedDrivetrain.includes(car.drivetrain));

            // Price filter
            const matchesPrice = carPrice >= minP && carPrice <= maxP;

            // Power filter
            const pValue = car.power ? parseInt(car.power) : 0;
            const matchesPowerRange = pValue >= minPower && pValue <= maxPower;

            return matchesQuery && matchesSeries && matchesBody && matchesFuel && matchesDrivetrain && matchesPrice && matchesPowerRange;
        });

        // Sort by availability status priority
        return filtered.sort((a, b) => {
            const getStatusPriority = (car: typeof a) => {
                const isSold = (car.order_status || '').includes('Sprzedany');
                const hasImages = car.images && car.images.length > 0;

                if (isSold) return 3; // Sold cars last
                if (!hasImages) return 2; // Pending setup (no images) second
                return 1; // Available/Reserved first
            };

            return getStatusPriority(a) - getStatusPriority(b);
        });
    }, [enrichedCars, searchParams]);

    return (
        <div className="max-w-[1600px] mx-auto px-6 flex flex-col-reverse lg:flex-row gap-12 pt-8">
            {/* Sidebar (Left on desktop, bottom on mobile flow) */}
            <FilterSidebar
                isOpen={isFiltersOpen}
                onClose={() => setIsFiltersOpen(false)}
                options={filterOptions}
            />

            {/* Product Grid/List (Right on desktop, top on mobile flow) */}
            <div className="flex-1">
                <Suspense fallback={<div className="animate-pulse bg-gray-100 h-96 rounded-sm" />}>
                    <CarGrid
                        cars={filteredCars}
                        totalCount={cars.length}
                        onOpenFilters={() => setIsFiltersOpen(true)}
                        dictionaries={dictionaries}
                    />
                </Suspense>
            </div>
        </div>
    );
}
