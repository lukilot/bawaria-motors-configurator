import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hzrxlhdhfaqraiaqyewk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6cnhsaGRoZmFxcmFpYXF5ZXdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDI4NzUzMywiZXhwIjoyMDg1ODYzNTMzfQ.HJCQMMAgm6tH3K8bVD6X52_JeUNIBXolZKGnnYB0EVs';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    let allData = [];
    let count = 0;
    const pageSize = 1000;
    
    while (true) {
        const { data, error } = await supabase
            .from('dictionaries')
            .select('id, type, code, data')
            .eq('type', 'option')
            .range(count, count + pageSize - 1);
            
        if (error || !data) break;
        allData = allData.concat(data);
        count += data.length;
        if (data.length < pageSize) break;
    }
    
    const possibleBroken = new Set();

    // Look for HTML entities like &#174;, &quot;, &amp;, &lt;, &gt;
    // Look for UTF-8 read as Latin-1: Ĺ‚, Ĺź, Ĺ›, Ĺ, Ăł, Ăł, Ă„, Ä‡, Ä™
    // Look for Windows-1250 read as UTF-8: , ³, ê, æ, œ, ¿, ñ, , Ÿ
    const brokenRegex = /(&#\d+;)|(&[a-z]+;)|([³êæœ¿ñŸĂĹÄ])/i;

    let brokenCount = 0;
    const examples = [];

    allData.forEach(row => {
        let name = row.data?.name;
        if (!name) {
            // Check if it's an array with body_groups inside
            if (Array.isArray(row.data)) {
                name = row.data[0]?.name;
            } else if (Array.isArray(row.data?.variations)) {
                name = row.data.variations[0]?.name || row.data.name;
            }
        }

        if (name && brokenRegex.test(name)) {
            possibleBroken.add(name);
            brokenCount++;
            if (examples.length < 30) {
                examples.push(`${row.code}: ${name}`);
            }
        }
    });

    console.log(`Total options fetched: ${allData.length}`);
    console.log(`Found ${brokenCount} definitely broken names.`);
    console.log("Samples:");
    console.log(examples);
}

check().catch(console.error);
