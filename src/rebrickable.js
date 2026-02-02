/**
 * Rebrickable API integration
 * Free API: https://rebrickable.com/api/v3/docs/
 */

// Rebrickable API key (free tier - get your own at rebrickable.com/api/)
const API_KEY = '15f3297f52a74ed7f85251f5ff45ce1d';
const BASE_URL = 'https://rebrickable.com/api/v3';

/**
 * Search for sets by name or number
 */
export async function searchSets(query, page = 1, pageSize = 20) {
    const url = `${BASE_URL}/lego/sets/?search=${encodeURIComponent(query)}&page=${page}&page_size=${pageSize}`;
    
    const response = await fetch(url, {
        headers: { 'Authorization': `key ${API_KEY}` }
    });
    
    if (!response.ok) {
        throw new Error(`Rebrickable API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
        count: data.count,
        sets: data.results.map(set => ({
            id: set.set_num,
            name: set.name,
            number: set.set_num.replace(/-\d+$/, ''),
            year: set.year,
            pieces: set.num_parts,
            image: set.set_img_url,
            theme: set.theme_id
        }))
    };
}

/**
 * Get parts list for a specific set
 */
export async function getSetParts(setNum) {
    const parts = [];
    let url = `${BASE_URL}/lego/sets/${setNum}/parts/?page_size=500`;
    
    while (url) {
        const response = await fetch(url, {
            headers: { 'Authorization': `key ${API_KEY}` }
        });
        
        if (!response.ok) {
            throw new Error(`Rebrickable API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        for (const item of data.results) {
            parts.push({
                id: item.part.part_num,
                name: item.part.name,
                color: item.color.id,
                colorName: item.color.name,
                colorHex: '#' + item.color.rgb,
                quantity: item.quantity,
                image: item.part.part_img_url,
                isSpare: item.is_spare
            });
        }
        
        url = data.next;
    }
    
    return parts;
}

/**
 * Get set details
 */
export async function getSetDetails(setNum) {
    const url = `${BASE_URL}/lego/sets/${setNum}/`;
    
    const response = await fetch(url, {
        headers: { 'Authorization': `key ${API_KEY}` }
    });
    
    if (!response.ok) {
        throw new Error(`Set not found: ${setNum}`);
    }
    
    const set = await response.json();
    
    return {
        id: set.set_num,
        name: set.name,
        number: set.set_num.replace(/-\d+$/, ''),
        year: set.year,
        pieces: set.num_parts,
        image: set.set_img_url
    };
}

/**
 * Get popular/featured sets
 */
export async function getPopularSets(page = 1, pageSize = 20) {
    // Get sets from recent years, sorted by parts count
    const currentYear = new Date().getFullYear();
    const url = `${BASE_URL}/lego/sets/?min_year=${currentYear - 2}&ordering=-num_parts&page=${page}&page_size=${pageSize}`;
    
    const response = await fetch(url, {
        headers: { 'Authorization': `key ${API_KEY}` }
    });
    
    if (!response.ok) {
        throw new Error(`Rebrickable API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
        count: data.count,
        sets: data.results.map(set => ({
            id: set.set_num,
            name: set.name,
            number: set.set_num.replace(/-\d+$/, ''),
            year: set.year,
            pieces: set.num_parts,
            image: set.set_img_url
        }))
    };
}

/**
 * Map Rebrickable color ID to LDraw color ID (approximate)
 */
export function rebrickableToLDrawColor(rbColorId) {
    const colorMap = {
        0: 0,      // Black
        1: 1,      // Blue
        2: 2,      // Green
        3: 3,      // Dark Turquoise
        4: 4,      // Red
        5: 5,      // Dark Pink
        6: 6,      // Brown
        7: 7,      // Light Gray
        8: 8,      // Dark Gray
        9: 9,      // Light Blue
        10: 10,    // Bright Green
        11: 11,    // Light Turquoise
        12: 12,    // Salmon
        13: 13,    // Pink
        14: 14,    // Yellow
        15: 15,    // White
        19: 19,    // Tan
        22: 22,    // Purple
        25: 25,    // Orange
        26: 26,    // Magenta
        27: 27,    // Lime
        28: 28,    // Dark Tan
        29: 29,    // Bright Pink
        31: 31,    // Medium Lavender
        68: 27,    // Very Light Orange -> Lime (approx)
        69: 17,    // Light Purple -> Light Green (approx)
        70: 6,     // Reddish Brown
        71: 7,     // Light Bluish Gray
        72: 8,     // Dark Bluish Gray
        73: 9,     // Medium Blue
        74: 10,    // Medium Green
        84: 6,     // Medium Dark Flesh
        85: 22,    // Medium Lilac
        86: 6,     // Light Flesh
        110: 1,    // Violet
        112: 1,    // Medium Violet
        115: 27,   // Medium Lime
        118: 11,   // Aqua
        120: 10,   // Bright Light Green
        125: 25,   // Light Orange
        150: 7,    // Medium Dark Pink
        151: 2,    // Sand Green
        153: 6,    // Sand Red
        154: 4,    // New Dark Red
        191: 25,   // Fire Yellow
        212: 9,    // Bright Light Blue
        226: 14,   // Cool Yellow
        272: 8,    // Dark Blue
        288: 2,    // Dark Green
        308: 6,    // Dark Brown
        320: 4,    // Dark Red
        321: 3,    // Dark Azure
        322: 11,   // Medium Azure
        323: 11,   // Aqua
        326: 27,   // Spring Yellowish Green
        329: 17,   // Glow in Dark White
        330: 17,   // Olive Green
        // Trans colors
        32: 15,    // Trans-Clear
        33: 1,     // Trans-Dark Blue
        34: 2,     // Trans-Green
        36: 4,     // Trans-Red
        37: 5,     // Trans-Dark Pink
        38: 25,    // Trans-Neon Orange
        40: 6,     // Trans-Brown
        41: 11,    // Trans-Light Blue
        42: 10,    // Trans-Neon Green
        43: 9,     // Trans-Very Light Blue
        44: 22,    // Trans-Light Purple
        46: 14,    // Trans-Yellow
        47: 15,    // Trans-Clear (alt)
        52: 22,    // Trans-Purple
        54: 14,    // Trans-Neon Yellow
    };
    
    return colorMap[rbColorId] ?? 7; // Default to light gray
}
