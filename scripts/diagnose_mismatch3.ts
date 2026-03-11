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

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL']!, env['SUPABASE_SERVICE_ROLE_KEY']!);

async function run() {
    const { data: logs } = await supabase.from('sync_logs').select('*').order('created_at', { ascending: false }).limit(20);
    console.log("Recent Sync Logs:");
    for (const log of logs || []) {
        console.log(`[${log.created_at}] VIN: ${log.vin}, Change: ${log.change_type}`);
        console.log(`  Details: ${log.details}`);
    }
}
run().catch(console.error);
