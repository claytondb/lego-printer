import * as THREE from 'three';

// Cache for loaded parts
const partCache = new Map();

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
    
    try {
        // Check cache first
        if (partCache.has(cleanId)) {
            const cached = partCache.get(cleanId);
            return cached ? cached.clone() : createFallbackGeometry(cleanId);
        }
        
        // Try bundled parts first
        if (BUNDLED_PARTS[cleanId]) {
            try {
                const geo = createBundledGeometry(cleanId, BUNDLED_PARTS[cleanId]);
                if (geo) {
                    partCache.set(cleanId, geo);
                    return geo.clone();
                }
            } catch (e) {
                console.warn('Bundled geometry failed for', cleanId, e);
            }
        }
        
        // Use fallback geometry based on part ID
        try {
            const fallback = createFallbackGeometry(cleanId);
            if (fallback) {
                partCache.set(cleanId, fallback);
                return fallback.clone();
            }
        } catch (e) {
            console.warn('Fallback geometry failed for', cleanId, e);
        }
        
        // Ultimate fallback - simple box
        const box = new THREE.BoxGeometry(20, 24, 20);
        box.translate(0, 12, 0);
        partCache.set(cleanId, box);
        return box.clone();
        
    } catch (e) {
        console.warn('Error getting geometry for', partId, e);
        // Ultimate fallback - simple box
        const box = new THREE.BoxGeometry(20, 24, 20);
        box.translate(0, 12, 0);
        return box;
    }
}

/**
 * Create geometry from bundled part definition
 */
function createBundledGeometry(partId, def) {
    const [studsX, heightUnits, studsZ] = def.dims;
    const STUD = 20;  // 20 LDU per stud
    const PLATE_H = 8;
    
    const width = studsX * STUD;
    const depth = studsZ * STUD;
    const height = def.plate ? PLATE_H : (def.tile ? 4 : heightUnits * PLATE_H);
    
    try {
        if (def.tile) {
            // Tiles - flat with no studs
            return createTileGeometry(width, depth);
        } else if (def.round || def.cone) {
            // Round parts
            return createRoundGeometry(width, height, def.cone);
        } else if (def.slope) {
            // Slopes
            return createSlopeGeometry(width, height, depth);
        } else {
            // Standard brick/plate with studs
            return createBrickGeometry(width, height, depth, studsX, studsZ);
        }
    } catch (e) {
        console.warn('Failed to create geometry for', partId, e);
        return createSimpleBox(width, height, depth);
    }
}

/**
 * Create brick geometry with studs
 */
function createBrickGeometry(width, height, depth, studsX, studsZ) {
    const STUD = 20;
    const STUD_RADIUS = 6;
    const STUD_HEIGHT = 4;
    const STUD_SEGMENTS = 12;
    
    const vertices = [];
    const indices = [];
    let vertexOffset = 0;
    
    // Main body (box)
    const hw = width * 0.48;  // half width with small gap
    const hh = height / 2;
    const hd = depth * 0.48;
    
    // Box vertices (8 corners)
    const boxVerts = [
        [-hw, 0, -hd], [hw, 0, -hd], [hw, 0, hd], [-hw, 0, hd],  // bottom
        [-hw, height, -hd], [hw, height, -hd], [hw, height, hd], [-hw, height, hd]  // top
    ];
    
    for (const v of boxVerts) {
        vertices.push(...v);
    }
    
    // Box faces (6 faces, 2 triangles each)
    const boxIndices = [
        0,1,2, 0,2,3,  // bottom
        4,6,5, 4,7,6,  // top
        0,4,5, 0,5,1,  // front
        2,6,7, 2,7,3,  // back
        0,3,7, 0,7,4,  // left
        1,5,6, 1,6,2   // right
    ];
    indices.push(...boxIndices);
    vertexOffset = 8;
    
    // Add studs
    for (let sx = 0; sx < studsX; sx++) {
        for (let sz = 0; sz < studsZ; sz++) {
            const cx = (sx - (studsX - 1) / 2) * STUD;
            const cz = (sz - (studsZ - 1) / 2) * STUD;
            const baseY = height;
            
            // Stud cylinder vertices
            const studVerts = createCylinderVertices(cx, baseY, cz, STUD_RADIUS, STUD_HEIGHT, STUD_SEGMENTS);
            for (const v of studVerts.vertices) {
                vertices.push(...v);
            }
            
            // Stud indices (offset by current vertex count)
            for (const idx of studVerts.indices) {
                indices.push(idx + vertexOffset);
            }
            vertexOffset += studVerts.vertices.length;
        }
    }
    
    return createBufferGeometry(vertices, indices);
}

/**
 * Create cylinder vertices for studs
 */
function createCylinderVertices(cx, baseY, cz, radius, height, segments) {
    const vertices = [];
    const indices = [];
    
    // Bottom center
    vertices.push([cx, baseY, cz]);
    // Top center
    vertices.push([cx, baseY + height, cz]);
    
    // Bottom and top ring
    for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const x = cx + Math.cos(angle) * radius;
        const z = cz + Math.sin(angle) * radius;
        vertices.push([x, baseY, z]);         // bottom ring
        vertices.push([x, baseY + height, z]); // top ring
    }
    
    // Indices for bottom cap
    for (let i = 0; i < segments; i++) {
        const curr = 2 + i * 2;
        const next = 2 + ((i + 1) % segments) * 2;
        indices.push(0, next, curr);
    }
    
    // Indices for top cap
    for (let i = 0; i < segments; i++) {
        const curr = 3 + i * 2;
        const next = 3 + ((i + 1) % segments) * 2;
        indices.push(1, curr, next);
    }
    
    // Indices for sides
    for (let i = 0; i < segments; i++) {
        const bl = 2 + i * 2;
        const br = 2 + ((i + 1) % segments) * 2;
        const tl = bl + 1;
        const tr = br + 1;
        indices.push(bl, br, tr);
        indices.push(bl, tr, tl);
    }
    
    return { vertices, indices };
}

