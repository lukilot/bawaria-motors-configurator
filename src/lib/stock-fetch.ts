import { supabase } from './supabase';
import { StockCar } from '@/types/stock';

import { ProductGroup } from '@/types/stock';

export async function getAvailableProductGroups(): Promise<ProductGroup[]> {
    // Fetch groups that have at least one public stock unit
    // We use !inner to filter groups that strictly have matching stock_units
    const { data, error } = await supabase
        .from('product_groups')
        .select(`
            *,
            stock_units!inner(*)
        `)
        .eq('stock_units.visibility', 'PUBLIC');

    if (error) {
        console.error('Error fetching product groups:', error);
        return [];
    }

    if (!data) return [];

    // Transform to ProductGroup interface
    return data.map((group: any) => {
        const units = group.stock_units as StockCar[];

        // Calculate min/max price
        const prices = units.map(u => u.special_price || u.list_price).filter(p => p > 0);
        const min_price = prices.length > 0 ? Math.min(...prices) : 0;
        const max_price = prices.length > 0 ? Math.max(...prices) : 0;

        return {
            ...group,
            available_units: units,
            available_count: units.length,
            min_price,
            max_price
        };
    });
}

export async function getAvailableCars(): Promise<StockCar[]> {
    // Deprecated or used for non-grouped view?
    // Let's keep it working for fallback or legacy views
    let allCars: StockCar[] = [];
    let from = 0;
    const batchSize = 1000;
    let more = true;

    while (more) {
        const { data, error } = await supabase
            .from('stock_units')
            .select('*')
            .in('visibility', ['PUBLIC', 'SOLD'])
            .order('list_price', { ascending: true })
            .range(from, from + batchSize - 1);

        if (error) {
            console.error('Error fetching stock:', error);
            break;
        }

        if (data && data.length > 0) {
            allCars = [...allCars, ...data as any];

            if (data.length < batchSize) {
                more = false;
            } else {
                from += batchSize;
            }
        } else {
            more = false;
        }
    }

    return allCars;
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

    const sameSpecCars = allCars.filter(car =>
        car.model_code === currentCar.model_code &&
        getFingerprint(car) === currentFingerprint
    );

    // Group by Color + Upholstery
    const groupedVariants = new Map<string, StockCar[]>();

    sameSpecCars.forEach(car => {
        const key = `${car.color_code}|${car.upholstery_code}`;
        if (!groupedVariants.has(key)) {
            groupedVariants.set(key, []);
        }
        groupedVariants.get(key)!.push(car);
    });

    // Remove the current car's configuration group
    const currentConfigKey = `${currentCar.color_code}|${currentCar.upholstery_code}`;
    groupedVariants.delete(currentConfigKey);

    // Return representatives for other configs
    return Array.from(groupedVariants.values()).map(group => {
        // Pick best representative (logic similar to groupIdenticalCars)
        const sorted = group.sort((a, b) => {
            // Prioritize Ready > Photos > Available
            const score = (c: StockCar) => {
                let s = 0;
                if (c.status_code > 190) s += 100;
                if (c.images && c.images.length > 0) s += 50;
                return s;
            };
            return score(b) - score(a);
        });
        const rep = sorted[0];
        // optional: attach count
        return { ...rep, available_count: group.length };
    });
}
