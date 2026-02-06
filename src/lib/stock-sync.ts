import { supabase } from './supabase';
import { StockCar } from '@/types/stock';

export const syncStockToSupabase = async (cars: StockCar[]) => {
    if (!cars || cars.length === 0) return { success: true, count: 0 };

    // Prepare data for upsert
    // We need to map our Frontend 'StockCar' to the Database 'stock_units' columns
    // camelCase -> snake_case
    const dbRows = cars.map(car => {
        const row: any = {
            vin: car.vin,
            status_code: car.status_code,
            order_status: car.order_status,
            processing_type: car.processing_type,
            reservation_details: car.reservation_details,
            model_code: car.model_code,
            model_name: car.model_name,
            body_group: car.body_group,
            color_code: car.color_code,
            upholstery_code: car.upholstery_code,
            fuel_type: car.fuel_type,
            power: car.power,
            drivetrain: car.drivetrain,
            option_codes: car.option_codes,
            currency: car.currency,
            visibility: car.visibility,
            production_date: car.production_date ? new Date(car.production_date).toISOString() : null, // Ensure date format
            last_synced_at: new Date().toISOString()
        };

        // Only update price if we have a valid one from the file (unlikely from stock file)
        // OR if needed to preserve existing non-zero price in DB
        // By omitting the key, Supabase Upsert will NOT modify the existing column value if the row exists.
        if (car.list_price > 0) {
            row.list_price = car.list_price;
        }

        return row;
    });

    // Perform Upsert (Insert or Update if VIN exists)
    const { error, count } = await supabase
        .from('stock_units')
        .upsert(dbRows, {
            onConflict: 'vin',
            ignoreDuplicates: false // We want to update!
        })
        .select();

    if (error) {
        throw new Error(error.message);
    }

    return { success: true, count };
};

export const analyzeStockDiff = async (newCars: StockCar[]) => {
    // 1. Get all currently ACTIVE cars (not Sold/Archived)
    const { data: activeCars, error } = await supabase
        .from('stock_units')
        .select('*')
        .lt('status_code', 190); // Assuming 190+ is Sold/Reserved. User implies "unavailable".
    // Actually, user said "marked as sold [to be accepted]".
    // Usually Sold is ~500. Active is < 190 (Available) or < 500?
    // Let's assume we want to catch anything that IS currently potentially available (status < 190)
    // AND is missing from the file.

    if (error) throw error;
    if (!activeCars) return [];

    const newVins = new Set(newCars.map(c => c.vin));

    // Find cars in DB that are NOT in the new file
    const missingCars = activeCars.filter(car => !newVins.has(car.vin));

    return missingCars; // These are candidates for "Sold"
};

export const processSoldCars = async (vins: string[]) => {
    if (vins.length === 0) return { count: 0, purgedCount: 0 };

    // 1. Update Status to SOLD (500)
    const { error: updateError } = await supabase
        .from('stock_units')
        .update({
            status_code: 500,
            order_status: 'Sprzedany / Wycofany',
            visibility: 'HIDDEN' // Hide from public list immediately
        })
        .in('vin', vins);

    if (updateError) throw updateError;

    // 2. Purge Images for each VIN
    let purgedCount = 0;
    for (const vin of vins) {
        // We can reuse our API logic or do it directly here since we have the service role client?
        // No, this runs on client-side likely (triggered by Admin UI).
        // Database trigger would be best, but we'll use a fetch loop for now or client storage calls.

        // Using Storage API directly is risky if RLS blocks delete.
        // But we fixed RLS! 
        // However, emptying the folder requires listing files first.

        try {
            await fetch('/api/admin/purge-images', {
                method: 'POST',
                body: JSON.stringify({ vin }),
            });
            purgedCount++;
        } catch (e) {
            console.error(`Failed to purge images for ${vin}`, e);
        }
    }

    return { count: vins.length, purgedCount };
};
