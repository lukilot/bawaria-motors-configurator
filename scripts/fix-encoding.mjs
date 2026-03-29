import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hzrxlhdhfaqraiaqyewk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6cnhsaGRoZmFxcmFpYXF5ZXdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDI4NzUzMywiZXhwIjoyMDg1ODYzNTMzfQ.HJCQMMAgm6tH3K8bVD6X52_JeUNIBXolZKGnnYB0EVs';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const replacementMap = {
    '¹': 'ą', '¥': 'Ą',
    'ê': 'ę', 'Ê': 'Ę',
    '³': 'ł', '£': 'Ł',
    'ñ': 'ń', 'Ñ': 'Ń',
    // ó/Ó usually map properly to ó/Ó because they are the same in ISO-8859-1 and Win-1250! But just in case:
    'œ': 'ś', 'Œ': 'Ś',
    'Ÿ': 'ź', 'Ž': 'Ź', // note: 8F is actually not defined in ISO-8859-1 formally, sometimes it's omitted
    '¿': 'ż', '¯': 'Ż',
    'œ': 'ś',
    'æ': 'ć', 'Æ': 'Ć' // Win1250: E6 = ć, C6 = Ć. ISO-8859-1: E6 = æ, C6 = Æ
};

function fixEncoding(text) {
    if (!text) return text;
    let fixed = text;
    for (const [bad, good] of Object.entries(replacementMap)) {
        // use regex to replace all globally
        fixed = fixed.replace(new RegExp(bad, 'g'), good);
    }
    return fixed;
}

async function run() {
    let allData = [];
    let count = 0;
    const pageSize = 1000;
    
    while (true) {
        const { data, error } = await supabase
            .from('dictionaries')
            .select('id, type, code, data')
            .range(count, count + pageSize - 1);
            
        if (error || !data) break;
        allData = allData.concat(data);
        count += data.length;
        if (data.length < pageSize) break;
    }

    console.log(`Fetched ${allData.length} total dictionary items.`);
    
    let updatedCount = 0;
    
    for (const row of allData) {
        let changed = false;
        const newData = JSON.parse(JSON.stringify(row.data)); // Deep clone
        
        // If it's a simple object containing name
        if (newData && typeof newData.name === 'string') {
            const fixed = fixEncoding(newData.name);
            if (fixed !== newData.name) {
                newData.name = fixed;
                changed = true;
            }
        }
        
        // If it's an array of objects
        if (Array.isArray(newData)) {
            for (let i = 0; i < newData.length; i++) {
                if (newData[i] && typeof newData[i].name === 'string') {
                    const fixed = fixEncoding(newData[i].name);
                    if (fixed !== newData[i].name) {
                        newData[i].name = fixed;
                        changed = true;
                    }
                }
            }
        }
        
        // If it has variations
        if (newData && Array.isArray(newData.variations)) {
            for (let i = 0; i < newData.variations.length; i++) {
                if (newData.variations[i] && typeof newData.variations[i].name === 'string') {
                    const fixed = fixEncoding(newData.variations[i].name);
                    if (fixed !== newData.variations[i].name) {
                        newData.variations[i].name = fixed;
                        changed = true;
                    }
                }
            }
        }
        
        if (changed) {
            // Update in DB
            const { error } = await supabase
                .from('dictionaries')
                .update({ data: newData })
                .eq('id', row.id);
                
            if (error) {
                console.error(`Failed to update ${row.code}:`, error);
            } else {
                updatedCount++;
            }
        }
    }
    
    console.log(`Successfully fixed encoding for ${updatedCount} items.`);
}

run().catch(console.error);
