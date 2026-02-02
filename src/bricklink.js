/**
 * BrickLink price estimation and links
 * Note: BrickLink doesn't have a public API, so we use estimates
 * and provide links to actual BrickLink pages
 */

// Average price per piece by category (USD, rough estimates)
const PRICE_ESTIMATES = {
    // Standard bricks (per piece)
    brick_1x1: 0.05,
    brick_1x2: 0.06,
    brick_1x3: 0.08,
    brick_1x4: 0.10,
    brick_1x6: 0.15,
    brick_1x8: 0.20,
    brick_2x2: 0.08,
    brick_2x3: 0.12,
    brick_2x4: 0.15,
    brick_2x6: 0.25,
    brick_2x8: 0.35,
    
    // Plates (per piece)
    plate_1x1: 0.03,
    plate_1x2: 0.04,
    plate_1x4: 0.06,
    plate_1x6: 0.10,
    plate_1x8: 0.15,
    plate_2x2: 0.05,
    plate_2x3: 0.08,
    plate_2x4: 0.10,
    plate_2x6: 0.15,
    plate_2x8: 0.25,
    plate_4x4: 0.20,
    plate_4x6: 0.30,
    plate_4x8: 0.40,
    
    // Tiles
    tile_1x1: 0.04,
    tile_1x2: 0.05,
    tile_1x4: 0.08,
    tile_2x2: 0.08,
    tile_2x4: 0.15,
    
    // Slopes
    slope_1x2: 0.08,
    slope_2x2: 0.12,
    slope_2x3: 0.18,
    slope_2x4: 0.25,
    
    // Special/Technic (generally more expensive)
    technic: 0.20,
    minifig_part: 0.50,
    wheel: 0.30,
    window: 0.40,
    
    // Default for unknown
    default: 0.10
};

/**
 * Estimate price for a part based on ID and name
 */
export function estimatePartPrice(partId, partName) {
    const name = (partName || '').toLowerCase();
    const id = (partId || '').toLowerCase();
    
    // Try to categorize the part
    if (name.includes('minifig') || name.includes('mini fig')) {
        return PRICE_ESTIMATES.minifig_part;
    }
    
    if (name.includes('technic') || name.includes('axle') || name.includes('pin')) {
        return PRICE_ESTIMATES.technic;
    }
    
    if (name.includes('wheel') || name.includes('tire')) {
        return PRICE_ESTIMATES.wheel;
    }
    
    if (name.includes('window') || name.includes('door')) {
        return PRICE_ESTIMATES.window;
    }
    
    // Check for tiles
    if (name.includes('tile')) {
        if (name.includes('1x1')) return PRICE_ESTIMATES.tile_1x1;
        if (name.includes('1x2')) return PRICE_ESTIMATES.tile_1x2;
        if (name.includes('1x4')) return PRICE_ESTIMATES.tile_1x4;
        if (name.includes('2x2')) return PRICE_ESTIMATES.tile_2x2;
        if (name.includes('2x4')) return PRICE_ESTIMATES.tile_2x4;
        return PRICE_ESTIMATES.tile_1x2;
    }
    
    // Check for slopes
    if (name.includes('slope')) {
        if (name.includes('1x2')) return PRICE_ESTIMATES.slope_1x2;
        if (name.includes('2x2')) return PRICE_ESTIMATES.slope_2x2;
        if (name.includes('2x3')) return PRICE_ESTIMATES.slope_2x3;
        if (name.includes('2x4')) return PRICE_ESTIMATES.slope_2x4;
        return PRICE_ESTIMATES.slope_2x2;
    }
    
    // Check for plates
    if (name.includes('plate')) {
        if (name.includes('1x1')) return PRICE_ESTIMATES.plate_1x1;
        if (name.includes('1x2')) return PRICE_ESTIMATES.plate_1x2;
        if (name.includes('1x4')) return PRICE_ESTIMATES.plate_1x4;
        if (name.includes('1x6')) return PRICE_ESTIMATES.plate_1x6;
        if (name.includes('1x8')) return PRICE_ESTIMATES.plate_1x8;
        if (name.includes('2x2')) return PRICE_ESTIMATES.plate_2x2;
        if (name.includes('2x3')) return PRICE_ESTIMATES.plate_2x3;
        if (name.includes('2x4')) return PRICE_ESTIMATES.plate_2x4;
        if (name.includes('2x6')) return PRICE_ESTIMATES.plate_2x6;
        if (name.includes('2x8')) return PRICE_ESTIMATES.plate_2x8;
        if (name.includes('4x4')) return PRICE_ESTIMATES.plate_4x4;
        if (name.includes('4x6')) return PRICE_ESTIMATES.plate_4x6;
        if (name.includes('4x8')) return PRICE_ESTIMATES.plate_4x8;
        return PRICE_ESTIMATES.plate_2x4;
    }
    
    // Check for bricks
    if (name.includes('brick')) {
        if (name.includes('1x1')) return PRICE_ESTIMATES.brick_1x1;
        if (name.includes('1x2')) return PRICE_ESTIMATES.brick_1x2;
        if (name.includes('1x3')) return PRICE_ESTIMATES.brick_1x3;
        if (name.includes('1x4')) return PRICE_ESTIMATES.brick_1x4;
        if (name.includes('1x6')) return PRICE_ESTIMATES.brick_1x6;
        if (name.includes('1x8')) return PRICE_ESTIMATES.brick_1x8;
        if (name.includes('2x2')) return PRICE_ESTIMATES.brick_2x2;
        if (name.includes('2x3')) return PRICE_ESTIMATES.brick_2x3;
        if (name.includes('2x4')) return PRICE_ESTIMATES.brick_2x4;
        if (name.includes('2x6')) return PRICE_ESTIMATES.brick_2x6;
        if (name.includes('2x8')) return PRICE_ESTIMATES.brick_2x8;
        return PRICE_ESTIMATES.brick_2x4;
    }
    
    return PRICE_ESTIMATES.default;
}

