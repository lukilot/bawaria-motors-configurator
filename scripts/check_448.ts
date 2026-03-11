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
    console.log("Checking Dictionary for color 448...");
    const { data: d } = await supabase.from('dictionaries').select('*').eq('type', 'color').eq('code', '448');
    console.log(JSON.stringify(d, null, 2));

    console.log("\nChecking cars with individual_color '448'...");
    const { data: cars } = await supabase.from('stock_units').select('vin, model_name, individual_color').eq('individual_color', '448');
    console.log(cars);
}
run();
