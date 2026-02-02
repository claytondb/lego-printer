import { LDRAW_COLORS } from './ldraw-colors.js';
import { LDRAW_PARTS } from './ldraw-parts.js';

/**
 * Parser for LDraw format files (.ldr, .mpd, .dat)
 * LDraw is the open standard for Lego CAD
 */
export class LDrawParser {
    constructor() {
        this.parts = new Map(); // part ID -> count by color
    }
    
    parse(content, filename = 'model') {
        const lines = content.split('\n').map(l => l.trim());
        const partCounts = new Map(); // "partId|color" -> { part info, count }
        let modelName = filename.replace(/\.[^.]+$/, '');
        
        for (const line of lines) {
            if (!line) continue;
            
            const parts = line.split(/\s+/);
            const lineType = parseInt(parts[0]);
            
            switch (lineType) {
                case 0:
                    // Comment or meta command
                    if (parts[1] === 'Name:') {
                        modelName = parts.slice(2).join(' ');
                    } else if (parts[1] === 'FILE' || parts[1] === '!DATA') {
                        // Submodel name
                    }
                    break;
                    
                case 1:
                    // Part reference
                    // Format: 1 <color> <x> <y> <z> <a> <b> <c> <d> <e> <f> <g> <h> <i> <part>
                    if (parts.length >= 15) {
                        const color = parseInt(parts[1]);
                        const partFile = parts.slice(14).join(' ').toLowerCase();
                        const partId = this.extractPartId(partFile);
                        
                        if (partId && !partFile.includes('.ldr')) {
                            // Only count actual parts, not submodels
                            const key = `${partId}|${color}`;
                            
                            if (!partCounts.has(key)) {
                                const partInfo = LDRAW_PARTS[partId] || { name: `Part ${partId}` };
                                const colorInfo = LDRAW_COLORS[color] || { name: 'Unknown', hex: '#888888' };
                                
                                partCounts.set(key, {
                                    id: partId,
                                    name: partInfo.name,
                                    color: color,
                                    colorName: colorInfo.name,
                                    quantity: 0
                                });
                            }
                            
                            partCounts.get(key).quantity++;
                        }
                    }
                    break;
                    
                case 2:
                case 3:
                case 4:
                case 5:
                    // Line, triangle, quad, optional line - geometry, skip
                    break;
            }
        }
        
        // Convert to array
        const partsArray = Array.from(partCounts.values());
        
        // Sort by quantity (most needed first)
        partsArray.sort((a, b) => b.quantity - a.quantity);
        
        return {
            name: modelName,
            parts: partsArray,
            totalPieces: partsArray.reduce((sum, p) => sum + p.quantity, 0)
        };
    }
    
    extractPartId(partFile) {
        // Remove path and extension
        let id = partFile.split('/').pop().split('\\').pop();
        id = id.replace(/\.dat$/i, '');
        
        // Handle common patterns
        // Some files have patterns like "3001.dat" or "s\3001s01.dat"
        
        // Extract base part number
        const match = id.match(/^(\d+[a-z]?\d*)/i);
        if (match) {
            return match[1];
        }
        
        return id;
    }
    
    // Parse Studio 2.0 .io files (they're SQLite databases with LDraw inside)
    parseStudioIO(content) {
        // .io files are actually SQLite databases
        // For a web app, we'd need sql.js to parse them
        // For now, return a helpful error
        throw new Error('Studio .io files require the desktop version. Please export as .ldr from Studio 2.0');
    }
}
