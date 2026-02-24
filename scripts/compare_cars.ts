import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const vin1 = 'WBS31GB050FV89097';
    const vin2 = 'WBS31GB090FU90797';

    const { data: cars, error } = await supabase
        .from('stock_units')
        .select('*')
        .in('vin', [vin1, vin2]);

    if (error) {
        console.error('Error fetching cars:', error);
        return;
    }

    if (!cars || cars.length !== 2) {
        console.error('Could not find both cars', cars?.map(c => c.vin));
        return;
    }

    const c1 = cars.find(c => c.vin === vin1);
    const c2 = cars.find(c => c.vin === vin2);

    console.log('Comparing', vin1, 'and', vin2);

    const keys = Object.keys(c1).sort();
    let differences = 0;

    for (const key of keys) {
        const val1 = JSON.stringify(c1[key]);
        const val2 = JSON.stringify(c2[key]);

        if (val1 !== val2) {
            console.log(`Difference in ${key}:`);
            console.log(`  ${vin1}:`, c1[key]);
            console.log(`  ${vin2}:`, c2[key]);
            differences++;
        }
    }

    if (differences === 0) {
        console.log('No differences found in database fields.');
    } else {
        console.log(`Total differences: ${differences}`);
    }
}

main();
