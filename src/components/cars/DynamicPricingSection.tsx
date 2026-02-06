'use client';

import { useState } from 'react';
import { StockCar } from '@/types/stock';
import { cn } from '@/lib/utils';
import { ServicePackageConfigurator } from './ServicePackageConfigurator';

interface DynamicPricingSectionProps {
    car: StockCar;
    seriesCode: string;
}

export function DynamicPricingSection({ car, seriesCode }: DynamicPricingSectionProps) {
    // State for additional costs from service packages
    const [additionalCost, setAdditionalCost] = useState(0);
    const [selectedServiceCodes, setSelectedServiceCodes] = useState<string[]>([]);

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('pl-PL', { style: 'currency', currency: car.currency }).format(price);

    const isSold = (car.order_status || '').includes('Sprzedany');

    // Calculate final displayed price
    const basePrice = car.special_price && car.special_price < car.list_price ? car.special_price : car.list_price;
    const finalPrice = basePrice + additionalCost;
    const hasDiscount = car.special_price && car.special_price < car.list_price;

    const handleContactClick = () => {
        // Here we would ideally open the contact form and pass the selected codes
        console.log('Contact with services:', selectedServiceCodes);
        // For now just standard log or navigation, assuming functionality is similar to before
        // If there was a specific onClick handler before, we might need to replicate it or accept it as prop.
        // But the previous code just had a button.
    };

    return (
        <div className="space-y-8">
            {/* Service Configurator */}
            <ServicePackageConfigurator
                currentCodes={car.option_codes}
                seriesCode={seriesCode}
                onPriceUpdate={setAdditionalCost}
                onSelectionChange={setSelectedServiceCodes}
            />

            {/* Price Card */}
            <div className="bg-gray-50 p-6 rounded-sm border border-gray-100 transition-all duration-300 ease-in-out">
                {car.list_price > 0 && (
                    <div className="flex flex-col gap-1 mb-6">
                        <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Cena całkowita</span>

                        {/* Show old price crossed out if there is a discount AND no added cost (or distinct display?)
                            Actually, if we add costs, the "list price" concept gets fuzzy. 
                            Let's keep it simple: 
                            If discount exists: Show List Price (crossed) -> Final Special Price (Base Special + Services)
                            If no discount: Show Final Price (Base List + Services)
                        */}

                        {hasDiscount ? (
                            <div className="flex flex-col">
                                <span className="text-sm text-gray-400 line-through decoration-gray-300">
                                    {formatPrice(car.list_price + additionalCost)}
                                    {/* Note: usually list price also increases if we add services, 
                                        so logically we add cost to both base and special */}
                                </span>
                                <span className={cn(
                                    "text-3xl font-bold tracking-tight transition-colors",
                                    additionalCost > 0 ? "text-black" : "text-gray-900"
                                )}>
                                    {formatPrice(finalPrice)}
                                </span>
                            </div>
                        ) : (
                            <span className={cn(
                                "text-3xl font-bold tracking-tight transition-colors",
                                additionalCost > 0 ? "text-black" : "text-gray-900"
                            )}>
                                {formatPrice(finalPrice)}
                            </span>
                        )}


                    </div>
                )}

                <button
                    disabled={isSold}
                    onClick={handleContactClick}
                    className={cn(
                        "w-full py-4 text-sm font-bold uppercase tracking-widest transition-all shadow-lg",
                        isSold
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                            : "bg-black text-white hover:bg-gray-800 hover:shadow-xl translate-y-0 hover:-translate-y-0.5"
                    )}
                >
                    {isSold ? 'Pojazd Sprzedany' : 'Jestem zainteresowany'}
                </button>
                <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed">
                    *Cena zawiera VAT. Zdjęcia mają charakter poglądowy.
                </p>
            </div>
        </div>
    );
}
