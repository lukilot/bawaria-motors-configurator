import Link from 'next/link';
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
};

export function CarRow({ car, modelName, dictionaries }: CarRowProps) {
    // Logic to determine availability
    // Logic to determine availability
    // Logic to determine availability
    const isSold = (car.order_status || '').includes('Sprzedany');
    const reservationStr = (car.reservation_details || '').trim();
    const isReserved = !!reservationStr && reservationStr.toLowerCase() !== 'rezerwuj';
    // Available if status > 190 (regardless of reservation, but logic below handles display)
    const isReady = car.status_code > 190;

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
            "group bg-white border border-gray-100 rounded-sm overflow-hidden hover:shadow-lg transition-all duration-300",
            isSold && "opacity-60 grayscale-[0.5] hover:shadow-none hover:opacity-60"
        )}>
            <Link href={`/cars/${encodeURIComponent(car.vin)}`} className={cn("flex flex-col md:flex-row h-full", isSold && "cursor-default pointer-events-none")}>

                {/* Left: Images (Grid) */}
                {/* Desktop: 1 Main + 3 Small below? Or Porsche style is 1 big left, 3 small below it? 
                   Actually Porsche style often has a slider or grid. 
                   User said: "1 main photo and three photos below using grid" 
                */}
                <div className="w-full md:w-[45%] lg:w-[40%] bg-white flex flex-col">
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
                    </div>

                    {/* 3 Thumbnails Row */}
                    {hasImages && displayImages.length > 1 && (
                        <div className="grid grid-cols-3 h-20 md:h-24 border-t border-gray-100">
                            {/* Slot 1 */}
                            <div className="relative border-r border-gray-100 overflow-hidden">
                                {displayImages[1] && (
                                    <img src={displayImages[1].url} className="w-full h-full object-cover" alt="" />
                                )}
                            </div>
                            {/* Slot 2 */}
                            <div className="relative border-r border-gray-100 overflow-hidden">
                                {displayImages[2] && (
                                    <img src={displayImages[2].url} className="w-full h-full object-cover" alt="" />
                                )}
                            </div>
                            {/* Slot 3 (Interior) */}
                            <div className="relative overflow-hidden">
                                {displayImages[3] && (
                                    <img src={displayImages[3].url} className="w-full h-full object-cover" alt="" />
                                )}
                                {/* Optional 'Interior' label? */}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Details */}
                {/* Right: Details */}
                <div className="flex-1 p-5 flex flex-col">

                    {/* Header */}
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="text-2xl font-bold tracking-tight text-gray-900 group-hover:text-blue-700 transition-colors">
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
                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded-sm">
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
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-3 gap-x-8 mt-4 text-sm text-gray-600">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold italic">Lakier</span>
                                <span className="font-medium text-gray-900 truncate text-xs" title={car.color_code}>
                                    {dictionaries.color[car.color_code]?.name || car.color_code}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold italic">Tapicerka</span>
                                <span className="font-medium text-gray-900 truncate text-xs" title={car.upholstery_code}>
                                    {dictionaries.upholstery[car.upholstery_code]?.name || car.upholstery_code}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold italic">Rok produkcji</span>
                                <span className="font-medium text-gray-900 text-xs">
                                    {car.production_date ? new Date(car.production_date).getFullYear() : '2024'}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold italic">Moc</span>
                                <span className="font-medium text-gray-900 truncate text-xs">
                                    {car.power || '-'}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold italic">Rodzaj paliwa</span>
                                <span className="font-medium text-gray-900 truncate text-xs">
                                    {car.fuel_type || '-'}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold italic">Napęd</span>
                                <span className="font-medium text-gray-900 text-xs">
                                    {dictionaries.drivetrain[car.drivetrain || '']?.name || car.drivetrain || '-'}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold italic">Typ nadwozia</span>
                                <span className="font-medium text-gray-900 truncate text-xs">
                                    {car.body_type || '-'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Footer: Price & CTA */}
                    <div className="mt-auto flex items-end justify-between border-t border-gray-50 pt-4">
                        <div className="flex flex-col">
                            {car.list_price > 0 && (
                                car.special_price && car.special_price < car.list_price ? (
                                    <>
                                        <span className="text-xs text-gray-400 line-through mb-0.5">
                                            {formatPrice(car.list_price)}
                                        </span>
                                        <span className="text-2xl font-bold text-gray-900 tracking-tight">
                                            {formatPrice(car.special_price)}
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-2xl font-bold text-gray-900 tracking-tight">
                                        {formatPrice(car.list_price)}
                                    </span>
                                )
                            )}
                        </div>

                        <button className={cn(
                            "px-6 py-2.5 text-xs font-bold uppercase tracking-widest transition-all border",
                            isSold
                                ? "bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed"
                                : "bg-white border-black text-black hover:bg-black hover:text-white"
                        )}>
                            {isSold ? 'Sprzedany' : 'Szczegóły'}
                        </button>
                    </div>
                </div>

            </Link>
        </div>
    );
}
