export const COLOR_MAP: Record<string, string> = {
    // Polish
    'Czarny': '#000000',
    'Biały': '#ffffff',
    'Szary': '#9ca3af',
    'Grafitowy': '#374151',
    'Srebrny': '#e5e7eb',
    'Niebieski': '#2563eb',
    'Błękitny': '#93c5fd',
    'Granatowy': '#1e3a8a',
    'Turkusowy': '#2dd4bf',
    'Czerwony': '#dc2626',
    'Bordowy': '#7f1d1d',
    'Brązowy': '#78350f',
    'Beżowy': '#f5f5dc',
    'Kremowy': '#fef3c7',
    'Zielony': '#15803d',
    'Oliwkowy': '#3f6212',
    'Pomarańczowy': '#ea580c',
    'Żółty': '#eab308',
    'Złoty': '#ca8a04',
    'Miedziany': '#b45309',
    'Fioletowy': '#7e22ce',
    'Różowy': '#db2777',

    // English
    'Black': '#000000',
    'White': '#ffffff',
    'Gray': '#9ca3af',
    'Grey': '#9ca3af',
    'Silver': '#e5e7eb',
    'Blue': '#2563eb',
    'Red': '#dc2626',
    'Brown': '#78350f',
    'Beige': '#f5f5dc',
    'Green': '#15803d',
    'Orange': '#ea580c',
    'Yellow': '#eab308',
    'Gold': '#ca8a04',
    'Purple': '#7e22ce',
};

export const getColor = (name?: string) => {
    if (!name) return '#e5e7eb';
    const trimmed = name.trim();
    if (COLOR_MAP[trimmed]) return COLOR_MAP[trimmed];

    const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    if (COLOR_MAP[capitalized]) return COLOR_MAP[capitalized];

    const lower = trimmed.toLowerCase();
    if (lower.includes('czarn')) return COLOR_MAP['Czarny'];
    if (lower.includes('biał')) return COLOR_MAP['Biały'];
    if (lower.includes('szar')) return COLOR_MAP['Szary'];
    if (lower.includes('srebr')) return COLOR_MAP['Srebrny'];
    if (lower.includes('niebies')) return COLOR_MAP['Niebieski'];
    if (lower.includes('czerwo')) return COLOR_MAP['Czerwony'];
    if (lower.includes('brąz')) return COLOR_MAP['Brązowy'];
    if (lower.includes('beż')) return COLOR_MAP['Beżowy'];
    if (lower.includes('ziel')) return COLOR_MAP['Zielony'];

    return '#e5e7eb'; // Default gray
};
