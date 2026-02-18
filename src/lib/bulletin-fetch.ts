import { supabase } from './supabase';
import { StockCar } from '@/types/stock';
import { getChassisCode } from './chassis-mapping';

export interface BulletinRule {
    model_codes?: string[];
    body_groups?: string[];
    production_year_min?: number;
    production_year_max?: number;
    discount_amount: number;
    discount_percent: number;
}

export interface Bulletin {
    id: string;
    name: string;
    description?: string;
    rules: BulletinRule[];
    is_active: boolean;
    valid_from?: string;
    valid_until?: string;
    created_at?: string;
    updated_at?: string;
}

/**
 * Fetch all currently active bulletins whose validity window includes today.
 */
export async function getActiveBulletins(): Promise<Bulletin[]> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const { data, error } = await supabase
        .from('bulletins')
        .select('*')
        .eq('is_active', true);

    if (error) {
        console.error('Error fetching bulletins:', error);
        return [];
    }

    // Filter by validity dates and normalize format
    return (data || [])
        .filter((b: any) => {
            if (b.valid_from && b.valid_from > today) return false;
            if (b.valid_until && b.valid_until < today) return false;
            return true;
        })
        .map((b: any): Bulletin => {
            // Backward compatibility: if old flat columns exist, convert to rules array
            let rules: BulletinRule[] = [];
            if (Array.isArray(b.rules) && b.rules.length > 0) {
                rules = b.rules;
            } else if (b.discount_amount > 0 || b.discount_percent > 0) {
                // Legacy format: convert flat fields to a single rule
                rules = [{
                    model_codes: b.model_codes || [],
                    body_groups: b.body_groups || [],
                    production_year_min: b.production_year_min ?? undefined,
                    production_year_max: b.production_year_max ?? undefined,
                    discount_amount: b.discount_amount || 0,
                    discount_percent: b.discount_percent || 0,
                }];
            }

            return {
                id: b.id,
                name: b.name,
                description: b.description,
                rules,
                is_active: b.is_active,
                valid_from: b.valid_from,
                valid_until: b.valid_until,
                created_at: b.created_at,
                updated_at: b.updated_at,
            };
        });
}

/**
 * Round a price UP to the nearest 1000 PLN.
 * e.g. 233234 → 234000, 234000 → 234000, 234001 → 235000
 */
export function roundUpTo1000(price: number): number {
    return Math.ceil(price / 1000) * 1000;
}

/**
 * Compute the discounted price for a given list price and a single rule.
 * Percentage discount is applied to list price first, then flat amount is subtracted.
 * Returns the resulting discounted price, rounded up to nearest 1000.
 */
export function computeDiscountedPrice(listPrice: number, rule: BulletinRule): number {
    let discounted = listPrice;

    // Apply percentage discount
    if (rule.discount_percent > 0) {
        discounted = discounted * (1 - rule.discount_percent / 100);
    }

    // Apply flat discount
    if (rule.discount_amount > 0) {
        discounted = discounted - rule.discount_amount;
    }

    // Never go below 0
    if (discounted < 0) discounted = 0;

    return roundUpTo1000(discounted);
}

/**
 * Compute the total PLN value of a discount for ranking purposes.
 */
function computeEffectiveDiscount(listPrice: number, rule: BulletinRule): number {
    let discount = 0;
    if (rule.discount_percent > 0) {
        discount += listPrice * (rule.discount_percent / 100);
    }
    if (rule.discount_amount > 0) {
        discount += rule.discount_amount;
    }
    return discount;
}

/**
 * Check if a single rule matches a given car.
 * Returns a specificity score (higher = more specific match):
 *   - model_code match: +10
 *   - body_group match: +5
 *   - production_year match: +2
 *   - 0 means no match
 */
function matchRule(car: StockCar, rule: BulletinRule): number {
    let specificity = 0;
    const carBodyGroup = car.body_group || getChassisCode(car.model_code);
    const carProdYear = car.production_date
        ? parseInt(car.production_date.substring(0, 4), 10)
        : null;

    // Check model_codes match
    const hasModelFilter = rule.model_codes && rule.model_codes.length > 0;
    if (hasModelFilter) {
        if (rule.model_codes!.includes(car.model_code)) {
            specificity += 10;
        } else {
            return 0;
        }
    }

    // Check body_groups match
    const hasBodyGroupFilter = rule.body_groups && rule.body_groups.length > 0;
    if (hasBodyGroupFilter) {
        if (carBodyGroup && rule.body_groups!.includes(carBodyGroup)) {
            specificity += 5;
        } else {
            return 0;
        }
    }

    // Check production year range
    const hasYearFilter = rule.production_year_min != null || rule.production_year_max != null;
    if (hasYearFilter) {
        if (carProdYear == null) return 0;
        if (rule.production_year_min != null && carProdYear < rule.production_year_min) return 0;
        if (rule.production_year_max != null && carProdYear > rule.production_year_max) return 0;
        specificity += 2;
    }

    // If no filters at all, it's a global rule → matches everything with lowest specificity
    if (!hasModelFilter && !hasBodyGroupFilter && !hasYearFilter) {
        specificity = 1;
    }

    return specificity;
}

interface MatchedRule {
    bulletinId: string;
    rule: BulletinRule;
    effectiveDiscount: number;
    specificity: number;
}

/**
 * Given a car and all active bulletins, find the single best matching rule
 * across all bulletins and all their rules.
 * Priority: highest effective discount wins. Ties broken by highest specificity.
 * Returns the best rule or null if no rule matches.
 */
export function getBestRule(car: StockCar, bulletins: Bulletin[]): MatchedRule | null {
    let best: MatchedRule | null = null;

    for (const bulletin of bulletins) {
        for (const rule of bulletin.rules) {
            const specificity = matchRule(car, rule);
            if (specificity === 0) continue;

            const effectiveDiscount = computeEffectiveDiscount(car.list_price, rule);

            if (
                best === null ||
                effectiveDiscount > best.effectiveDiscount ||
                (effectiveDiscount === best.effectiveDiscount && specificity > best.specificity)
            ) {
                best = { bulletinId: bulletin.id, rule, effectiveDiscount, specificity };
            }
        }
    }

    return best;
}

/**
 * Compute the discounted price for a car, considering manual special_price priority.
 * Returns null if no discount applies (car should display at list_price or its manual special_price).
 */
export function getCarDiscountedPrice(car: StockCar, bulletins: Bulletin[]): number | null {
    // Manual special_price takes priority over bulletin discounts
    if (car.special_price && car.special_price < car.list_price) {
        return null; // Let the existing special_price logic handle display
    }

    const matched = getBestRule(car, bulletins);
    if (!matched) return null;

    return computeDiscountedPrice(car.list_price, matched.rule);
}
