import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import JSZip from 'jszip';
import { LDRAW_COLORS } from './ldraw-colors.js';
import { getPartGeometry, preloadCommonParts, getCacheStats } from './part-loader.js';
import { searchSets, getSetParts, getSetDetails, getPopularSets, getThemes, getSetsByTheme, rebrickableToLDrawColor } from './rebrickable.js';
import { loadInventory, saveInventory, getOwnedQuantity, setOwnedPart, getInventoryStats, clearInventory } from './inventory.js';
import { calculateTotalCost, estimate3DPrintCost, formatPrice, getBrickLinkUrl } from './bricklink.js';

// App State
const state = {
    parts: [],              // Parsed parts with geometry
    partInstances: [],      // Individual placed parts with transforms
    selectedParts: new Set(),
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    builtGroup: null,       // Group for assembled model
    partsGroup: null,       // Group for laid-out parts
    viewMode: 'built',      // 'built' or 'parts'
    currentModelName: '',
    rawLdrContent: null,    // Store raw LDR for parsing
    colorFilter: '',        // Current color filter
    searchPage: 1,          // Rebrickable search page
    searchQuery: '',        // Current search query
    searchResults: null,    // Cached search results
    currentThemeId: null,   // Current theme being browsed
    currentThemeName: ''    // Current theme name
};

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
    setupUpload();
    setupWorkspace();
    setupModal();
    setupRebrickableSearch();
    setupInventoryUI();
    updateInventoryDisplay();
    setupPWAInstall();
    
    // Preload common parts in background
    preloadCommonParts().then(() => {
        const stats = getCacheStats();
        console.log(`Part cache ready: ${stats.bundled} bundled, ${stats.cached} cached`);
    });
}

// PWA Install Prompt
let deferredPrompt;
function setupPWAInstall() {
    const installBtn = document.getElementById('installBtn');
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBtn.style.display = 'inline-block';
    });
    
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('Install outcome:', outcome);
        deferredPrompt = null;
        installBtn.style.display = 'none';
    });
    
    window.addEventListener('appinstalled', () => {
        console.log('App installed');
        installBtn.style.display = 'none';
    });
}

// Rebrickable Catalog
function setupRebrickableSearch() {
    const modal = document.getElementById('catalogModal');
    const searchInput = document.getElementById('rebrickableSearch');
    const searchBtn = document.getElementById('searchBtn');
    
    document.getElementById('catalogBtn').addEventListener('click', () => {
        modal.style.display = 'flex';
        loadFeaturedSets();
        loadThemes();
    });
    
    document.getElementById('closeCatalog').addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab + 'Tab').classList.add('active');
            
            // Hide search results when switching tabs
            document.getElementById('searchResults').style.display = 'none';
            document.getElementById('catalogContent').style.display = 'block';
            document.getElementById('catalogPagination').style.display = 'none';
        });
    });
    
    // Search
    searchBtn.addEventListener('click', () => performSearch());
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
    
    // Pagination
    document.getElementById('prevPage').addEventListener('click', () => {
        if (state.searchPage > 1) {
            state.searchPage--;
            if (state.currentThemeId) {
                loadThemeSets(state.currentThemeId, false);
            } else {
                performSearch(false);
            }
        }
    });
    
    document.getElementById('nextPage').addEventListener('click', () => {
        state.searchPage++;
        if (state.currentThemeId) {
            loadThemeSets(state.currentThemeId, false);
        } else {
            performSearch(false);
        }
    });
    
    // Back to themes
    document.getElementById('backToThemes').addEventListener('click', () => {
        document.getElementById('themesList').style.display = 'grid';
        document.getElementById('themesSetsGrid').style.display = 'none';
        document.getElementById('backToThemes').style.display = 'none';
        document.getElementById('catalogPagination').style.display = 'none';
        state.currentThemeId = null;
    });
}

// Load featured sets
async function loadFeaturedSets() {
    const grid = document.getElementById('featuredGrid');
    if (grid.dataset.loaded) return;
    
    grid.innerHTML = '<div class="loading-placeholder"><div class="loading-spinner"></div> Loading featured sets...</div>';
    
    try {
        const results = await getPopularSets(1, 12);
        grid.innerHTML = renderSetGrid(results.sets);
        attachSetClickHandlers(grid);
        grid.dataset.loaded = 'true';
    } catch (error) {
        console.error('Failed to load featured sets:', error);
        grid.innerHTML = '<div class="loading-placeholder">Failed to load featured sets</div>';
    }
}

// Load themes
async function loadThemes() {
    const grid = document.getElementById('themesList');
    if (grid.dataset.loaded) return;
    
    grid.innerHTML = '<div class="loading-placeholder"><div class="loading-spinner"></div> Loading themes...</div>';
    
    try {
        const themes = await getThemes();
        
        // Theme icons mapping
        const themeIcons = {
            'Technic': '⚙️',
            'Star Wars': '⭐',
            'Harry Potter': '⚡',
            'Architecture': '🏛️',
            'Speed Champions': '🏎️',
            'Creator Expert': '🎨',
            'Ideas': '💡',
            'Creator 3-in-1': '🔄',
            'City': '🏙️',
            'Ninjago': '🥷',
            'Super Heroes': '🦸',
            'Icons': '🏆',
            'Disney': '🏰',
            'Friends': '💜',
            'Minecraft': '⛏️',
            'DUPLO': '👶',
            'Classic': '🧱',
        };
        
        grid.innerHTML = themes.slice(0, 20).map(theme => `
            <div class="theme-card" data-theme-id="${theme.id}" data-theme-name="${theme.name}">
                <div class="theme-icon">${themeIcons[theme.name] || '📦'}</div>
                <div class="theme-name">${theme.name}</div>
            </div>
        `).join('');
        
        grid.querySelectorAll('.theme-card').forEach(card => {
            card.addEventListener('click', () => {
                state.currentThemeId = card.dataset.themeId;
                state.currentThemeName = card.dataset.themeName;
                loadThemeSets(card.dataset.themeId);
            });
        });
        
        grid.dataset.loaded = 'true';
    } catch (error) {
        console.error('Failed to load themes:', error);
        grid.innerHTML = '<div class="loading-placeholder">Failed to load themes</div>';
    }
}

