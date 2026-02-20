
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
    console.log('Checking for body_groups without pricing...');

    // 1. Get all distinct body_groups from stock_units
    const { data: stockGroups, error: stockError } = await supabase
        .from('stock_units')
        .select('body_group, model_code, source')
        .not('body_group', 'is', null);

    if (stockError) {
        console.error('Error fetching stock:', stockError);
        return;
    }

    // distinct groups
    const uniqueStockGroups = [...new Set(stockGroups.map(c => c.body_group))];
    console.log(`Found ${uniqueStockGroups.length} unique body groups in stock.`);

    // 2. Get all distinct series_code from service_prices
    const { data: priceGroups, error: priceError } = await supabase
        .from('service_prices')
        .select('series_code');

    if (priceError) {
        console.error('Error fetching prices:', priceError);
        return;
    }

    const uniquePriceGroups = new Set(priceGroups.map(p => p.series_code));
    console.log(`Found ${uniquePriceGroups.size} unique series codes with prices.`);

    // 3. Find mismatch
    const missingPricing = uniqueStockGroups.filter(g => !uniquePriceGroups.has(g));

    console.log(`\nFound ${missingPricing.length} body groups in stock with NO pricing data:`);
    console.log(missingPricing);

    // 4. Show examples of cars with these groups
    if (missingPricing.length > 0) {
        console.log('\nExamples of affect cars:');
        const affectedCars = stockGroups.filter(c => missingPricing.includes(c.body_group));

        // Group by body_group -> model_code
        const summary: Record<string, Set<string>> = {};
        affectedCars.forEach(c => {
            if (!summary[c.body_group]) summary[c.body_group] = new Set();
            summary[c.body_group].add(c.model_code);
        });

        for (const [bg, models] of Object.entries(summary)) {
            console.log(`Body Group "${bg}" (Models: ${[...models].join(', ')})`);
        }
    }
}

main();
