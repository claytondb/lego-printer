import * as THREE from 'three';
import { LDrawLoader } from 'three/examples/jsm/loaders/LDrawLoader.js';
import { LDrawConditionalLineMaterial } from 'three/examples/jsm/materials/LDrawConditionalLineMaterial.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Cache for loaded parts
const partCache = new Map();
const loadingParts = new Map();

// LDraw parts library URL
const LDRAW_URL = 'https://raw.githubusercontent.com/gkjohnson/ldraw-parts-library/master/complete/ldraw/';

// Shared LDrawLoader instance
let loader = null;
let loaderReady = false;

/**
 * Initialize the LDraw loader
 */
async function initLoader() {
    if (loader && loaderReady) return loader;
    
    loader = new LDrawLoader();
    loader.setPartsLibraryPath(LDRAW_URL);
    
    // Set the conditional line material (required by LDrawLoader)
    loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);
    
    // Preload materials/colors (use the alt config from the repo)
    try {
        await loader.preloadMaterials('https://raw.githubusercontent.com/gkjohnson/ldraw-parts-library/master/colors/ldcfgalt.ldr');
        console.log('LDraw materials loaded');
    } catch (e) {
        console.warn('Failed to load LDraw materials, using defaults:', e.message);
    }
    
    loaderReady = true;
    return loader;
}

/**
 * Get geometry for a part using Three.js LDrawLoader
 */
export async function getPartGeometry(partId) {
    const cleanId = partId.toString().toLowerCase().replace(/\.dat$/, '');
    
    // Check cache first
    if (partCache.has(cleanId)) {
        const cached = partCache.get(cleanId);
        return cached ? cached.clone() : createFallbackBox(cleanId);
    }
    
    // Check if already loading
    if (loadingParts.has(cleanId)) {
        try {
            const geo = await loadingParts.get(cleanId);
            return geo ? geo.clone() : createFallbackBox(cleanId);
        } catch (e) {
            return createFallbackBox(cleanId);
        }
    }
    
    // Start loading
    const loadPromise = loadPart(cleanId);
    loadingParts.set(cleanId, loadPromise);
    
    try {
        const geometry = await loadPromise;
        partCache.set(cleanId, geometry);
        loadingParts.delete(cleanId);
        return geometry ? geometry.clone() : createFallbackBox(cleanId);
    } catch (e) {
        console.warn(`Failed to load part ${cleanId}:`, e.message);
        loadingParts.delete(cleanId);
        const fallback = createFallbackBox(cleanId);
        partCache.set(cleanId, fallback);
        return fallback.clone();
    }
}

/**
 * Load a part using LDrawLoader
 */
async function loadPart(partId) {
    await initLoader();
    
    // Try different paths
    const paths = [
        `${LDRAW_URL}parts/${partId}.dat`,
        `${LDRAW_URL}p/${partId}.dat`,
        `${LDRAW_URL}parts/s/${partId}.dat`
    ];
    
    for (const path of paths) {
        try {
            console.log(`Trying to load: ${path}`);
            const group = await loadFromUrl(path);
            if (group) {
                console.log(`Loaded ${partId}, extracting geometry...`);
                const geometry = extractGeometryFromGroup(group);
                if (geometry) {
                    console.log(`Got geometry for ${partId}`);
                    return geometry;
                }
            }
        } catch (e) {
            console.log(`Failed to load from ${path}:`, e.message);
            // Try next path
        }
    }
    
    console.warn(`Part not found in any path: ${partId}`);
    return null; // Return null instead of throwing - will use fallback
}

/**
 * Load model from URL using LDrawLoader with timeout
 */
function loadFromUrl(url) {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error('Load timeout'));
        }, 10000); // 10 second timeout
        
        loader.load(
            url,
            (group) => {
                clearTimeout(timeoutId);
                resolve(group);
            },
            undefined,
            (error) => {
                clearTimeout(timeoutId);
                reject(error);
            }
        );
    });
}

/**
 * Extract merged geometry from loaded LDraw group
 */
function extractGeometryFromGroup(group) {
    const geometries = [];
    
    group.traverse((child) => {
        if (child.isMesh && child.geometry) {
            // Clone geometry and apply world transform
            const geo = child.geometry.clone();
            child.updateWorldMatrix(true, false);
            geo.applyMatrix4(child.matrixWorld);
            
            // Ensure geometry has position attribute
            if (geo.attributes.position) {
                // Remove index if present for easier merging
                if (geo.index) {
                    const nonIndexed = geo.toNonIndexed();
                    geometries.push(nonIndexed);
                } else {
                    geometries.push(geo);
                }
            }
        }
    });
    
    if (geometries.length === 0) {
        return null;
    }
    
    if (geometries.length === 1) {
        const geo = geometries[0];
        geo.computeVertexNormals();
        return geo;
    }
    
    // Merge all geometries
    try {
        const merged = mergeGeometries(geometries, false);
        if (merged) {
            merged.computeVertexNormals();
            return merged;
        }
    } catch (e) {
        console.warn('Failed to merge geometries:', e.message);
    }
    
    // Return first geometry if merge fails
    geometries[0].computeVertexNormals();
    return geometries[0];
}

/**
 * Create a fallback box geometry
 */
function createFallbackBox(partId) {
    // Try to guess dimensions from common part IDs
    let width = 20, height = 24, depth = 20;
    
    const id = partId.toString();
    const brickSizes = {
        '3001': [40, 24, 80], '3002': [40, 24, 60], '3003': [40, 24, 40],
        '3004': [20, 24, 40], '3005': [20, 24, 20], '3010': [20, 24, 80],
        '3020': [40, 8, 80], '3021': [40, 8, 60], '3022': [40, 8, 40],
        '3023': [20, 8, 40], '3024': [20, 8, 20],
    };
    
    if (brickSizes[id]) {
        [width, height, depth] = brickSizes[id];
    }
    
    const geo = new THREE.BoxGeometry(width * 0.95, height, depth * 0.95);
    geo.translate(0, height / 2, 0);
    return geo;
}

/**
 * Preload common parts
 */
export async function preloadCommonParts() {
    await initLoader();
    console.log('LDraw loader initialized');
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
