const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Basic env parser
const env = fs.readFileSync(path.resolve(__dirname, '../.env.local'), 'utf8')
    .split('\n')
    .reduce((acc, line) => {
        const [key, value] = line.split('=');
        if (key && value) acc[key.trim()] = value.trim();
        return acc;
    }, {});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyze() {
    const { data: cars, error } = await supabase
        .from('stock_units')
        .select('model_code, color_code, upholstery_code, option_codes');

    if (error) {
        console.error('Error:', error);
        return;
    }

    const modelCodes = new Set();
    const colorCodes = new Set();
    const upholsteryCodes = new Set();
    const options = new Set();

    cars.forEach(car => {
        if (car.model_code) modelCodes.add(car.model_code);
        if (car.color_code) colorCodes.add(car.color_code);
        if (car.upholstery_code) upholsteryCodes.add(car.upholstery_code);
        car.option_codes?.forEach(o => options.add(o));
    });

    console.log('\n--- MODEL CODES ---');
    console.log(JSON.stringify(Array.from(modelCodes).sort()));

    console.log('\n--- COLOR CODES ---');
    console.log(JSON.stringify(Array.from(colorCodes).sort()));

    console.log('\n--- UPHOLSTERY CODES ---');
    console.log(JSON.stringify(Array.from(upholsteryCodes).sort()));

    console.log('\n--- TOP 20 OPTIONS ---');
    console.log(JSON.stringify(Array.from(options).sort().slice(0, 20)));
}

analyze();
