'use client';

import { useCompareStore } from '@/store/compareStore';
import { useGarageStore } from '@/store/garageStore';
import { cn } from '@/lib/utils';
import { X, Check, Minus, ChevronDown, ChevronUp, Loader2, Scale, ArrowLeft, Warehouse } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { BMWIndividualBadge } from './BMWIndividualBadge';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Dicts {
    model: Record<string, { name?: string } | null>;
    option: Record<string, { name?: string } | Array<{ name?: string }> | null>;
    color: Record<string, { name?: string } | null>;
    upholstery: Record<string, { name?: string } | null>;
    drivetrain: Record<string, { name?: string } | null>;
}

const EMPTY_DICTS: Dicts = { model: {}, option: {}, color: {}, upholstery: {}, drivetrain: {} };

// ── Helpers ───────────────────────────────────────────────────────────────────
function getOptionName(dicts: Dicts, code: string): string {
    const entry = dicts.option?.[code];
    if (!entry) return code;
    const name = Array.isArray(entry) ? entry[0]?.name : (entry as any)?.name;
    return name || code;
}

function getModelName(dicts: Dicts, modelCode: string): string {
    const entry = dicts.model?.[modelCode] as any;
    return entry?.name || `BMW ${modelCode}`;
}

function getColorName(dicts: Dicts, car: any): string {
    if (car.color_code === '490') {
        const entry = dicts.color?.[car.individual_color || ''] as any;
        return entry?.name || car.individual_color || 'BMW Individual';
    }
    const entry = dicts.color?.[car.color_code] as any;
    return entry?.name || car.color_code || '—';
}

function getPlural(n: number, one: string, few: string, many: string) {
    if (n === 1) return one;
    const lastDigit = n % 10;
    const lastTwoDigits = n % 100;
    if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) {
        return few;
    }
    return many;
}

