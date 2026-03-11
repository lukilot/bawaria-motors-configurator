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
    console.log("Checking option codes for 490 (Individual) cars...");
    const { data: cars } = await supabase.from('stock_units').select('vin, color_code, option_codes, individual_color').eq('color_code', '490').limit(20);
    
    cars?.forEach(c => {
        console.log(`VIN ${c.vin}: IndColor=${c.individual_color}`);
        console.log(`  Options: ${JSON.stringify(c.option_codes)}`);
        // Check if any option looks like an individual color code
        const indMatch = c.option_codes?.find((o: string) => o.includes('|') || /^[A-Z0-9]{3}$/.test(o));
        if (indMatch) console.log(`  Potential color option: ${indMatch}`);
    });
}
run();
