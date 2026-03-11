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
    const { data: groups } = await supabase.from('product_groups').select('id, images');
    const { data: cars } = await supabase.from('stock_units').select('vin, product_group_id');

    const groupToVins: Record<string, any[]> = {};
    for (const car of cars!) {
        if (car.product_group_id) {
            if (!groupToVins[car.product_group_id]) groupToVins[car.product_group_id] = [];
            groupToVins[car.product_group_id].push(car);
        }
    }

    const orphans = groups!.filter(g => g.images && g.images.length > 0 && (!groupToVins[g.id] || groupToVins[g.id].length === 0));
    console.log(`Remaining TRULY orphaned groups with images: ${orphans.length}`);
}
run();
