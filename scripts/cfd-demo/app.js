import { createGL } from "/scripts/graphics/gl.js";
import { Mesh } from "/scripts/graphics/mesh.js";
import { Background } from "/scripts/graphics/background.js";
import { ParticleSet } from "/scripts/graphics/particle-set.js";
import { Camera } from "/scripts/graphics/camera.js";
import { Renderer } from "/scripts/graphics/renderer.js";
import { generateVortexParticles, createCubeData, createFloorData, generateGrid, generateAxisLine } from "/scripts/graphics/geometry.js";
import { loadOBJ } from "/scripts/graphics/obj.js";

import { vec3 } from "/scripts/math/vec3.js";
import { quat, fromAxisAngle } from "/scripts/math/quat.js";
import { mat4 } from "/scripts/math/mat4.js";
import { CFDSimulator} from "/scripts/simulation/cfd-simulator.js";

const canvas = document.getElementById("cfd");
const gl = createGL(canvas);

const camera = new Camera();

const renderer = new Renderer(gl, canvas,camera);
const background = new Background(gl,"/assets/textures/sky.avif");
await background.loadTexture();

const lightDir = vec3(1, -5.0, -0.5);

const entities = [];
const background_entity = {
    background: background,
    draw: () => { background.draw()} 
}
entities.push(background_entity);


const grid = generateGrid(100,100);
const x = generateAxisLine(15, "x");
const y = generateAxisLine(15, "y");
const z = generateAxisLine(15, "z");

const gridModel = mat4();
const gridMesh = new Mesh(gl, grid, camera, gridModel, null, vec3(0.8,0.8,0.8), "unlit");
const xModel = mat4();
const xMesh = new Mesh(gl, x,camera, xModel, null, vec3(1,0,0), "unlit");

const yModel = mat4();
const yMesh = new Mesh(gl, y,camera, yModel, null, vec3(0,1,0), "unlit");

const zModel = mat4();
const zMesh = new Mesh(gl, z,camera, zModel, null, vec3(0,0,1), "unlit");

const gridEntity = {
    mesh: gridMesh,
    model: gridMesh.model,
    translation: { position: vec3(0,0,0), rotation: quat(), scale: vec3(1,1,1)},
    draw: () => {gridMesh.draw()}
}
entities.push(gridEntity);


const xEntity = {
    mesh: xMesh,
    model: xMesh.model,
    translation: { position: vec3(0,0,0), rotation: quat(), scale: vec3(1,1,1)},
    draw: () => {xMesh.draw()}
}
entities.push(xEntity);



const yEntity = {
    mesh: yMesh,
    model: yMesh.model,
    translation: { position: vec3(0,0,0), rotation: quat(), scale: vec3(1,1,1)},
    draw: () => {yMesh.draw()}
}
entities.push(yEntity);



const zEntity = {
    mesh: zMesh,
    model: zMesh.model,
    translation: { position: vec3(0,0,0), rotation: quat(), scale: vec3(1,1,1)},
    draw: () => {zMesh.draw()}
}
entities.push(zEntity);



const model = mat4();
const cube = createCubeData();
const cubeMesh = new Mesh(gl,cube, camera, model,lightDir, vec3(0.3,0.3,0.3), "lit");
var cubeTranslation = {
    position: vec3(0,0,0),
    rotation: quat(),
    scale: vec3(1,1,1) 
}
const cube_entity = {
    mesh: cubeMesh,
    model: cubeMesh.model,
    translation: cubeTranslation,
    collision: 1,
    draw: () => { cubeMesh.draw()}
}
entities.push(cube_entity);



const simulator = new CFDSimulator(entities.filter(x => x.collision == 1), { particleCount: 50000 });

const cfdParticleSet = new ParticleSet(gl, simulator.positions, simulator.velocities, camera);
const particles_entity = {
    particleSet: cfdParticleSet,
    draw: () => { cfdParticleSet.draw();}
}
entities.push(particles_entity);

var lastTime = 0;

function frame(time) {
    var dt = (time - lastTime)/1000;
    lastTime = time;
    dt = Math.min(dt, 1/60);

    simulator.step(dt);

    renderer.draw(entities);      

    requestAnimationFrame(frame);
    
}

requestAnimationFrame(frame);


