import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { LDrawParser } from './ldraw-parser.js';
import { STLExporter } from './stl-exporter.js';
import { LDRAW_COLORS } from './ldraw-colors.js';

// App State
const state = {
    parts: [],          // Parsed parts from file
    selectedParts: new Set(),
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    partMeshes: new Map()
};

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
    setupUpload();
    setupWorkspace();
    setupModal();
    setupSamples();
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
    const text = await file.text();
    const parser = new LDrawParser();
    
    try {
        const result = parser.parse(text, file.name);
        state.parts = result.parts;
        
        // Select all by default
        state.selectedParts = new Set(state.parts.map((_, i) => i));
        
        showWorkspace(result.name || file.name);
        renderPartsList();
        init3DPreview();
    } catch (error) {
        console.error('Parse error:', error);
        alert('Failed to parse file: ' + error.message);
    }
}

// Sample Designs
function setupSamples() {
    document.querySelectorAll('.sample-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const sample = btn.dataset.sample;
            loadSample(sample);
        });
    });
}

async function loadSample(name) {
    const samples = {
        car: generateSampleCar(),
        house: generateSampleHouse(),
        robot: generateSampleRobot()
    };
    
    const sample = samples[name];
    if (sample) {
        state.parts = sample.parts;
        state.selectedParts = new Set(state.parts.map((_, i) => i));
        showWorkspace(sample.name);
        renderPartsList();
        init3DPreview();
    }
}

function generateSampleCar() {
    return {
        name: 'Simple Car',
        parts: [
            { id: '3024', name: 'Plate 1x1', color: 4, colorName: 'Red', quantity: 4 },
            { id: '3023', name: 'Plate 1x2', color: 4, colorName: 'Red', quantity: 6 },
            { id: '3004', name: 'Brick 1x2', color: 4, colorName: 'Red', quantity: 4 },
            { id: '3003', name: 'Brick 2x2', color: 4, colorName: 'Red', quantity: 2 },
            { id: '3022', name: 'Plate 2x2', color: 0, colorName: 'Black', quantity: 2 },
            { id: '4624', name: 'Wheel Rim', color: 7, colorName: 'Light Gray', quantity: 4 },
            { id: '3641', name: 'Tire', color: 0, colorName: 'Black', quantity: 4 },
            { id: '3823', name: 'Windscreen 2x4x2', color: 15, colorName: 'Trans-Clear', quantity: 1 },
            { id: '3020', name: 'Plate 2x4', color: 4, colorName: 'Red', quantity: 2 },
        ]
    };
}

function generateSampleHouse() {
    return {
        name: 'Mini House',
        parts: [
            { id: '3001', name: 'Brick 2x4', color: 1, colorName: 'Blue', quantity: 12 },
            { id: '3003', name: 'Brick 2x2', color: 1, colorName: 'Blue', quantity: 8 },
            { id: '3004', name: 'Brick 1x2', color: 1, colorName: 'Blue', quantity: 6 },
            { id: '3005', name: 'Brick 1x1', color: 1, colorName: 'Blue', quantity: 4 },
            { id: '3020', name: 'Plate 2x4', color: 2, colorName: 'Green', quantity: 4 },
            { id: '3795', name: 'Plate 2x6', color: 2, colorName: 'Green', quantity: 2 },
            { id: '3039', name: 'Slope 45 2x2', color: 4, colorName: 'Red', quantity: 4 },
            { id: '3040', name: 'Slope 45 1x2', color: 4, colorName: 'Red', quantity: 4 },
            { id: '60601', name: 'Window 1x2x2', color: 15, colorName: 'Trans-Clear', quantity: 2 },
            { id: '3023', name: 'Plate 1x2', color: 6, colorName: 'Brown', quantity: 2 },
        ]
    };
}

function generateSampleRobot() {
    return {
        name: 'Simple Robot',
        parts: [
            { id: '3003', name: 'Brick 2x2', color: 7, colorName: 'Light Gray', quantity: 3 },
            { id: '3004', name: 'Brick 1x2', color: 7, colorName: 'Light Gray', quantity: 6 },
            { id: '3005', name: 'Brick 1x1', color: 0, colorName: 'Black', quantity: 2 },
            { id: '3024', name: 'Plate 1x1', color: 4, colorName: 'Red', quantity: 2 },
            { id: '3023', name: 'Plate 1x2', color: 7, colorName: 'Light Gray', quantity: 4 },
            { id: '3622', name: 'Brick 1x3', color: 7, colorName: 'Light Gray', quantity: 4 },
            { id: '4070', name: 'Brick Modified 1x1 Headlight', color: 14, colorName: 'Yellow', quantity: 2 },
            { id: '3024', name: 'Plate 1x1 Round', color: 4, colorName: 'Red', quantity: 1 },
            { id: '4589', name: 'Cone 1x1', color: 14, colorName: 'Yellow', quantity: 1 },
        ]
    };
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

    document.getElementById('exportSTL').addEventListener('click', showExportModal);

    document.getElementById('searchParts').addEventListener('input', (e) => {
        renderPartsList(e.target.value);
    });

    document.getElementById('sortParts').addEventListener('change', () => {
        renderPartsList();
    });

    document.getElementById('showSelected').addEventListener('change', updatePreview);
    document.getElementById('resetView').addEventListener('click', resetCameraView);
}

function showWorkspace(name) {
    document.getElementById('workspace').style.display = 'block';
    document.getElementById('designName').textContent = name;
    document.querySelector('.upload-section').style.display = 'none';
}

