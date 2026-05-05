export const particleFrag = `#version 300 es
precision highp float;

in float vSpeed;
out vec4 FragColor;

uniform float uMaxSpeed;

vec3 colorMap(float t) {
    // simple heatmap
    return vec3(
        t,
        1.0 - abs(t - 0.5) * 2.0,
        1.0 - t
    );
}

void main() {
    float t = clamp(vSpeed / uMaxSpeed, 0.0, 1.0);
    vec3 color = colorMap(t);

    // round particle
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    if (dot(p, p) > 1.0) discard;

    FragColor = vec4(color, 1.0);
}`
