import { supabase } from './supabase';
import { StockCar } from '@/types/stock';

export async function getAvailableCars(): Promise<StockCar[]> {
    const { data, error } = await supabase
        .from('stock_units')
        .select('*')
        .eq('visibility', 'PUBLIC') // Only show public cars
        .order('list_price', { ascending: true }); // Default sort

    if (error) {
        console.error('Error fetching stock:', error);
        return [];
    }

    // Cast snake_case DB result to our camelCase TypeScript interface?
    // Actually, our Interface uses snake_case for DB fields (status_code, model_code)
    // Check types/stock.ts:
    // export interface StockCar {
    //   vin: string;
    //   status_code: number;
    //   ...
    // }
    // So the structure matches 1:1 with DB column names (except TypeScript usually prefers camelCase, but we kept snake_case in interface for simplicity).
    // Wait, let's double check types/stock.ts

    return (data as any[]) || [];
}

export async function getCarByVin(vin: string): Promise<StockCar | null> {
    const { data, error } = await supabase
        .from('stock_units')
        .select('*')
        .eq('vin', vin)
        .single();

    if (error) {
        console.error('Error fetching car by VIN:', error);
        return null;
    }

    return (data as any) || null;
}

export async function getCarVariants(currentCar: StockCar): Promise<StockCar[]> {
    const allCars = await getAvailableCars();

    // Normalize codes for comparison: filter out color/upholstery and sort
    const getFingerprint = (car: StockCar) => {
        const color = car.color_code?.trim().toUpperCase();
        const upholstery = car.upholstery_code?.trim().toUpperCase();

        return car.option_codes
            .filter(code => {
                const clean = code.trim().split(' ')[0].toUpperCase(); // Just the code part
                return clean !== color && clean !== upholstery;
            })
            .sort()
            .join(',');
    };

    const currentFingerprint = getFingerprint(currentCar);

    return allCars.filter(car =>
        car.vin !== currentCar.vin &&
        car.model_code === currentCar.model_code &&
        getFingerprint(car) === currentFingerprint
    );
}
