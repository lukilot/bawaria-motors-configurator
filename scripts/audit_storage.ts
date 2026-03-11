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
    console.log("Auditing Storage bucket 'stock-images'...");
    
    // List folders in 'groups/'
    const { data: folders, error: folderError } = await supabase
        .storage
        .from('stock-images')
        .list('groups', { limit: 1000 });

    if (folderError) {
        console.error("Error listing folders:", folderError);
        return;
    }

    console.log(`Found ${folders.length} folders in 'groups/'.`);

    // We are looking for photos that aren't properly linked.
    // Let's also search for ANY file that contains '41HK' or 'M3CS' or 'CS' in its name
    // This requires listing inside each folder, which is slow.
    // Let's start with a few suspicious ones or just a general scan.

    for (const folder of folders) {
        if (folder.name === '.emptyFolderPlaceholder') continue;
        
        const { data: files } = await supabase
            .storage
            .from('stock-images')
            .list(`groups/${folder.name}`);
        
        if (files) {
            const matches = files.filter(f => 
                f.name.includes('41HK') || 
                f.name.includes('M4CS') || 
                f.name.includes('M3CS') || 
                f.name.toLowerCase().includes('cs')
            );
            
            if (matches.length > 0) {
                console.log(`Folder ${folder.name} has CS-related files!`);
                matches.forEach(m => console.log(`  - ${m.name}`));
            }
        }
    }
    console.log("Audit complete.");
}
run();
