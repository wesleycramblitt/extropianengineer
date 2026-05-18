import { createGL }                from "/scripts/graphics/gl.js";
import { Mesh }                     from "/scripts/graphics/mesh.js";
import { ParticleSet }              from "/scripts/graphics/particle-set.js";
import { Camera }                   from "/scripts/graphics/camera.js";
import { Renderer }                 from "/scripts/graphics/renderer.js";
import { createCubeData,
         createSphereData,
         createSolidCylinderData,
         generateGrid,
         generateAxisLine }         from "/scripts/graphics/geometry.js";
import { loadOBJ }                  from "/scripts/graphics/obj.js";
import { vec3 }                     from "/scripts/math/vec3.js";
import { quat }                     from "/scripts/math/quat.js";
import { mat4 }                     from "/scripts/math/mat4.js";
import { CFDSimulator }             from "/scripts/simulation/cfd-simulator.js";
import { CanvasController }         from "/scripts/graphics/canvas-controller.js";

// ── canvas & WebGL context ──────────────────────────────────────────

const canvas = document.getElementById("cfd");
const gl = createGL(canvas);

// ── visibility / pause / fullscreen controller ─────────────────────

const controller = new CanvasController(canvas);

// ── camera & renderer ───────────────────────────────────────────────

const camera   = new Camera();
const renderer = new Renderer(gl, canvas, camera);

// ── background: solid #333 via gl.clearColor in Renderer ────────────

const entities = [];

const lightDir = vec3(5, -5.0, -0.5);

// ── reference grid & axes ───────────────────────────────────────────

const grid     = generateGrid(100, 100);
const axisX    = generateAxisLine(15, "x");
const axisY    = generateAxisLine(15, "y");
const axisZ    = generateAxisLine(15, "z");

const gridModel = mat4();
const gridMesh  = new Mesh(gl, grid,  camera, gridModel,  null, vec3(0.8, 0.8, 0.8), "unlit");
const xMesh     = new Mesh(gl, axisX, camera, mat4(),      null, vec3(1, 0, 0),      "unlit");
const yMesh     = new Mesh(gl, axisY, camera, mat4(),      null, vec3(0, 1, 0),      "unlit");
const zMesh     = new Mesh(gl, axisZ, camera, mat4(),      null, vec3(0, 0, 1),      "unlit");

function pushStaticEntity(mesh) {
    entities.push({
        mesh:        mesh,
        model:       mesh.model,
        translation: { position: vec3(0, 0, 0), rotation: quat(), scale: vec3(1, 1, 1) },
        draw:        () => { mesh.draw(); },
    });
}

pushStaticEntity(gridMesh);
pushStaticEntity(xMesh);
pushStaticEntity(yMesh);
pushStaticEntity(zMesh);

// ── obstacle shapes (procedural + loaded OBJ) ──────────────────────

const [ coffeeData, b2Data] = await Promise.all([
    // loadOBJ('/assets/mesh/bowl.obj'),
    loadOBJ('/assets/mesh/coffee.obj'),
    loadOBJ('/assets/mesh/b2.obj')
]);

const shapeDefs = {
    'Cube':     () => createCubeData(),
    'Sphere':   () => createSphereData(0.5, 24, 24),
    'Cylinder': () => createSolidCylinderData(0.5, 1.0, 32),
    // 'Bowl':     () => bowlData,
    'Coffee':   () => coffeeData,
    // 'B2':     () => b2Data,
};

function createObstacleEntity(shapeName) {
    const data = shapeDefs[shapeName]();
    const model = mat4();
    const mesh  = new Mesh(gl, data, camera, model, lightDir, vec3(0.3, 0.3, 0.3), 'lit');
    return {
        mesh:        mesh,
        model:       mesh.model,
        translation: { position: vec3(0, 0, 0), rotation: quat(), scale: vec3(1, 1, 1) },
        collision:   1,
        draw:        () => { mesh.draw(); },
    };
}

// Initial obstacle
let currentShape = 'Cube';
const obstacleIdx = entities.length;
entities.push(createObstacleEntity(currentShape));

// ── simulator ───────────────────────────────────────────────────────

const simulator = new CFDSimulator(
    entities.filter(e => e.collision === 1),
    { particleCount: 50000 },
);

// ── GPU particle renderer ───────────────────────────────────────────

const cfdParticleSet = new ParticleSet(gl, simulator.positions, simulator.velocities, camera);
entities.push({
    particleSet: cfdParticleSet,
    draw:        () => { cfdParticleSet.draw(); },
});

// ── obstacle shape dropdown ─────────────────────────────────────────

const select = document.createElement('select');
select.setAttribute('data-no-drag', '');
Object.assign(select.style, {
    position: 'absolute',
    bottom: '0.5rem',
    left: '0.5rem',
    zIndex: '999',
    padding: '0.3rem 0.5rem',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: '4px',
    background: 'rgba(0,0,0,0.7)',
    color: '#eee',
    fontSize: '0.85rem',
    cursor: 'pointer',
    pointerEvents: 'auto',
});

