import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Cache for loaded parts and subparts
const partCache = new Map();
const subpartCache = new Map();
const loadingParts = new Map(); // Track in-progress loads

// LDraw parts library URL
const LDRAW_URL = 'https://raw.githubusercontent.com/gkjohnson/ldraw-parts-library/master/complete/ldraw/';

/**
 * Get geometry for a part - fetches from LDraw library
 */
export async function getPartGeometry(partId) {
    const cleanId = partId.toString().toLowerCase().replace(/\.dat$/, '').replace(/[a-z]$/, '');
    
    // Check cache first
    if (partCache.has(cleanId)) {
        const cached = partCache.get(cleanId);
        return cached ? cached.clone() : createFallbackBox(cleanId);
    }
    
    // Check if already loading
    if (loadingParts.has(cleanId)) {
        return loadingParts.get(cleanId);
    }
    
    // Start loading
    const loadPromise = loadPartGeometry(cleanId);
    loadingParts.set(cleanId, loadPromise);
    
    try {
        const geometry = await loadPromise;
        partCache.set(cleanId, geometry);
        return geometry.clone();
    } catch (e) {
        console.warn(`Failed to load part ${cleanId}:`, e.message);
        const fallback = createFallbackBox(cleanId);
        partCache.set(cleanId, fallback);
        return fallback.clone();
    } finally {
        loadingParts.delete(cleanId);
    }
}

/**
 * Load and parse a part from LDraw library
 */
async function loadPartGeometry(partId) {
    // Try parts folder first, then p (primitives)
    const urls = [
        `${LDRAW_URL}parts/${partId}.dat`,
        `${LDRAW_URL}p/${partId}.dat`
    ];
    
    let content = null;
    for (const url of urls) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                content = await response.text();
                break;
            }
        } catch (e) {
            // Try next URL
        }
    }
    
    if (!content) {
        throw new Error(`Part not found: ${partId}`);
    }
    
    // Parse LDraw format
    return parseLDrawPart(content, partId);
}

/**
 * Parse LDraw .dat file content into geometry
 */
async function parseLDrawPart(content, partId, depth = 0) {
    if (depth > 10) {
        // Prevent infinite recursion
        return null;
    }
    
    const lines = content.split('\n');
    const vertices = [];
    const indices = [];
    const subpartGeometries = [];
    
    for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 2) continue;
        
        const lineType = parseInt(parts[0]);
        
        if (lineType === 3 && parts.length >= 11) {
            // Triangle: 3 color x1 y1 z1 x2 y2 z2 x3 y3 z3
            const baseIndex = vertices.length / 3;
            vertices.push(
                parseFloat(parts[2]), -parseFloat(parts[3]), parseFloat(parts[4]),
                parseFloat(parts[5]), -parseFloat(parts[6]), parseFloat(parts[7]),
                parseFloat(parts[8]), -parseFloat(parts[9]), parseFloat(parts[10])
            );
            indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
            
        } else if (lineType === 4 && parts.length >= 14) {
            // Quad: 4 color x1 y1 z1 x2 y2 z2 x3 y3 z3 x4 y4 z4
            const baseIndex = vertices.length / 3;
            vertices.push(
                parseFloat(parts[2]), -parseFloat(parts[3]), parseFloat(parts[4]),
                parseFloat(parts[5]), -parseFloat(parts[6]), parseFloat(parts[7]),
                parseFloat(parts[8]), -parseFloat(parts[9]), parseFloat(parts[10]),
                parseFloat(parts[11]), -parseFloat(parts[12]), parseFloat(parts[13])
            );
            // Two triangles for the quad
            indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
            indices.push(baseIndex, baseIndex + 2, baseIndex + 3);
            
        } else if (lineType === 1 && parts.length >= 15) {
            // Subpart reference: 1 color x y z a b c d e f g h i file.dat
            const subpartFile = parts[14].toLowerCase().replace(/\\/g, '/');
            
            // Load ALL subparts (not just specific ones)
            try {
                const subGeo = await loadSubpart(subpartFile, parts, depth);
                if (subGeo) {
                    subpartGeometries.push(subGeo);
                }
            } catch (e) {
                // Skip failed subparts silently
            }
        }
    }
    
    // Build geometry from vertices
    const geometries = [];
    
    if (vertices.length > 0 && indices.length > 0) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geo.setIndex(indices);
        geo.computeVertexNormals();
        geometries.push(geo);
    }
    
    geometries.push(...subpartGeometries);
    
    if (geometries.length === 0) {
        return createFallbackBox(partId);
    }
    
    if (geometries.length === 1) {
        return geometries[0];
    }
    
    try {
        return mergeGeometries(geometries, false);
    } catch (e) {
        return geometries[0];
    }
}

/**
 * Load a subpart with transformation
 */
