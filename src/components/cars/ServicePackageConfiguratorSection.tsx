'use client';

import { StockCar } from '@/types/stock';
import { ServicePackageConfigurator } from './ServicePackageConfigurator';
import { useVdpStore } from '@/store/vdpStore';

interface ServicePackageConfiguratorSectionProps {
    car: StockCar;
    seriesCode: string;
    isDark?: boolean;
    fuelType?: string;
}

export function ServicePackageConfiguratorSection({ car, seriesCode, isDark = false, fuelType }: ServicePackageConfiguratorSectionProps) {
    const { setAdditionalCost } = useVdpStore();

    return (
        <div className="mt-12">
            <div className="flex items-center gap-3 mb-10">
                <h3 className="text-[11px] text-gray-400 uppercase tracking-[0.4em] font-bold">Pakiety Serwisowe</h3>
                <div className="h-px flex-1 bg-current opacity-10" />
            </div>

            <ServicePackageConfigurator
                currentCodes={car.option_codes}
                seriesCode={seriesCode}
                fuelType={fuelType || car.fuel_type}
                onPriceUpdate={setAdditionalCost}
                onSelectionChange={() => { }} // We only care about price for now
                isDark={isDark}
            />
        </div>
    );
}
