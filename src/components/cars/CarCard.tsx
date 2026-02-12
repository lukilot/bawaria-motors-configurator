import Link from 'next/link';
import Image from 'next/image';
import { StockCar } from '@/types/stock';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface CarCardProps {
    car: StockCar;
    modelName?: string;
    colorName?: string;
    upholsteryName?: string;
}

export function CarCard({ car, modelName, colorName, upholsteryName }: CarCardProps) {
    // Logic to determine badges
    // 337 is common code for M Sport Package
    const isAvailable = car.status_code >= 190 || ['SH', 'ST'].includes(car.processing_type);
    const hasMSport = car.option_codes.includes('337');
    const isMSeries = (car.series || '').includes('Seria M');

    // Pricing Formatter
    const formatPrice = (price: number) =>
        new Intl.NumberFormat('pl-PL', { style: 'currency', currency: car.currency }).format(price);

    return (
        <Link
            href={`/cars/${encodeURIComponent(car.vin)}`}
            className={cn(
                "group mt-1 overflow-hidden transition-all duration-300 ease-out cursor-pointer relative block",
                isMSeries
                    ? "bg-[#1a1a1a] border-[#333] hover:shadow-[0_20px_50px_-12px_rgba(83,160,222,0.3)] hover:border-[#53A0DE]/30"
                    : "bg-white border-gray-100 hover:shadow-xl hover:translate-y-[-2px]"
            )}
        >
            {/* Custom M Hover Gradient Shadow (Blur) */}
            {isMSeries && (
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#53A0DE] via-[#02256E] to-[#E40424] opacity-0 group-hover:opacity-40 blur-2xl transition-opacity duration-500 -z-10" />
            )}

            <div className={cn("aspect-[16/9] relative overflow-hidden", isMSeries ? (car.images && car.images.length > 0 ? "bg-[#0f0f0f]" : "bg-gray-200") : "bg-gray-100")}>
                {car.images && car.images.length > 0 ? (
                    <div className="relative w-full h-full">
                        <Image
                            src={car.images[0].url}
                            alt={`${modelName || car.model_code}`}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            placeholder="blur"
                            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P//fwAJ/AP+0068IAAAAABJRU5ErkJggg=="
                        />
                    </div>
                ) : (
                    <>
                        {/* Car Under Cover */}
                        <div className="relative w-full h-full bg-gray-200">
                            <Image
                                src="/images/car-cover.png"
                                alt="Vehicle in Preparation"
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover opacity-80 mix-blend-multiply grayscale-[0.2]"
                            />
                        </div>
                        {/* Badge Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
                            <span className="bg-white/90 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-900 border border-gray-200 shadow-sm relative z-10">
                                Oferta w trakcie przygotowywania
                            </span>
                        </div>
                    </>
                )}

                {/* M Power Badge */}
                {isMSeries && (
                    <div className="absolute top-0 right-0 z-20">
                        <div className="relative bg-black/80 backdrop-blur-md text-white px-3 py-1.5 flex items-center gap-2 skew-x-[-12deg] mr-[-10px] mt-2 translate-x-2">
                            <div className="flex gap-0.5 skew-x-[12deg]">
                                <div className="w-1 h-2.5 bg-[#53A0DE]" />
                                <div className="w-1 h-2.5 bg-[#02256E]" />
                                <div className="w-1 h-2.5 bg-[#E40424]" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest skew-x-[12deg] pr-2">M Power</span>
                        </div>
                    </div>
                )}


                <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10">
                    {/* Only show 'Available' if we have photos (REAL availability) or if we want to show 'In Prep' status? 
                        User said "Pending offer should change to Ready".
                        I'll show the standard status but maybe dimmed if pending?
                    */}
                    {isAvailable && (
                        <span className={cn(
                            "backdrop-blur-sm text-[10px] uppercase font-bold px-3 py-1.5 tracking-wider shadow-sm",
                            isMSeries
                                ? "bg-black/80 text-white border border-white/10"
                                : (car.images?.length || 0) > 0 ? "bg-white/90 text-gray-900" : "bg-gray-100/90 text-gray-500"
                        )}>
                            {(car.images?.length || 0) > 0 ? 'Available' : 'Pending Setup'}
                        </span>
                    )}
                    {hasMSport && !isMSeries && (
                        <span className="bg-blue-600/90 backdrop-blur-sm text-white text-[10px] uppercase font-bold px-3 py-1.5 tracking-wider shadow-sm">
                            M Sport
                        </span>
                    )}
                    {(car.available_count || 0) > 1 && (
                        <span className={cn(
                            "backdrop-blur-sm border text-[10px] uppercase font-bold px-3 py-1.5 tracking-wider shadow-sm",
                            isMSeries ? "bg-white/10 text-white border-white/10" : "bg-white/90 text-gray-900 border-gray-200"
                        )}>
                            {car.available_count} szt.
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-5 relative">
                <h3 className={cn("text-lg font-semibold tracking-tight leading-tight mb-1", isMSeries ? "text-white" : "text-gray-900")}>
                    {modelName || `BMW Model ${car.model_code}`}
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-6">
                    <div className="flex flex-col">
                        <span className="text-[8px] text-gray-400 uppercase font-bold tracking-wider">Lakier</span>
                        <span className={cn("text-[10px] font-bold uppercase truncate italic", isMSeries ? "text-gray-300" : "text-gray-900")}>{colorName || car.color_code}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] text-gray-400 uppercase font-bold tracking-wider">Tapicerka</span>
                        <span className="text-[10px] text-gray-500 font-bold uppercase truncate italic">{upholsteryName || car.upholstery_code}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] text-gray-400 uppercase font-bold tracking-wider">Specyfikacja</span>
                        <span className={cn("text-[10px] font-bold uppercase truncate italic", isMSeries ? "text-gray-300" : "text-gray-900")}>
                            {car.fuel_type} • {car.drivetrain}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] text-gray-400 uppercase font-bold tracking-wider">Nadwozie / Moc</span>
                        <span className={cn("text-[10px] font-bold uppercase truncate italic", isMSeries ? "text-gray-300" : "text-gray-900")}>
                            {car.body_type} • {car.power} KM
                        </span>
                    </div>
                </div>

                <div className={cn("flex items-end justify-between border-t pt-4 mt-2", isMSeries ? "border-white/10" : "border-gray-50")}>
                    <div className="flex flex-col">
                        {car.special_price && car.special_price < car.list_price ? (
                            <>
                                <span className="text-[10px] text-gray-400 line-through mb-0.5">
                                    {formatPrice(car.list_price)}
                                </span>
                                <span className={cn("text-xl font-bold tracking-tight", isMSeries ? "text-white" : "text-gray-900")}>
                                    {formatPrice(car.special_price)}
                                </span>
                            </>
                        ) : (
                            <span className={cn("text-xl font-bold tracking-tight", isMSeries ? "text-white" : "text-gray-900")}>
                                {formatPrice(car.list_price)}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform duration-300">
                        <span className={cn("text-[10px] uppercase tracking-widest font-bold transition-colors", isMSeries ? "text-gray-400 group-hover:text-blue-400" : "text-gray-300 group-hover:text-black")}>
                            Szczegóły
                        </span>
                        <ArrowRight className={cn("w-3 h-3 transition-colors", isMSeries ? "text-gray-400 group-hover:text-blue-400" : "text-gray-300 group-hover:text-black")} />
                    </div>
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
        </Link>

    );
}
