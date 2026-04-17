import { createGL } from "/scripts/graphics/gl.js";
import { ShaderProgram } from "/scripts/graphics/shader.js";
import { Mesh } from "/scripts/graphics/mesh.js";
import { Camera } from "/scripts/graphics/camera.js";
import { Renderer } from "/scripts/graphics/renderer.js";
import { createCubeData, createFloorData } from "/scripts/graphics/geometry.js";
import { loadOBJ } from "/scripts/graphics/obj.js";
import { litVert } from "/scripts/graphics/shaders/lit.vert.js";
import { litFrag } from "/scripts/graphics/shaders/lit.frag.js";
import { backgroundVert } from "/scripts/graphics/shaders/background.vert.js";
import { backgroundFrag } from "/scripts/graphics/shaders/background.frag.js";

import { vec3 } from "/scripts/math/vec3.js";
import { quat, fromAxisAngle } from "/scripts/math/quat.js";
import { mat4 } from "/scripts/math/mat4.js";
import { composeTRS } from "/scripts/math/transform.js";
import { loadTexture } from "../graphics/texture.js";
import { createHollowCylinder } from '/scripts/graphics/geometry.js';

const canvas = document.getElementById("cfd");
const gl = createGL(canvas);

const renderer = new Renderer(gl, canvas);
const camera = new Camera();

const bgTexture = await loadTexture(gl, "/assets/textures/sky.avif");
const shader = new ShaderProgram(gl, litVert, litFrag);
const backgroundShader = new ShaderProgram(gl, backgroundVert, backgroundFrag);
const coffee = await loadOBJ("/assets/mesh/bowl.obj");

const coffeeMesh = new Mesh(gl, coffee);
const model = mat4();

const cylinderTranslation = { 
    position: vec3(0,0,-5),
    scale: vec3(0.5,0.5,0.5),
    rotation: quat(0,0,0,0)
}

const lightDir = vec3(0.5, -1.0, -0.2);


function composeTRSFromTranslation(model, t) {
    composeTRS(model,t.position, t.rotation, t.scale); 
}

function frame(t) {
  renderer.beginFrame(camera);

  renderer.drawBackground(backgroundShader, bgTexture);

  // const angle = t * 0.001;
  // fromAxisAngle(cylinderTranslation.rotation, vec3(1, 0, 0), angle);
  composeTRSFromTranslation(model, cylinderTranslation);

  renderer.drawMesh(coffeeMesh, shader, model, camera, lightDir, camera.eye, vec3(3,3,3));

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
