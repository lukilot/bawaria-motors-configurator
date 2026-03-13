'use client';

import Link from 'next/link';
import { StockCar } from '@/types/stock';
import { cn } from '@/lib/utils';
import { ArrowRight, Warehouse, Scale } from 'lucide-react';
import { BMWIndividualBadge } from './BMWIndividualBadge';
import { useGarageStore } from '@/store/garageStore';
import { useCompareStore } from '@/store/compareStore';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveDictionaryEntry } from '@/lib/dictionary-fetch';
import { getPluralForm } from '@/lib/plurals';
import { getColor } from '@/lib/colors';

interface CarCardProps {
    car: StockCar;
    modelName?: string;
    colorName?: string;
    upholsteryName?: string;
    individualColorName?: string;
    showAmbilight?: boolean; // Default true
}

export function CarCard({ car, modelName, colorName, upholsteryName, individualColorName, showAmbilight = true }: CarCardProps) {
    const isAvailable = car.status_code >= 190 || ['SH', 'ST'].includes(car.processing_type);
    const hasMSport = car.option_codes.includes('337');
    const isMSeries = (car.series || '').includes('Seria M');
    const isElectric = car.fuel_type === 'Elektryczny';

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('pl-PL', { style: 'currency', currency: car.currency, maximumFractionDigits: 0 }).format(price);

    const { addCar: addGarageCar, removeCar: removeGarageCar, isSaved } = useGarageStore();
    const { compareCars, addCar: addCompareCar, removeCar: removeCompareCar } = useCompareStore();

    const isCarCompared = useCompareStore(state => state.compareCars.some(c => c.vin === car.vin));
    const isCarSaved = useGarageStore(state => state.savedCars?.some((c: any) => c.vin === car.vin));

    const [clientMounted, setClientMounted] = useState(false);
    useEffect(() => { setClientMounted(true); }, []);

    const saved = clientMounted && isCarSaved;
    const compared = clientMounted && isCarCompared;

    const toggleGarage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (saved) {
            removeGarageCar(car.vin);
        } else {
            addGarageCar(car);
        }
    };

    const toggleCompare = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (compared) {
            removeCompareCar(car.vin);
        } else {
            if (compareCars.length >= 3) {
                alert("Możesz porównywać maksymalnie 3 samochody jednocześnie.");
                return;
            }
            addCompareCar(car);
        }
    };

    // --- Image Logic ---
    const allImages = car.images || [];
    const hasImages = allImages.length > 0;

    // Ostatnie zdjęcie z galerii to zawsze wnętrze w naszych systemach
    const interiorImage = hasImages && allImages.length > 1 ? allImages[allImages.length - 1] : null;

    // Do scrubbowania wyciągamy pierwsze max 5 zdjęć (ale wykluczamy to, które użyliśmy jako wnętrze)
    const scrubImages = hasImages
        ? allImages.filter(img => img.url !== interiorImage?.url).slice(0, 5)
        : [];

    const displayImages = scrubImages.length > 0 ? scrubImages : (interiorImage ? [interiorImage] : []);

    const [activeImgIdx, setActiveImgIdx] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (displayImages.length <= 1) return;
        const { left, width } = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - left;
        const sectionWidth = width / displayImages.length;
        const newIndex = Math.min(Math.floor(x / sectionWidth), displayImages.length - 1);
        if (newIndex !== activeImgIdx) setActiveImgIdx(newIndex);
    };

    const handleMouseLeave = () => {
        setActiveImgIdx(0);
    };

    // Calculate effective price (for crossed out old price presentation)
    const effectivePrice = car.special_price && car.special_price < car.list_price ? car.special_price : car.list_price;
    const hasDiscount = car.special_price && car.special_price < car.list_price;

    return (
        <div
            className="group relative flex flex-col md:block w-full min-h-[auto] md:h-[400px] lg:h-[480px] transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-transform cursor-pointer shadow-sm hover:shadow-2xl md:hover:-translate-y-1 z-10"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* Ambilight Glow Underlay (Outside Overflow) */}
            {showAmbilight && (isMSeries || isElectric) && (
                <div
                    className={cn(
                        "hidden md:block absolute -inset-3 opacity-0 transition-all duration-700 z-[-1] rounded-3xl pointer-events-none blur-2xl group-hover:opacity-90 mix-blend-screen",
                        isMSeries
                            ? "bg-gradient-to-tr from-[#53A0DE] via-[#02256E] to-[#E40424]"
                            : "bg-gradient-to-tr from-[#0653B6] via-[#106ABF] to-[#2E95D3]"
                    )}
                />
            )}

            <Link
                href={`/cars/${encodeURIComponent(car.vin)}`}
                className={cn(
                    "absolute inset-0 overflow-hidden rounded-2xl block",
                    isMSeries ? "bg-[#0f0f0f] border border-[#222]" : "bg-white md:bg-black border border-gray-100 md:border-transparent group-hover:border-white/10",
                    compared && "ring-2 ring-blue-500 ring-offset-2 ring-offset-white"
                )}
            >
                {/* Background Images + Scrubbing (Responsive height on mobile, full absolute on md) */}
                <div className="relative w-full h-[260px] sm:h-[340px] md:h-full md:absolute md:inset-0 z-0 bg-gray-900 overflow-hidden shrink-0 border-b md:border-none border-white/5">
                    {displayImages.length > 0 ? (
                        <>
                            {/* Desktop Hover Scrubbing */}
                            <div className="hidden md:block absolute inset-0">
                                {displayImages.map((img, idx) => (
                                    <img
                                        key={idx}
                                        src={img.url}
                                        alt={`${modelName || car.model_code}`}
                                        className={cn(
                                            "absolute inset-0 w-full h-full object-cover transition-opacity duration-300 pointer-events-none group-hover:scale-105 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
                                            idx === activeImgIdx ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                ))}
                            </div>

                            {/* Mobile Static Image */}
                            <div className="md:hidden absolute inset-0 z-10">
                                <img src={displayImages[0].url} alt={`${modelName || car.model_code}`} className="w-full h-full object-cover" />
                            </div>
                        </>
                    ) : (
                        <div className="absolute inset-0 w-full h-full">
                            <img
                                src="/images/car-cover.png"
                                alt="Vehicle in Preparation"
                                className="absolute inset-0 w-full h-full object-cover opacity-90 pointer-events-none md:group-hover:scale-105 ease-[cubic-bezier(0.2,0.8,0.2,1)] transition-transform duration-700"
                            />
                            <div className="absolute inset-0 flex items-center justify-center p-4">
                                <div className="bg-black/60 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full shadow-lg pointer-events-none z-10 transition-transform md:group-hover:scale-105 duration-700">
                                    <span className="text-white text-[10px] md:text-xs font-bold uppercase tracking-widest text-center shadow-black drop-shadow-md">
                                        Oferta w przygotowaniu
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Scrubber Tick Indicators */}
                    {displayImages.length > 1 && (
                        <div className="hidden md:flex absolute top-2.5 left-0 right-0 z-10 justify-center gap-1.5 px-8 transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                            {displayImages.map((_, idx) => (
                                <div key={idx} className={cn("h-0.5 rounded-full flex-1 transition-all duration-300", idx === activeImgIdx ? "bg-white" : "bg-white/30")} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Soft Lounge Gradient Overlay for Desktop only */}
                <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity duration-700 ease-in-out" />

                {/* Top Left: Floating Actions */}
                <div className="absolute top-5 left-5 z-30 flex flex-col items-start gap-2">
                    <button
                        onClick={toggleGarage}
                        className={cn(
                            "group/btn flex items-center h-8 rounded-full backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] shadow-[0_4px_20px_rgba(0,0,0,0.25)] origin-left border",
                            saved ? "bg-white text-black border-white" : "bg-black/50 hover:bg-black/70 text-white border-white/20"
                        )}
                    >
                        <div className="w-8 h-8 flex items-center justify-center shrink-0">
                            <Warehouse className={cn("w-3.5 h-3.5 transition-transform duration-300", !saved && "group-hover/btn:-translate-y-0.5")} />
                        </div>
                        <div className="grid grid-cols-[0fr] group-hover/btn:grid-cols-[1fr] transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]">
                            <div className="overflow-hidden flex items-center">
                                <span className="whitespace-nowrap pr-4 text-[10px] uppercase font-bold tracking-wider opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100 group-hover/btn:delay-100">
                                    {saved ? "W garażu" : "Zaparkuj"}
                                </span>
                            </div>
                        </div>
                    </button>
                    <button
                        onClick={toggleCompare}
                        className={cn(
                            "group/btn flex items-center h-8 rounded-full backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] shadow-[0_4px_20px_rgba(0,0,0,0.25)] origin-left border",
                            compared ? "bg-blue-600 text-white border-blue-600" : "bg-black/50 hover:bg-black/70 text-white border-white/20"
                        )}
                    >
                        <div className="w-8 h-8 flex items-center justify-center shrink-0">
                            <Scale className={cn("w-3.5 h-3.5 transition-transform duration-300", !compared && "group-hover/btn:-translate-y-0.5")} />
                        </div>
                        <div className="grid grid-cols-[0fr] group-hover/btn:grid-cols-[1fr] transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]">
                            <div className="overflow-hidden flex items-center">
                                <span className="whitespace-nowrap pr-4 text-[10px] uppercase font-bold tracking-wider opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100 group-hover/btn:delay-100">
                                    {compared ? "Dodane" : "Porównaj"}
                                </span>
                            </div>
                        </div>
                    </button>
                </div>

                {/* Brand Badges Top Right */}
                    <div className="absolute top-4 right-4 z-30 flex flex-col items-end gap-1.5 text-[9px] uppercase font-bold tracking-widest text-white">
                        {car.available_count && car.available_count > 1 && (
                            <div className={cn("px-2.5 py-1.5 rounded-sm border shadow-sm", isMSeries ? "bg-black/80 border-white/20 text-white backdrop-blur-xl" : "bg-white border-gray-200 text-gray-800 shadow-sm")}>
                                {car.available_count} {getPluralForm(car.available_count, 'dostępny', 'dostępne', 'dostępnych')}
                            </div>
                        )}
                    </div>

                {/* Bottom Content Area */}
                <div className="relative md:absolute md:inset-x-0 md:bottom-0 z-20 flex flex-col justify-end p-5 md:p-8 w-full flex-1">

                    {/* Wrap the moving elements in a container that handles the hover translation. Static on mobile. */}
                    <div className="relative w-full h-full flex flex-col justify-end transform md:transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] md:group-hover:-translate-y-[110px] z-10">

                        {/* Title & Static Info */}
                        <div className="flex items-end justify-between gap-3 md:gap-5">
                            <div className="flex-1 min-w-0 pr-6 md:pr-0">
                                <p className={cn("text-[10px] uppercase font-mono tracking-widest mb-1.5 md:mb-2 md:opacity-70 group-hover:opacity-100 transition-opacity", isMSeries ? "text-white/60 md:text-white/60" : "text-gray-500 md:text-white/60")}>
                                    {car.vin}
                                </p>
                                <h3 className={cn("text-[20px] sm:text-[26px] md:text-[32px] font-bold tracking-tight leading-[1.05] line-clamp-2 md:pr-4", isMSeries ? "text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300" : "text-gray-900 md:text-white")}>
                                    {modelName || `BMW Model ${car.model_code}`}
                                </h3>

                                <div className="flex flex-col items-start mt-1.5 md:mt-2">
                                    {hasDiscount && (
                                        <span className={cn("text-[10px] sm:text-xs font-bold line-through decoration-red-500/50 mb-0.5", isMSeries ? "text-white/50" : "text-gray-500 md:text-white/50")}>
                                            {formatPrice(car.list_price)}
                                        </span>
                                    )}
                                    <span className={cn("text-xl sm:text-2xl font-black tracking-tight leading-none", isMSeries ? "text-white" : "text-gray-900 md:text-white")}>
                                        {formatPrice(effectivePrice)}
                                    </span>
                                </div>
                            </div>

                            {/* Premium Interactive PIP Thumbnail - Interior view */}
                            {interiorImage && (
                                <Link href={`/cars/${encodeURIComponent(car.vin)}`} className="group/pip md:relative absolute right-5 -top-10 md:top-auto md:right-auto z-50 shrink-0 ml-4 md:mb-2 w-16 h-16 sm:w-[72px] sm:h-[72px] cursor-pointer block">
                                    {/* The Expanding PIP container */}
                                    {/* By using specific pixel radiuses (rounded-[32px] for 64px, rounded-[36px] for 72px) instead of rounded-full, the border-radius transitions perfectly smoothly to rounded-[24px] without weird snapping mid-animation. */}
                                    <div className="absolute bottom-0 right-0 overflow-hidden w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-[32px] sm:rounded-[36px] border border-white/30 shadow-[0_8px_20px_rgba(0,0,0,0.5)] bg-black/40 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover/pip:w-[280px] group-hover/pip:h-[200px] group-hover/pip:rounded-[20px] group-hover/pip:shadow-[0_24px_48px_rgba(0,0,0,0.6)] group-hover/pip:border-white/40">
                                        <img src={interiorImage.url} alt="Wnętrze" className="absolute inset-0 w-full h-full object-cover scale-[1.3] group-hover/pip:scale-100 transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]" />
                                    </div>
                                </Link>
                            )}
                        </div>

                        {/* Glassmorphism Specs Drawer */}
                        {/* Inline visible on mobile, absolute hover on desktop */}
                        <div className="mt-5 md:mt-0 md:absolute md:top-[100%] left-0 right-0 md:pt-6 md:opacity-0 md:transition-opacity md:duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] md:group-hover:opacity-100 z-10 w-full">
                            <div className={cn("rounded-[16px] md:rounded-[20px] p-4 md:p-5 grid grid-cols-2 gap-x-4 md:gap-x-5 gap-y-4 shadow-sm md:shadow-[0_8px_30px_rgba(0,0,0,0.5)] border",
                                isMSeries ? "bg-white/5 md:bg-black/60 md:backdrop-blur-2xl border-white/5 md:border-white/20" : "bg-gray-50 md:bg-black/60 md:backdrop-blur-2xl border-gray-100 md:border-white/20")}>
                                <div className="flex flex-col min-w-0">
                                    <span className={cn("text-[8px] uppercase font-bold tracking-wider mb-0.5 md:mb-1", isMSeries ? "text-white/40" : "text-gray-400 md:text-white/40")}>Lakier</span>
                                    {car.color_code === '490' ? (
                                        <BMWIndividualBadge
                                            compact
                                            className={cn("text-[10px] font-bold uppercase", isMSeries ? "text-white drop-shadow-md" : "text-gray-900 md:text-white md:drop-shadow-md")}
                                            colorName={individualColorName || car.individual_color}
                                        />
                                    ) : (
                                        <span className={cn("text-[10px] font-bold uppercase break-words leading-tight mt-0.5", isMSeries ? "text-white drop-shadow-md" : "text-gray-900 md:text-white md:drop-shadow-md")}>{colorName || car.color_code}</span>
                                    )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className={cn("text-[8px] uppercase font-bold tracking-wider mb-0.5 md:mb-1", isMSeries ? "text-white/40" : "text-gray-400 md:text-white/40")}>Tapicerka</span>
                                    <span className={cn("text-[10px] font-bold uppercase break-words leading-tight mt-0.5", isMSeries ? "text-white drop-shadow-md" : "text-gray-900 md:text-white md:drop-shadow-md")}>{upholsteryName || car.upholstery_code}</span>
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className={cn("text-[8px] uppercase font-bold tracking-wider mb-0.5 md:mb-1", isMSeries ? "text-white/40" : "text-gray-400 md:text-white/40")}>Napęd</span>
                                    <span className={cn("text-[10px] font-bold uppercase truncate", isElectric && !isMSeries ? "text-blue-600 md:text-blue-300" : isMSeries ? "text-white drop-shadow-md" : "text-gray-900 md:text-white md:drop-shadow-md")}>
                                        {car.fuel_type} • {car.power} KM
                                    </span>
                                </div>
                                <div className="flex flex-col justify-end items-end min-w-0">
                                    <div className={cn("flex items-center gap-1.5 transition-colors", isMSeries ? "text-white/40 group-hover/link:text-white" : "text-gray-400 md:text-white/40 md:group-hover/link:text-white")}>
                                        <span className="text-[10px] uppercase tracking-widest font-bold">Detale</span>
                                        <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* M Bottom Accent Border */}
                {isMSeries && (
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 flex z-30">
                        <div className="flex-1 bg-[#53A0DE]" />
                        <div className="flex-1 bg-[#02256E]" />
                        <div className="flex-1 bg-[#E40424]" />
                    </div>
                )}

                {/* Electric Bottom Accent Border */}
                {isElectric && !isMSeries && (
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0653B6] to-[#2E95D3] z-30" />
                )}
            </Link>
        </div>
    );
}
