import Link from 'next/link';
import { StockCar } from '@/types/stock';
import { cn } from '@/lib/utils';

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

    // Pricing Formatter
    const formatPrice = (price: number) =>
        new Intl.NumberFormat('pl-PL', { style: 'currency', currency: car.currency }).format(price);

    return (
        <Link
            href={`/cars/${encodeURIComponent(car.vin)}`}
            className="group bg-white border border-gray-100 overflow-hidden hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 ease-out cursor-pointer relative block"
        >
            {/* Image Area */}
            <div className="aspect-[16/9] bg-gray-100 relative overflow-hidden">
                {car.images && car.images.length > 0 ? (
                    <img
                        src={car.images[0].url}
                        alt={`${modelName || car.model_code}`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    <>
                        {/* Car Under Cover */}
                        <div className="w-full h-full bg-gray-200">
                            <img
                                src="/images/car-cover.png"
                                alt="Vehicle in Preparation"
                                className="w-full h-full object-cover opacity-80 mix-blend-multiply grayscale-[0.2]"
                            />
                        </div>
                        {/* Badge Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
                            <span className="bg-white/90 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-900 border border-gray-200 shadow-sm">
                                Oferta w trakcie przygotowywania
                            </span>
                        </div>
                    </>
                )}

                <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                    {/* Only show 'Available' if we have photos (REAL availability) or if we want to show 'In Prep' status? 
                        User said "Pending offer should change to Ready".
                        I'll show the standard status but maybe dimmed if pending?
                    */}
                    {isAvailable && (
                        <span className={cn(
                            "backdrop-blur-sm text-[10px] uppercase font-bold px-3 py-1.5 tracking-wider shadow-sm",
                            (car.images?.length || 0) > 0 ? "bg-white/90 text-gray-900" : "bg-gray-100/90 text-gray-500"
                        )}>
                            {(car.images?.length || 0) > 0 ? 'Available' : 'Pending Setup'}
                        </span>
                    )}
                    {hasMSport && (
                        <span className="bg-blue-600/90 backdrop-blur-sm text-white text-[10px] uppercase font-bold px-3 py-1.5 tracking-wider shadow-sm">
                            M Sport
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900 tracking-tight leading-tight mb-1">
                    {modelName || `BMW Model ${car.model_code}`}
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-6">
                    <div className="flex flex-col">
                        <span className="text-[8px] text-gray-400 uppercase font-bold tracking-wider">Lakier</span>
                        <span className="text-[10px] text-gray-900 font-bold uppercase truncate italic">{colorName || car.color_code}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] text-gray-400 uppercase font-bold tracking-wider">Tapicerka</span>
                        <span className="text-[10px] text-gray-500 font-bold uppercase truncate italic">{upholsteryName || car.upholstery_code}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] text-gray-400 uppercase font-bold tracking-wider">Specyfikacja</span>
                        <span className="text-[10px] text-gray-900 font-bold uppercase truncate italic">
                            {car.fuel_type} • {car.drivetrain}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] text-gray-400 uppercase font-bold tracking-wider">Nadwozie / Moc</span>
                        <span className="text-[10px] text-gray-900 font-bold uppercase truncate italic">
                            {car.body_type} • {car.power} KM
                        </span>
                    </div>
                </div>

                <div className="flex items-end justify-between border-t border-gray-50 pt-4">
                    <div className="flex flex-col">
                        {car.special_price && car.special_price < car.list_price ? (
                            <>
                                <span className="text-[10px] text-gray-400 line-through mb-0.5">
                                    {formatPrice(car.list_price)}
                                </span>
                                <span className="text-lg font-bold text-gray-900 tracking-tight">
                                    {formatPrice(car.special_price)}
                                </span>
                            </>
                        ) : (
                            <span className="text-lg font-bold text-gray-900 tracking-tight">
                                {formatPrice(car.list_price)}
                            </span>
                        )}
                    </div>

                    <button className="text-[10px] font-bold uppercase tracking-widest border border-gray-200 px-5 py-2.5 hover:bg-black hover:text-white hover:border-black transition-colors">
                        View
                    </button>
                </div>
            </div>
        </Link>
    );
}
