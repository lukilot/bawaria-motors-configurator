
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('--- Verifying BSI/BRI Prices (Post-Fix) ---');

    // 1. Fetch BMW PL cars
    const { data: cars, error: carError } = await supabase
        .from('stock_units')
        .select('vin, series, model_name, body_group, source')
        .neq('source', 'Bawaria Motors')
        .limit(20);

    if (carError) {
        console.error('Error fetching cars:', carError);
        return;
    }

    console.log(`Fetched ${cars.length} BMW PL cars.`);

    for (const car of cars) {
        console.log(`\nChecking Car: ${car.vin} | Model: ${car.model_name}`);
        console.log(`   Source: ${car.source}`);
        console.log(`   Current BodyGroup: ${car.body_group}`);

        // Use body_group as code
        const code = car.body_group;

        if (!code || code === 'BMW') {
            console.warn(`❌ Invalid Body Group: "${code}"`);
            continue;
        }

        const { data: prices, error: priceError } = await supabase
            .from('service_prices')
            .select('package_id, price')
            .eq('series_code', code);

        if (priceError) {
            console.error(`Error fetching prices for ${code}:`, priceError);
        } else {
            console.log(`   -> Found ${prices.length} price entries for series "${code}"`);
            if (prices.length > 0) {
                console.log(`✅ Success! Prices found.`);
            } else {
                console.warn(`❌ No prices found for code "${code}".`);
            }
        }
    }
}

main();
