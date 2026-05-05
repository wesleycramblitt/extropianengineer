import { createGL } from "/scripts/graphics/gl.js";
import { Mesh } from "/scripts/graphics/mesh.js";
import { Background } from "/scripts/graphics/background.js";
import { ParticleSet } from "/scripts/graphics/particle-set.js";
import { Camera } from "/scripts/graphics/camera.js";
import { Renderer } from "/scripts/graphics/renderer.js";
import { generateVortexParticles, createCubeData, createFloorData } from "/scripts/graphics/geometry.js";
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



const model = mat4();
console.log(model);
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



const simulator = new CFDSimulator(entities.filter(x => x.collision == 1), {});

 const { positions ,velocities} = generateVortexParticles(100000, 5, 1, 2.0) 
simulator.positions = positions;
simulator.velocities = velocities;
const cfdParticleSet = new ParticleSet(gl, simulator.positions, simulator.velocities, camera);
const particles_entity = {
    particleSet: cfdParticleSet,
    draw: () => { cfdParticleSet.draw();}
}
entities.push(particles_entity);


var lastTime = 0;

function frame(time) {
  const dt = (time - lastTime)/1000;
  lastTime = time;
    
  simulator.step(dt);

  
  renderer.draw(entities);      

  requestAnimationFrame(frame);
    
}

requestAnimationFrame(frame);


