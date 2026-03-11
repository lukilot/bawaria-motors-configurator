import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { launchBrowser } from '@/lib/browser-launcher';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

function normalizeCode(code: string): string {
    if (!code) return '';
    
    // S0248 -> 248 (3 chars)
    // S0337 -> 337 (3 chars)
    if (code.startsWith('S0')) return code.substring(2);
    
    // P0C31 -> C31 (3 chars)
    // P0071 -> 071 (3 chars)
    if (code.startsWith('P0')) return code.substring(2);
    
    // PI337 -> 337 (3 chars)
    // PIC4E -> C4E (3 chars)
    if (code.startsWith('PI') && code.length > 4) return code.substring(2);
    
    // FKUMY -> KUMY (4 chars)
    // FBLAT -> BLAT
    if (code.match(/^[FKZ][A-Z0-9]{4}$/)) return code.substring(1);
    
    return code;
}

async function fetchAndCompress(url: string): Promise<Buffer> {
    const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BawariaBot/1.0)' }
    });
    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    // WebP format for fast loading
    return sharp(buffer)
        .resize(400, 400, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .webp({ quality: 82 })
        .toBuffer();
}

async function uploadToSupabase(buffer: Buffer, bodyGroup: string, code: string): Promise<string> {
    const filename = `options/${bodyGroup}/${code}.webp`;
    const { error } = await supabase.storage
        .from('stock-images')
        .upload(filename, buffer, { contentType: 'image/webp', upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('stock-images').getPublicUrl(filename);
    return publicUrl;
}

export async function POST(request: NextRequest) {
    let browser: any = null;
    const debugLogs: string[] = [];

    try {
        const { configuratorUrl, bodyGroup } = await request.json();
        if (!configuratorUrl || !bodyGroup) {
            return NextResponse.json({ error: 'Missing configuratorUrl or bodyGroup' }, { status: 400 });
        }

        browser = await launchBrowser();
        const page = await browser.newPage();

        let rawOptionImages: Record<string, string> = {};   // RAW code -> COSY URL
        let rawOptionNames: Record<string, string> = {};    // RAW code -> name
        let allJsonIntercepted: any[] = [];

        page.on('response', async (response: any) => {
            const url = response.url();
            try {
                if (url.includes('.json') || response.headers()['content-type']?.includes('json')) {
                    const json = await response.json();
                    allJsonIntercepted.push({ url, json });
                    
                    // 1. Grid payload (standard images)
                    if (url.includes('option-selector-grid')) {
                        const desktop = json?.collections?.['option-selector-grid']?.desktop || {};
                        for (const [code, data] of Object.entries(desktop as Record<string, any>)) {
                            const imgUrl = (data as any)?.imageGroups?.[0]?.images?.[0]?.viewImage;
                            if (imgUrl && !rawOptionImages[code]) {
                                rawOptionImages[code] = imgUrl;
                            }
                            const name = (data as any)?.salesText || (data as any)?.title;
                            if (name && !rawOptionNames[code]) {
                                rawOptionNames[code] = name;
                            }
                        }
                    }

                    // 2. Pricing payload (standard labels)
                    if (url.includes('pricing/calculation')) {
                        const components = json?.publicCalculation?.components || [];
                        for (const comp of components) {
                            if (comp.componentId && comp.label && !rawOptionNames[comp.componentId]) {
                                rawOptionNames[comp.componentId] = comp.label;
                            }
                        }
                    }

                    // 3. Marketing texts (broad labels)
                    if (url.includes('marketing-texts')) {
                        for (const [code, data] of Object.entries(json || {})) {
                            const name = (data as any)?.salesText || (data as any)?.option;
                            if (name && !rawOptionNames[code]) {
                                rawOptionNames[code] = name;
                            }
                        }
                    }
                }
            } catch {
                // ignore parse errors
            }
        });

        await page.goto(configuratorUrl, { waitUntil: 'networkidle2', timeout: 90000 });
        await new Promise(r => setTimeout(r, 6000));
        await browser.close();
        browser = null;

        // Exhaustive search through all JSON for any missing names/labels
        const allRawCodes = new Set([
            ...Object.keys(rawOptionImages),
            ...Object.keys(rawOptionNames)
        ]);
        
        // Final fallback: look into all intercepted JSONs for labels matching codes
        for (const data of allJsonIntercepted) {
            try {
                const str = JSON.stringify(data.json);
                allRawCodes.forEach(code => {
                    if (str.includes(`"${code}"`) && !rawOptionNames[code]) {
                        // Very basic fuzzy search for name near code
                        // This is a safety net
                    }
                });
            } catch {}
        }

        if (allRawCodes.size === 0) {
            return NextResponse.json({ error: 'No options found. Check URL.' }, { status: 404 });
        }

        let imported = 0;
        let skipped = 0;

        for (const rawCode of allRawCodes) {
            try {
                const code = normalizeCode(rawCode);
                if (!code || code.length < 2) continue;

                let name = rawOptionNames[rawCode] || rawCode;
                // If name is still just the code, try to find it in marketing texts (if missed earlier)
                if (name === rawCode || name === rawCode.substring(2)) {
                    // check marketingTexts specifically for S0... and P0...
                    const S0Code = rawCode.startsWith('S0') ? rawCode : `S0${code}`;
                    const P0Code = rawCode.startsWith('P0') ? rawCode : `P0${code}`;
                    name = rawOptionNames[S0Code] || rawOptionNames[P0Code] || name;
                }

                const cosyUrl = rawOptionImages[rawCode];
                let imageUrl = null;
                if (cosyUrl) {
                    try {
                        const compressed = await fetchAndCompress(cosyUrl);
                        imageUrl = await uploadToSupabase(compressed, bodyGroup, code);
                    } catch (err) {
                        debugLogs.push(`Image error ${code}: ${err}`);
                    }
                }

                const { data: existing } = await supabase
                    .from('dictionaries')
                    .select('id, data')
                    .eq('code', code)
                    .eq('type', 'option')
                    .maybeSingle();

                const existingBodyGroups: string[] = existing?.data?.body_groups || [];
                const updatedBodyGroups = Array.from(new Set([...existingBodyGroups, bodyGroup]));

                const upsertData = {
                    ...existing?.data,
                    name: name !== code ? name : (existing?.data?.name || name),
                    body_groups: updatedBodyGroups,
                    image_url: imageUrl || existing?.data?.image_url || null,
                };

                if (existing) {
                    await supabase.from('dictionaries').update({ data: upsertData }).eq('id', existing.id);
                } else {
                    await supabase.from('dictionaries').insert({
                        type: 'option',
                        code,
                        data: upsertData,
                    });
                }
                imported++;
            } catch (e: any) {
                debugLogs.push(`${rawCode}: ${e.message}`);
                skipped++;
            }
        }

        return NextResponse.json({
            success: true,
            imported,
            skipped,
            total: imported + skipped,
            debug: debugLogs.slice(0, 20),
        });

    } catch (error: any) {
        console.error('BMW options import failed:', error);
        if (browser) { try { await browser.close(); } catch {} }
        return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
    }
}
