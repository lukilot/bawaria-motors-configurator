
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const vin = 'WBA71FN050CX16539';
    console.log(`Checking VIN: ${vin}`);

    const { data: car, error } = await supabase
        .from('stock_units')
        .select('*')
        .eq('vin', vin)
        .single();

    if (error) {
        console.error('Error fetching car:', error);
        return;
    }

    if (!car) {
        console.error('Car not found');
        return;
    }

    console.log('Car details:');
    console.log(`Model Code: ${car.model_code}`);
    console.log(`Body Group: ${car.body_group}`);
    console.log(`Source: ${car.source}`);
    console.log(`Series: ${car.series}`); // Sometimes checking if series is populated helps

    if (!car.body_group) {
        console.log('Body Group is missing! Searching for other cars with same model_code...');
        const { data: others, error: othersError } = await supabase
            .from('stock_units')
            .select('vin, body_group, source')
            .eq('model_code', car.model_code)
            .not('body_group', 'is', null)
            .limit(5);

        if (othersError) {
            console.error('Error fetching others:', othersError);
        } else if (others && others.length > 0) {
            console.log('Found siblings with body_group:', others);
        } else {
            console.log('No siblings found with body_group.');
        }
    } else {
        console.log('Body Group exists.');
    }
}

main();