/**
 * Create tile geometry (flat, no studs)
 */
function createTileGeometry(width, depth) {
    const height = 4;
    const hw = width * 0.48;
    const hd = depth * 0.48;
    
    const vertices = [
        [-hw, 0, -hd], [hw, 0, -hd], [hw, 0, hd], [-hw, 0, hd],
        [-hw, height, -hd], [hw, height, -hd], [hw, height, hd], [-hw, height, hd]
    ];
    
    const indices = [
        0,1,2, 0,2,3,
        4,6,5, 4,7,6,
        0,4,5, 0,5,1,
        2,6,7, 2,7,3,
        0,3,7, 0,7,4,
        1,5,6, 1,6,2
    ];
    
    return createBufferGeometry(vertices.map(v => [...v]), indices);
}

/**
 * Create round brick/cone geometry
 */
function createRoundGeometry(width, height, isCone) {
    const radius = width / 2 * 0.9;
    const segments = 16;
    const vertices = [];
    const indices = [];
    
    // Bottom center
    vertices.push([0, 0, 0]);
    // Top center
    vertices.push([0, height, 0]);
    
    // Bottom and top rings
    for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        vertices.push([x, 0, z]);
        vertices.push([x * (isCone ? 0.1 : 1), height, z * (isCone ? 0.1 : 1)]);
    }
    
    // Bottom cap
    for (let i = 0; i < segments; i++) {
        const curr = 2 + i * 2;
        const next = 2 + ((i + 1) % segments) * 2;
        indices.push(0, next, curr);
    }
    
    // Top cap
    for (let i = 0; i < segments; i++) {
        const curr = 3 + i * 2;
        const next = 3 + ((i + 1) % segments) * 2;
        indices.push(1, curr, next);
    }
    
    // Sides
    for (let i = 0; i < segments; i++) {
        const bl = 2 + i * 2;
        const br = 2 + ((i + 1) % segments) * 2;
        const tl = bl + 1;
        const tr = br + 1;
        indices.push(bl, br, tr);
        indices.push(bl, tr, tl);
    }
    
    return createBufferGeometry(vertices, indices);
}

/**
 * Create slope geometry
 */
function createSlopeGeometry(width, height, depth) {
    const hw = width * 0.48;
    const hd = depth * 0.48;
    
    // Slope vertices - angled top
    const vertices = [
        // Bottom
        [-hw, 0, -hd], [hw, 0, -hd], [hw, 0, hd], [-hw, 0, hd],
        // Top (sloped - back is higher)
        [-hw, height * 0.2, -hd], [hw, height * 0.2, -hd], 
        [hw, height, hd], [-hw, height, hd]
    ];
    
    const indices = [
        0,1,2, 0,2,3,  // bottom
        4,6,5, 4,7,6,  // top (sloped)
        0,4,5, 0,5,1,  // front
        2,6,7, 2,7,3,  // back
        0,3,7, 0,7,4,  // left
        1,5,6, 1,6,2   // right
    ];
    
    return createBufferGeometry(vertices.map(v => [...v]), indices);
}

/**
 * Create simple box geometry (fallback)
 */
function createSimpleBox(width, height, depth) {
    const geo = new THREE.BoxGeometry(width * 0.95, height, depth * 0.95);
    geo.translate(0, height / 2, 0);
    return geo;
}

/**
 * Create BufferGeometry from vertices and indices
 */
function createBufferGeometry(vertices, indices) {
    if (!vertices || vertices.length === 0) {
        console.warn('Empty vertices, using fallback box');
        return new THREE.BoxGeometry(20, 24, 20);
    }
    
    try {
        const positions = new Float32Array(vertices.length * 3);
        for (let i = 0; i < vertices.length; i++) {
            positions[i * 3] = vertices[i][0];
            positions[i * 3 + 1] = vertices[i][1];
            positions[i * 3 + 2] = vertices[i][2];
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        if (indices && indices.length > 0) {
            geometry.setIndex(indices);
        }
        geometry.computeVertexNormals();
        
        return geometry;
    } catch (e) {
        console.warn('Failed to create buffer geometry:', e);
        return new THREE.BoxGeometry(20, 24, 20);
    }
}

/**
 * Create slope geometry
 */
/**
 * Create fallback geometry for unknown parts
 */
function createFallbackGeometry(partId) {
    // Try to guess dimensions from part ID
    const dims = guessDimensions(partId);
    const STUD = 20;
    const height = dims.h * 8;
    
    try {
        // Create proper brick with studs
        return createBrickGeometry(dims.x * STUD, height, dims.z * STUD, dims.x, dims.z);
    } catch (e) {
        console.warn('Failed to create fallback geometry for', partId, e);
        return createSimpleBox(dims.x * STUD, height, dims.z * STUD);
    }
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
    // Pre-generate geometries for bundled parts
    const bundledIds = Object.keys(BUNDLED_PARTS);
    for (const id of bundledIds) {
        try {
            await getPartGeometry(id);
        } catch (e) {
            console.warn('Failed to preload', id);
        }
    }
    console.log(`Preloaded ${bundledIds.length} common parts`);
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
