'use client';

import { useCompareStore } from '@/store/compareStore';
import { cn } from '@/lib/utils';
import { X, Check, Minus, ChevronDown, ChevronUp, Loader2, Scale, Trash2 } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

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

// ── Component ─────────────────────────────────────────────────────────────────
export function CompareModal() {
    const { compareCars, isModalOpen, closeModal, removeCar } = useCompareStore();
    const [mounted, setMounted] = useState(false);
    const [dicts, setDicts] = useState<Dicts | null>(null);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (!isModalOpen || dicts) return;
        fetch('/api/dictionaries')
            .then(r => r.json())
            .then(setDicts)
            .catch(() => setDicts(EMPTY_DICTS));
    }, [isModalOpen]);

    useEffect(() => {
        document.body.style.overflow = isModalOpen ? 'hidden' : '';
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
        { label: 'Rodzaj paliwa', fn: (c: any) => c.fuel_type || '—' },
        { label: 'Moc silnika', fn: (c: any) => c.power ? `${c.power} KM` : '—' },
        { label: 'Układ napędowy', fn: (c: any) => (d.drivetrain as any)?.[c.drivetrain]?.name || c.drivetrain || '—' },
        { label: 'Lakier', fn: (c: any) => !dicts ? c.color_code || '—' : getColorName(d, c) },
        { label: 'Tapicerka', fn: (c: any) => (d.upholstery as any)?.[c.upholstery_code]?.name || c.upholstery_code || '—' },
    ], [d, dicts]);

    const specsDiffCount = useMemo(() => {
        if (compareCars.length < 2) return 0;
        return specRows.reduce((count, row) => {
            const values = compareCars.map(row.fn);
            return new Set(values).size > 1 ? count + 1 : count;
        }, 0);
    }, [compareCars, specRows]);

    const allCodeSet = useMemo(() =>
        compareCars.reduce((set, car) => {
            car.option_codes?.forEach((c: string) => set.add(c.trim()));
            return set;
        }, new Set<string>()),
        [compareCars]
    );

    const diffCodes = useMemo(() =>
        Array.from(allCodeSet).filter(code =>
            compareCars.some(c => c.option_codes?.some((oc: string) => oc.trim() === code)) &&
            !compareCars.every(c => c.option_codes?.some((oc: string) => oc.trim() === code))
        ).sort((a, b) => getOptionName(d, a).localeCompare(getOptionName(d, b))),
        [allCodeSet, compareCars, d]
    );

    const allCodesSorted = useMemo(() =>
        Array.from(allCodeSet).sort((a, b) => getOptionName(d, a).localeCompare(getOptionName(d, b))),
        [allCodeSet, d]
    );

    if (!mounted || !isModalOpen) return null;

    const hasOption = (car: any, code: string) =>
        car.option_codes?.some((c: string) => c.trim() === code);

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(price);

    const codesToShow = showAll ? allCodesSorted : diffCodes;
    const isLoading = !dicts;
    const n = compareCars.length;

    return (
        <div className="fixed inset-0 z-[200] flex flex-col bg-white overflow-hidden animate-in fade-in duration-500">
            {/* Ambient Lounge Background - Light */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-50 via-white to-gray-50 pointer-events-none" />
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[120%] h-[40%] bg-blue-500/[0.03] rounded-[100%] blur-[120px] pointer-events-none" />

            {/* Header: Virtual Showroom Style - Light */}
            <div className="relative flex items-center justify-between px-10 py-6 border-b border-gray-100 bg-white/80 backdrop-blur-2xl shrink-0 z-50">
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                        <Scale className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-light tracking-[0.2em] text-gray-900 uppercase">Wirtualny Salon</h2>
                        <div className="flex items-center gap-3 mt-1.5">
                            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.25em]">Zestawienie ({n})</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={closeModal}
                    className="group flex items-center gap-4 px-6 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-full transition-all duration-500"
                >
                    <span className="text-[10px] text-gray-500 group-hover:text-gray-900 font-bold uppercase tracking-[0.2em]">Powrót</span>
                    <X className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-transform group-hover:rotate-90 duration-500" />
                </button>
            </div>

            {/* Main Table Interface */}
            <div className="flex-1 overflow-auto bg-gray-50/30">
                <div className="min-w-max p-10 pt-0">
                    <table className="border-separate border-spacing-0 w-full relative">
                        <thead>
                            <tr>
                                {/* Category Header col - STICKY TOP AND LEFT */}
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
                                        className="sticky top-0 z-30 p-0 text-left bg-white/95 backdrop-blur-xl border-b border-gray-100 px-6 pb-12"
                                    >
                                        <div className="w-[320px] group relative pt-6">
                                            {/* Removal Button - Elegant & Defined */}
                                            <button
                                                onClick={() => { removeCar(car.vin); if (n <= 1) closeModal(); }}
                                                className="absolute -top-1 -right-1 z-30 w-10 h-10 bg-white text-gray-400 hover:text-red-500 border border-gray-100 rounded-full flex items-center justify-center transition-all duration-500 shadow-lg opacity-0 group-hover:opacity-100 hover:scale-110"
                                                title="Usuń z porównania"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>

                                            <Link href={`/cars/${encodeURIComponent(car.vin)}`} className="block group/card">
                                                {/* Vehicle Imagery */}
                                                <div className="aspect-[4/3] rounded-[24px] overflow-hidden bg-white border border-gray-100 relative shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] transition-all duration-700 group-hover/card:border-gray-200 isolation-auto">
                                                    {(() => {
                                                        const imgUrl = car.images?.[0]?.url || (car as any).group_images?.[0]?.url;
                                                        return imgUrl ? (
                                                            <div className="relative w-full h-full overflow-hidden rounded-[24px]">
                                                                <Image
                                                                    src={imgUrl}
                                                                    alt={car.vin}
                                                                    fill
                                                                    className="object-cover transition-transform duration-700 group-hover/card:scale-110"
                                                                    sizes="320px"
                                                                    priority={idx < 3}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gray-50">
                                                                <div className="w-12 h-12 rounded-full border border-gray-100 flex items-center justify-center">
                                                                    <Scale className="w-6 h-6 text-gray-200" />
                                                                </div>
                                                                <span className="text-[9px] text-gray-300 font-bold uppercase tracking-[0.3em]">Brak wizualizacji</span>
                                                            </div>
                                                        );
                                                    })()}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/5 via-transparent to-transparent opacity-60 pointer-events-none" />

                                                    {/* Sequence ID */}
                                                    <div className="absolute top-5 left-5 px-3 py-1.5 rounded-lg bg-gray-50/80 backdrop-blur-md border border-black/[0.03] text-[10px] font-medium text-gray-400 tracking-widest z-10">
                                                        #{idx + 1}
                                                    </div>
                                                </div>

                                                {/* Description */}
                                                <div className="mt-8 px-2">
                                                    <h3 className="text-xl font-light text-gray-900 leading-tight uppercase tracking-wide truncate group-hover/card:text-blue-600 transition-colors">
                                                        {isLoading ? `BMW ${car.model_code}` : getModelName(d, car.model_code)}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="text-[9px] text-gray-400 font-mono tracking-tighter uppercase">{car.vin}</span>
                                                    </div>

                                                    <div className="mt-6 flex flex-col gap-0.5">
                                                        {car.special_price && car.special_price < car.list_price ? (
                                                            <>
                                                                <span className="text-[11px] text-gray-400 line-through font-medium tracking-tight opacity-80">{formatPrice(car.list_price)}</span>
                                                                <span className="text-2xl font-medium text-gray-900 tracking-tighter">{formatPrice(car.special_price)}</span>
                                                            </>
                                                        ) : (
                                                            <span className="text-2xl font-medium text-gray-900 tracking-tighter">{formatPrice(car.list_price)}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>

                                            {/* Mobile Visibility Handler */}
                                            <button
                                                onClick={() => { removeCar(car.vin); if (n <= 1) closeModal(); }}
                                                className="mt-6 w-full flex items-center justify-center gap-3 py-3 bg-gray-50 border border-gray-100 rounded-2xl transition-all duration-300 text-[10px] font-bold text-gray-500 uppercase tracking-widest md:hidden"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Usuń pojazd
                                            </button>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {/* Section: ATRIBUTES */}
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
                                        <td className="sticky left-0 z-20 p-8 py-7 bg-white/95 backdrop-blur-md border-r border-gray-100 shadow-sm">
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

                            {/* Section: OPTIONS */}
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
                                        codesToShow.map(code => {
                                            const name = getOptionName(d, code);
                                            const presentArr = compareCars.map(c => hasOption(c, code));
                                            const isDiff = presentArr.some(Boolean) && !presentArr.every(Boolean);

                                            return (
                                                <tr key={code} className={cn("group transition-all duration-500", isDiff ? "bg-amber-50/30" : "hover:bg-gray-50/30")}>
                                                    <td className="sticky left-0 z-20 p-5 px-8 bg-white/95 backdrop-blur-md border-r border-gray-100">
                                                        <div className="flex flex-col gap-1">
                                                            <span className={cn("text-[14px] transition-colors leading-relaxed", isDiff ? "text-gray-900 font-medium italic" : "text-gray-600")}>
                                                                {name}
                                                            </span>
                                                            <span className="text-[8px] font-mono text-gray-300 mt-1 uppercase tracking-widest">{code}</span>
                                                        </div>
                                                    </td>
                                                    {compareCars.map((car, i) => (
                                                        <td key={i} className="p-5 border-l border-gray-100 text-center">
                                                            <div className="flex justify-center">
                                                                {presentArr[i]
                                                                    ? (
                                                                        <div className={cn(
                                                                            "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500",
                                                                            isDiff
                                                                                ? "bg-gray-900 text-white shadow-md"
                                                                                : "bg-gray-100 text-gray-300"
                                                                        )}>
                                                                            <Check className="w-4 h-4" strokeWidth={2.5} />
                                                                        </div>
                                                                    )
                                                                    : <Minus className="w-4 h-4 text-gray-100" strokeWidth={2} />
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

            {/* Subfooter Accent */}
            <div className="h-[1px] bg-gray-100" />
        </div>
    );
}