// Load sets for a theme
async function loadThemeSets(themeId, resetPage = true) {
    if (resetPage) state.searchPage = 1;
    
    const grid = document.getElementById('themesSetsGrid');
    const themesList = document.getElementById('themesList');
    const backBtn = document.getElementById('backToThemes');
    
    themesList.style.display = 'none';
    grid.style.display = 'grid';
    backBtn.style.display = 'block';
    grid.innerHTML = '<div class="loading-placeholder"><div class="loading-spinner"></div> Loading sets...</div>';
    
    try {
        const results = await getSetsByTheme(themeId, state.searchPage, 12);
        grid.innerHTML = renderSetGrid(results.sets);
        attachSetClickHandlers(grid);
        
        // Pagination
        const totalPages = Math.ceil(results.count / 12);
        document.getElementById('catalogPagination').style.display = 'flex';
        document.getElementById('pageInfo').textContent = `Page ${state.searchPage} of ${totalPages}`;
        document.getElementById('prevPage').disabled = state.searchPage <= 1;
        document.getElementById('nextPage').disabled = state.searchPage >= totalPages;
        
    } catch (error) {
        console.error('Failed to load theme sets:', error);
        grid.innerHTML = '<div class="loading-placeholder">Failed to load sets</div>';
    }
}

// Search sets
async function performSearch(resetPage = true) {
    const query = document.getElementById('rebrickableSearch').value.trim();
    if (!query) return;
    
    if (resetPage) state.searchPage = 1;
    state.searchQuery = query;
    state.currentThemeId = null;
    
    // Show search results, hide tabs content
    document.getElementById('catalogContent').style.display = 'none';
    const resultsGrid = document.getElementById('searchResults');
    resultsGrid.style.display = 'grid';
    resultsGrid.innerHTML = '<div class="loading-placeholder"><div class="loading-spinner"></div> Searching...</div>';
    
    try {
        const results = await searchSets(query, state.searchPage, 12);
        state.searchResults = results;
        
        if (results.sets.length === 0) {
            resultsGrid.innerHTML = '<div class="loading-placeholder">No sets found for "' + query + '"</div>';
            document.getElementById('catalogPagination').style.display = 'none';
            return;
        }
        
        resultsGrid.innerHTML = renderSetGrid(results.sets);
        attachSetClickHandlers(resultsGrid);
        
        // Pagination
        const totalPages = Math.ceil(results.count / 12);
        document.getElementById('catalogPagination').style.display = 'flex';
        document.getElementById('pageInfo').textContent = `Page ${state.searchPage} of ${totalPages}`;
        document.getElementById('prevPage').disabled = state.searchPage <= 1;
        document.getElementById('nextPage').disabled = state.searchPage >= totalPages;
        
    } catch (error) {
        console.error('Search error:', error);
        resultsGrid.innerHTML = '<div class="loading-placeholder">Search failed. Please try again.</div>';
    }
}

