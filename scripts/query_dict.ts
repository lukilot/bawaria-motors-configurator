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
    console.log("Checking Dictionary for model codes 31HK and 41HK...");
    const { data: d1 } = await supabase.from('dictionaries').select('*').eq('type', 'model').in('code', ['31HK', '41HK']);
    console.log(JSON.stringify(d1, null, 2));

    console.log("\nChecking Dictionary for colors C4P and 475...");
    const { data: d2 } = await supabase.from('dictionaries').select('*').eq('type', 'color').in('code', ['C4P', '475']);
    console.log(JSON.stringify(d2, null, 2));
}
run();
