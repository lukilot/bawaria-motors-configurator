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
    console.log("Finding storage-only orphaned folders...");
    const { data: folders } = await supabase.storage.from('stock-images').list('groups', { limit: 1000 });
    if (!folders) return;

    const { data: groups } = await supabase.from('product_groups').select('id');
    const dbGroupIds = new Set(groups?.map(g => g.id));

    for (const folder of folders) {
        if (folder.name === '.emptyFolderPlaceholder') continue;
        if (!dbGroupIds.has(folder.name)) {
            const { data: files } = await supabase.storage.from('stock-images').list(`groups/${folder.name}`);
            console.log(`\nFolder ${folder.name} is NOT in product_groups DB (${files?.length || 0} files)`);
            if (files && files.length > 0) {
               console.log(`  Sample file: ${files[0].name}`);
            }
        }
    }
}
run();