function renderPartsList(filter = '') {
    const container = document.getElementById('partsList');
    const sortBy = document.getElementById('sortParts').value;
    
    let parts = state.parts.map((part, index) => ({ ...part, index }));
    
    // Filter
    if (filter) {
        const lowerFilter = filter.toLowerCase();
        parts = parts.filter(p => 
            p.name.toLowerCase().includes(lowerFilter) ||
            p.id.toLowerCase().includes(lowerFilter) ||
            p.colorName.toLowerCase().includes(lowerFilter)
        );
    }
    
    // Sort
    parts.sort((a, b) => {
        switch (sortBy) {
            case 'quantity': return b.quantity - a.quantity;
            case 'name': return a.name.localeCompare(b.name);
            case 'color': return a.colorName.localeCompare(b.colorName);
            default: return 0;
        }
    });
    
    container.innerHTML = parts.map(part => {
        const isSelected = state.selectedParts.has(part.index);
        const color = LDRAW_COLORS[part.color] || { hex: '#888888' };
        
        return `
            <div class="part-item ${isSelected ? 'selected' : ''}" data-index="${part.index}">
                <input type="checkbox" class="part-checkbox" ${isSelected ? 'checked' : ''}>
                <div class="part-preview">🧱</div>
                <div class="part-info">
                    <div class="part-name">${part.name}</div>
                    <div class="part-details">
                        <span class="part-color" style="background: ${color.hex}"></span>
                        ${part.colorName} • #${part.id}
                    </div>
                </div>
                <div class="part-quantity">×${part.quantity}</div>
            </div>
        `;
    }).join('');
    
    // Add click handlers
    container.querySelectorAll('.part-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.type === 'checkbox') return;
            const index = parseInt(item.dataset.index);
            togglePart(index);
        });
        
        item.querySelector('.part-checkbox').addEventListener('change', (e) => {
            const index = parseInt(item.dataset.index);
            togglePart(index, e.target.checked);
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
        if (force) {
            state.selectedParts.add(index);
        } else {
            state.selectedParts.delete(index);
        }
    }
    
    renderPartsList(document.getElementById('searchParts').value);
    updatePreview();
}

function updateCounts() {
    const totalUnique = state.parts.length;
    const selectedUnique = state.selectedParts.size;
    const selectedPieces = Array.from(state.selectedParts).reduce((sum, i) => 
        sum + state.parts[i].quantity, 0);
    
    document.getElementById('totalCount').textContent = totalUnique;
    document.getElementById('selectedCount').textContent = selectedUnique;
    document.getElementById('selectedPieces').textContent = selectedPieces;
}

// 3D Preview
function init3DPreview() {
    const container = document.getElementById('preview3d');
    container.innerHTML = '';
    
    // Scene
    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x1a1a2e);
    
    // Camera
    state.camera = new THREE.PerspectiveCamera(
        50, container.clientWidth / container.clientHeight, 0.1, 1000
    );
    state.camera.position.set(10, 10, 10);
    
    // Renderer
    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(state.renderer.domElement);
    
    // Controls
    state.controls = new OrbitControls(state.camera, state.renderer.domElement);
    state.controls.enableDamping = true;
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    state.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    state.scene.add(directionalLight);
    
    // Grid
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x333333);
    state.scene.add(gridHelper);
    
    // Add parts visualization
    updatePreview();
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        state.controls.update();
        state.renderer.render(state.scene, state.camera);
    }
    animate();
    
    // Handle resize
    window.addEventListener('resize', () => {
        state.camera.aspect = container.clientWidth / container.clientHeight;
        state.camera.updateProjectionMatrix();
        state.renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

function updatePreview() {
    if (!state.scene) return;
    
    const showSelectedOnly = document.getElementById('showSelected').checked;
    
    // Clear existing meshes
    state.partMeshes.forEach(mesh => state.scene.remove(mesh));
    state.partMeshes.clear();
    
    // Create simple brick representations
    let offset = 0;
    state.parts.forEach((part, index) => {
        if (showSelectedOnly && !state.selectedParts.has(index)) return;
        
        const color = LDRAW_COLORS[part.color] || { hex: '#888888' };
        const geometry = new THREE.BoxGeometry(0.8, 0.96, 0.8);
        const material = new THREE.MeshPhongMaterial({ 
            color: color.hex,
            opacity: state.selectedParts.has(index) ? 1 : 0.3,
            transparent: !state.selectedParts.has(index)
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(offset % 10 - 5, 0.48, Math.floor(offset / 10) - 2);
        state.scene.add(mesh);
        state.partMeshes.set(index, mesh);
        offset++;
    });
}

function resetCameraView() {
    state.camera.position.set(10, 10, 10);
    state.controls.target.set(0, 0, 0);
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
    const combine = document.getElementById('combineParts').checked;
    const hollow = document.getElementById('hollowParts').checked;
    
    const exporter = new STLExporter();
    const selectedParts = Array.from(state.selectedParts).map(i => state.parts[i]);
    
    if (combine) {
        // Export all as single STL
        const stl = await exporter.exportParts(selectedParts, { scale, hollow });
        downloadFile(stl, 'lego-parts-combined.stl');
    } else {
        // Export as ZIP with individual files
        const files = await exporter.exportPartsIndividual(selectedParts, { scale, hollow });
        // For now, just export combined
        const stl = await exporter.exportParts(selectedParts, { scale, hollow });
        downloadFile(stl, 'lego-parts.stl');
    }
    
    hideExportModal();
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
