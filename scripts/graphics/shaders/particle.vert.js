export const particleVert = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPos;
layout(location = 1) in float aSpeed;

out float vSpeed;

uniform mat4 uView;
uniform mat4 uProjection;

void main() {
    gl_Position = uProjection * uView * vec4(aPos, 1.0);
    vSpeed = aSpeed;
    gl_PointSize = 5.0;
}`