// Render set grid HTML
function renderSetGrid(sets) {
    return sets.map(set => `
        <div class="catalog-item" data-set-num="${set.id}">
            <div class="catalog-thumb">
                ${set.image ? `<img src="${set.image}" alt="${set.name}" loading="lazy">` : '<span class="emoji-thumb">🧱</span>'}
            </div>
            <div class="catalog-info">
                <div class="catalog-name">${set.name}</div>
                <div class="catalog-meta">
                    <span>#${set.number}</span>
                    <span>${set.pieces} pcs</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Attach click handlers to set cards
function attachSetClickHandlers(container) {
    container.querySelectorAll('.catalog-item').forEach(item => {
        item.addEventListener('click', () => loadRebrickableSet(item.dataset.setNum));
    });
}

async function loadRebrickableSet(setNum) {
    document.getElementById('catalogModal').style.display = 'none';
    showLoading(`Loading set ${setNum}...`);
    
    try {
        const [setDetails, parts] = await Promise.all([
            getSetDetails(setNum),
            getSetParts(setNum)
        ]);
        
        state.currentModelName = setDetails.name;
        state.parts = parts.filter(p => !p.isSpare).map(p => ({
            id: p.id,
            name: p.name,
            color: rebrickableToLDrawColor(p.color),
            colorName: p.colorName,
            colorHex: p.colorHex,
            quantity: p.quantity,
            image: p.image
        }));
        state.partInstances = [];
        state.builtGroup = null;
        
        // Select all by default
        state.selectedParts = new Set(state.parts.map((_, i) => i));
        
        // Switch to Parts view since we don't have assembly data
        state.viewMode = 'parts';
        
        hideLoading();
        showWorkspace(setDetails.name);
        populateColorFilter();
        renderPartsList();
        init3DPreview();
        
        // Update view toggle buttons
        document.getElementById('viewBuilt').classList.remove('active');
        document.getElementById('viewParts').classList.add('active');
        
    } catch (error) {
        hideLoading();
        console.error('Failed to load set:', error);
        alert('Failed to load set: ' + error.message);
    }
}

// Inventory UI
function setupInventoryUI() {
    const modal = document.getElementById('inventoryModal');
    
    document.getElementById('manageInventory').addEventListener('click', () => {
        updateInventoryModal();
        modal.style.display = 'flex';
    });
    
    document.getElementById('closeInventory').addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
    
    document.getElementById('clearInventory').addEventListener('click', () => {
        if (confirm('Clear all inventory? This cannot be undone.')) {
            clearInventory();
            updateInventoryDisplay();
            updateInventoryModal();
            renderPartsList();
        }
    });
    
    document.getElementById('importInventory').addEventListener('click', () => {
        alert('Load a set first, then click the ✓ button on each part to add it to your inventory.');
    });
    
    document.getElementById('exportInventoryBtn').addEventListener('click', () => {
        const inventory = loadInventory();
        const blob = new Blob([JSON.stringify(inventory, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'lego-inventory.json';
        a.click();
        URL.revokeObjectURL(url);
    });
}

function updateInventoryDisplay() {
    const stats = getInventoryStats();
    document.getElementById('inventoryStats').textContent = 
        `📦 Inventory: ${stats.uniqueParts} parts (${stats.totalPieces} pieces)`;
}

function updateInventoryModal() {
    const stats = getInventoryStats();
    document.getElementById('invUniqueParts').textContent = stats.uniqueParts;
    document.getElementById('invTotalPieces').textContent = stats.totalPieces;
}

function populateColorFilter() {
    const select = document.getElementById('filterColor');
    const colors = new Map();
    
    for (const part of state.parts) {
        if (!colors.has(part.colorName)) {
            colors.set(part.colorName, part.colorHex || LDRAW_COLORS[part.color]?.hex || '#888888');
        }
    }
    
    // Sort by name
    const sorted = [...colors.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    
    select.innerHTML = '<option value="">All Colors</option>' + 
        sorted.map(([name, hex]) => 
            `<option value="${name}" style="color: ${hex}">● ${name}</option>`
        ).join('');
}

// File Upload
function setupUpload() {
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');

    uploadZone.addEventListener('click', () => fileInput.click());
    
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) loadFile(file);
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) loadFile(file);
    });
}

async function loadFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    
    showLoading('Loading model...');
    
    try {
        if (ext === 'io') {
            throw new Error('Studio .io files must be exported as .ldr first. In Studio 2.0: File → Export → Export as LDraw');
        }
        
        const text = await file.text();
        state.rawLdrContent = text;
        state.currentModelName = file.name.replace(/\.[^.]+$/, '');
        
        await loadLDrawModel(text, file.name);
        
    } catch (error) {
        console.error('Load error:', error);
        hideLoading();
        alert('Failed to load file: ' + error.message);
    }
}

async function loadLDrawModel(ldrContent, filename) {
    showLoading('Parsing LDraw file...');
    
    try {
        // Parse parts list and instances from content
        const partsData = parseLDrawParts(ldrContent);
        state.parts = partsData.parts;
        state.partInstances = partsData.instances;
        
        // Select all by default
        state.selectedParts = new Set(state.parts.map((_, i) => i));
        
        showLoading('Loading part geometry...');
        
        // Build the assembled model from part instances
        if (state.partInstances.length > 0) {
            state.builtGroup = await buildAssembledModel(state.partInstances);
        } else {
            state.builtGroup = null;
        }
        
        hideLoading();
        showWorkspace(state.currentModelName);
        renderPartsList();
        init3DPreview();
        
    } catch (error) {
        hideLoading();
        console.error('LDraw load error:', error);
        alert('Failed to load model: ' + error.message);
    }
}

// Build 3D assembled model from part instances
async function buildAssembledModel(instances) {
    const group = new THREE.Group();
    
    // Get unique part IDs
    const uniqueParts = [...new Set(instances.map(i => i.partId))];
    showLoading(`Loading ${uniqueParts.length} unique parts...`);
    
    // Preload all unique part geometries
    const geometryMap = new Map();
    await Promise.all(uniqueParts.map(async (partId) => {
        const geo = await getPartGeometry(partId);
        geometryMap.set(partId, geo);
    }));
    
    showLoading('Building model...');
    
    // Place each instance
    for (const inst of instances) {
        const geo = geometryMap.get(inst.partId);
        if (!geo) continue;
        
        const color = LDRAW_COLORS[inst.color] || { hex: '#888888' };
        const material = new THREE.MeshPhongMaterial({ 
            color: color.hex,
            flatShading: false
        });
        
        const mesh = new THREE.Mesh(geo.clone(), material);
        
        // Apply LDraw transformation matrix
        if (inst.matrix) {
            const m = new THREE.Matrix4();
            m.set(
                inst.matrix[0], inst.matrix[4], inst.matrix[8], inst.matrix[12],
                -inst.matrix[1], -inst.matrix[5], -inst.matrix[9], -inst.matrix[13], // Flip Y
                inst.matrix[2], inst.matrix[6], inst.matrix[10], inst.matrix[14],
                0, 0, 0, 1
            );
            mesh.applyMatrix4(m);
        } else {
            mesh.position.set(inst.x, -inst.y, inst.z);
        }
        
        group.add(mesh);
    }
    
    return group;
}

// Parse LDraw content for parts list
function parseLDrawParts(content) {
    const lines = content.split('\n').map(l => l.trim());
    const partCounts = new Map();
    const instances = [];
    const submodels = new Map();
    let currentSubmodel = null;
    
    // First pass: collect submodels
    for (const line of lines) {
        if (!line) continue;
        const parts = line.split(/\s+/);
        
        if (parts[0] === '0' && parts[1] === 'FILE') {
            currentSubmodel = parts.slice(2).join(' ').toLowerCase();
            submodels.set(currentSubmodel, []);
        } else if (currentSubmodel && submodels.has(currentSubmodel)) {
            submodels.get(currentSubmodel).push(line);
        }
    }
    
    // Second pass: parse parts
    const parseLines = (lineArray) => {
        for (const line of lineArray) {
            if (!line) continue;
            const parts = line.split(/\s+/);
            const lineType = parseInt(parts[0]);
            
            if (lineType === 1 && parts.length >= 15) {
                const color = parseInt(parts[1]);
                const x = parseFloat(parts[2]);
                const y = parseFloat(parts[3]);
                const z = parseFloat(parts[4]);
                // Transformation matrix (a b c d e f g h i)
                const a = parseFloat(parts[5]), b = parseFloat(parts[6]), c = parseFloat(parts[7]);
                const d = parseFloat(parts[8]), e = parseFloat(parts[9]), f = parseFloat(parts[10]);
                const g = parseFloat(parts[11]), h = parseFloat(parts[12]), i = parseFloat(parts[13]);
                const partFile = parts.slice(14).join(' ').toLowerCase();
                
                // Build 4x4 transformation matrix (column-major for Three.js)
                const matrix = [
                    a, d, g, 0,
                    b, e, h, 0,
                    c, f, i, 0,
                    x, y, z, 1
                ];
                
                // Check if it's a submodel reference
                if (submodels.has(partFile)) {
                    parseLines(submodels.get(partFile));
                } else {
                    const partId = extractPartId(partFile);
                    if (partId) {
                        instances.push({ partId, color, x, y, z, matrix, partFile });
                        
                        const key = `${partId}|${color}`;
                        if (!partCounts.has(key)) {
                            partCounts.set(key, {
                                id: partId,
                                name: getPartName(partId),
                                color: color,
                                colorName: LDRAW_COLORS[color]?.name || 'Unknown',
                                quantity: 0
                            });
                        }
                        partCounts.get(key).quantity++;
                    }
                }
            }
        }
    };
    
    // If MPD with submodels, parse main model; otherwise parse all
    if (submodels.size > 0) {
        const mainModel = submodels.keys().next().value;
        parseLines(submodels.get(mainModel) || lines);
    } else {
        parseLines(lines);
    }
    
    const partsArray = Array.from(partCounts.values());
    partsArray.sort((a, b) => b.quantity - a.quantity);
    
    return { parts: partsArray, instances };
}

function extractPartId(partFile) {
    let id = partFile.split('/').pop().split('\\').pop();
    id = id.replace(/\.dat$/i, '').replace(/\.ldr$/i, '');
    const match = id.match(/^(\d+[a-z]?\d*)/i);
    return match ? match[1] : null;
}

function getPartName(partId) {
    // Common part names
    const names = {
        '3001': 'Brick 2x4',
        '3002': 'Brick 2x3',
        '3003': 'Brick 2x2',
        '3004': 'Brick 1x2',
        '3005': 'Brick 1x1',
        '3010': 'Brick 1x4',
        '3020': 'Plate 2x4',
        '3021': 'Plate 2x3',
        '3022': 'Plate 2x2',
        '3023': 'Plate 1x2',
        '3024': 'Plate 1x1',
        '3622': 'Brick 1x3',
        '3710': 'Plate 1x4',
        '3795': 'Plate 2x6',
        '3034': 'Plate 2x8',
        '3832': 'Plate 2x10',
        '3030': 'Plate 4x10',
        '3031': 'Plate 4x4',
        '3032': 'Plate 4x6',
        '3033': 'Plate 6x10',
        '3035': 'Plate 4x8',
        '3036': 'Plate 6x8',
        '3460': 'Plate 1x8',
        '3666': 'Plate 1x6',
        '3039': 'Slope 45 2x2',
        '3040': 'Slope 45 1x2',
        '3298': 'Slope 33 3x2',
        '3037': 'Slope 45 2x4',
        '3038': 'Slope 45 2x3',
        '3660': 'Slope Inverted 45 2x2',
        '3665': 'Slope Inverted 45 1x2',
        '3700': 'Technic Brick 1x2 with Hole',
        '3701': 'Technic Brick 1x4 with Holes',
        '3702': 'Technic Brick 1x8 with Holes',
        '3703': 'Technic Brick 1x16 with Holes',
        '32316': 'Technic Liftarm 1x5',
        '6632': 'Technic Liftarm 1x3',
        '3749': 'Technic Axle Pin',
        '2780': 'Technic Pin',
        '4274': 'Technic Pin 1/2',
        '6558': 'Technic Pin Long',
        '32123': 'Technic Bush 1/2',
        '3713': 'Technic Bush',
        '3673': 'Technic Pin',
        '3069b': 'Tile 1x2',
        '3070b': 'Tile 1x1',
        '2431': 'Tile 1x4',
        '6636': 'Tile 1x6',
        '4162': 'Tile 1x8',
        '87079': 'Tile 2x4',
        '3068b': 'Tile 2x2',
        '63864': 'Tile 1x3',
        '98138': 'Tile Round 1x1',
        '15535': 'Tile Round 2x2',
        '4150': 'Tile Round 2x2',
        '4073': 'Plate Round 1x1',
        '6141': 'Plate Round 1x1',
        '4032': 'Plate Round 2x2',
        '60474': 'Plate Round 4x4',
        '85861': 'Plate Round 1x1 with Open Stud',
        '3062b': 'Brick Round 1x1',
        '3941': 'Brick Round 2x2',
        '6143': 'Brick Round 2x2',
        '98100': 'Cone 1x1 with Top Groove',
        '4589': 'Cone 1x1',
        '64288': 'Slope Curved 1x2',
        '11477': 'Slope Curved 2x1',
        '15068': 'Slope Curved 2x2',
        '93273': 'Slope Curved 3x1',
        '50950': 'Slope Curved 3x1',
        '61678': 'Slope Curved 4x1',
        '3045': 'Slope 45 Double 2x2',
        '3048': 'Slope 45 Double 1x2',
        '3044': 'Slope 45 Double 2x1',
        '3245': 'Brick 1x2x2',
        '2357': 'Brick 2x2 Corner',
        '6091': 'Brick Curved 2x1',
        '30165': 'Brick Modified 2x2 Curved Top',
        '87087': 'Brick Modified 1x1 with Stud on Side',
        '4070': 'Brick Modified 1x1 with Headlight',
        '30414': 'Brick Modified 1x4 with Studs on Side',
        '52107': 'Brick Modified 1x2 with Studs on 2 Sides',
        '98283': 'Brick Modified 1x2 with Masonry Profile'
    };
    return names[partId] || `Part ${partId}`;
}

// Workspace
function setupWorkspace() {
    document.getElementById('selectAll').addEventListener('click', () => {
        state.selectedParts = new Set(state.parts.map((_, i) => i));
        renderPartsList();
        updatePreview();
    });

    document.getElementById('selectNone').addEventListener('click', () => {
        state.selectedParts.clear();
        renderPartsList();
        updatePreview();
    });
    
    // Select only parts user doesn't have enough of
    document.getElementById('selectNeed').addEventListener('click', () => {
        state.selectedParts.clear();
        state.parts.forEach((part, index) => {
            const owned = getOwnedQuantity(part.id, part.color);
            if (owned < part.quantity) {
                state.selectedParts.add(index);
            }
        });
        renderPartsList();
        updatePreview();
    });

    document.getElementById('exportSTL').addEventListener('click', showExportModal);

    document.getElementById('searchParts').addEventListener('input', (e) => {
        renderPartsList(e.target.value);
    });
    
    // Color filter
    document.getElementById('filterColor').addEventListener('change', (e) => {
        state.colorFilter = e.target.value;
        renderPartsList();
    });

    document.getElementById('sortParts').addEventListener('change', () => {
        renderPartsList();
    });

    // View mode toggle
    document.getElementById('viewBuilt').addEventListener('click', () => setViewMode('built'));
    document.getElementById('viewParts').addEventListener('click', () => setViewMode('parts'));
    
    document.getElementById('centerView').addEventListener('click', centerView);
    document.getElementById('resetView').addEventListener('click', resetCameraView);
}

function setViewMode(mode) {
    state.viewMode = mode;
    document.getElementById('viewBuilt').classList.toggle('active', mode === 'built');
    document.getElementById('viewParts').classList.toggle('active', mode === 'parts');
    updatePreview();
}

function showWorkspace(name) {
    document.getElementById('workspace').style.display = 'block';
    document.getElementById('designName').textContent = name;
    document.querySelector('.upload-section').style.display = 'none';
}

function showLoading(message) {
    let loader = document.getElementById('loadingOverlay');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'loadingOverlay';
        loader.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-text"></div>
            </div>
        `;
        document.body.appendChild(loader);
    }
    loader.querySelector('.loading-text').textContent = message;
    loader.style.display = 'flex';
}

