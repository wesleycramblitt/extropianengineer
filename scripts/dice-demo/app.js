import { createGL } from "/scripts/graphics/gl.js";
import { ShaderProgram } from "/scripts/graphics/shader.js";
import { Mesh } from "/scripts/graphics/mesh.js";
import { Camera } from "/scripts/graphics/camera.js";
import { Renderer } from "/scripts/graphics/renderer.js";
import { createCubeData, generateGrid, generateAxisLine } from "/scripts/graphics/geometry.js";
import { loadOBJ } from "/scripts/graphics/obj.js";
import { vec3 } from "/scripts/math/vec3.js";
import { quat, fromAxisAngle } from "/scripts/math/quat.js";
import { mat4 } from "/scripts/math/mat4.js";
import { composeTRS } from "/scripts/math/transform.js";
import { loadTexture } from "../graphics/texture.js";
import { RigidBodySimulator } from "/scripts/simulation/rigid-body-simulator.js";

const canvas = document.getElementById("dice");
const gl = createGL(canvas);

const renderer = new Renderer(gl, canvas);
const camera = new Camera();

const grid = generateGrid(100,100);
const x = generateAxisLine(15, "x");
const y = generateAxisLine(15, "y");
const z = generateAxisLine(15, "z");

const dice = await loadOBJ("/assets/mesh/dice.obj");

const cubeMesh = new Mesh(gl, dice);
const gridMesh = new Mesh(gl, grid);
const xMesh = new Mesh(gl, x);
const yMesh = new Mesh(gl, y);
const zMesh = new Mesh(gl, z);


const model = mat4();
const cubeTranslation = { 
    position: vec3(-3,15,0),
    scale: vec3(0.2,0.2,0.2),
    rotation: quat()
}

const cube2Translation = { 
    position: vec3(0,0,0),
    scale: vec3(0.2,0.2,0.2),
    rotation: quat()
}

const gridTranslation = { 
    position: vec3(0,0,0),
    scale: vec3(1,1,1),
    rotation: quat()
}


const lightDir = vec3(0.5, -1.0, -0.2);

function composeTRSFromTranslation(model, t) {
    composeTRS(model,t.position, t.rotation, t.scale); 
}

const simulator = new RigidBodySimulator(cubeTranslation);

var lastTime = 0;
function frame(time) {
  const dt = (time - lastTime)/1000;
  lastTime = time;

  var rigidBodyState = simulator.step(dt);
  renderer.beginFrame(camera);

  //renderer.drawBackground(backgroundShader, bgTexture);
  composeTRSFromTranslation(model, gridTranslation);

  renderer.drawLines(gridMesh, model, camera, camera.eye, vec3(0.5,0.5,0.5));
  renderer.drawLines(xMesh, model, camera, camera.eye, vec3(0,0.8,0));
  renderer.drawLines(yMesh, model, camera, camera.eye, vec3(0.8,0,0));
  renderer.drawLines(zMesh, model, camera, camera.eye, vec3(0,0,0.8));

  //const angle = t * 0.001;
  //fromAxisAngle(cubeTranslation.rotation, vec3(0, 1, 0), angle);
  composeTRSFromTranslation(model, cubeTranslation);
  renderer.drawMesh(cubeMesh, model, camera, lightDir, camera.eye, vec3(0.4,0.4,0.8));

  composeTRSFromTranslation(model, cube2Translation);
  renderer.drawMesh(cubeMesh,  model, camera, lightDir, camera.eye, vec3(0.8,0.4,0.4));


  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
