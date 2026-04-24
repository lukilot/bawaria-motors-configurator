import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

function getOptionsSet(opts: string[]) {
    if (!opts) return new Set<string>();
    return new Set(opts.flatMap(o => o.replace(/[\(\)]/g, ' ').split(' ')).map(x => x.trim()).filter(Boolean));
}

function intersectionSize(setA: Set<string>, setB: Set<string>) {
    let size = 0;
    for (const elem of setA) {
        if (setB.has(elem)) size++;
    }
    return size;
}

async function recoverGroups() {
    console.log('Fetching groups...');
    const { data: allGroups, error } = await supabase.from('product_groups').select('*');
    if (error || !allGroups) {
        console.error('Failed to fetch groups', error);
        return;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const oldGroupsWithAssets = allGroups.filter(g => 
        new Date(g.created_at) < todayStart && 
        (
            (g.images && g.images.length > 0) || 
            g.manual_price !== null || 
            g.otomoto_listed === true || 
            g.otomoto_url !== null ||
            g.description !== null
        )
    );

    const newGroups = allGroups.filter(g => new Date(g.updated_at) >= todayStart);

    const updates = [];
    let recoveredCount = 0;
    const idsToDelete = new Set<string>();

    for (const newGroup of newGroups) {
        if (newGroup.images && newGroup.images.length > 0) continue;

        const newSet = getOptionsSet(newGroup.option_codes || []);

        const candidates = oldGroupsWithAssets.filter(old => 
            old.model_code === newGroup.model_code &&
            old.color_code === newGroup.color_code &&
            old.upholstery_code === newGroup.upholstery_code
        );

        if (candidates.length === 0) continue;

        let bestMatch = candidates[0];
        if (candidates.length > 1) {
            let maxIntersect = -1;
            for (const cand of candidates) {
                const candSet = getOptionsSet(cand.option_codes || []);
                const score = intersectionSize(candSet, newSet);
                if (score > maxIntersect) {
                    maxIntersect = score;
                    bestMatch = cand;
                }
            }
        }

        if (bestMatch) {
            updates.push({
                id: newGroup.id,
                images: bestMatch.images,
                manual_price: bestMatch.manual_price,
                otomoto_listed: bestMatch.otomoto_listed,
                otomoto_url: bestMatch.otomoto_url,
                description: bestMatch.description,
                updated_at: new Date().toISOString()
            });
            recoveredCount++;
            idsToDelete.add(bestMatch.id);
        }
    }

    console.log(`Ready to recover ${updates.length} groups.`);

    let successUpdates = 0;
    for (const update of updates) {
        const { error: err } = await supabase.from('product_groups').update({
            images: update.images,
            manual_price: update.manual_price,
            otomoto_listed: update.otomoto_listed,
            otomoto_url: update.otomoto_url,
            description: update.description,
            updated_at: update.updated_at
        }).eq('id', update.id);
        
        if (!err) successUpdates++;
    }

    console.log(`Successfully recovered ${successUpdates} groups.`);

    let deletedCount = 0;
    for (const id of Array.from(idsToDelete)) {
        const { data: units } = await supabase.from('stock_units').select('vin').eq('product_group_id', id);
        if (!units || units.length === 0) {
            const { error: delErr } = await supabase.from('product_groups').delete().eq('id', id);
            if (!delErr) deletedCount++;
        }
    }
    console.log(`Cleaned up ${deletedCount} abandoned old groups.`);
}

recoverGroups();