// ── Sub-components ────────────────────────────────────────────────────────────
function GarageButton({ car }: { car: any }) {
    const isSaved = useGarageStore(state => state.savedCars.some(c => c.vin === car.vin));
    const addCar = useGarageStore(state => state.addCar);
    const removeCar = useGarageStore(state => state.removeCar);

    return (
        <button
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isSaved) removeCar(car.vin);
                else addCar(car);
            }}
            className={cn(
                "absolute bottom-4 right-4 w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-500 z-20 shadow-xl",
                isSaved
                    ? "bg-black text-white border-black scale-105"
                    : "bg-white/80 backdrop-blur-md text-gray-400 border-white/20 hover:bg-white hover:text-black hover:scale-110"
            )}
            title={isSaved ? "Usuń z garażu" : "Dodaj do garażu"}
        >
            <Warehouse className="w-4 h-4" />
        </button>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function CompareModal() {
    const { compareCars, isModalOpen, closeModal, removeCar } = useCompareStore();
    const [mounted, setMounted] = useState(false);
    const [dicts, setDicts] = useState<Dicts | null>(null);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isModalOpen || dicts) return;
        fetch('/api/dictionaries')
            .then(r => r.json())
            .then(setDicts)
            .catch(() => setDicts(EMPTY_DICTS));
    }, [isModalOpen]);

    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isModalOpen]);

    useEffect(() => {
        if (isModalOpen) setShowAll(false);
    }, [isModalOpen]);

    const pathname = usePathname();

    useEffect(() => {
        closeModal();
    }, [pathname, closeModal]);

    const d = dicts ?? EMPTY_DICTS;

    // Spec definitions for difference counting
    const specRows = useMemo(() => [
        { label: 'Rodzaj paliwa', fn: (c: any) => (c.fuel_type || '—') as React.ReactNode },
        { label: 'Moc silnika', fn: (c: any) => (c.power ? `${c.power} KM` : '—') as React.ReactNode },
        { label: 'Układ napędowy', fn: (c: any) => ((d.drivetrain?.[c.drivetrain] as any)?.name || c.drivetrain || '—') as React.ReactNode },
        {
            label: 'Lakier',
            fn: (c: any) => {
                if (c.color_code === '490') {
                    return <BMWIndividualBadge compact colorName={(d.color?.[c.individual_color || ''] as any)?.name || c.individual_color} />;
                }
                return (!dicts ? c.color_code || '—' : getColorName(d, c)) as React.ReactNode;
            }
        },
        { label: 'Tapicerka', fn: (c: any) => ((d.upholstery?.[c.upholstery_code] as any)?.name || c.upholstery_code || '—') as React.ReactNode },
    ], [d, dicts]);

    const specsDiffCount = useMemo(() => {
        if (compareCars.length < 2) return 0;
        return specRows.reduce((count, row) => {
            const values = compareCars.map(row.fn);
            return new Set(values).size > 1 ? count + 1 : count;
        }, 0);
    }, [compareCars, specRows]);

    const getFlattenedCodes = (car: any) => {
        const codes = new Set<string>();
        car.option_codes?.forEach((raw: string) => {
            const match = raw.match(/^([A-Z0-9]+)\s*\((.+)\)$/);
            if (match) {
                const content = match[2];
                const kids = content.trim().split(/[\s,]+/).filter(Boolean);
                kids.forEach(k => codes.add(k.trim()));
            } else {
                codes.add(raw.trim());
            }
        });
        return Array.from(codes);
    };

    const carOptionMaps = useMemo(() => 
        compareCars.map(car => ({
            vin: car.vin,
            codes: new Set(getFlattenedCodes(car).filter(code => {
                const entry = d.option?.[code] as any;
                if (Array.isArray(entry)) {
                    return !entry.some(e => e.hidden === true);
                }
                return entry?.hidden !== true;
            }))
        })),
        [compareCars, d.option]
    );

    const allCodeSet = useMemo(() =>
        carOptionMaps.reduce((set, map) => {
            map.codes.forEach(c => set.add(c));
            return set;
        }, new Set<string>()),
        [carOptionMaps]
    );

    const diffCodes = useMemo(() =>
        Array.from(allCodeSet).filter(code =>
            carOptionMaps.some(m => m.codes.has(code)) &&
            !carOptionMaps.every(m => m.codes.has(code))
        ).sort((a, b) => getOptionName(d, a as string).localeCompare(getOptionName(d, b as string))),
        [allCodeSet, carOptionMaps, d]
    );

    const allCodesSorted = useMemo(() =>
        Array.from(allCodeSet).sort((a, b) => getOptionName(d, a as string).localeCompare(getOptionName(d, b as string))),
        [allCodeSet, d]
    );

    if (!mounted || !isModalOpen) return null;

    const hasOption = (idx: number, code: string) =>
        carOptionMaps[idx]?.codes.has(code);

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(price);

    const codesToShow = showAll ? allCodesSorted : diffCodes;
    const isLoading = !dicts;
    const n = compareCars.length;

    return (
        <div className="fixed inset-0 z-[1000000] flex flex-col bg-white overflow-hidden animate-in fade-in duration-500">
            {/* Ambient Lounge Background - Light */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-50 via-white to-gray-50 pointer-events-none" />
            
            {/* Header: Portal Style Navigation */}
            <div className="relative flex items-center justify-between px-6 md:px-12 py-4 border-b border-gray-100 bg-white shrink-0 z-50">
                <div className="flex items-center gap-6">
                    <button
                        onClick={closeModal}
                        className="group flex items-center justify-center w-11 h-11 bg-black text-white hover:bg-gray-800 rounded-full transition-all duration-300 shadow-lg shadow-black/10 active:scale-90"
                    >
                        <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                    </button>
                    
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 shrink-0">
                            <Scale className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xs md:text-sm font-light tracking-[0.2em] text-gray-900 uppercase truncate">Wirtualny Salon</h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="w-1 h-1 bg-gray-300 rounded-full shrink-0" />
                                <span className="text-[8px] md:text-[9px] text-gray-400 font-medium uppercase tracking-[0.2em] truncate">Zestawienie ({n})</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-3">
                    <div className="flex flex-col items-end mr-4">
                        <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest leading-none">Status</span>
                        <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest mt-1">Aktywne zestawienie</span>
                    </div>
                </div>
            </div>

            {/* Main Table Interface - Desktop */}
            <div className="hidden md:block flex-1 overflow-auto bg-gray-50/10">
                <div className="min-w-max p-10 pt-0">
                    <table className="border-separate border-spacing-0 w-full relative">
                        <thead>
                            <tr>
                                <th className="sticky top-0 left-0 z-40 p-0 text-left align-bottom bg-white border-b border-r border-gray-100">
                                    <div className="w-64 p-8">
                                        <button
                                            onClick={() => setShowAll(v => !v)}
                                            className={cn(
                                                "w-full flex items-center justify-between p-5 rounded-2xl border transition-all duration-500",
                                                showAll
                                                    ? "bg-gray-50 border-gray-100 hover:border-gray-200"
                                                    : "bg-gray-900 border-gray-900 hover:bg-black text-white"
                                            )}
                                        >
                                            <div className="flex flex-col text-left">
                                                <span className={cn("text-[8px] font-bold uppercase tracking-[0.3em] mb-1", showAll ? "text-gray-400" : "text-gray-500")}>Tryb widoku</span>
                                                <span className="text-[11px] font-bold tracking-widest whitespace-nowrap uppercase">
                                                    {showAll ? 'WSZYSTKO' : 'TYLKO RÓŻNICE'}
                                                </span>
                                            </div>
                                            {showAll ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}
                                        </button>
                                    </div>
                                </th>

                                {compareCars.map((car, idx) => (
                                    <th
                                        key={idx}
                                        className="sticky top-0 z-30 p-0 text-left bg-white/95 backdrop-blur-xl border-b border-gray-100 px-6 pb-6"
                                    >
                                        <div className="w-[320px] group relative pt-4">
                                            <div className="absolute top-2 left-2 z-50">
                                                <button
                                                    onClick={() => { removeCar(car.vin); if (n <= 1) closeModal(); }}
                                                    className="w-9 h-9 bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 border border-gray-100 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg opacity-0 group-hover:opacity-100 hover:scale-110"
                                                    title="Usuń z porównania"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="block group/card relative">
                                                <div className="aspect-[21/9] rounded-[16px] overflow-hidden bg-white border border-gray-100 relative shadow-[0_10px_30px_-12px_rgba(0,0,0,0.08)] transition-all duration-700 group-hover/card:border-gray-200">
                                                    {(() => {
                                                        const imgUrl = car.images?.[0]?.url || (car as any).group_images?.[0]?.url;
                                                        return imgUrl ? (
                                                            <div className="relative w-full h-full overflow-hidden rounded-[16px]">
                                                                <Image
                                                                    src={imgUrl}
                                                                    alt={car.vin}
                                                                    fill
                                                                    className="object-cover object-[center_38%] transition-transform duration-700 group-hover/card:scale-110"
                                                                    sizes="320px"
                                                                    priority={idx < 3}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-gray-50">
                                                                <Scale className="w-4 h-4 text-gray-200" />
                                                                <span className="text-[8px] text-gray-300 font-bold uppercase tracking-[0.2em]">Brak</span>
                                                            </div>
                                                        );
                                                    })()}
                                                    <GarageButton car={car} />
                                                    <Link href={`/cars/${encodeURIComponent(car.vin)}`} className="absolute inset-0 z-10" />
                                                    <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-white/80 backdrop-blur-md border border-black/[0.03] text-[9px] font-bold text-gray-400 tracking-widest z-10">
                                                        #{idx + 1}
                                                    </div>
                                                </div>

                                                <div className="mt-4 px-1">
                                                    <div className="flex flex-col gap-1">
                                                        <h3 className="text-sm font-bold text-gray-900 leading-tight uppercase tracking-tight truncate group-hover/card:text-blue-600 transition-colors">
                                                            {isLoading ? `BMW ${car.model_code}` : getModelName(d, car.model_code)}
                                                        </h3>
                                                        <p className="text-[9px] text-gray-400 font-mono truncate uppercase opacity-60 m-0">{car.vin}</p>
                                                        
                                                        <div className="mt-2 flex items-baseline gap-2">
                                                            {car.special_price && car.special_price < car.list_price ? (
                                                                <>
                                                                    <span className="text-lg font-bold text-gray-900">{formatPrice(car.special_price)}</span>
                                                                    <span className="text-[10px] text-gray-400 line-through opacity-60">{formatPrice(car.list_price)}</span>
                                                                </>
                                                            ) : (
                                                                <span className="text-lg font-bold text-gray-900 tracking-tight">{formatPrice(car.list_price)}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            <tr className="bg-gray-50/50">
                                <td className="p-8 sticky left-0 z-20 bg-gray-50 border-r border-gray-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-1 h-5 bg-gray-300 rounded-full" />
                                        <span className="text-[12px] font-bold uppercase tracking-[0.4em] text-gray-900">Specyfikacja</span>
                                        {!showAll && specsDiffCount > 0 && (
                                            <span className="ml-4 px-2 py-0.5 rounded-full border border-gray-200 bg-white text-[8px] font-bold text-gray-500 tracking-tighter shadow-sm uppercase">
                                                {specsDiffCount} {getPlural(specsDiffCount, 'różnica', 'różnice', 'różnic')}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                {compareCars.map((_, i) => (
                                    <td key={i} className="p-8 border-l border-gray-100" />
                                ))}
                            </tr>

                            {specRows.map(row => {
                                const values = compareCars.map(row.fn);
                                const isDiff = new Set(values).size > 1;
                                return (
                                    <tr key={row.label} className={cn("group transition-all duration-500", isDiff ? "bg-blue-50/30" : "hover:bg-gray-50/50")}>
                                        <td className="sticky left-0 z-20 p-8 py-7 bg-white border-r border-gray-100">
                                            <span className={cn("text-[12px] font-medium uppercase tracking-[0.1em] transition-colors", isDiff ? "text-gray-900" : "text-gray-400")}>
                                                {row.label}
                                            </span>
                                        </td>
                                        {compareCars.map((car, i) => (
                                            <td key={i} className="p-8 py-7 border-l border-gray-100">
                                                <div className={cn("text-[14px] transition-all", isDiff ? "text-gray-900 font-medium" : "text-gray-500")}>
                                                    {values[i]}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}

                            {allCodeSet.size > 0 && (
                                <>
                                    <tr className="bg-gray-50/50">
                                        <td className="p-8 sticky left-0 z-20 bg-gray-50 border-r border-gray-100">
                                            <div className="flex items-center gap-4">
                                                <div className="w-1 h-5 bg-gray-200 rounded-full" />
                                                <span className="text-[12px] font-bold uppercase tracking-[0.4em] text-gray-900">Wyposażenie</span>
                                                {!showAll && diffCodes.length > 0 && (
                                                    <span className="ml-4 px-2 py-0.5 rounded-full border border-gray-200 bg-white text-[8px] font-bold text-gray-500 tracking-tighter shadow-sm uppercase">
                                                        {diffCodes.length} {getPlural(diffCodes.length, 'różnica', 'różnice', 'różnic')}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        {compareCars.map((_, i) => (
                                            <td key={i} className="p-8 border-l border-gray-100" />
                                        ))}
                                    </tr>

                                    {isLoading ? (
                                        <tr>
                                            <td className="sticky left-0 p-16 bg-white" />
                                            <td colSpan={n} className="p-16 text-center">
                                                <Loader2 className="w-10 h-10 animate-spin text-gray-200 mx-auto" />
                                            </td>
                                        </tr>
                                    ) : (
                                        (codesToShow as string[]).map(code => {
                                            const name = getOptionName(d, code);
                                            const presentArr = compareCars.map((_, i) => hasOption(i, code));
                                            const isDiff = presentArr.some(Boolean) && !presentArr.every(Boolean);

                                            return (
                                                <tr key={code} className={cn("group transition-all duration-500", isDiff ? "bg-amber-50/30" : "hover:bg-gray-50/30")}>
                                                    <td className="sticky left-0 z-20 p-5 px-8 bg-white border-r border-gray-100">
                                                        <div className="flex flex-col gap-1">
                                                            <span className={cn("text-[14px] transition-colors leading-relaxed", isDiff ? "text-gray-900 font-medium italic" : "text-gray-600")}>
                                                                {name}
                                                            </span>
                                                            <span className="text-[8px] font-mono text-gray-600 mt-1 uppercase tracking-widest">{code}</span>
                                                        </div>
                                                    </td>
                                                    {compareCars.map((_, i) => (
                                                        <td key={i} className="p-5 border-l border-gray-100 text-center">
                                                            <div className="flex justify-center">
                                                                {presentArr[i]
                                                                    ? (
                                                                        <div className={cn(
                                                                            "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500",
                                                                            isDiff
                                                                                ? "bg-gray-900 text-white shadow-md"
                                                                                : "bg-gray-100 text-gray-500"
                                                                        )}>
                                                                            <Check className="w-4 h-4" strokeWidth={2.5} />
                                                                        </div>
                                                                    )
                                                                    : <Minus className="w-4 h-4 text-gray-400" strokeWidth={2.5} />
                                                                }
                                                            </div>
                                                        </td>
                                                    ))}
                                                </tr>
                                            );
                                        })
                                    )}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Main Surface Interface - Mobile */}
            <div className="md:hidden flex-1 flex flex-col min-h-0 bg-white relative z-[100]">
                {/* Fixed Top Section: Car Selector with Horizontal Scroll */}
                <div className="shrink-0 bg-white border-b border-gray-100 px-4 py-4 flex gap-4 overflow-x-auto no-scrollbar shadow-sm z-50">
                    {compareCars.map((car, idx) => (
                        <div key={car.vin} className="flex-shrink-0 w-28 flex flex-col items-center group relative">
                            <button
                                onClick={() => { removeCar(car.vin); if (n <= 1) closeModal(); }}
                                className="absolute -top-1.5 -right-1.5 z-10 w-7 h-7 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-400 shadow-md active:bg-red-50 active:text-red-500 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="w-28 h-12 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 relative shadow-sm">
                                {car.images?.[0]?.url ? (
                                    <Image src={car.images[0].url} alt={car.vin} fill className="object-cover object-[center_38%]" sizes="120px" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                        <Scale className="w-4 h-4 text-gray-200" />
                                    </div>
                                )}
                            </div>

                            <span className="text-[10px] font-bold text-gray-900 mt-2 uppercase tracking-tighter truncate w-full text-center px-1">
                                #{idx + 1} {isLoading ? car.model_code : getModelName(d, car.model_code)}
                            </span>
                        </div>
                    ))}

                    <div className="flex-shrink-0 w-28">
                        <button
                            onClick={() => setShowAll(v => !v)}
                            className={cn(
                                "w-28 h-12 rounded-xl border flex flex-col items-center justify-center transition-all duration-300 shadow-sm",
                                showAll ? "bg-gray-100 border-gray-200" : "bg-black border-black text-white"
                            )}
                        >
                            <span className="text-[7px] font-bold uppercase tracking-[0.2em] opacity-60">Zmień widok</span>
                            <span className="text-[10px] font-bold leading-none tracking-widest">{showAll ? 'WSZYSTKO' : 'RÓŻNICE'}</span>
                        </button>
                    </div>
                </div>

                {/* Content Area - Vertically Scrollable */}
                <div className="flex-grow overflow-y-auto overflow-x-hidden bg-gray-50/20">
                    <div className="p-5 flex flex-col gap-10 pb-40">
                        {/* Section: SPECIFICATIONS */}
                        <div className="flex flex-col gap-5">
                            <div className="flex items-center gap-3 px-1">
                                <div className="w-1.5 h-6 bg-gray-900 rounded-full" />
                                <h4 className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-gray-900">Specyfikacja</h4>
                                {!showAll && specsDiffCount > 0 && (
                                    <span className="ml-auto text-[8px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-full">{specsDiffCount} {getPlural(specsDiffCount, 'różnica', 'różnice', 'różnic')}</span>
                                )}
                            </div>
                            
                            <div className="grid gap-4">
                                {specRows.map(row => {
                                    const values = compareCars.map(row.fn);
                                    const isDiff = new Set(values).size > 1;
                                    if (!showAll && !isDiff) return null;

                                    return (
                                        <div key={row.label} className={cn(
                                            "rounded-3xl border p-5 flex flex-col gap-4 shadow-sm transition-all duration-500",
                                            isDiff ? "bg-white border-blue-100 ring-4 ring-blue-50/10" : "bg-white border-gray-100"
                                        )}>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{row.label}</span>
                                                {isDiff && <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm animate-pulse" />}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                {compareCars.map((car, idx) => (
                                                    <div key={idx} className="flex flex-col gap-1">
                                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.05em]">Auto #{idx + 1}</span>
                                                        <div className={cn("text-[13px] leading-snug", isDiff ? "text-gray-900 font-bold" : "text-gray-600 font-medium")}>
                                                            {values[idx]}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Section: EQUIPMENT */}
                        {allCodeSet.size > 0 && (
                            <div className="flex flex-col gap-5">
                                <div className="flex items-center gap-3 px-1">
                                    <div className="w-1.5 h-6 bg-gray-300 rounded-full" />
                                    <h4 className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-gray-900">Wyposażenie</h4>
                                    {!showAll && diffCodes.length > 0 && (
                                        <span className="ml-auto text-[8px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">{diffCodes.length} {getPlural(diffCodes.length, 'różnica', 'różnice', 'różnic')}</span>
                                    )}
                                </div>

                                <div className="grid gap-3">
                                    {isLoading ? (
                                        <div className="p-16 bg-white rounded-3xl border border-gray-100 flex flex-col items-center justify-center gap-4">
                                            <Loader2 className="w-10 h-10 animate-spin text-gray-200" />
                                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Pobieranie opcji...</span>
                                        </div>
                                    ) : (
                                        (codesToShow as string[]).map(code => {
                                            const name = getOptionName(d, code);
                                            const presentArr = compareCars.map((_, i) => hasOption(i, code));
                                            const isDiff = presentArr.some(Boolean) && !presentArr.every(Boolean);

                                            return (
                                                <div key={code} className={cn(
                                                    "rounded-2xl border p-5 flex flex-col gap-4 transition-all duration-500",
                                                    isDiff ? "bg-white border-amber-100 ring-4 ring-amber-50/10" : "bg-white/50 border-gray-100 opacity-80"
                                                )}>
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className={cn("text-[13px] leading-relaxed", isDiff ? "text-gray-900 font-bold" : "text-gray-600 font-medium")}>
                                                                {name as string}
                                                            </span>
                                                            <span className="text-[8px] font-mono text-gray-600 uppercase tracking-[0.2em]">{(code as string)}</span>
                                                        </div>
                                                        {isDiff && <div className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shrink-0 mt-2" />}
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {compareCars.map((_, idx) => (
                                                            <div key={idx} className={cn(
                                                                "flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-300",
                                                                presentArr[idx] 
                                                                    ? (isDiff ? "bg-gray-900 text-white border-gray-900 shadow-inner" : "bg-gray-100 text-gray-600 border-gray-200")
                                                                    : "bg-gray-50 text-gray-500 border-gray-200"
                                                            )}>
                                                                <span className="text-[9px] font-bold uppercase tracking-wider">#{idx + 1}</span>
                                                                {presentArr[idx] 
                                                                    ? <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                                                    : <Minus className="w-3.5 h-3.5 text-gray-400" strokeWidth={2.5} />
                                                                }
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Global Subfooter Gradient */}
            <div className="shrink-0 h-[env(safe-area-inset-bottom,0px)] bg-white" />
        </div>
    );
}
