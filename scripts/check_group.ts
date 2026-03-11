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
    const gid = '05c3b905-3abd-4247-9c60-1af594e29943';
    console.log(`Checking group ${gid}...`);
    const { data: group } = await supabase.from('product_groups').select('*').eq('id', gid).single();
    console.log(JSON.stringify(group, null, 2));
    
    const { data: cars } = await supabase.from('stock_units').select('vin, model_name').eq('product_group_id', gid);
    console.log("Linked cars:", cars);
}
run();