async function loadSubpart(filename, parts, depth) {
    // Parse transformation matrix from line type 1
    const x = parseFloat(parts[2]);
    const y = -parseFloat(parts[3]); // Flip Y
    const z = parseFloat(parts[4]);
    const a = parseFloat(parts[5]), b = parseFloat(parts[6]), c = parseFloat(parts[7]);
    const d = parseFloat(parts[8]), e = parseFloat(parts[9]), f = parseFloat(parts[10]);
    const g = parseFloat(parts[11]), h = parseFloat(parts[12]), i = parseFloat(parts[13]);
    
    // Build transformation matrix (LDraw uses right-handed, Y-up)
    const matrix = new THREE.Matrix4();
    matrix.set(
        a, b, c, x,
        d, e, f, y,
        g, h, i, z,
        0, 0, 0, 1
    );
    
    // Fetch subpart - handle various path formats
    let cleanName = filename.replace('.dat', '');
    
    // Build list of possible URLs based on the filename pattern
    const urls = [];
    
    if (cleanName.startsWith('s/')) {
        // Subpart in parts/s/ folder
        urls.push(`${LDRAW_URL}parts/${cleanName}.dat`);
    } else if (cleanName.startsWith('48/')) {
        // High-res primitive
        urls.push(`${LDRAW_URL}p/${cleanName}.dat`);
    } else if (cleanName.startsWith('8/')) {
        // Low-res primitive  
        urls.push(`${LDRAW_URL}p/${cleanName}.dat`);
    } else {
        // Try multiple locations
        urls.push(
            `${LDRAW_URL}p/${cleanName}.dat`,
            `${LDRAW_URL}parts/s/${cleanName}.dat`,
            `${LDRAW_URL}parts/${cleanName}.dat`,
            `${LDRAW_URL}p/48/${cleanName}.dat`
        );
    }
    
    // Check subpart cache first
    if (subpartCache.has(cleanName)) {
        const cached = subpartCache.get(cleanName);
        if (cached) {
            const geo = cached.clone();
            geo.applyMatrix4(matrix);
            return geo;
        }
        return null;
    }
    
    for (const url of urls) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                const content = await response.text();
                const geo = await parseLDrawPart(content, cleanName, depth + 1);
                if (geo) {
                    // Cache the untransformed geometry
                    subpartCache.set(cleanName, geo);
                    // Return transformed clone
                    const transformed = geo.clone();
                    transformed.applyMatrix4(matrix);
                    return transformed;
                }
            }
        } catch (e) {
            // Try next URL
        }
    }
    
    // Cache null result to avoid retrying
    subpartCache.set(cleanName, null);
    return null;
}

/**
 * Create a fallback box geometry based on part ID
 */
function createFallbackBox(partId) {
    // Try to guess size from part ID
    let width = 20, height = 24, depth = 20;
    
    const id = partId.toString();
    
    // Common part patterns
    if (id.startsWith('300')) {
        // Bricks 3001-3010
        const brickSizes = {
            '3001': [40, 24, 80],  // 2x4
            '3002': [40, 24, 60],  // 2x3
            '3003': [40, 24, 40],  // 2x2
            '3004': [20, 24, 40],  // 1x2
            '3005': [20, 24, 20],  // 1x1
            '3006': [40, 24, 200], // 2x10
            '3007': [40, 24, 160], // 2x8
            '3008': [20, 24, 160], // 1x8
            '3009': [20, 24, 120], // 1x6
            '3010': [20, 24, 80],  // 1x4
        };
        if (brickSizes[id]) {
            [width, height, depth] = brickSizes[id];
        }
    } else if (id.startsWith('302')) {
        // Plates
        height = 8;
        const plateSizes = {
            '3020': [40, 8, 80],   // 2x4
            '3021': [40, 8, 60],   // 2x3
            '3022': [40, 8, 40],   // 2x2
            '3023': [20, 8, 40],   // 1x2
            '3024': [20, 8, 20],   // 1x1
        };
        if (plateSizes[id]) {
            [width, height, depth] = plateSizes[id];
        }
    }
    
    const geo = new THREE.BoxGeometry(width * 0.95, height, depth * 0.95);
    geo.translate(0, height / 2, 0);
    
    // Add simple studs
    const studsX = Math.max(1, Math.floor(width / 20));
    const studsZ = Math.max(1, Math.floor(depth / 20));
    const studGeos = [geo];
    
    for (let sx = 0; sx < studsX; sx++) {
        for (let sz = 0; sz < studsZ; sz++) {
            const studGeo = new THREE.CylinderGeometry(6, 6, 4, 8);
            const cx = (sx - (studsX - 1) / 2) * 20;
            const cz = (sz - (studsZ - 1) / 2) * 20;
            studGeo.translate(cx, height + 2, cz);
            studGeos.push(studGeo);
        }
    }
    
    try {
        return mergeGeometries(studGeos, false);
    } catch (e) {
        return geo;
    }
}

/**
 * Preload common parts
 */
export async function preloadCommonParts() {
    const commonParts = ['3001', '3003', '3004', '3005', '3020', '3022', '3023', '3024'];
    
    const results = await Promise.allSettled(
        commonParts.map(id => getPartGeometry(id))
    );
    
    const loaded = results.filter(r => r.status === 'fulfilled').length;
    console.log(`Preloaded ${loaded}/${commonParts.length} common parts`);
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
    return {
        cached: partCache.size,
        loading: loadingParts.size
    };
}