/**
 * Calculate total estimated cost for parts
 */
export function calculateTotalCost(parts) {
    let total = 0;
    for (const part of parts) {
        const pricePerPiece = estimatePartPrice(part.id, part.name);
        total += pricePerPiece * part.quantity;
    }
    return total;
}

/**
 * Get BrickLink search URL for a part
 */
export function getBrickLinkUrl(partId, colorName) {
    const baseUrl = 'https://www.bricklink.com/v2/search.page';
    const query = `${partId} ${colorName || ''}`.trim();
    return `${baseUrl}?q=${encodeURIComponent(query)}`;
}

/**
 * Get BrickLink catalog URL for a part
 */
export function getBrickLinkCatalogUrl(partId) {
    return `https://www.bricklink.com/v2/catalog/catalogitem.page?P=${partId}`;
}

/**
 * Estimate 3D printing cost
 * Based on average filament usage and cost
 */
export function estimate3DPrintCost(parts, filamentCostPerKg = 25) {
    // Rough estimate: average Lego brick weighs ~2-3 grams
    // PLA infill at 20% would use ~1.5g per brick equivalent
    let totalGrams = 0;
    
    for (const part of parts) {
        // Estimate grams based on part type
        const name = (part.name || '').toLowerCase();
        let gramsPerPart = 1.5; // default
        
        if (name.includes('plate')) gramsPerPart = 0.5;
        else if (name.includes('tile')) gramsPerPart = 0.3;
        else if (name.includes('1x1')) gramsPerPart = 0.4;
        else if (name.includes('1x2')) gramsPerPart = 0.7;
        else if (name.includes('2x2')) gramsPerPart = 1.0;
        else if (name.includes('2x4')) gramsPerPart = 2.0;
        else if (name.includes('2x6')) gramsPerPart = 3.0;
        else if (name.includes('2x8')) gramsPerPart = 4.0;
        else if (name.includes('4x')) gramsPerPart = 4.0;
        
        totalGrams += gramsPerPart * part.quantity;
    }
    
    const totalKg = totalGrams / 1000;
    return totalKg * filamentCostPerKg;
}

/**
 * Format currency
 */
export function formatPrice(amount) {
    return '$' + amount.toFixed(2);
}
