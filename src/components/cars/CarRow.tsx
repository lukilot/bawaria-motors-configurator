'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StockCar } from '@/types/stock';
import { cn } from '@/lib/utils';
import { ArrowRight, Warehouse, Scale, X } from 'lucide-react';
import { BMWIndividualBadge } from './BMWIndividualBadge';
import { useGarageStore } from '@/store/garageStore';
import { useCompareStore } from '@/store/compareStore';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getColor } from '@/lib/colors';
import { resolveDictionaryEntry } from '@/lib/dictionary-fetch';
import { getPluralForm } from '@/lib/plurals';

interface CarRowProps {
    car: StockCar;
    modelName: string;
    dictionaries: {
        model: Record<string, any>;
        color: Record<string, any>;
        upholstery: Record<string, any>;
        option: Record<string, any>;
        drivetrain: Record<string, any>;
    };
    discountedPrice?: number;
}

export function CarRow({ car, modelName, dictionaries, discountedPrice }: CarRowProps) {
    const isSold = (car.order_status || '').includes('Sprzedany');
    const reservationStr = (car.reservation_details || '').trim();
    const isReserved = !!reservationStr && reservationStr.toLowerCase() !== 'rezerwuj';
    const isReady = car.status_code > 190;
    const isMSeries = (car.series || '').includes('Seria M');
    const isElectric = car.fuel_type === 'Elektryczny';

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('pl-PL', { style: 'currency', currency: car.currency, maximumFractionDigits: 0 }).format(price);

    const { addCar: addGarageCar, removeCar: removeGarageCar } = useGarageStore();
    const { compareCars, addCar: addCompareCar, removeCar: removeCompareCar } = useCompareStore();

    const isCarCompared = useCompareStore(state => state.compareCars.some(c => c.product_group_id === car.product_group_id));
    const isCarSaved = useGarageStore(state => state.savedCars?.some((c: any) => c.product_group_id === car.product_group_id));

    const [clientMounted, setClientMounted] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    useEffect(() => { setClientMounted(true); }, []);

    const router = useRouter();

    const saved = clientMounted && isCarSaved;
    const compared = clientMounted && isCarCompared;

    const toggleGarage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (saved) {
            removeGarageCar(car.product_group_id!);
        } else {
            addGarageCar(car);
        }
    };

    const toggleCompare = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (compared) {
            removeCompareCar(car.product_group_id!);
        } else {
            if (compareCars.length >= 3) {
                alert("Możesz porównywać maksymalnie 3 samochody jednocześnie.");
                return;
            }
            addCompareCar(car);
        }
    };

    const displayedModelName = modelName || `BMW ${car.model_code}`;

    // Image Logic
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

    const rawEffectivePrice = (car.special_price && car.special_price < car.list_price)
        ? car.special_price
        : (discountedPrice && discountedPrice < car.list_price)
            ? discountedPrice
            : car.list_price;

    const hasDiscount = rawEffectivePrice < car.list_price;
    
    // Resolve names for the main view and spec drawer
    const colorOpt = resolveDictionaryEntry(car.color_code, dictionaries, 'option', car.body_group);
    const colorName = colorOpt?.name || (car.color_code === '490'
        ? (dictionaries.color[car.individual_color || '']?.name || car.individual_color || 'BMW Individual')
        : (dictionaries.color[car.color_code]?.name || car.color_code));

    const upholsteryOpt = resolveDictionaryEntry(car.upholstery_code, dictionaries, 'option', car.body_group);
    const upholsteryName = upholsteryOpt?.name || (dictionaries.upholstery[car.upholstery_code]?.name || car.upholstery_code);

    return (
        <div className="group relative w-full transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-transform shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] md:hover:-translate-y-1 z-10">
            {/* Ambilight Glow Underlay */}
            {(isMSeries || isElectric) && (
                <div
                    className={cn(
                        "hidden md:block absolute -inset-2 opacity-0 transition-all duration-700 z-[-1] rounded-3xl pointer-events-none blur-2xl group-hover:opacity-90 mix-blend-screen",
                        isMSeries
                            ? "bg-gradient-to-tr from-[#53A0DE] via-[#02256E] to-[#E40424]"
                            : "bg-gradient-to-tr from-[#0653B6] via-[#106ABF] to-[#2E95D3]"
                    )}
                />
            )}

            <div className={cn(
                "rounded-2xl overflow-hidden relative flex flex-col md:flex-row min-h-auto md:min-h-[220px] lg:h-[280px]",
                isMSeries
                    ? "bg-[#18181A] border border-white/5 group-hover:border-white/10"
                    : "bg-white border border-gray-100 group-hover:border-gray-200/80",
                isSold && "opacity-60 grayscale-[0.5]",
                compared && "ring-2 ring-blue-500 ring-offset-2 ring-offset-white"
            )}>
                {/* Left Image Pane (Scrubbable) */}
                <div
                    className="w-full h-[260px] sm:h-[320px] md:h-auto md:w-[45%] lg:w-[40%] relative bg-gray-900 overflow-hidden shrink-0 border-b md:border-b-0 border-white/5"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                >
                    {/* Images */}
                    <Link href={`/cars/${car.product_group_id!.slice(0, 8).toUpperCase()}`} className={cn("absolute inset-0 z-0", isSold && "cursor-default pointer-events-none")} prefetch={false}>
                        {displayImages.length > 0 ? (
                            <>
                                {/* Desktop Hover Scrubbing Images */}
                                <div className="hidden md:block absolute inset-0">
                                    {displayImages.map((img, idx) => (
                                        <img
                                            key={idx}
                                            src={img.url}
                                            alt={`${displayedModelName}`}
                                            className={cn(
                                                "absolute inset-0 w-full h-full object-cover transition-opacity duration-300 pointer-events-none group-hover:scale-105 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
                                                idx === activeImgIdx ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                    ))}
                                </div>

                                {/* Mobile Static Image */}
                                <div className="md:hidden absolute inset-0 z-10">
                                    <img src={displayImages[0].url} alt={`${displayedModelName}`} className="w-full h-full object-cover" />
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

                        {/* Gradient Overlay for buttons readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10 pointer-events-none opacity-60 md:transition-opacity duration-700 md:group-hover:opacity-80" />

                        {/* Scrubber Ticks */}
                        {displayImages.length > 1 && (
                            <div className="hidden md:flex absolute top-5 left-0 right-0 z-20 justify-center gap-2 px-6 transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                                {displayImages.map((_, idx) => (
                                    <div key={idx} className={cn("h-[3px] rounded-full flex-1 max-w-[40px] transition-all duration-300", idx === activeImgIdx ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "bg-white/30")} />
                                ))}
                            </div>
                        )}
                    </Link>


                    {/* Interior PIP — Desktop: Link to VDP, Mobile: Lightbox trigger — bottom-right corner */}
                    {interiorImage && (
                        <>
                            {/* Desktop: hover-expand link to VDP */}
                            <Link
                                href={`/cars/${car.product_group_id!.slice(0, 8).toUpperCase()}`}
                                className="hidden md:block absolute bottom-5 right-5 z-40 group/pip w-16 h-16 sm:w-[72px] sm:h-[72px] cursor-pointer"
                            >
                                <div className="absolute bottom-0 right-0 overflow-hidden w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-[32px] sm:rounded-[36px] border border-white/30 shadow-[0_4px_12px_rgba(0,0,0,0.4)] bg-black/40 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover/pip:w-[280px] sm:group-hover/pip:w-[320px] group-hover/pip:h-[200px] sm:group-hover/pip:h-[220px] group-hover/pip:rounded-[20px] group-hover/pip:shadow-[0_24px_48px_rgba(0,0,0,0.6)] group-hover/pip:border-white/40">
                                    <img src={interiorImage.url} alt="Wnętrze" className="absolute inset-0 w-full h-full object-cover scale-[1.3] group-hover/pip:scale-100 transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]" />
                                </div>
                            </Link>

                            {/* Mobile: tap opens lightbox — bottom-RIGHT corner (was bottom-left) */}
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsLightboxOpen(true); }}
                                className="md:hidden absolute bottom-4 right-4 z-40 w-14 h-14 rounded-[24px] overflow-hidden border border-white/30 shadow-[0_4px_16px_rgba(0,0,0,0.5)] active:scale-95 transition-transform"
                            >
                                <img src={interiorImage.url} alt="Wnętrze" className="w-full h-full object-cover scale-[1.2]" />
                                <div className="absolute inset-0 bg-black/15" />
                            </button>
                        </>
                    )}

                    {/* Mobile — Action Buttons: Zapisz top-left, Porównaj top-right */}
                    <button
                        onClick={toggleGarage}
                        className={cn(
                            "md:hidden absolute top-4 left-4 z-40 flex items-center gap-1.5 px-3 py-2 rounded-full backdrop-blur-md text-[9px] font-bold uppercase tracking-wider transition-all",
                            saved
                                ? "bg-gray-900/90 text-white border border-white/20"
                                : "bg-black/50 text-white/70 border border-white/10 active:bg-black/80"
                        )}
                    >
                        <Warehouse className="w-3.5 h-3.5" />
                        {saved ? 'Zapisany' : 'Zapisz'}
                    </button>
                    <button
                        onClick={toggleCompare}
                        className={cn(
                            "md:hidden absolute top-4 right-4 z-40 flex items-center gap-1.5 px-3 py-2 rounded-full backdrop-blur-md text-[9px] font-bold uppercase tracking-wider transition-all",
                            compared
                                ? "bg-blue-600/90 text-white border border-blue-400/30"
                                : "bg-black/50 text-white/70 border border-white/10 active:bg-black/80"
                        )}
                    >
                        <Scale className="w-3.5 h-3.5" />
                        {compared ? 'Dodany' : 'Porównaj'}
                    </button>
                </div>

                {/* Interior Lightbox Portal — rendered in document.body to escape card's will-change-transform stacking context */}
                {clientMounted && createPortal(
                    <AnimatePresence>
                        {isLightboxOpen && interiorImage && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center p-4"
                                onClick={() => setIsLightboxOpen(false)}
                            >
                                {/* Header label */}
                                <p className="text-white/40 text-[10px] uppercase tracking-[0.25em] font-bold mb-5">Wnętrze</p>

                                {/* Interior Image */}
                                <img
                                    src={interiorImage.url}
                                    alt="Wnętrze"
                                    className="max-h-[65dvh] max-w-full w-full object-contain rounded-2xl shadow-2xl"
                                    onClick={(e) => e.stopPropagation()}
                                />

                                {/* Bottom Action Bar */}
                                <div
                                    className="flex flex-row items-stretch gap-3 w-full max-w-md mt-6"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* Primary: Detale button */}
                                    <button
                                        onClick={() => router.push(`/cars/${car.product_group_id!.slice(0, 8).toUpperCase()}`)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-white text-black rounded-2xl py-4 text-[11px] font-bold uppercase tracking-[0.2em] shadow-lg active:scale-[0.98] transition-transform"
                                    >
                                        <span>Detale</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </button>

                                    {/* Secondary: Zamknij button */}
                                    <button
                                        onClick={() => setIsLightboxOpen(false)}
                                        className="flex items-center justify-center gap-2 bg-white/10 text-white/80 rounded-2xl px-5 py-4 text-[11px] font-bold uppercase tracking-[0.2em] border border-white/10 active:bg-white/20 active:scale-[0.98] transition-all"
                                    >
                                        <X className="w-4 h-4" />
                                        <span>Zamknij</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body
                )}

                {/* Right Info Pane */}
                <Link href={`/cars/${car.product_group_id}`} className={cn("flex-1 p-5 lg:p-8 flex flex-col justify-between md:justify-end relative overflow-hidden", isSold && "cursor-default pointer-events-none")}>

                    {/* Minimalist Action Buttons — Desktop only (hidden on mobile, shown in gallery instead) */}
                    <div className="hidden md:flex absolute top-5 left-5 lg:top-8 lg:left-8 z-30 flex-row items-center gap-5">
                        <button
                            onClick={toggleGarage}
                            className={cn(
                                "flex items-center gap-2 group/action hover:opacity-100 transition-opacity duration-300",
                                saved
                                    ? (isMSeries ? "text-white opacity-100" : "text-black opacity-100")
                                    : (isMSeries ? "text-white opacity-40" : "text-gray-900 opacity-40")
                            )}
                        >
                            <Warehouse className={cn("w-4 h-4 transition-transform duration-300 origin-bottom", !saved && "group-hover/action:scale-110")} />
                            <span className="text-[9px] uppercase font-bold tracking-[0.2em]">{saved ? "Zapisany" : "Zapisz"}</span>
                        </button>

                        <button
                            onClick={toggleCompare}
                            className={cn(
                                "flex items-center gap-2 group/action hover:opacity-100 transition-opacity duration-300",
                                compared
                                    ? "text-blue-500 opacity-100"
                                    : (isMSeries ? "text-white opacity-40" : "text-gray-900 opacity-40")
                            )}
                        >
                            <Scale className={cn("w-4 h-4 transition-transform duration-300 origin-bottom", !compared && "group-hover/action:scale-110")} />
                            <span className="text-[9px] uppercase font-bold tracking-[0.2em]">{compared ? "Dodany" : "Porównaj"}</span>
                        </button>
                    </div>

                    {/* Brand Badges Top Right (hidden on mobile when lightbox open) */}
                    <div className={cn("absolute top-4 md:top-5 right-4 md:right-5 z-30 flex flex-col items-end gap-1.5 text-[9px] uppercase font-bold tracking-widest text-white", isLightboxOpen && "hidden")}>
                        {car.available_count && car.available_count > 1 && (
                            <div className={cn("px-2.5 py-1.5 rounded-sm border shadow-sm", isMSeries ? "bg-black/80 border-white/20 text-white backdrop-blur-xl" : "bg-white border-gray-200 text-gray-800 shadow-sm")}>
                                {car.available_count} {getPluralForm(car.available_count, 'dostępny', 'dostępne', 'dostępnych')}
                            </div>
                        )}
                    </div>

                    {/* Transform Container for Title & Price */}
                    <div className="relative w-full flex flex-col md:justify-end transform md:transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] md:group-hover:-translate-y-[90px] lg:group-hover:-translate-y-[85px] z-10">
                        <div className="flex flex-col xl:flex-row xl:justify-between items-start xl:items-end gap-3 md:gap-5">
                            <div className="flex-1 min-w-0 pr-8 md:pr-0">
                                <div className={cn("flex items-center gap-3 md:gap-4 mb-2", isLightboxOpen && "invisible")}>
                                    <span className={cn("text-[9px] md:text-[10px] font-mono tracking-widest uppercase opacity-70 group-hover:opacity-100 transition-opacity", isMSeries ? "text-white/60" : "text-gray-500")}>
                                        OFERTA: {car.product_group_id!.slice(0, 8).toUpperCase()}
                                    </span>
                                    {/* Status Badges */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {isSold && (
                                            <span className={cn("px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-sm", isMSeries ? "bg-white/10 text-white/50" : "bg-gray-100 text-gray-500")}>
                                                Sprzedany
                                            </span>
                                        )}
                                        {!isSold && isReady && (
                                            <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-sm", isMSeries ? "bg-white/5 border border-green-900/40 text-green-400" : "bg-green-50/80 text-green-700")}>
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shrink-0" />
                                                Od ręki
                                            </span>
                                        )}
                                        {!isSold && isReserved && (
                                            <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-sm", isMSeries ? "bg-white/5 border border-yellow-900/40 text-yellow-500" : "bg-yellow-50 text-yellow-700")}>
                                                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full shrink-0" />
                                                Rezerwacja
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <h3 className={cn("text-[20px] sm:text-[26px] lg:text-[32px] font-bold tracking-tight leading-[1.1] line-clamp-2 md:pr-4 transition-colors duration-300",
                                    isMSeries ? "text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400" : "text-gray-900"
                                )}>
                                    {displayedModelName}
                                </h3>
                            </div>

                            {/* Price Block */}
                            <div className="flex flex-row md:flex-col items-end justify-between md:justify-end xl:items-end w-full xl:w-auto mt-1 md:mt-0 xl:min-w-[140px] border-t md:border-t-0 pt-3 md:pt-0 border-gray-200/50">
                                <div className="flex flex-col md:items-end w-full">
                                    <span className={cn("text-[8px] md:text-[9px] uppercase tracking-[0.2em] font-bold mb-0.5", isMSeries ? "text-white/40" : "text-gray-400")}>Oferta</span>
                                    <div className="flex flex-col items-start md:items-end">
                                        {hasDiscount ? (
                                            <>
                                                <span className={cn("text-[10px] sm:text-[11px] font-bold line-through decoration-red-500/50 mb-0.5", isMSeries ? "text-white/50" : "text-gray-500")}>
                                                    {formatPrice(car.list_price)}
                                                </span>
                                                <span className={cn("text-[20px] sm:text-[22px] lg:text-[24px] font-black tracking-tight leading-none", isMSeries ? "text-white" : "text-gray-900")}>
                                                    {formatPrice(rawEffectivePrice)}
                                                </span>
                                            </>
                                        ) : (
                                            <span className={cn("text-[20px] sm:text-[22px] lg:text-[24px] font-black tracking-tight leading-none mt-3 md:mt-2", isMSeries ? "text-white" : "text-gray-900")}>
                                                {formatPrice(car.list_price)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Spec Drawer (Slides in at bottom on desktop like a notch, statically visible on mobile inline) */}
                    <div className="mt-5 md:mt-0 md:absolute md:bottom-0 md:left-5 md:right-5 lg:left-8 lg:right-8 md:opacity-0 transform md:translate-y-full md:group-hover:translate-y-0 md:transition-all md:duration-700 md:ease-[cubic-bezier(0.2,0.8,0.2,1)] md:group-hover:opacity-100 z-10">
                        <div className={cn("rounded-[16px] md:rounded-t-[20px] md:rounded-b-none p-4 md:p-5 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-4 md:shadow-[0_-8px_30px_rgba(0,0,0,0.06)]",
                            isMSeries ? "bg-white/5 md:bg-black/95 border border-white/5 md:border-white/10 md:border-b-0 md:backdrop-blur-2xl" : "bg-gray-50 md:bg-white/95 border border-gray-100 md:border-gray-200/80 md:border-b-0 md:backdrop-blur-2xl")}>
                            <div className="flex flex-col min-w-0">
                                <span className={cn("text-[8px] uppercase font-bold tracking-wider mb-1", isMSeries ? "text-white/40" : "text-gray-400")}>Lakier</span>
                                 {car.color_code === '490' ? (
                                     <BMWIndividualBadge
                                         compact
                                         className={cn("text-[10px] font-bold uppercase", isMSeries ? "text-white drop-shadow-md" : "text-gray-900")}
                                         colorName={colorName}
                                     />
                                 ) : (
                                     <span className={cn("text-[10px] font-bold uppercase break-words leading-tight mt-0.5", isMSeries ? "text-white drop-shadow-md" : "text-gray-900")}>
                                         {colorName}
                                     </span>
                                 )}
                            </div>
                             <div className="flex flex-col min-w-0">
                                 <span className={cn("text-[8px] uppercase font-bold tracking-wider mb-1", isMSeries ? "text-white/40" : "text-gray-400")}>Tapicerka</span>
                                 <span className={cn("text-[10px] font-bold uppercase break-words leading-tight mt-0.5", isMSeries ? "text-white drop-shadow-md" : "text-gray-900")}>
                                     {upholsteryName}
                                 </span>
                             </div>
                            <div className="flex flex-col">
                                <span className={cn("text-[8px] uppercase font-bold tracking-wider mb-1", isMSeries ? "text-white/40" : "text-gray-400")}>Napęd</span>
                                <span className={cn("text-[10px] font-bold uppercase truncate", isElectric && !isMSeries ? "text-blue-600" : isMSeries ? "text-white drop-shadow-md" : "text-gray-900")}>
                                    {car.fuel_type || '-'} • {car.power ? `${car.power} KM` : '-'}
                                </span>
                            </div>
                            <div className="flex flex-col justify-end items-end">
                                <div className={cn("flex items-center gap-1.5 transition-colors", isMSeries ? "text-white/40 group-hover/link:text-white" : "text-gray-400 group-hover/link:text-gray-900")}>
                                    <span className="text-[10px] uppercase tracking-widest font-bold">Detale</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Border Accent */}
                    {isMSeries && (
                        <div className="absolute bottom-0 left-0 right-0 h-1.5 flex z-30 opacity-80 group-hover:opacity-100 transition-opacity">
                            <div className="flex-1 bg-[#53A0DE]" />
                            <div className="flex-1 bg-[#02256E]" />
                            <div className="flex-1 bg-[#E40424]" />
                        </div>
                    )}
                    {isElectric && !isMSeries && (
                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0653B6] to-[#2E95D3] z-30 opacity-80 group-hover:opacity-100 transition-opacity" />
                    )}
                </Link>

            </div>
        </div>
    );
}
