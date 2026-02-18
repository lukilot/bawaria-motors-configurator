
export interface ModelAttributes {
    fuel_type?: string;
    series?: string;
    body_group?: string; // critical for service pricing (e.g. G60)
    body_type?: string;
}

const MODEL_MAP: Record<string, ModelAttributes> = {
    // BEV
    '61HG': { fuel_type: 'Electric', series: 'Seria 5', body_group: 'G60', body_type: 'Limuzyna' },
    '41HG': { fuel_type: 'Electric', series: 'Seria 5', body_group: 'G60', body_type: 'Limuzyna' },
    // PHEV/ICE
    'HF11': { fuel_type: 'Petrol', series: 'Seria 5', body_group: 'G60', body_type: 'Limuzyna' },
    '11HG': { fuel_type: 'Diesel', series: 'Seria 5', body_group: 'G60', body_type: 'Limuzyna' },
};

export function getModelAttributes(code: string): ModelAttributes {
    return MODEL_MAP[code] || {};
}
