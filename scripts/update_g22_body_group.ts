
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
    console.log('Patching 71FN cars to body_group G22...');

    // 1. Find cars to update
    const { data: cars, error: findError } = await supabase
        .from('stock_units')
        .select('vin, model_code, body_group')
        .eq('model_code', '71FN');

    if (findError) {
        console.error('Error finding cars:', findError);
        return;
    }

    if (!cars || cars.length === 0) {
        console.log('No cars found with model_code 71FN.');
        return;
    }

    console.log(`Found ${cars.length} cars with model_code 71FN.`);

    // 2. Update them
    const { error: updateError } = await supabase
        .from('stock_units')
        .update({ body_group: 'G22' })
        .eq('model_code', '71FN');

    if (updateError) {
        console.error('Error updating cars:', updateError);
    } else {
        console.log('Successfully updated body_group to G22 for all 71FN cars.');
    }
}

main();