function hideLoading() {
    const loader = document.getElementById('loadingOverlay');
    if (loader) loader.style.display = 'none';
}

function renderPartsList(filter = '') {
    const container = document.getElementById('partsList');
    const sortBy = document.getElementById('sortParts').value;
    const textFilter = filter || document.getElementById('searchParts').value;
    
    let parts = state.parts.map((part, index) => ({ 
        ...part, 
        index,
        owned: getOwnedQuantity(part.id, part.color)
    }));
    
    // Text filter
    if (textFilter) {
        const lowerFilter = textFilter.toLowerCase();
        parts = parts.filter(p => 
            p.name.toLowerCase().includes(lowerFilter) ||
            p.id.toLowerCase().includes(lowerFilter) ||
            p.colorName.toLowerCase().includes(lowerFilter)
        );
    }
    
    // Color filter
    if (state.colorFilter) {
        parts = parts.filter(p => p.colorName === state.colorFilter);
    }
    
    // Sort
    parts.sort((a, b) => {
        switch (sortBy) {
            case 'quantity': return b.quantity - a.quantity;
            case 'name': return a.name.localeCompare(b.name);
            case 'color': return a.colorName.localeCompare(b.colorName);
            case 'owned': return b.owned - a.owned;
            default: return 0;
        }
    });
    
    container.innerHTML = parts.map(part => {
        const isSelected = state.selectedParts.has(part.index);
        const colorHex = part.colorHex || LDRAW_COLORS[part.color]?.hex || '#888888';
        const hasEnough = part.owned >= part.quantity;
        const need = Math.max(0, part.quantity - part.owned);
        
        return `
            <div class="part-item ${isSelected ? 'selected' : ''} ${hasEnough ? 'have-enough' : ''}" data-index="${part.index}">
                <input type="checkbox" class="part-checkbox" ${isSelected ? 'checked' : ''}>
                <div class="part-thumb" style="background-color: ${colorHex}">
                    ${part.image ? `<img src="${part.image}" alt="${part.name}" loading="lazy">` : `<span class="part-icon">🧱</span>`}
                </div>
                <div class="part-info">
                    <div class="part-name">${part.name}</div>
                    <div class="part-details">
                        <span class="part-color-badge" style="background: ${colorHex}"></span>
                        ${part.colorName} • #${part.id}
                        ${part.owned > 0 ? `<span class="part-owned-qty">✓ Own ${part.owned}</span>` : ''}
                    </div>
                </div>
                <div class="part-quantity">
                    ${hasEnough ? `<span class="have-all">✓</span>` : `×${need}`}
                </div>
                <button class="part-owned-btn ${part.owned > 0 ? 'owned' : ''}" 
                        data-part-id="${part.id}" 
                        data-color="${part.color}"
                        data-qty="${part.quantity}"
                        title="Mark as owned">
                    ${part.owned > 0 ? '✓' : '+'}
                </button>
            </div>
        `;
    }).join('');
    
    // Event handlers
    container.querySelectorAll('.part-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.type === 'checkbox' || e.target.classList.contains('part-owned-btn')) return;
            togglePart(parseInt(item.dataset.index));
        });
        
        item.querySelector('.part-checkbox').addEventListener('change', (e) => {
            togglePart(parseInt(item.dataset.index), e.target.checked);
        });
    });
    
    // Owned button handlers
    container.querySelectorAll('.part-owned-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const partId = btn.dataset.partId;
            const color = parseInt(btn.dataset.color);
            const qty = parseInt(btn.dataset.qty);
            const currentOwned = getOwnedQuantity(partId, color);
            
            if (currentOwned > 0) {
                // Toggle off
                setOwnedPart(partId, color, 0);
            } else {
                // Set owned to quantity needed
                setOwnedPart(partId, color, qty);
            }
            
            updateInventoryDisplay();
            renderPartsList();
        });
    });
    
    updateCounts();
}

