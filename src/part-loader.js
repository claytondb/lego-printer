import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// LDraw parts library sources (try multiple)
const PART_SOURCES = [
    'https://cdn.jsdelivr.net/gh/nicoschwabe/ldraw-parts@main/parts/',
    'https://raw.githubusercontent.com/nicoschwabe/ldraw-parts/main/parts/',
];

// Cache for loaded parts
const partCache = new Map();
const loadingPromises = new Map();

// LDraw unit scale (20 LDU = 1 stud = 8mm real)
const LDU_SCALE = 1;

/**
 * Pre-bundled basic parts (most common bricks)
 * These are simplified geometries, not full LDraw definitions
 */
const BUNDLED_PARTS = {
    // Bricks
    '3001': { name: 'Brick 2x4', dims: [2, 3, 4] },
    '3002': { name: 'Brick 2x3', dims: [2, 3, 3] },
    '3003': { name: 'Brick 2x2', dims: [2, 3, 2] },
    '3004': { name: 'Brick 1x2', dims: [1, 3, 2] },
    '3005': { name: 'Brick 1x1', dims: [1, 3, 1] },
    '3006': { name: 'Brick 2x10', dims: [2, 3, 10] },
    '3007': { name: 'Brick 2x8', dims: [2, 3, 8] },
    '3008': { name: 'Brick 1x8', dims: [1, 3, 8] },
    '3009': { name: 'Brick 1x6', dims: [1, 3, 6] },
    '3010': { name: 'Brick 1x4', dims: [1, 3, 4] },
    '3622': { name: 'Brick 1x3', dims: [1, 3, 3] },
    '3245': { name: 'Brick 1x2x2', dims: [1, 6, 2] },
    '2357': { name: 'Brick 2x2 Corner', dims: [2, 3, 2], corner: true },
    
    // Plates
    '3020': { name: 'Plate 2x4', dims: [2, 1, 4], plate: true },
    '3021': { name: 'Plate 2x3', dims: [2, 1, 3], plate: true },
    '3022': { name: 'Plate 2x2', dims: [2, 1, 2], plate: true },
    '3023': { name: 'Plate 1x2', dims: [1, 1, 2], plate: true },
    '3024': { name: 'Plate 1x1', dims: [1, 1, 1], plate: true },
    '3034': { name: 'Plate 2x8', dims: [2, 1, 8], plate: true },
    '3795': { name: 'Plate 2x6', dims: [2, 1, 6], plate: true },
    '3710': { name: 'Plate 1x4', dims: [1, 1, 4], plate: true },
    '3666': { name: 'Plate 1x6', dims: [1, 1, 6], plate: true },
    '3460': { name: 'Plate 1x8', dims: [1, 1, 8], plate: true },
    '3030': { name: 'Plate 4x10', dims: [4, 1, 10], plate: true },
    '3031': { name: 'Plate 4x4', dims: [4, 1, 4], plate: true },
    '3032': { name: 'Plate 4x6', dims: [4, 1, 6], plate: true },
    '3033': { name: 'Plate 6x10', dims: [6, 1, 10], plate: true },
    '3035': { name: 'Plate 4x8', dims: [4, 1, 8], plate: true },
    '3036': { name: 'Plate 6x8', dims: [6, 1, 8], plate: true },
    
    // Tiles (no studs)
    '3069b': { name: 'Tile 1x2', dims: [1, 1, 2], tile: true },
    '3070b': { name: 'Tile 1x1', dims: [1, 1, 1], tile: true },
    '2431': { name: 'Tile 1x4', dims: [1, 1, 4], tile: true },
    '6636': { name: 'Tile 1x6', dims: [1, 1, 6], tile: true },
    '4162': { name: 'Tile 1x8', dims: [1, 1, 8], tile: true },
    '3068b': { name: 'Tile 2x2', dims: [2, 1, 2], tile: true },
    '87079': { name: 'Tile 2x4', dims: [2, 1, 4], tile: true },
    
    // Slopes
    '3039': { name: 'Slope 45 2x2', dims: [2, 2, 2], slope: 45 },
    '3040': { name: 'Slope 45 1x2', dims: [1, 2, 2], slope: 45 },
    '3037': { name: 'Slope 45 2x4', dims: [2, 2, 4], slope: 45 },
    '3038': { name: 'Slope 45 2x3', dims: [2, 2, 3], slope: 45 },
    '3298': { name: 'Slope 33 3x2', dims: [2, 2, 3], slope: 33 },
    '3044': { name: 'Slope 45 Double 2x1', dims: [2, 2, 1], slope: 45, double: true },
    '3045': { name: 'Slope 45 Double 2x2', dims: [2, 2, 2], slope: 45, double: true },
    
    // Inverted Slopes
    '3660': { name: 'Slope Inv 45 2x2', dims: [2, 2, 2], slopeInv: 45 },
    '3665': { name: 'Slope Inv 45 1x2', dims: [1, 2, 2], slopeInv: 45 },
    
    // Round
    '3062b': { name: 'Brick Round 1x1', dims: [1, 3, 1], round: true },
    '3941': { name: 'Brick Round 2x2', dims: [2, 3, 2], round: true },
    '4073': { name: 'Plate Round 1x1', dims: [1, 1, 1], round: true, plate: true },
    '4032': { name: 'Plate Round 2x2', dims: [2, 1, 2], round: true, plate: true },
    '4589': { name: 'Cone 1x1', dims: [1, 3, 1], cone: true },
    '98100': { name: 'Cone 1x1 Top Groove', dims: [1, 3, 1], cone: true },
    
    // Technic
    '3700': { name: 'Technic Brick 1x2 Hole', dims: [1, 3, 2], technicHole: true },
    '3701': { name: 'Technic Brick 1x4 Holes', dims: [1, 3, 4], technicHole: true },
    '3702': { name: 'Technic Brick 1x8 Holes', dims: [1, 3, 8], technicHole: true },
    '2780': { name: 'Technic Pin', dims: [1, 1, 1], pin: true },
    '3673': { name: 'Technic Pin', dims: [1, 1, 1], pin: true },
    '6558': { name: 'Technic Pin Long', dims: [1, 2, 1], pin: true },
    
    // Modified Bricks
    '4070': { name: 'Brick 1x1 Headlight', dims: [1, 3, 1], headlight: true },
    '87087': { name: 'Brick 1x1 Stud Side', dims: [1, 3, 1], studSide: true },
    '30414': { name: 'Brick 1x4 Studs Side', dims: [1, 3, 4], studSide: true },
    
    // Wheels
    '4624': { name: 'Wheel Rim 8mm', dims: [1, 1, 1], wheel: true },
    '3641': { name: 'Tire Smooth', dims: [1, 1, 1], tire: true },
    
    // Windows
    '3065': { name: 'Brick 1x2 No Studs', dims: [1, 3, 2], hollow: true },
    '60601': { name: 'Window 1x2x2', dims: [1, 6, 2], window: true },
    
    // Curved
    '6091': { name: 'Brick Curved 2x1', dims: [2, 3, 1], curved: true },
    '11477': { name: 'Slope Curved 2x1', dims: [2, 2, 1], curvedSlope: true },
    '15068': { name: 'Slope Curved 2x2', dims: [2, 2, 2], curvedSlope: true },
    '50950': { name: 'Slope Curved 3x1', dims: [3, 2, 1], curvedSlope: true },
    '61678': { name: 'Slope Curved 4x1', dims: [4, 2, 1], curvedSlope: true },
};

