import * as THREE from 'three';

/**
 * Specific geometry generators for common Lego parts
 * These create accurate printable models with proper dimensions
 */
export const BRICK_GEOMETRY = {
    // Bricks
    '3001': (exp, hollow) => exp.generateBrickGeometry(2, 4, 1, hollow), // 2x4
    '3002': (exp, hollow) => exp.generateBrickGeometry(2, 3, 1, hollow), // 2x3
    '3003': (exp, hollow) => exp.generateBrickGeometry(2, 2, 1, hollow), // 2x2
    '3004': (exp, hollow) => exp.generateBrickGeometry(1, 2, 1, hollow), // 1x2
    '3005': (exp, hollow) => exp.generateBrickGeometry(1, 1, 1, hollow), // 1x1
    '3006': (exp, hollow) => exp.generateBrickGeometry(2, 10, 1, hollow), // 2x10
    '3007': (exp, hollow) => exp.generateBrickGeometry(2, 8, 1, hollow), // 2x8
    '3008': (exp, hollow) => exp.generateBrickGeometry(1, 8, 1, hollow), // 1x8
    '3009': (exp, hollow) => exp.generateBrickGeometry(1, 6, 1, hollow), // 1x6
    '3010': (exp, hollow) => exp.generateBrickGeometry(1, 4, 1, hollow), // 1x4
    '3622': (exp, hollow) => exp.generateBrickGeometry(1, 3, 1, hollow), // 1x3
    
    // Plates
    '3020': (exp, hollow) => exp.generatePlateGeometry(2, 4, hollow), // 2x4
    '3021': (exp, hollow) => exp.generatePlateGeometry(2, 3, hollow), // 2x3
    '3022': (exp, hollow) => exp.generatePlateGeometry(2, 2, hollow), // 2x2
    '3023': (exp, hollow) => exp.generatePlateGeometry(1, 2, hollow), // 1x2
    '3024': (exp, hollow) => exp.generatePlateGeometry(1, 1, hollow), // 1x1
    '3795': (exp, hollow) => exp.generatePlateGeometry(2, 6, hollow), // 2x6
    '3034': (exp, hollow) => exp.generatePlateGeometry(2, 8, hollow), // 2x8
    '3460': (exp, hollow) => exp.generatePlateGeometry(1, 8, hollow), // 1x8
    '3666': (exp, hollow) => exp.generatePlateGeometry(1, 6, hollow), // 1x6
    '3710': (exp, hollow) => exp.generatePlateGeometry(1, 4, hollow), // 1x4
    '3031': (exp, hollow) => exp.generatePlateGeometry(4, 4, hollow), // 4x4
    '3032': (exp, hollow) => exp.generatePlateGeometry(4, 6, hollow), // 4x6
    '3035': (exp, hollow) => exp.generatePlateGeometry(4, 8, hollow), // 4x8
    '3036': (exp, hollow) => exp.generatePlateGeometry(6, 8, hollow), // 6x8
    
    // Round pieces
    '3062': (exp, hollow) => generateRoundBrick(exp, 1, 1, hollow),
    '3941': (exp, hollow) => generateRoundBrick(exp, 2, 1, hollow),
    '85861': (exp, hollow) => generateRoundPlate(exp, 1, hollow),
    '4032': (exp, hollow) => generateRoundPlate(exp, 2, hollow),
    
    // Cones
    '4589': (exp, hollow) => generateCone(exp, 1, 1, hollow),
    '3942': (exp, hollow) => generateCone(exp, 2, 2, hollow),
    
    // Slopes
    '3039': (exp, hollow) => generateSlope45(exp, 2, 2, hollow),
    '3040': (exp, hollow) => generateSlope45(exp, 1, 2, hollow),
    '3037': (exp, hollow) => generateSlope45(exp, 2, 4, hollow),
    '3038': (exp, hollow) => generateSlope45(exp, 2, 3, hollow),
    
    // Wheels (simplified)
    '4624': (exp, hollow) => generateWheel(exp, 8, 6.4, hollow),
    '3641': (exp, hollow) => generateTire(exp, 8, 6.4, hollow),
};

