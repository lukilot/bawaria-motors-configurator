import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { StockCar } from '@/types/stock';
import { cn } from '@/lib/utils';

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
};

export function CarRow({ car, modelName, dictionaries, discountedPrice }: CarRowProps) {
    // Logic to determine availability
    // Logic to determine availability
    // Logic to determine availability
    const isSold = (car.order_status || '').includes('Sprzedany');
    const reservationStr = (car.reservation_details || '').trim();
    const isReserved = !!reservationStr && reservationStr.toLowerCase() !== 'rezerwuj';
    // Available if status > 190 (regardless of reservation, but logic below handles display)
    const isReady = car.status_code > 190;
    const isMSeries = (car.series || '').includes('Seria M');
    const isElectric = car.fuel_type === 'Elektryczny';

    const hasImages = car.images && car.images.length > 0;

    // Pricing
    const formatPrice = (price: number) =>
        new Intl.NumberFormat('pl-PL', { style: 'currency', currency: car.currency }).format(price);

    // Image Logic
    // 1. Main Image (First)
    // 2. Thumbnails (Next 2)
    // 3. Last Image (Assumed Interior if enough images, otherwise 4th)

    // We want to show index 0 (Main), 1, 2, and then Last Key.

    let displayImages: { url: string, alt: string }[] = [];

    if (hasImages) {
        // Main Image
        const mainImg = car.images![0];

        // Middle Thumbnails (up to 2)
        const middleImgs = car.images!.slice(1, 3);

        // Last Image (Interior?) - only if we have more than 3 images to avoid dupes
        // If we have 4 images: 0, 1, 2, 3. 
        // If we have 3 images: 0, 1, 2.

        const lastImg = car.images!.length > 3 ? car.images![car.images!.length - 1] : (car.images!.length > 2 ? car.images![2] : null);

        // Filter out nulls and duplicates (basic check)
        // Actually, let's just grab 0, 1, 2, and Last.

        displayImages.push({ url: mainImg.url, alt: 'Front View' });

        middleImgs.forEach((img, idx) => displayImages.push({ url: img.url, alt: `View ${idx + 2}` }));

        if (lastImg && !middleImgs.includes(lastImg)) {
            displayImages.push({ url: lastImg.url, alt: 'Interior / Detail' });
        }

        // Limit to 4 total just in case
        displayImages = displayImages.slice(0, 4);
    }

    const displayedModelName = modelName || `BMW ${car.model_code}`;

    return (
        <div className={cn(
            "group rounded-sm overflow-hidden transition-all duration-300 relative",
            isMSeries
                ? "bg-[#1a1a1a] border border-[#333] hover:border-[#53A0DE]/30 hover:shadow-[0_20px_50px_-12px_rgba(83,160,222,0.2)]"
                : isElectric
                    ? "bg-white border border-blue-100 hover:border-blue-300 hover:shadow-[0_10px_40px_-10px_rgba(6,83,182,0.15)]"
                    : "bg-white border border-gray-100 hover:shadow-lg",
            isSold && "opacity-60 grayscale-[0.5] hover:shadow-none hover:opacity-60"
        )}>
            {/* Custom M Hover Gradient Shadow (Blur) - Subtle for List View */}
            {isMSeries && (
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#53A0DE] via-[#02256E] to-[#E40424] opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500 -z-10" />
            )}

            {/* Custom Electric Hover Gradient Shadow (Blue Glow) */}
            {isElectric && !isMSeries && (
                <div className="absolute -inset-0.5 bg-blue-400/20 opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500 -z-10" />
            )}

            <Link href={`/cars/${encodeURIComponent(car.vin)}`} className={cn("flex flex-col md:flex-row h-full", isSold && "cursor-default pointer-events-none")}>

                {/* Left: Images (Grid) */}
                <div className={cn("w-full md:w-[45%] lg:w-[40%] flex flex-col", isMSeries ? (hasImages ? "bg-[#0f0f0f]" : "bg-gray-200") : "bg-white")}>
                    {/* Main Image */}
                    <div className="relative aspect-[4/3] md:aspect-[16/10] overflow-hidden">
                        {hasImages ? (
                            <img
                                src={displayImages[0].url}
                                alt={displayImages[0].alt}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                        ) : (
                            // Cover Image Logic
                            <>
                                <img
                                    src="/images/car-cover.png"
                                    alt="In Preparation"
                                    className="w-full h-full object-cover opacity-80 mix-blend-multiply grayscale-[0.2]"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
                                    <span className="bg-white/90 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-900 border border-gray-200 shadow-sm">
                                        {isSold ? 'Pojazd Sprzedany' : 'Oferta w trakcie przygotowywania'}
                                    </span>
                                </div>
                            </>
                        )}
                        {/* M Badge on List View */}
                        {isMSeries && (
                            <div className="absolute top-0 right-0 z-20">
                                <div className="relative bg-black/80 backdrop-blur-md text-white px-3 py-1 flex items-center gap-2 skew-x-[-12deg] mr-[-10px] mt-2 translate-x-2">
                                    <span className="text-[9px] font-bold uppercase tracking-widest skew-x-[12deg] pr-2">M Power</span>
                                </div>
                            </div>
                        )}
                        {/* Electric Badge on List View */}
                        {isElectric && !isMSeries && (
                            <div className="absolute top-0 right-0 z-20">
                                <div className="relative bg-white/90 backdrop-blur-md text-[#0653B6] px-3 py-1 flex items-center gap-2 skew-x-[-12deg] mr-[-10px] mt-2 translate-x-2 border-l border-b border-blue-100 shadow-sm">
                                    <span className="text-[9px] font-bold uppercase tracking-widest skew-x-[12deg] pr-2">BMW i</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 3 Thumbnails Row */}
                    {hasImages && displayImages.length > 1 && (
                        <div className={cn("grid grid-cols-3 h-20 md:h-24 border-t", isMSeries ? "border-gray-800" : "border-gray-100")}>
                            {/* Slot 1 */}
                            <div className={cn("relative border-r overflow-hidden", isMSeries ? "border-gray-800" : "border-gray-100")}>
                                {displayImages[1] && (
                                    <img src={displayImages[1].url} className="w-full h-full object-cover" alt="" />
                                )}
                            </div>
                            {/* Slot 2 */}
                            <div className={cn("relative border-r overflow-hidden", isMSeries ? "border-gray-800" : "border-gray-100")}>
                                {displayImages[2] && (
                                    <img src={displayImages[2].url} className="w-full h-full object-cover" alt="" />
                                )}
                            </div>
                            {/* Slot 3 (Interior) */}
                            <div className="relative overflow-hidden">
                                {displayImages[3] && (
                                    <img src={displayImages[3].url} className="w-full h-full object-cover" alt="" />
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Details */}
                <div className="flex-1 p-5 flex flex-col relative">

                    {/* Header */}
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className={cn("text-2xl font-bold tracking-tight transition-colors", isMSeries ? "text-white group-hover:text-blue-400" : "text-gray-900 group-hover:text-blue-700")}>
                                    {displayedModelName}
                                </h3>
                                <div className="mt-0">
                                    <span className="text-[10px] text-gray-400 font-mono tracking-wider uppercase">
                                        {car.vin}
                                    </span>
                                </div>
                            </div>
                            {/* Badges Container */}
                            <div className="flex flex-col items-end gap-1">
                                {isSold && (
                                    <span className="px-2 py-1 bg-gray-200 text-gray-600 text-[10px] font-bold uppercase tracking-wider rounded-sm">
                                        Sprzedany
                                    </span>
                                )}

                                {!isSold && isReady && (
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm",
                                        isMSeries
                                            ? "bg-black/40 text-green-400 border border-green-900/50"
                                            : "bg-green-50 text-green-700"
                                    )}>
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shrink-0" />
                                        Dostępny od ręki
                                    </span>
                                )}

                                {!isSold && isReserved && (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-yellow-50 text-yellow-700 text-[10px] font-bold uppercase tracking-wider rounded-sm">
                                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full shrink-0" />
                                        Zarezerwowany
                                    </span>
                                )}

                                {/* Available Count Badge */}
                                {(car.available_count || 0) > 1 && (
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm border",
                                        isMSeries ? "bg-white/10 text-gray-300 border-white/10" : "bg-blue-50 text-blue-700 border-blue-100"
                                    )}>
                                        {car.available_count} szt. dostępnych
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className={cn("grid grid-cols-2 gap-y-3 gap-x-8 mt-4 text-sm", isMSeries ? "text-gray-400" : "text-gray-600")}>
                            <div className="flex flex-col">
                                <span className={cn("text-[10px] uppercase tracking-wider font-semibold italic", isMSeries ? "text-gray-500" : "text-gray-400")}>Lakier</span>
                                <span className={cn("font-medium truncate text-xs", isMSeries ? "text-gray-200" : "text-gray-900")} title={car.color_code}>
                                    {dictionaries.color[car.color_code]?.name || car.color_code}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className={cn("text-[10px] uppercase tracking-wider font-semibold italic", isMSeries ? "text-gray-500" : "text-gray-400")}>Tapicerka</span>
                                <span className={cn("font-medium truncate text-xs", isMSeries ? "text-gray-200" : "text-gray-900")} title={car.upholstery_code}>
                                    {dictionaries.upholstery[car.upholstery_code]?.name || car.upholstery_code}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className={cn("text-[10px] uppercase tracking-wider font-semibold italic", isMSeries ? "text-gray-500" : "text-gray-400")}>Rok produkcji</span>
                                <span className={cn("font-medium text-xs", isMSeries ? "text-gray-200" : "text-gray-900")}>
                                    {car.production_date ? new Date(car.production_date).getFullYear() : '2024'}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className={cn("text-[10px] uppercase tracking-wider font-semibold italic", isMSeries ? "text-gray-500" : "text-gray-400")}>Moc</span>
                                <span className={cn("font-medium truncate text-xs", isMSeries ? "text-gray-200" : "text-gray-900")}>
                                    {car.power ? `${car.power} KM` : '-'}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className={cn("text-[10px] uppercase tracking-wider font-semibold italic", isMSeries ? "text-gray-500" : "text-gray-400")}>Rodzaj paliwa</span>
                                <span className={cn("font-medium truncate text-xs", isElectric && !isMSeries ? "text-[#0653B6]" : isMSeries ? "text-gray-200" : "text-gray-900")}>
                                    {car.fuel_type || '-'}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className={cn("text-[10px] uppercase tracking-wider font-semibold italic", isMSeries ? "text-gray-500" : "text-gray-400")}>Napęd</span>
                                <span className={cn("font-medium text-xs", isMSeries ? "text-gray-200" : "text-gray-900")}>
                                    {dictionaries.drivetrain[car.drivetrain || '']?.name || car.drivetrain || '-'}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className={cn("text-[10px] uppercase tracking-wider font-semibold italic", isMSeries ? "text-gray-500" : "text-gray-400")}>Typ nadwozia</span>
                                <span className={cn("font-medium truncate text-xs", isMSeries ? "text-gray-200" : "text-gray-900")}>
                                    {car.body_type || '-'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Footer: Price & CTA */}
                    <div className={cn("mt-auto flex items-end justify-between border-t pt-4", isMSeries ? "border-gray-800" : "border-gray-50")}>
                        <div className="flex flex-col">
                            {car.list_price > 0 && (() => {
                                // Priority: manual special_price > bulletin discountedPrice > list_price
                                const hasManualDiscount = car.special_price && car.special_price < car.list_price;
                                const hasBulletinDiscount = !hasManualDiscount && discountedPrice && discountedPrice < car.list_price;
                                const effectivePrice = hasManualDiscount ? car.special_price! : hasBulletinDiscount ? discountedPrice! : car.list_price;
                                const showCrossedOut = hasManualDiscount || hasBulletinDiscount;

                                return showCrossedOut ? (
                                    <>
                                        <span className="text-xs text-gray-400 line-through mb-0.5">
                                            {formatPrice(car.list_price)}
                                        </span>
                                        <span className={cn("text-2xl font-bold tracking-tight", isMSeries ? "text-white" : "text-gray-900")}>
                                            {formatPrice(effectivePrice)}
                                        </span>
                                    </>
                                ) : (
                                    <span className={cn("text-2xl font-bold tracking-tight", isMSeries ? "text-white" : "text-gray-900")}>
                                        {formatPrice(car.list_price)}
                                    </span>
                                );
                            })()}
                        </div>

                        <div className={cn(
                            "flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all",
                            isSold ? "text-gray-400 cursor-not-allowed" :
                                (isMSeries ? "text-gray-400 group-hover:text-blue-400" :
                                    isElectric ? "text-gray-400 group-hover:text-[#0653B6]" :
                                        "text-black group-hover:text-blue-700")
                        )}>
                            {isSold ? (
                                <span>Sprzedany</span>
                            ) : (
                                <>
                                    <span>Szczegóły</span>
                                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                                </>
                            )}
                        </div>
                    </div>

                    {/* M Bottom Border */}
                    {isMSeries && (
                        <div className="absolute bottom-0 left-0 w-full h-1 flex">
                            <div className="w-1/3 bg-[#53A0DE]" />
                            <div className="w-1/3 bg-[#02256E]" />
                            <div className="w-1/3 bg-[#E40424]" />
                        </div>
                    )}

                    {/* Electric Bottom Border */}
                    {isElectric && !isMSeries && (
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#0653B6] to-[#2E95D3]" />
                    )}
                </div>

            </Link>
        </div>
    );
}