/**
 * Get geometry for a part - from cache, bundled, or fetch
 */
export async function getPartGeometry(partId) {
    const cleanId = partId.toString().toLowerCase().replace(/[a-z]$/, '');
    
    // Check cache first
    if (partCache.has(cleanId)) {
        return partCache.get(cleanId).clone();
    }
    
    // Check if already loading
    if (loadingPromises.has(cleanId)) {
        const geo = await loadingPromises.get(cleanId);
        return geo ? geo.clone() : createFallbackGeometry(cleanId);
    }
    
    // Try bundled parts first
    if (BUNDLED_PARTS[cleanId]) {
        const geo = createBundledGeometry(cleanId, BUNDLED_PARTS[cleanId]);
        partCache.set(cleanId, geo);
        return geo.clone();
    }
    
    // Try to fetch from LDraw library
    const fetchPromise = fetchPartGeometry(cleanId);
    loadingPromises.set(cleanId, fetchPromise);
    
    const geo = await fetchPromise;
    loadingPromises.delete(cleanId);
    
    if (geo) {
        partCache.set(cleanId, geo);
        return geo.clone();
    }
    
    // Fallback to basic brick
    const fallback = createFallbackGeometry(cleanId);
    partCache.set(cleanId, fallback);
    return fallback.clone();
}