function generateRoundBrick(exp, diameter, height, hollow) {
    const d = diameter * exp.UNIT_SIZE;
    const h = height * exp.BRICK_HEIGHT;
    
    const geometries = [];
    
    // Cylinder body
    const body = new THREE.CylinderGeometry(d / 2, d / 2, h, 32);
    body.translate(0, h / 2, 0);
    geometries.push(body);
    
    // Stud on top (if 1x1)
    if (diameter === 1) {
        const stud = new THREE.CylinderGeometry(
            exp.STUD_DIAMETER / 2,
            exp.STUD_DIAMETER / 2,
            exp.STUD_HEIGHT,
            16
        );
        stud.translate(0, h + exp.STUD_HEIGHT / 2, 0);
        geometries.push(stud);
    }
    
    return mergeGeometries(geometries);
}

function generateRoundPlate(exp, diameter, hollow) {
    const d = diameter * exp.UNIT_SIZE;
    const h = exp.PLATE_HEIGHT;
    
    const geometries = [];
    
    // Cylinder body
    const body = new THREE.CylinderGeometry(d / 2, d / 2, h, 32);
    body.translate(0, h / 2, 0);
    geometries.push(body);
    
    // Stud on top
    if (diameter === 1) {
        const stud = new THREE.CylinderGeometry(
            exp.STUD_DIAMETER / 2,
            exp.STUD_DIAMETER / 2,
            exp.STUD_HEIGHT,
            16
        );
        stud.translate(0, h + exp.STUD_HEIGHT / 2, 0);
        geometries.push(stud);
    }
    
    return mergeGeometries(geometries);
}

function generateCone(exp, diameter, height, hollow) {
    const d = diameter * exp.UNIT_SIZE;
    const h = height * exp.BRICK_HEIGHT;
    
    const geometries = [];
    
    // Cone body
    const cone = new THREE.ConeGeometry(d / 2, h, 32);
    cone.translate(0, h / 2, 0);
    geometries.push(cone);
    
    return mergeGeometries(geometries);
}

function generateSlope45(exp, width, length, hollow) {
    const w = width * exp.UNIT_SIZE;
    const l = length * exp.UNIT_SIZE;
    const h = exp.BRICK_HEIGHT;
    
    // Create slope using a custom shape
    const shape = new THREE.Shape();
    shape.moveTo(-l/2, 0);
    shape.lineTo(l/2, 0);
    shape.lineTo(l/2, h);
    shape.lineTo(-l/2, 0);
    
    const extrudeSettings = {
        steps: 1,
        depth: w,
        bevelEnabled: false
    };
    
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.rotateY(Math.PI / 2);
    geometry.translate(0, 0, 0);
    
    return geometry;
}

function generateWheel(exp, diameter, width, hollow) {
    const d = diameter;
    const w = width;
    
    const geometries = [];
    
    // Outer rim
    const rim = new THREE.TorusGeometry(d / 2 - 1, 1, 8, 32);
    rim.rotateX(Math.PI / 2);
    geometries.push(rim);
    
    // Hub
    const hub = new THREE.CylinderGeometry(d / 4, d / 4, w, 16);
    hub.rotateX(Math.PI / 2);
    geometries.push(hub);
    
    return mergeGeometries(geometries);
}

function generateTire(exp, diameter, width, hollow) {
    const d = diameter;
    const w = width;
    
    // Torus for tire
    const tire = new THREE.TorusGeometry(d / 2, w / 2, 16, 32);
    tire.rotateX(Math.PI / 2);
    
    return tire;
}

function mergeGeometries(geometries) {
    if (geometries.length === 0) return new THREE.BufferGeometry();
    if (geometries.length === 1) return geometries[0];
    
    // Simple merge
    let totalVertices = 0;
    for (const geo of geometries) {
        totalVertices += geo.attributes.position.count;
    }
    
    const positions = new Float32Array(totalVertices * 3);
    const normals = new Float32Array(totalVertices * 3);
    let offset = 0;
    
    for (const geo of geometries) {
        const pos = geo.attributes.position;
        const norm = geo.attributes.normal;
        
        for (let i = 0; i < pos.count; i++) {
            positions[offset * 3] = pos.getX(i);
            positions[offset * 3 + 1] = pos.getY(i);
            positions[offset * 3 + 2] = pos.getZ(i);
            
            if (norm) {
                normals[offset * 3] = norm.getX(i);
                normals[offset * 3 + 1] = norm.getY(i);
                normals[offset * 3 + 2] = norm.getZ(i);
            }
            offset++;
        }
    }
    
    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    
    return merged;
}
