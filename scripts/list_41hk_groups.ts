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
    console.log("Listing ALL product groups with model_code 41HK...");
    const { data: groups } = await supabase.from('product_groups').select('*').eq('model_code', '41HK');
    
    groups?.forEach(g => {
        console.log(`\nGroup ${g.id}:`);
        console.log(`  Signature: ${g.signature}`);
        console.log(`  Images in DB: ${g.images?.length || 0}`);
        
        // Let's check if the folder for this group exists in storage and what's in it
        // (folder name is same as group id)
    });
}
run();
