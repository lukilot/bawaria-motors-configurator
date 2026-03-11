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
    const folders = ['03d62b75-9fbb-47c5-8d34-65a35903aa6d', '0dabc6ca-0ad2-4731-8609-3edb46eabb9e', '0e3b87e0-ca20-4ae2-aaff-24ca1bd5cfa4'];
    
    for (const f of folders) {
        console.log(`\nFolder ${f}:`);
        const { data: files } = await supabase.storage.from('stock-images').list(`groups/${f}`);
        if (files) {
            files.forEach(file => console.log(`  - ${file.name}`));
        }
        
        const { data: group } = await supabase.from('product_groups').select('signature').eq('id', f).single();
        console.log(`  Group Signature in DB: ${group?.signature || 'NOT IN DB'}`);
    }
}
run();
