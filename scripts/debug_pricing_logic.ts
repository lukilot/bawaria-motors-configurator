
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Force use of ANON KEY to simulate client-side RLS restrictions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials (ANON KEY)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// COPY OF getModelAttributes logic for 71FN from the file we just wrote
const MODEL_MAP: any = {
    '71FN': { fuel_type: 'Diesel', series: 'Seria 4 / i4', body_group: 'G22', body_type: 'Coupe' },
};

function getModelAttributes(code: string) {
    return MODEL_MAP[code] || {};
}

async function main() {
    const vin = 'WBA71FN050CX16539';
    console.log(`Debugging VIN: ${vin}`);

    // 1. Fetch Car
    const { data: car, error } = await supabase
        .from('stock_units')
        .select('*')
        .eq('vin', vin)
        .single();

    if (error || !car) {
        console.error('Car not found', error);
        return;
    }

    console.log('Car Model Code:', car.model_code);
    console.log('Car Body Group (DB):', car.body_group);

    console.log('Car Option Codes:', car.option_codes);

    // 2. Resolve Attributes
    const staticAttrs = getModelAttributes(car.model_code);
    console.log('Static Attrs:', staticAttrs);

    const enrichedCar = {
        ...car,
        body_group: staticAttrs.body_group || car.body_group,
    };

    console.log('Resolved Body Group (enrichedCar.body_group):', enrichedCar.body_group);

    const seriesCode = enrichedCar.body_group;
    console.log('Series Code passed to Configurator:', seriesCode);


    // 3. Check Prices for this Series Code
    if (seriesCode) {
        const { data: prices, error: priceError } = await supabase
            .from('service_prices')
            .select('*')
            .eq('series_code', seriesCode);

        if (priceError) {
            console.error('Error fetching prices:', priceError);
        } else {
            console.log(`Found ${prices?.length} prices for ${seriesCode}`);
            if (prices && prices.length > 0) {
                const samplePrice = prices[0];
                console.log('Sample price:', samplePrice);

                // Check if package exists
                const { data: pkg, error: pkgError } = await supabase
                    .from('service_packages')
                    .select('*')
                    .eq('id', samplePrice.package_id)
                    .single();

                if (pkg) {
                    console.log('Matching Package found:', pkg);
                } else {
                    console.error('Matching Package NOT found for ID:', samplePrice.package_id);
                }

            } else {
                console.log('WARNING: No prices found!');
            }
        }
    } else {
        console.log('WARNING: Series Code is missing!');
    }
}

main();