/**
 * Create geometry from bundled part definition
 */
function createBundledGeometry(partId, def) {
    const [studsX, heightUnits, studsZ] = def.dims;
    const STUD = 20;  // 20 LDU per stud
    const PLATE_H = 8;
    const BRICK_H = 24;
    
    const width = studsX * STUD;
    const depth = studsZ * STUD;
    const height = def.plate ? PLATE_H : (def.tile ? 4 : heightUnits * PLATE_H);
    
    const geometries = [];
    
    if (def.round || def.cone) {
        // Cylindrical parts
        const radius = Math.min(width, depth) / 2 * 0.9;
        if (def.cone) {
            geometries.push(new THREE.ConeGeometry(radius, height, 16));
        } else {
            geometries.push(new THREE.CylinderGeometry(radius, radius, height, 16));
        }
    } else if (def.slope) {
        // Slope geometry
        geometries.push(createSlopeGeometry(width, height, depth, def.slope, def.double));
    } else if (def.slopeInv) {
        // Inverted slope
        const slopeGeo = createSlopeGeometry(width, height, depth, def.slopeInv);
        slopeGeo.rotateX(Math.PI);
        geometries.push(slopeGeo);
    } else if (def.curvedSlope) {
        // Curved slope approximation
        geometries.push(createCurvedSlopeGeometry(width, height, depth));
    } else {
        // Standard box
        const bodyGeo = new THREE.BoxGeometry(width * 0.98, height, depth * 0.98);
        bodyGeo.translate(0, height / 2, 0);
        geometries.push(bodyGeo);
    }
    
    // Add studs (unless tile or special part)
    if (!def.tile && !def.cone && !def.pin && !def.tire) {
        const studGeo = new THREE.CylinderGeometry(6, 6, 4, 12);
        for (let sx = 0; sx < studsX; sx++) {
            for (let sz = 0; sz < studsZ; sz++) {
                const stud = studGeo.clone();
                stud.translate(
                    (sx - (studsX - 1) / 2) * STUD,
                    height + 2,
                    (sz - (studsZ - 1) / 2) * STUD
                );
                geometries.push(stud);
            }
        }
    }
    
    return mergeGeometries(geometries);
}

/**
 * Create slope geometry
 */
function createSlopeGeometry(width, height, depth, angle, double = false) {
    const shape = new THREE.Shape();
    
    if (double) {
        // Peaked roof shape
        shape.moveTo(-width/2, 0);
        shape.lineTo(width/2, 0);
        shape.lineTo(width/2, height * 0.3);
        shape.lineTo(0, height);
        shape.lineTo(-width/2, height * 0.3);
        shape.closePath();
    } else {
        // Single slope
        shape.moveTo(-width/2, 0);
        shape.lineTo(width/2, 0);
        shape.lineTo(width/2, height);
        shape.lineTo(-width/2, height * 0.3);
        shape.closePath();
    }
    
    const extrudeSettings = { depth: depth, bevelEnabled: false };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, 0, depth/2);
    
    return geo;
}

/**
 * Create curved slope geometry
 */
function createCurvedSlopeGeometry(width, height, depth) {
    const shape = new THREE.Shape();
    shape.moveTo(-width/2, 0);
    shape.lineTo(width/2, 0);
    shape.lineTo(width/2, height * 0.2);
    shape.quadraticCurveTo(width/4, height, -width/2, height);
    shape.closePath();
    
    const extrudeSettings = { depth: depth, bevelEnabled: false };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, 0, depth/2);
    
    return geo;
}

/**
 * Fetch and parse LDraw .dat file
 */
async function fetchPartGeometry(partId) {
    for (const baseUrl of PART_SOURCES) {
        try {
            const url = `${baseUrl}${partId}.dat`;
            const response = await fetch(url);
            
            if (!response.ok) continue;
            
            const text = await response.text();
            return parseLDrawDat(text);
        } catch (e) {
            continue;
        }
    }
    return null;
}

/**
 * Parse LDraw .dat file format into Three.js geometry
 */
