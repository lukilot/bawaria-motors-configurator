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
    const gid = '1be8968c-36dd-4bdc-b102-8bc6297c877b'; // The one with 490/31GW and 7 pics
    const { data: group } = await supabase.from('product_groups').select('images').eq('id', gid).single();
    if (group?.images) {
        console.log("URLs for 31GW group:");
        group.images.forEach((img: any) => console.log(img.url));
    }
}
run();
