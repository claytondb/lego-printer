/**
 * User inventory management with localStorage persistence
 */

const STORAGE_KEY = 'lego-printer-inventory';

/**
 * Load inventory from localStorage
 */
export function loadInventory() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            return JSON.parse(data);
        }
    } catch (e) {
        console.warn('Failed to load inventory:', e);
    }
    return { ownedParts: {}, collections: {} };
}

/**
 * Save inventory to localStorage
 */
export function saveInventory(inventory) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
    } catch (e) {
        console.warn('Failed to save inventory:', e);
    }
}

/**
 * Mark a part as owned
 * @param {string} partId - Part number
 * @param {number} colorId - Color ID
 * @param {number} quantity - How many owned
 */
export function setOwnedPart(partId, colorId, quantity) {
    const inventory = loadInventory();
    const key = `${partId}|${colorId}`;
    
    if (quantity > 0) {
        inventory.ownedParts[key] = quantity;
    } else {
        delete inventory.ownedParts[key];
    }
    
    saveInventory(inventory);
}

/**
 * Get quantity owned of a specific part/color
 */
export function getOwnedQuantity(partId, colorId) {
    const inventory = loadInventory();
    const key = `${partId}|${colorId}`;
    return inventory.ownedParts[key] || 0;
}

/**
 * Check if user has enough of a part
 */
export function hasEnough(partId, colorId, needed) {
    return getOwnedQuantity(partId, colorId) >= needed;
}

/**
 * Get all owned parts
 */
export function getAllOwned() {
    const inventory = loadInventory();
    return inventory.ownedParts;
}

/**
 * Clear all owned parts
 */
export function clearInventory() {
    const inventory = loadInventory();
    inventory.ownedParts = {};
    saveInventory(inventory);
}

/**
 * Import inventory from array of parts
 */
export function importInventory(parts) {
    const inventory = loadInventory();
    
    for (const part of parts) {
        const key = `${part.id}|${part.color}`;
        inventory.ownedParts[key] = (inventory.ownedParts[key] || 0) + part.quantity;
    }
    
    saveInventory(inventory);
}

/**
 * Export inventory as array
 */
export function exportInventory() {
    const inventory = loadInventory();
    const parts = [];
    
    for (const [key, quantity] of Object.entries(inventory.ownedParts)) {
        const [id, color] = key.split('|');
        parts.push({ id, color: parseInt(color), quantity });
    }
    
    return parts;
}

/**
 * Get inventory statistics
 */
export function getInventoryStats() {
    const inventory = loadInventory();
    const entries = Object.entries(inventory.ownedParts);
    
    return {
        uniqueParts: entries.length,
        totalPieces: entries.reduce((sum, [_, qty]) => sum + qty, 0)
    };
}

/**
 * Save/load named collections
 */
export function saveCollection(name, parts) {
    const inventory = loadInventory();
    inventory.collections = inventory.collections || {};
    inventory.collections[name] = {
        savedAt: Date.now(),
        parts: parts
    };
    saveInventory(inventory);
}

export function loadCollection(name) {
    const inventory = loadInventory();
    return inventory.collections?.[name]?.parts || null;
}

export function getCollectionNames() {
    const inventory = loadInventory();
    return Object.keys(inventory.collections || {});
}

export function deleteCollection(name) {
    const inventory = loadInventory();
    if (inventory.collections) {
        delete inventory.collections[name];
        saveInventory(inventory);
    }
}
