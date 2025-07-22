import * as THREE from "https://cdn.skypack.dev/three@0.129.0";

export function createEarthMaterial(dayTexture, nightTexture, lightDirection) {
  return new THREE.ShaderMaterial({
    uniforms: {
      dayMap: { value: dayTexture },
      nightMap: { value: nightTexture },
      lightDirection: { value: lightDirection.clone().normalize() },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldNormal;

      void main() {
        vUv = uv;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D dayMap;
      uniform sampler2D nightMap;
      uniform vec3 lightDirection;

      varying vec2 vUv;
      varying vec3 vWorldNormal;

      void main() {
        vec3 normal = normalize(vWorldNormal);
        float lightIntensity = dot(normal, normalize(lightDirection));
        float blend = clamp(lightIntensity, 0.0, 1.0);

        vec3 dayColor = texture2D(dayMap, vUv).rgb;
        vec3 nightColor = texture2D(nightMap, vUv).rgb;

        vec3 color = mix(nightColor, dayColor, blend);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
}
