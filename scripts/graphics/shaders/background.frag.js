export const backgroundFrag = `#version 300 es
    precision highp float;

    in vec2 vUV;

    uniform sampler2D uBackground;

    out vec4 outColor;

    void main() {
        vec3 color = texture(uBackground, vUV).rgb;
        outColor = vec4(color, 1.0);
    }
`;