Object.keys(shapeDefs).forEach(function (name) {
    var opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    if (name === currentShape) opt.selected = true;
    select.appendChild(opt);
});

select.addEventListener('change', function () {
    var name = select.value;
    if (name === currentShape) return;
    currentShape = name;

    // Replace the obstacle entity in the render list.
    entities[obstacleIdx] = createObstacleEntity(name);

    // Update simulator's collision-entity reference and re-voxelise.
    simulator.entities = entities.filter(function (e) { return e.collision === 1; });
    simulator.updateSolidFlagsFromEntities();

    // Reset tracer particles — old positions are invalid for the new shape.
    simulator.particles.resetAll();
});
select.addEventListener('pointerdown', function (e) { e.stopPropagation(); });

var shell = canvas.closest('.canvas-shell');
if (shell) shell.appendChild(select);

// ── camera view presets ──────────────────────────────────────────────

const viewPresets = {
    'Persp': { eye: [2, 3, 2],       target: [0, 0, 0], up: [0, 1, 0] },
    'Top':   { eye: [0, 3.5, 0.001], target: [0, 0, 0], up: [0, 0, -1] },
    'Front': { eye: [0, 0, 3.5],     target: [0, 0, 0], up: [0, 1, 0] },
    'Side':  { eye: [3.5, 0, 0],     target: [0, 0, 0], up: [0, 1, 0] },
};

// Target camera state (lerped toward each frame).
const targetCam = {
    eye:    [camera.eye[0],    camera.eye[1],    camera.eye[2]],
    target: [camera.target[0], camera.target[1], camera.target[2]],
    up:     [camera.up[0],     camera.up[1],     camera.up[2]],
};

function applyViewPreset(name) {
    const p = viewPresets[name];
    if (!p) return;
    targetCam.eye[0]    = p.eye[0];
    targetCam.eye[1]    = p.eye[1];
    targetCam.eye[2]    = p.eye[2];
    targetCam.target[0] = p.target[0];
    targetCam.target[1] = p.target[1];
    targetCam.target[2] = p.target[2];
    targetCam.up[0]     = p.up[0];
    targetCam.up[1]     = p.up[1];
    targetCam.up[2]     = p.up[2];
}

// ── view-switch buttons (axis-colored gizmo) ────────────────────────

const viewBar = document.createElement('div');
viewBar.setAttribute('data-no-drag', '');
Object.assign(viewBar.style, {
    position: 'absolute',
    bottom: '0.5rem',
    right: '0.5rem',
    display: 'flex',
    gap: '0.3rem',
    zIndex: '999',
    pointerEvents: 'auto',
});

function makeViewBtn(label, color) {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.type = 'button';
    btn.setAttribute('data-no-drag', '');
    Object.assign(btn.style, {
        padding: '0.25rem 0.55rem',
        border: '1px solid ' + color,
        borderRadius: '4px',
        background: 'rgba(0,0,0,0.7)',
        color: color,
        fontSize: '0.8rem',
        cursor: 'pointer',
        lineHeight: '1',
    });
    btn.style.setProperty('pointer-events', 'auto', 'important');
    btn.addEventListener('pointerdown', function (e) {
        e.stopPropagation();
        applyViewPreset(label);
    });
    return btn;
}

viewBar.appendChild(makeViewBtn('Persp', '#ccc'));
viewBar.appendChild(makeViewBtn('Side',  '#f44'));   // X-axis
viewBar.appendChild(makeViewBtn('Top',   '#4f4'));   // Y-axis
viewBar.appendChild(makeViewBtn('Front', '#44f'));   // Z-axis

if (shell) shell.appendChild(viewBar);

// ── render loop ─────────────────────────────────────────────────────

let lastTime = 0;

function frame(time) {
    requestAnimationFrame(frame);

    if (controller.isPlaying) {
        let dt = (time - lastTime) / 1000;
        if (lastTime === 0) dt = 1 / 60;
        lastTime = time;
        dt = Math.min(dt, 1 / 30);
        simulator.step(dt);
    } else {
        lastTime = 0;
    }

    // ── smooth camera transition ──────────────────────────────────
    const speed = 6.0;   // higher = snappier
    const t = 1.0 - Math.exp(-speed * (1 / 60));  // framerate-independent lerp
    for (let i = 0; i < 3; i++) {
        camera.eye[i]    += (targetCam.eye[i]    - camera.eye[i])    * t;
        camera.target[i] += (targetCam.target[i] - camera.target[i]) * t;
        camera.up[i]     += (targetCam.up[i]     - camera.up[i])     * t;
    }
    camera.updateView();

    renderer.draw(entities);
}

requestAnimationFrame(frame);
