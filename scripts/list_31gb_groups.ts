import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envFile.split('\n').forEach((line: string) => {
    const [key, ...val] = line.split('=');
    if (key && val) env[key.trim()] = val.join('=').trim();
});
const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'] || env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function run() {
    console.log("Listing ALL product groups with model_code 31GB...");
    const { data: groups } = await supabase.from('product_groups').select('*').eq('model_code', '31GB');
    
    groups?.forEach(g => {
        console.log(`\nGroup ${g.id}:`);
        console.log(`  Color: ${g.color_code}, Uph: ${g.upholstery_code}`);
        console.log(`  Signature: ${g.signature}`);
        console.log(`  Pics: ${g.images?.length || 0}`);
        if (g.images && g.images.length > 0) {
            console.log(`  First Pic URL: ${JSON.stringify(g.images[0])}`);
        }
    });

    const { data: cars } = await supabase.from('stock_units').select('vin, color_code, individual_color, product_group_id').eq('model_code', '31GB');
    console.log("\n--- CARS ---");
    cars?.forEach(c => {
        console.log(`VIN ${c.vin}: Color=${c.color_code}, IndColor=${c.individual_color}, GID=${c.product_group_id}`);
    });
}
run();
