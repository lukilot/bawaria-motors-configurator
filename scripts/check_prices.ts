
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
    console.log('Checking service prices...');

    // Check for G22
    const { data: g22Data, error: g22Error } = await supabase
        .from('service_prices')
        .select('*')
        .eq('series_code', 'G22')
        .limit(5);

    if (g22Error) console.error(g22Error);
    console.log('Prices for G22:', g22Data?.length);

    // Check for G26
    const { data: g26Data, error: g26Error } = await supabase
        .from('service_prices')
        .select('*')
        .eq('series_code', 'G26')
        .limit(5);

    if (g26Error) console.error(g26Error);
    console.log('Prices for G26:', g26Data?.length);

    // List all distinct series codes
    const { data: distinctSeries, error: distinctError } = await supabase
        .from('service_prices')
        .select('series_code'); // distinct on client side if needed or use .rpc if available

    if (distinctError) console.error(distinctError);

    if (distinctSeries) {
        const unique = [...new Set(distinctSeries.map(item => item.series_code))].sort();
        console.log('Available series codes in service_prices:', unique);
    }
}

main();
