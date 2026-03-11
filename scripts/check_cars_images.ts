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
    console.log("Checking if ANY 41HK cars have images directly in stock_units...");
    const { data: cars } = await supabase.from('stock_units').select('vin, images, product_group_id').eq('model_code', '41HK');
    
    cars?.forEach(c => {
        if (c.images && c.images.length > 0) {
            console.log(`VIN ${c.vin} HAS DIRECT IMAGES: ${c.images.length} pics.`);
        }
    });

    console.log("\nChecking for ANY product group with 'M4 CS' in its history...");
    // Since I can't check history easily, I'll search for model names
    const { data: carsByName } = await supabase.from('stock_units').select('model_code, model_name').ilike('model_name', '%M4 CS%');
    console.log("Unique model codes for 'M4 CS' name:");
    const codes = new Set(carsByName?.map(c => c.model_code));
    console.log(Array.from(codes));
}
run();
