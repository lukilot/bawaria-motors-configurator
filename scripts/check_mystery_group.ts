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
    const gid = 'dadeea23-c019-4f3f-94bf-6f49f5231480';
    console.log(`Checking Mystery Group ${gid}...`);
    const { data: group } = await supabase.from('product_groups').select('*').eq('id', gid).single();
    if (group) {
        console.log(`Signature: ${group.signature}`);
        console.log(`Model: ${group.model_code}, Color: ${group.color_code}, Uph: ${group.upholstery_code}`);
        console.log(`Images length: ${group.images?.length || 0}`);
    } else {
        console.log("Group not found in DB.");
    }

    const { data: cars } = await supabase.from('stock_units').select('vin, model_name').eq('product_group_id', gid);
    console.log("Linked cars:", cars);
}
run();
