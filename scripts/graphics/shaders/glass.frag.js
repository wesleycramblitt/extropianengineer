export const glassFrag = `#version 300 es
precision highp float;

in vec3 vWorldPos;
in vec3 vNormal;
in vec2 vUV;

uniform vec3 uLightDir;
uniform vec3 uCameraPos;

uniform vec3 uBaseColor;
uniform float uSpecularStrength;
uniform float uShininess;
uniform float uAlpha;

out vec4 outColor;

void main() {
    vec3 N = normalize(vNormal);
    vec3 L = normalize(-uLightDir);
    vec3 V = normalize(uCameraPos - vWorldPos);
    vec3 H = normalize(L + V);

    float ndotl = max(dot(N, L), 0.0);
    float specular = pow(max(dot(N, H), 0.0), uShininess);

    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 5.0);

    vec3 tint = uBaseColor;

    // low body contribution + strong edge/spec cues
    vec3 color =
        tint * 0.06 +
        tint * 0.10 * ndotl +
        vec3(1.0) * (uSpecularStrength * specular) +
        tint * 0.85 * fresnel;

    float alpha = clamp(uAlpha + 0.45 * fresnel, 0.0, 1.0);

    outColor = vec4(color, alpha);
}
`;
