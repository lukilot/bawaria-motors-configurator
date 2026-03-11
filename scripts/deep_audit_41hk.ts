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
    console.log("Deep auditing ALL storage folders for 41HK / M4CS...");
    
    // 1. List folders in 'groups/'
    const { data: folders } = await supabase.storage.from('stock-images').list('groups', { limit: 1000 });
    if (!folders) return;

    console.log(`Scanning ${folders.length} folders...`);

    for (const folder of folders) {
        if (folder.name === '.emptyFolderPlaceholder') continue;
        
        const { data: files } = await supabase.storage.from('stock-images').list(`groups/${folder.name}`);
        if (files) {
            const matches = files.filter(f => 
                f.name.toLowerCase().includes('41hk') || 
                f.name.toLowerCase().includes('m4cs')
            );
            
            if (matches.length > 0) {
                console.log(`\nFolder ${folder.name} HAS 41HK MATCHES:`);
                matches.forEach(m => console.log(`  - ${m.name}`));
                
                // Check if this folder is attached to any group in DB
                const { data: group } = await supabase.from('product_groups').select('id, signature').eq('id', folder.name).single();
                console.log(`  DB Group: ${group ? group.signature : 'NOT IN DB'}`);
            }
        }
    }
    console.log("\nDeep audit complete.");
}
run();
