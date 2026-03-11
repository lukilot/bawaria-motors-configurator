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
    const { data: cars } = await supabase.from('stock_units').select('vin, model_code, model_name, visibility, last_synced_at').eq('product_group_id', '55d709a9-816d-4a8d-b730-5868acc7bca2');
    console.log(`Cars in Group 55d709a9-816d-4a8d-b730-5868acc7bca2:`);
    console.log(cars);
}
run();
