const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const env = fs.readFileSync(path.resolve(__dirname, '../.env.local'), 'utf8')
    .split('\n')
    .reduce((acc, line) => {
        const [key, value] = line.split('=');
        if (key && value) acc[key.trim()] = value.trim();
        return acc;
    }, {});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const seeds = [
    // COLORS
    { type: 'color', code: '300', data: { name: 'Biel alpejska' } },
    { type: 'color', code: '475', data: { name: 'Szafirowoczarny' } },
    { type: 'color', code: '416', data: { name: 'Czarny Carbon' } },
    { type: 'color', code: '668', data: { name: 'Czarny' } },
    { type: 'color', code: 'A96', data: { name: 'Biel mineralna' } },
    { type: 'color', code: 'C4P', data: { name: 'Brooklyn Grey' } },
    { type: 'color', code: 'C31', data: { name: 'Portimao Blue' } },
    { type: 'color', code: 'C1M', data: { name: 'Phytonic Blue' } },
    { type: 'color', code: 'C3G', data: { name: 'Aventurine Red' } },
    { type: 'color', code: 'C3Z', data: { name: 'Tanzanite Blue' } },
    { type: 'color', code: 'A90', data: { name: 'Sophisto Grey' } },

    // UPHOLSTERY
    { type: 'upholstery', code: 'KPSW', data: { name: 'Sensatec Black' } },
    { type: 'upholstery', code: 'KHSW', data: { name: 'Sensatec Perforated Black' } },
    { type: 'upholstery', code: 'KHG7', data: { name: 'Sensatec Perforated Canberra Beige' } },
    { type: 'upholstery', code: 'MAMU', data: { name: 'Skóra Vernasca Mocha' } },
    { type: 'upholstery', code: 'MANL', data: { name: 'Skóra Vernasca Black z niebieskim szwem' } },
    { type: 'upholstery', code: 'MASW', data: { name: 'Skóra Vernasca Black' } },
    { type: 'upholstery', code: 'LKSW', data: { name: 'Skóra Dakota Black' } },
    { type: 'upholstery', code: 'VCSW', data: { name: 'Skóra BMW Individual Merino Black' } },
    { type: 'upholstery', code: 'KUKP', data: { name: 'Veganza Perforated Cognac' } },

    // MODELS (Examples)
    { type: 'model', code: '21EJ', data: { series: 'Seria 3', name: '320d xDrive Sedan', fuel: 'Diesel', drivetrain: 'xDrive' } },
    { type: 'model', code: '31FL', data: { series: 'Seria 5', name: '520d xDrive', fuel: 'Diesel', drivetrain: 'xDrive' } },
    { type: 'model', code: '31GN', data: { series: 'Seria 5', name: '530e', fuel: 'Hybrid', drivetrain: 'RWD' } },
    { type: 'model', code: '11FL', data: { series: 'Seria 1', name: '118i', fuel: 'Gasoline', drivetrain: 'FWD' } },
    { type: 'model', code: '11GH', data: { series: 'Seria 1', name: '120i', fuel: 'Gasoline', drivetrain: 'FWD' } },
    { type: 'model', code: '21BX', data: { series: 'Seria 2', name: '218i Gran Coupe', fuel: 'Gasoline', drivetrain: 'FWD' } }
];

async function seed() {
    console.log('Seeding dictionaries...');
    for (const item of seeds) {
        const { error } = await supabase
            .from('dictionaries')
            .upsert(item, { onConflict: 'type,code' });

        if (error) console.error(`Error seeding ${item.code}:`, error.message);
        else console.log(`Seeded: ${item.type} - ${item.code}`);
    }
}

seed();