function parseLDrawDat(content) {
    const lines = content.split('\n');
    const vertices = [];
    const triangles = [];
    const quads = [];
    
    for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (!parts.length) continue;
        
        const type = parseInt(parts[0]);
        
        switch (type) {
            case 3: // Triangle
                if (parts.length >= 11) {
                    triangles.push([
                        [parseFloat(parts[2]), parseFloat(parts[3]), parseFloat(parts[4])],
                        [parseFloat(parts[5]), parseFloat(parts[6]), parseFloat(parts[7])],
                        [parseFloat(parts[8]), parseFloat(parts[9]), parseFloat(parts[10])]
                    ]);
                }
                break;
                
            case 4: // Quad
                if (parts.length >= 14) {
                    quads.push([
                        [parseFloat(parts[2]), parseFloat(parts[3]), parseFloat(parts[4])],
                        [parseFloat(parts[5]), parseFloat(parts[6]), parseFloat(parts[7])],
                        [parseFloat(parts[8]), parseFloat(parts[9]), parseFloat(parts[10])],
                        [parseFloat(parts[11]), parseFloat(parts[12]), parseFloat(parts[13])]
                    ]);
                }
                break;
        }
    }
    
    // Convert to BufferGeometry
    const positions = [];
    
    // Add triangles
    for (const tri of triangles) {
        for (const v of tri) {
            positions.push(v[0] * LDU_SCALE, -v[1] * LDU_SCALE, v[2] * LDU_SCALE);
        }
    }
    
    // Add quads as two triangles
    for (const quad of quads) {
        // First triangle
        positions.push(quad[0][0] * LDU_SCALE, -quad[0][1] * LDU_SCALE, quad[0][2] * LDU_SCALE);
        positions.push(quad[1][0] * LDU_SCALE, -quad[1][1] * LDU_SCALE, quad[1][2] * LDU_SCALE);
        positions.push(quad[2][0] * LDU_SCALE, -quad[2][1] * LDU_SCALE, quad[2][2] * LDU_SCALE);
        // Second triangle
        positions.push(quad[0][0] * LDU_SCALE, -quad[0][1] * LDU_SCALE, quad[0][2] * LDU_SCALE);
        positions.push(quad[2][0] * LDU_SCALE, -quad[2][1] * LDU_SCALE, quad[2][2] * LDU_SCALE);
        positions.push(quad[3][0] * LDU_SCALE, -quad[3][1] * LDU_SCALE, quad[3][2] * LDU_SCALE);
    }
    
    if (positions.length === 0) return null;
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeVertexNormals();
    
    return geometry;
}

/**
 * Create fallback geometry for unknown parts
 */
function createFallbackGeometry(partId) {
    // Try to guess dimensions from part ID
    const dims = guessDimensions(partId);
    const STUD = 20;
    const height = dims.h * 8;
    
    const geometries = [];
    
    // Body
    const body = new THREE.BoxGeometry(dims.x * STUD * 0.98, height, dims.z * STUD * 0.98);
    body.translate(0, height / 2, 0);
    geometries.push(body);
    
    // Studs
    const studGeo = new THREE.CylinderGeometry(6, 6, 4, 12);
    for (let sx = 0; sx < dims.x; sx++) {
        for (let sz = 0; sz < dims.z; sz++) {
            const stud = studGeo.clone();
            stud.translate(
                (sx - (dims.x - 1) / 2) * STUD,
                height + 2,
                (sz - (dims.z - 1) / 2) * STUD
            );
            geometries.push(stud);
        }
    }
    
    return mergeGeometries(geometries);
}

/**
 * Guess part dimensions from ID
 */
function guessDimensions(partId) {
    // Default 1x1 brick
    let x = 1, z = 1, h = 3;
    
    const id = partId.toString();
    
    // Check for dimension patterns in name/ID
    const match = id.match(/(\d)x(\d+)/i);
    if (match) {
        x = parseInt(match[1]);
        z = parseInt(match[2]);
    }
    
    // Plates are shorter
    if (id.startsWith('302') || id.startsWith('303') || id.startsWith('371')) {
        h = 1;
    }
    
    return { x, z, h };
}

/**
 * Preload common parts
 */
export async function preloadCommonParts() {
    const commonParts = [
        '3001', '3002', '3003', '3004', '3005', '3010',
        '3020', '3021', '3022', '3023', '3024',
        '3039', '3040', '3037',
        '3710', '3666', '3795',
        '4589', '3062b'
    ];
    
    await Promise.all(commonParts.map(id => getPartGeometry(id)));
    console.log(`Preloaded ${commonParts.length} common parts`);
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
    return {
        cached: partCache.size,
        bundled: Object.keys(BUNDLED_PARTS).length,
        loading: loadingPromises.size
    };
}
