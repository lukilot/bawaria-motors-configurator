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
    // List all tables in public schema
    const { data: tables, error } = await supabase.rpc('get_tables'); // Hope this rpc exists
    if (error) {
        // Fallback: try common tables
        console.log("RPC get_tables failed. Listing known tables...");
        const known = ['stock_units', 'product_groups', 'dictionaries', 'sync_logs', 'users', 'car_images', 'images'];
        for (const t of known) {
             const { count, error: te } = await supabase.from(t).select('*', { count: 'exact', head: true });
             if (!te) console.log(`Table ${t}: ${count} rows`);
        }
    } else {
        console.log(tables);
    }
}
run();