function togglePart(index, force = null) {
    if (force === null) {
        if (state.selectedParts.has(index)) {
            state.selectedParts.delete(index);
        } else {
            state.selectedParts.add(index);
        }
    } else {
        force ? state.selectedParts.add(index) : state.selectedParts.delete(index);
    }
    
    renderPartsList(document.getElementById('searchParts').value);
    updatePreview();
}

function updateCounts() {
    const totalUnique = state.parts.length;
    const selectedUnique = state.selectedParts.size;
    const totalPieces = state.parts.reduce((sum, p) => sum + p.quantity, 0);
    const selectedParts = Array.from(state.selectedParts).map(i => state.parts[i]);
    const selectedPieces = selectedParts.reduce((sum, p) => sum + p.quantity, 0);
    
    document.getElementById('totalCount').textContent = totalUnique;
    document.getElementById('selectedCount').textContent = selectedUnique;
    document.getElementById('totalPieces').textContent = totalPieces;
    document.getElementById('selectedPieces').textContent = selectedPieces;
    
    // Calculate prices
    const buyPrice = calculateTotalCost(selectedParts);
    const printPrice = estimate3DPrintCost(selectedParts);
    
    document.getElementById('buyPrice').textContent = formatPrice(buyPrice);
    document.getElementById('printPrice').textContent = formatPrice(printPrice);
    
    // Show savings
    const savingsEl = document.getElementById('savingsText');
    if (buyPrice > 0 && printPrice < buyPrice) {
        const savings = buyPrice - printPrice;
        const pct = Math.round((savings / buyPrice) * 100);
        savingsEl.textContent = `Save ${pct}%`;
        savingsEl.style.display = 'block';
    } else {
        savingsEl.style.display = 'none';
    }
}

