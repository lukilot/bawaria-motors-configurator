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
    console.log("Looking for ANY cars with '41HK' in model code...");
    const { data: c1 } = await supabase.from('stock_units').select('vin, status_code, visibility, last_synced_at').like('model_code', '%41HK%');
    console.log(c1);
    
    console.log("Looking for ANY cars with '490' in color code...");
    const { data: c2 } = await supabase.from('stock_units').select('vin, status_code, visibility, last_synced_at').eq('color_code', '490');
    console.log(`Found ${c2?.length} cars with color 490.`);
}
run();
