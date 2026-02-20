
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
    console.log('Checking for cars with missing or invalid body_group...');

    // Fetch cars with null or empty body_group
    const { data: missing, error } = await supabase
        .from('stock_units')
        .select('vin, model_code, body_group, source')
        .or('body_group.is.null,body_group.eq.""');

    if (error) {
        console.error('Error fetching cars:', error);
        return;
    }

    console.log(`Found ${missing?.length} cars with missing body_group.`);

    // Group by model_code to see which ones we need to fix
    const modelCounts: Record<string, number> = {};
    missing?.forEach(car => {
        const Code = car.model_code || 'UNKNOWN';
        modelCounts[Code] = (modelCounts[Code] || 0) + 1;
    });

    console.log('Missing body_group by Model Code:');
    console.table(modelCounts);
}

main();
