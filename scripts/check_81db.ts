
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
    console.log('Checking 81DB cars...');

    const { data: cars, error } = await supabase
        .from('stock_units')
        .select('vin, model_code, body_group')
        .eq('model_code', '81DB');

    if (error) {
        console.error('Error fetching cars:', error);
        return;
    }

    if (!cars || cars.length === 0) {
        console.log('No 81DB cars found.');
        return;
    }

    console.log(`Found ${cars.length} 81DB cars.`);
    console.table(cars);
}

main();
