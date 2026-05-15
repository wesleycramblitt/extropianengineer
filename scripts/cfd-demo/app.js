import { createGL }           from "/scripts/graphics/gl.js";
import { Mesh }                from "/scripts/graphics/mesh.js";
import { Background }          from "/scripts/graphics/background.js";
import { ParticleSet }         from "/scripts/graphics/particle-set.js";
import { Camera }              from "/scripts/graphics/camera.js";
import { Renderer }            from "/scripts/graphics/renderer.js";
import { createCubeData, generateGrid, generateAxisLine }
                               from "/scripts/graphics/geometry.js";
import { vec3 }                from "/scripts/math/vec3.js";
import { quat }                from "/scripts/math/quat.js";
import { mat4 }                from "/scripts/math/mat4.js";
import { CFDSimulator }        from "/scripts/simulation/cfd-simulator.js";

// ── canvas & WebGL context ──────────────────────────────────────────

const canvas = document.getElementById("cfd");
const gl = createGL(canvas);

// ── camera & renderer ───────────────────────────────────────────────

const camera   = new Camera();
const renderer = new Renderer(gl, canvas, camera);

// ── background (skybox) ─────────────────────────────────────────────

const background = new Background(gl, "/assets/textures/sky.avif");
await background.loadTexture();

const entities = [];
entities.push({
    background: background,
    draw:       () => { background.draw(); },
});

const lightDir = vec3(1, -5.0, -0.5);

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

// ── solid obstacle (cube) ───────────────────────────────────────────

const cubeModel = mat4();
const cubeData  = createCubeData();
const cubeMesh  = new Mesh(gl, cubeData, camera, cubeModel, lightDir, vec3(0.3, 0.3, 0.3), "lit");

const cubeTranslation = {
    position: vec3(0, 0, 0),
    rotation: quat(),
    scale:    vec3(1, 1, 1),
};

entities.push({
    mesh:        cubeMesh,
    model:       cubeMesh.model,
    translation: cubeTranslation,
    collision:   1,           // <— marks this entity for solid voxelisation
    draw:        () => { cubeMesh.draw(); },
});

// ── simulator ───────────────────────────────────────────────────────

const simulator = new CFDSimulator(
    entities.filter(e => e.collision === 1),
    { particleCount: 50000 },
);

// ── GPU particle renderer (reads Float32Arrays by reference) ────────

const cfdParticleSet = new ParticleSet(gl, simulator.positions, simulator.velocities, camera);
entities.push({
    particleSet: cfdParticleSet,
    draw:        () => { cfdParticleSet.draw(); },
});

// ── render loop ─────────────────────────────────────────────────────

let lastTime = 0;

function frame(time) {
    let dt = (time - lastTime) / 1000;
    lastTime = time;
    dt = Math.min(dt, 1 / 60);   // cap to ~16 ms to avoid spiral-of-death

    simulator.step(dt);
    renderer.draw(entities);

    requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