// 3D Preview
function init3DPreview() {
    const container = document.getElementById('preview3d');
    container.innerHTML = '';
    
    console.log('Initializing 3D preview, container size:', container.clientWidth, 'x', container.clientHeight);
    
    // Ensure container has dimensions
    if (container.clientWidth === 0 || container.clientHeight === 0) {
        console.warn('Preview container has no size, waiting...');
        setTimeout(() => init3DPreview(), 100);
        return;
    }
    
    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x1a1a2e);
    
    state.camera = new THREE.PerspectiveCamera(
        50, container.clientWidth / container.clientHeight, 0.1, 10000
    );
    state.camera.position.set(200, 200, 200);
    
    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setSize(container.clientWidth, container.clientHeight);
    state.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(state.renderer.domElement);
    
    state.controls = new OrbitControls(state.camera, state.renderer.domElement);
    state.controls.enableDamping = true;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    state.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 200, 100);
    state.scene.add(directionalLight);
    
    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(-100, 100, -100);
    state.scene.add(backLight);
    
    // Grid
    const gridHelper = new THREE.GridHelper(500, 50, 0x444444, 0x333333);
    state.scene.add(gridHelper);
    
    updatePreview();
    
    function animate() {
        requestAnimationFrame(animate);
        state.controls.update();
        state.renderer.render(state.scene, state.camera);
    }
    animate();
    
    window.addEventListener('resize', () => {
        state.camera.aspect = container.clientWidth / container.clientHeight;
        state.camera.updateProjectionMatrix();
        state.renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

async function updatePreview() {
    if (!state.scene) return;
    
    // Remove existing model groups
    if (state.builtGroup) {
        state.scene.remove(state.builtGroup);
    }
    if (state.partsGroup) {
        state.scene.remove(state.partsGroup);
    }
    
    if (state.viewMode === 'built' && state.builtGroup) {
        // Show assembled model
        state.scene.add(state.builtGroup);
        
        // Center camera on model
        const box = new THREE.Box3().setFromObject(state.builtGroup);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3()).length();
        
        state.controls.target.copy(center);
        state.camera.position.set(center.x + size, center.y + size * 0.5, center.z + size);
        state.controls.update();
        
    } else {
        // Show parts laid out (fallback or parts view)
        state.partsGroup = new THREE.Group();
        state.scene.add(state.partsGroup);
        
        if (state.parts.length === 0) {
            console.log('No parts to display');
            return;
        }
        
        const cols = Math.ceil(Math.sqrt(state.parts.length));
        const spacing = 60;
        
        // Create placeholder boxes immediately
        const placeholders = [];
        const placeholderMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x444444,
            opacity: 0.3,
            transparent: true
        });
        const placeholderGeometry = new THREE.BoxGeometry(40, 24, 40);
        
        state.parts.forEach((part, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            const x = col * spacing - (cols * spacing / 2);
            const z = row * spacing - (Math.ceil(state.parts.length / cols) * spacing / 2);
            
            const placeholder = new THREE.Mesh(placeholderGeometry, placeholderMaterial);
            placeholder.position.set(x, 12, z);
            state.partsGroup.add(placeholder);
            placeholders.push({ mesh: placeholder, x, z, index });
        });
        
        // Center camera on placeholders
        centerOnGroup(state.partsGroup);
        
        // Show loading status
        const statusEl = document.getElementById('loadingStatus');
        if (statusEl) statusEl.style.display = 'block';
        
        // Load real geometries progressively
        let loaded = 0;
        const total = state.parts.length;
        
        for (let i = 0; i < state.parts.length; i++) {
            const part = state.parts[i];
            const placeholder = placeholders[i];
            
            try {
                const geometry = await getPartGeometry(part.id);
                const isSelected = state.selectedParts.has(i);
                const colorHex = part.colorHex || LDRAW_COLORS[part.color]?.hex || '#888888';
                
                const material = new THREE.MeshPhongMaterial({ 
                    color: colorHex,
                    opacity: isSelected ? 1 : 0.5,
                    transparent: !isSelected,
                    flatShading: false
                });
                
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(placeholder.x, 0, placeholder.z);
                
                // Remove placeholder and add real mesh
                state.partsGroup.remove(placeholder.mesh);
                state.partsGroup.add(mesh);
                
                loaded++;
                updateLoadingStatus(`Loading parts: ${loaded}/${total}`);
                
            } catch (error) {
                console.error(`Failed to load part ${part.id}:`, error);
                // Keep placeholder for failed parts
                loaded++;
            }
        }
        
        updateLoadingStatus('');
        console.log(`Preview loaded: ${loaded}/${total} parts`);
        
        // Final center
        centerOnGroup(state.partsGroup);
    }
}

