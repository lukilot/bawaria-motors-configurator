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
    const vin = 'WBS41HK030CU97742';
    console.log(`Checking history for VIN: ${vin}`);
    
    // In many of my previous scripts, I only fetched ACTIVE cars. 
    // Let's check if there are multiple entries for this VIN or if it was ever in a different group.
    const { data: history } = await supabase.from('stock_units').select('*, product_groups(*)').eq('vin', vin);
    console.log(JSON.stringify(history, null, 2));
}
run();
