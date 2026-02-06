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