function centerOnGroup(group) {
    if (!group || group.children.length === 0) return;
    
    const box = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 100;
    const distance = maxDim * 1.5;
    
    state.controls.target.copy(center);
    state.camera.position.set(
        center.x + distance,
        center.y + distance * 0.5,
        center.z + distance
    );
    state.controls.update();
}

function updateLoadingStatus(text) {
    let el = document.getElementById('previewLoadingStatus');
    if (!el) {
        el = document.createElement('div');
        el.id = 'previewLoadingStatus';
        el.style.cssText = 'position:absolute;bottom:10px;left:10px;background:rgba(0,0,0,0.7);color:#fff;padding:8px 12px;border-radius:4px;font-size:12px;z-index:10;';
        document.getElementById('preview3d').appendChild(el);
    }
    el.textContent = text;
    el.style.display = text ? 'block' : 'none';
}

function resetCameraView() {
    state.camera.position.set(200, 200, 200);
    state.controls.target.set(0, 0, 0);
    state.controls.update();
}

function centerView() {
    if (!state.scene) return;
    
    // Find the group to center on
    const targetGroup = state.viewMode === 'built' && state.builtGroup 
        ? state.builtGroup 
        : state.partsGroup;
    
    if (!targetGroup) return;
    
    // Calculate bounding box
    const box = new THREE.Box3().setFromObject(targetGroup);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // Position camera to see entire model
    const distance = maxDim * 1.5;
    state.camera.position.set(
        center.x + distance,
        center.y + distance * 0.5,
        center.z + distance
    );
    state.controls.target.copy(center);
    state.controls.update();
}

// Export Modal
function setupModal() {
    document.getElementById('cancelExport').addEventListener('click', hideExportModal);
    document.getElementById('confirmExport').addEventListener('click', performExport);
    
    document.getElementById('exportModal').addEventListener('click', (e) => {
        if (e.target.id === 'exportModal') hideExportModal();
    });
}

function showExportModal() {
    const selectedPieces = Array.from(state.selectedParts).reduce((sum, i) => 
        sum + state.parts[i].quantity, 0);
    
    document.getElementById('exportCount').textContent = state.selectedParts.size;
    document.getElementById('exportPieces').textContent = selectedPieces;
    document.getElementById('exportModal').style.display = 'flex';
}

