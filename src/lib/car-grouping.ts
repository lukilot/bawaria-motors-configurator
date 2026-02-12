import { StockCar } from '@/types/stock';

export function groupIdenticalCars(cars: StockCar[]): StockCar[] {
    const groups: Map<string, StockCar[]> = new Map();

    // 1. Group by strict criteria
    cars.forEach(car => {
        const prodYear = car.production_date ? car.production_date.substring(0, 4) : 'Unknown';
        // Normalize options: sort to ensure order doesn't matter
        const sortedOptions = [...(car.option_codes || [])].sort().join(',');

        const key = [
            car.model_code,
            car.color_code,
            car.upholstery_code,
            sortedOptions,
            prodYear
        ].join('|');

        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(car);
    });

    // 2. Reduce to representatives
    const results: StockCar[] = [];

    groups.forEach((groupCars) => {
        if (groupCars.length === 0) return;

        // Sort group to pick best representative:
        // Priority 1: Not Sold
        // Priority 2: Status > 190 (Ready to pickup) AND Not Sold
        // Priority 3: Has Images
        // Priority 4: Status 193 or Available

        const sortedGroup = [...groupCars].sort((a, b) => {
            const score = (c: StockCar) => {
                let s = 0;
                const isSold = c.order_status?.toLowerCase().includes('sprzedany');

                if (!isSold) s += 1000; // Prioritize ANY available car over sold ones
                if (c.status_code > 190 && !isSold) s += 100; // Ready!
                if (c.images && c.images.length > 0) s += 50; // Has photos
                if (c.order_status?.includes('Dostępny')) s += 20;
                return s;
            };
            return score(b) - score(a);
        });

        const primary = { ...sortedGroup[0] };

        // Aggregate Data
        // Filter out Sold cars from available count? 
        // User said: "Available: X". Usually this implies buyable cars. 
        // If I have 1 Available and 1 Sold, count should be 1?
        // Let's count only non-sold cars for "available_count".
        const availableSiblings = groupCars.filter(c => !c.order_status?.toLowerCase().includes('sprzedany'));
        primary.available_count = availableSiblings.length;

        // If all cars are sold, available_count is 0. 
        // If available_count is 0, we should probably show the Sold status of the primary.

        primary.sibling_vins = groupCars.map(c => c.vin);

        // Special Status Logic
        // "Order Status - if at least one car is Ready (and not sold), label them all as DOSTĘPNY OD RĘKI."
        const hasReadyCar = groupCars.some(c => c.status_code > 190 && !c.order_status?.toLowerCase().includes('sprzedany'));

        if (hasReadyCar) {
            primary.status_code = 193;
            primary.order_status = 'Dostępny od ręki';
        }
        // If NO ready car, we leave the primary status as is. 
        // If primary is Sold (because all are sold), it remains Sold.

        results.push(primary);
    });

    return results;
}
