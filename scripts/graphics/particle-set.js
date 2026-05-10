
import { vec3 } from "/scripts/math/vec3.js";
import { quat, fromAxisAngle } from "/scripts/math/quat.js";
import { mat4 } from "/scripts/math/mat4.js";

import { ShaderProgram } from "/scripts/graphics/shader.js";
import { particleVert } from "/scripts/graphics/shaders/particle.vert.js";
import { particleFrag } from "/scripts/graphics/shaders/particle.frag.js";

/**
 * gl: webgl context
 * positions: array(vec3)  (world coords)
 * velocities: array(vec3) (world coords)
 * */
export class ParticleSet {
    constructor(gl, positions, velocities, camera) {
        this.gl = gl;
        this.positions = positions;
        this.velocities = velocities;
        this.camera = camera;

        this.shader = new ShaderProgram(gl, particleVert, particleFrag);

        this.particleVAO = gl.createVertexArray();
        this.positionVBO = gl.createBuffer();
        this.speedVBO = gl.createBuffer();

        this.speedData = new Float32Array(positions.length);

        this.configureVAO();
    }

    configureVAO() {
        const gl = this.gl;

        gl.bindVertexArray(this.particleVAO);

        // location 0: vec3 aPos
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionVBO);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(
            0,          // location
            3,          // vec3
            gl.FLOAT,
            false,
            0,          // tightly packed
            0
        );

        // location 1: float aSpeed
        gl.bindBuffer(gl.ARRAY_BUFFER, this.speedVBO);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(
            1,          // location
            1,          // float
            gl.FLOAT,
            false,
            0,
            0
        );

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    updateBufferData() {
        const n = this.velocities.length;

        if (this.speedData.length !== n/3) {
            this.speedData = new Float32Array(n/3);
        }

        for (let i = 0; i < n; i+=3) {
            const vx = this.velocities[i];
            const vy = this.velocities[i+1];
            const vz = this.velocities[i+2];
            this.speedData[i] = Math.sqrt(vx * vx + vy * vy + vz * vz);
//            if (this.speedData[i] > 3) this.speedData[i] = 3; 
        }
    }

    draw() {
        if (!this.positions) return;

        const gl = this.gl;
        const shader = this.shader;

        const count = this.positions.length/3;
        if (count === 0) return;

        this.updateBufferData();

        shader.use();
        shader.setMat4("uView", this.camera.view);
        shader.setMat4("uProjection", this.camera.projection);
        shader.setFloat("uMaxSpeed", 2);

        gl.bindVertexArray(this.particleVAO);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionVBO);
        gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.DYNAMIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.speedVBO);
        gl.bufferData(gl.ARRAY_BUFFER, this.speedData, gl.DYNAMIC_DRAW);

        gl.enable(gl.DEPTH_TEST);
        gl.depthMask(true);
        gl.enable(gl.BLEND);

        gl.drawArrays(gl.POINTS, 0, count);

        gl.bindVertexArray(null);
    }
}
