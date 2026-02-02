/**
 * Rebrickable API integration
 * Free API: https://rebrickable.com/api/v3/docs/
 */

import { FEATURED_SETS, THEMES, SET_PARTS } from './bundled-sets.js';

// Rebrickable API key
const DEFAULT_API_KEY = '63fc594deb555ac97f1b84596befd2b1';
const getApiKey = () => localStorage.getItem('rebrickable_api_key') || DEFAULT_API_KEY;
const BASE_URL = 'https://rebrickable.com/api/v3';

// Check if API is available
async function apiAvailable() {
    const key = getApiKey();
    if (!key) return false;
    try {
        const response = await fetch(`${BASE_URL}/lego/themes/?page_size=1`, {
            headers: { 'Authorization': `key ${key}` }
        });
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * Search for sets by name or number
 */
export async function searchSets(query, page = 1, pageSize = 20) {
    const key = getApiKey();
    
    // Try API first if key exists
    if (key) {
        try {
            const url = `${BASE_URL}/lego/sets/?search=${encodeURIComponent(query)}&page=${page}&page_size=${pageSize}`;
            const response = await fetch(url, {
                headers: { 'Authorization': `key ${key}` }
            });
            
            if (response.ok) {
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
        } catch (e) {
            console.warn('API search failed, using bundled data:', e);
        }
    }
    
    // Fallback to bundled data
    const lowerQuery = query.toLowerCase();
    const filtered = FEATURED_SETS.filter(s => 
        s.name.toLowerCase().includes(lowerQuery) ||
        s.number.includes(query) ||
        s.theme.toLowerCase().includes(lowerQuery)
    );
    
    return {
        count: filtered.length,
        sets: filtered
    };
}

/**
 * Get parts list for a specific set
 */
export async function getSetParts(setNum) {
    const key = getApiKey();
    
    if (key) {
        try {
            const parts = [];
            let url = `${BASE_URL}/lego/sets/${setNum}/parts/?page_size=500`;
            
            while (url) {
                const response = await fetch(url, {
                    headers: { 'Authorization': `key ${key}` }
                });
                
                if (!response.ok) break;
                
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
            
            if (parts.length > 0) return parts;
        } catch (e) {
            console.warn('API parts fetch failed:', e);
        }
    }
    
    // Check bundled parts
    if (SET_PARTS[setNum]) {
        return SET_PARTS[setNum];
    }
    
    // Generate placeholder parts for demo
    const set = FEATURED_SETS.find(s => s.id === setNum);
    if (set) {
        return generatePlaceholderParts(set.pieces);
    }
    
    throw new Error('Parts not available. Add your Rebrickable API key in Settings for full access.');
}

/**
 * Generate placeholder parts for demo purposes
 */
function generatePlaceholderParts(totalPieces) {
    const partTypes = [
        { id: '3001', name: 'Brick 2x4', pct: 0.08 },
        { id: '3003', name: 'Brick 2x2', pct: 0.10 },
        { id: '3004', name: 'Brick 1x2', pct: 0.12 },
        { id: '3005', name: 'Brick 1x1', pct: 0.08 },
        { id: '3020', name: 'Plate 2x4', pct: 0.10 },
        { id: '3022', name: 'Plate 2x2', pct: 0.12 },
        { id: '3023', name: 'Plate 1x2', pct: 0.15 },
        { id: '3024', name: 'Plate 1x1', pct: 0.10 },
        { id: '3710', name: 'Plate 1x4', pct: 0.08 },
        { id: '3039', name: 'Slope 45 2x2', pct: 0.04 },
        { id: '3069b', name: 'Tile 1x2', pct: 0.03 },
    ];
    
    const colors = [
        { id: 0, name: 'Black', hex: '#1B2A34' },
        { id: 15, name: 'White', hex: '#F4F4F4' },
        { id: 7, name: 'Light Gray', hex: '#8A928D' },
        { id: 8, name: 'Dark Gray', hex: '#545955' },
        { id: 4, name: 'Red', hex: '#B40000' },
        { id: 1, name: 'Blue', hex: '#1E5AA8' },
        { id: 14, name: 'Yellow', hex: '#FAC80A' },
    ];
    
    const parts = [];
    for (const pt of partTypes) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        parts.push({
            id: pt.id,
            name: pt.name,
            color: color.id,
            colorName: color.name,
            colorHex: color.hex,
            quantity: Math.max(1, Math.round(totalPieces * pt.pct)),
            image: null,
            isSpare: false
        });
    }
    
    return parts;
}

/**
 * Get set details
 */
export async function getSetDetails(setNum) {
    const key = getApiKey();
    
    if (key) {
        try {
            const url = `${BASE_URL}/lego/sets/${setNum}/`;
            const response = await fetch(url, {
                headers: { 'Authorization': `key ${key}` }
            });
            
            if (response.ok) {
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
        } catch (e) {
            console.warn('API set details failed:', e);
        }
    }
    
    // Check bundled sets
    const bundled = FEATURED_SETS.find(s => s.id === setNum);
    if (bundled) {
        return bundled;
    }
    
    throw new Error(`Set ${setNum} not found`);
}

/**
 * Get popular/featured sets
 */
export async function getPopularSets(page = 1, pageSize = 20) {
    const key = getApiKey();
    
    if (key) {
        try {
            const currentYear = new Date().getFullYear();
            const url = `${BASE_URL}/lego/sets/?min_year=${currentYear - 2}&min_parts=100&ordering=-num_parts&page=${page}&page_size=${pageSize}`;
            
            const response = await fetch(url, {
                headers: { 'Authorization': `key ${key}` }
            });
            
            if (response.ok) {
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
        } catch (e) {
            console.warn('API failed, using bundled data:', e);
        }
    }
    
    // Return bundled featured sets
    return {
        count: FEATURED_SETS.length,
        sets: FEATURED_SETS
    };
}

/**
 * Get themes (categories)
 */
export async function getThemes() {
    const key = getApiKey();
    
    if (key) {
        try {
            const url = `${BASE_URL}/lego/themes/?page_size=500`;
            const response = await fetch(url, {
                headers: { 'Authorization': `key ${key}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                const popularThemeIds = [1, 158, 246, 252, 435, 494, 577, 602, 608, 610, 621, 695];
                
                return data.results
                    .filter(t => popularThemeIds.includes(t.id) || t.parent_id === null)
                    .map(t => ({ id: t.id, name: t.name, parentId: t.parent_id }))
                    .sort((a, b) => a.name.localeCompare(b.name));
            }
        } catch (e) {
            console.warn('API failed, using bundled themes:', e);
        }
    }
    
    // Return bundled themes
    return THEMES;
}

/**
 * Get sets by theme
 */
export async function getSetsByTheme(themeId, page = 1, pageSize = 20) {
    const key = getApiKey();
    
    if (key) {
        try {
            const url = `${BASE_URL}/lego/sets/?theme_id=${themeId}&min_parts=50&ordering=-year,-num_parts&page=${page}&page_size=${pageSize}`;
            const response = await fetch(url, {
                headers: { 'Authorization': `key ${key}` }
            });
            
            if (response.ok) {
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
        } catch (e) {
            console.warn('API failed:', e);
        }
    }
    
    // Filter bundled sets by theme name
    const theme = THEMES.find(t => t.id == themeId);
    if (theme) {
        const filtered = FEATURED_SETS.filter(s => s.theme === theme.name);
        return { count: filtered.length, sets: filtered };
    }
    
    return { count: 0, sets: [] };
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
