import * as THREE from 'three';
import { LDrawLoader } from 'three/examples/jsm/loaders/LDrawLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Cache for loaded parts
const partCache = new Map();

// LDraw loader instance
let ldrawLoader = null;
let loaderReady = false;

// LDraw parts library URL
const LDRAW_PARTS_URL = 'https://raw.githubusercontent.com/gkjohnson/ldraw-parts-library/master/complete/ldraw/';

/**
 * Initialize the LDraw loader
 */
async function initLoader() {
    if (ldrawLoader) return;
    
    ldrawLoader = new LDrawLoader();
    ldrawLoader.setPartsLibraryPath(LDRAW_PARTS_URL);
    
    // Preload the color configuration
    try {
        await ldrawLoader.preloadMaterials(`${LDRAW_PARTS_URL}LDConfig.ldr`);
        loaderReady = true;
        console.log('LDraw loader ready');
    } catch (e) {
        console.warn('Failed to preload LDraw materials:', e);
        // Still mark as ready, we'll use fallback colors
        loaderReady = true;
    }
}

/**
 * Get geometry for a part from LDraw library
 */
export async function getPartGeometry(partId) {
    const cleanId = partId.toString().toLowerCase().replace(/\.dat$/, '');
    
    // Check cache first
    if (partCache.has(cleanId)) {
        const cached = partCache.get(cleanId);
        return cached ? cached.clone() : createFallbackBox();
    }
    
    // Initialize loader if needed
    if (!ldrawLoader) {
        await initLoader();
    }
    
    try {
        // Try to load from LDraw library
        const geometry = await loadPartFromLibrary(cleanId);
        if (geometry) {
            partCache.set(cleanId, geometry);
            return geometry.clone();
        }
    } catch (e) {
        console.warn(`Failed to load part ${cleanId}:`, e.message);
    }
    
    // Fallback to simple box
    const fallback = createFallbackBox();
    partCache.set(cleanId, fallback);
    return fallback.clone();
}

/**
 * Load a part directly from the LDraw library
 */
async function loadPartFromLibrary(partId) {
    const partUrl = `${LDRAW_PARTS_URL}parts/${partId}.dat`;
    
    return new Promise((resolve, reject) => {
        ldrawLoader.load(
            partUrl,
            (group) => {
                // Extract geometry from the loaded group
                const geometry = extractGeometry(group);
                resolve(geometry);
            },
            undefined,
            (error) => {
                reject(error);
            }
        );
    });
}

/**
 * Extract merged geometry from LDraw group
 */
function extractGeometry(group) {
    const geometries = [];
    
    group.traverse((child) => {
        if (child.isMesh && child.geometry) {
            // Clone and apply transforms
            const geo = child.geometry.clone();
            child.updateMatrixWorld(true);
            geo.applyMatrix4(child.matrixWorld);
            
            // Ensure consistent attributes for merging
            if (geo.index) {
                geometries.push(geo);
            }
        }
    });
    
    if (geometries.length === 0) {
        return createFallbackBox();
    }
    
    if (geometries.length === 1) {
        return geometries[0];
    }
    
    // Try to merge geometries
    try {
        return mergeGeometries(geometries, false);
    } catch (e) {
        console.warn('Failed to merge geometries:', e);
        return geometries[0];
    }
}

/**
 * Create a fallback box geometry
 */
function createFallbackBox() {
    const geo = new THREE.BoxGeometry(20, 24, 20);
    geo.translate(0, 12, 0);
    return geo;
}

/**
 * Preload common parts (optional, for better UX)
 */
export async function preloadCommonParts() {
    await initLoader();
    
    // Preload a few very common parts
    const commonParts = ['3001', '3002', '3003', '3004', '3005', '3020', '3022', '3023'];
    
    for (const part of commonParts) {
        try {
            await getPartGeometry(part);
        } catch (e) {
            // Ignore errors during preload
        }
    }
    
    console.log(`Preloaded ${commonParts.length} common parts`);
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
    return {
        cached: partCache.size,
        bundled: 0 // No longer using bundled parts
    };
}