function hideExportModal() {
    document.getElementById('exportModal').style.display = 'none';
}

async function performExport() {
    const scale = parseFloat(document.getElementById('exportScale').value) || 1;
    const hollow = document.getElementById('hollowParts').checked;
    const exportType = document.querySelector('input[name="exportType"]:checked').value;
    
    showLoading('Generating STL...');
    
    try {
        const selectedIndices = Array.from(state.selectedParts);
        
        if (selectedIndices.length === 0) {
            hideLoading();
            alert('No parts selected!');
            return;
        }
        
        // Load all geometries in parallel
        showLoading(`Loading ${selectedIndices.length} parts...`);
        const selectedParts = selectedIndices.map(i => state.parts[i]);
        const loadedGeometries = await Promise.all(
            selectedParts.map(part => getPartGeometry(part.id))
        );
        
        if (exportType === 'individual') {
            // Export as ZIP with individual files
            showLoading('Creating ZIP file...');
            const zip = new JSZip();
            const folder = zip.folder(state.currentModelName || 'lego-parts');
            
            for (let i = 0; i < selectedParts.length; i++) {
                const part = selectedParts[i];
                const geo = loadedGeometries[i].clone();
                geo.scale(scale, scale, scale);
                
                const stlData = exportToSTL(geo);
                const filename = `${part.id}_${part.colorName.replace(/\s+/g, '-')}_x${part.quantity}.stl`;
                folder.file(filename, stlData);
                
                showLoading(`Adding ${i + 1}/${selectedParts.length}...`);
            }
            
            // Also add a manifest
            const manifest = selectedParts.map(p => ({
                part_id: p.id,
                name: p.name,
                color: p.colorName,
                quantity: p.quantity
            }));
            folder.file('manifest.json', JSON.stringify(manifest, null, 2));
            
            showLoading('Compressing ZIP...');
            const content = await zip.generateAsync({ type: 'blob' });
            downloadBlob(content, `${state.currentModelName || 'lego-parts'}.zip`);
            
        } else {
            // Export as single combined STL
            showLoading('Building STL...');
            
            const geometries = [];
            const spacing = 50;
            const cols = Math.ceil(Math.sqrt(selectedIndices.length));
            
            loadedGeometries.forEach((geo, index) => {
                const clonedGeo = geo.clone();
                const row = Math.floor(index / cols);
                const col = index % cols;
                
                clonedGeo.translate(
                    col * spacing * scale,
                    0,
                    row * spacing * scale
                );
                
                clonedGeo.scale(scale, scale, scale);
                geometries.push(clonedGeo);
            });
            
            const mergedGeometry = mergeGeometries(geometries);
            const stlData = exportToSTL(mergedGeometry);
            downloadFile(stlData, `${state.currentModelName || 'lego-parts'}.stl`);
        }
        
        hideLoading();
        hideExportModal();
        
    } catch (error) {
        hideLoading();
        console.error('Export error:', error);
        alert('Export failed: ' + error.message);
    }
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function exportToSTL(geometry) {
    // Binary STL format
    const positions = geometry.attributes.position.array;
    const indices = geometry.index ? geometry.index.array : null;
    
    let triangles = [];
    
    if (indices) {
        for (let i = 0; i < indices.length; i += 3) {
            triangles.push([
                [positions[indices[i] * 3], positions[indices[i] * 3 + 1], positions[indices[i] * 3 + 2]],
                [positions[indices[i + 1] * 3], positions[indices[i + 1] * 3 + 1], positions[indices[i + 1] * 3 + 2]],
                [positions[indices[i + 2] * 3], positions[indices[i + 2] * 3 + 1], positions[indices[i + 2] * 3 + 2]]
            ]);
        }
    } else {
        for (let i = 0; i < positions.length; i += 9) {
            triangles.push([
                [positions[i], positions[i + 1], positions[i + 2]],
                [positions[i + 3], positions[i + 4], positions[i + 5]],
                [positions[i + 6], positions[i + 7], positions[i + 8]]
            ]);
        }
    }
    
    const bufferSize = 84 + (50 * triangles.length);
    const buffer = new ArrayBuffer(bufferSize);
    const view = new DataView(buffer);
    
    // Header (80 bytes)
    for (let i = 0; i < 80; i++) {
        view.setUint8(i, 0);
    }
    
    // Triangle count
    view.setUint32(80, triangles.length, true);
    
    let offset = 84;
    for (const tri of triangles) {
        // Calculate normal
        const v1 = tri[0], v2 = tri[1], v3 = tri[2];
        const ax = v2[0] - v1[0], ay = v2[1] - v1[1], az = v2[2] - v1[2];
        const bx = v3[0] - v1[0], by = v3[1] - v1[1], bz = v3[2] - v1[2];
        const nx = ay * bz - az * by;
        const ny = az * bx - ax * bz;
        const nz = ax * by - ay * bx;
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        
        view.setFloat32(offset, nx / len, true); offset += 4;
        view.setFloat32(offset, ny / len, true); offset += 4;
        view.setFloat32(offset, nz / len, true); offset += 4;
        
        for (const v of tri) {
            view.setFloat32(offset, v[0], true); offset += 4;
            view.setFloat32(offset, v[1], true); offset += 4;
            view.setFloat32(offset, v[2], true); offset += 4;
        }
        
        view.setUint16(offset, 0, true); offset += 2;
    }
    
    return buffer;
}

function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
