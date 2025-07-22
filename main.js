// Import necessary modules
import * as THREE from "https://cdn.skypack.dev/three@0.129.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { createEarthMaterial } from "./earth_shader.js";
import { setupPlanetInfoPopup } from "./planetinfo.js";

// Global variables
let scene, camera, renderer, controls;
let planet_sun, planet_mercury, planet_venus, planet_earth, planet_mars;
let planet_jupiter, planet_saturn, planet_uranus, planet_neptune;
let moonPivot,
  phobosPivot,
  ganymedePivot,
  titanPivot,
  titaniaPivot,
  tritonPivot;
let orbit_visibility = 0.3;  
let asteroidBeltGroup, earthMaterial;
let isPlaying = false, sound;
let isFollowingPlanet = false;
let targetPlanet = null;


const planets = [];

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();


const orbitRadii = {
  mercury: 30,
  venus: 45,
  earth: 60,
  mars: 75,
  jupiter: 140,
  saturn: 180,
  uranus: 210,
  neptune: 240,
};

// Speed slider setup
const speedSlider = document.getElementById("speedSlider");
const speedValueDisplay = document.getElementById("speedValue");
let speed_index = parseFloat(speedSlider.value);

speedSlider.addEventListener("input", () => {
  speed_index = parseFloat(speedSlider.value);
  speedValueDisplay.textContent = `${speed_index.toFixed(2)}x`;
});

// Store revolution angles for each planet
const revolutionAngles = {
  mercury: 0,
  venus: 0,
  earth: 0,
  mars: 0,
  jupiter: 0,
  saturn: 0,
  uranus: 0,
  neptune: 0,
};

let lastTime = performance.now();


function loadPlanet(texturePath, radius) {
  const geometry = new THREE.SphereGeometry(radius, 64, 64);
  const texture = new THREE.TextureLoader().load(texturePath);
  const material = new THREE.MeshStandardMaterial({ map: texture });
  return new THREE.Mesh(geometry, material);
}

function createOrbitRing(radius) {
  const geometry = new THREE.RingGeometry(radius - 0.3, radius + 0.3, 64);
  const material = new THREE.MeshBasicMaterial({
    color: 0x888888,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: orbit_visibility,
  });
  const ring = new THREE.Mesh(geometry, material);
  ring.rotation.x = Math.PI / 2;
  scene.add(ring);
}

function createAsteroidBelt(inner, outer, count) {
  const group = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const radius = THREE.MathUtils.lerp(inner, outer, Math.random());
    const angle = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * 2;
    const geo = new THREE.SphereGeometry(0.3 + Math.random() * 0.7, 8, 8);
    const mat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const rock = new THREE.Mesh(geo, mat);
    rock.position.set(radius * Math.cos(angle), y, radius * Math.sin(angle));
    group.add(rock);
  }
  scene.add(group);
  return group;
}

function planetRevolver(time, speed, planet, radius) {
  const angle = time * 0.001 * speed * speed_index;
  planet.position.x = radius * Math.cos(angle);
  planet.position.z = radius * Math.sin(angle);
}

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    3000
  );
  camera.position.z = 250;

  const loader = new THREE.CubeTextureLoader();
  scene.background = loader.load([
    "../assets/skybox/space_rt.png",
    "../assets/skybox/space_lf.png",
    "../assets/skybox/space_up.png",
    "../assets/skybox/space_dn.png",
    "../assets/skybox/space_ft.png",
    "../assets/skybox/space_bk.png",
  ]);

  // Sun
  const sunTex = new THREE.TextureLoader().load("../assets/planets/sun.jpg");
  const sunGeo = new THREE.SphereGeometry(20, 64, 64);
  const sunMat = new THREE.MeshBasicMaterial({ map: sunTex });
  planet_sun = new THREE.Mesh(sunGeo, sunMat);
  scene.add(planet_sun);
  planet_sun.name = "sun";
  planets.push(planet_sun);

  // Earth with shader
  const dayTexture = new THREE.TextureLoader().load(
    "../assets/planets/earth_daymap.jpg"
  );
  const nightTexture = new THREE.TextureLoader().load(
    "../assets/planets/earth_nightmap.jpg"
  );
  earthMaterial = createEarthMaterial(
    dayTexture,
    nightTexture,
    new THREE.Vector3(1, 0, 0)
  );
  const earthGeo = new THREE.SphereGeometry(4, 64, 64);
  planet_earth = new THREE.Mesh(earthGeo, earthMaterial);
  planet_earth.name = "earth";
  planets.push(planet_earth);

  // Other planets
  planet_mercury = loadPlanet("../assets/planets/mercury.jpg", 2);
  planet_mercury.name = "mercury";
  planets.push(planet_mercury);

  planet_venus = loadPlanet("../assets/planets/venus_surface.jpg", 3);
  planet_venus.name = "venus";
  planets.push(planet_venus);

  planet_mars = loadPlanet("../assets/planets/mars.jpg", 3.5);
  planet_mars.name = "mars";
  planets.push(planet_mars);

  planet_jupiter = loadPlanet("../assets/planets/jupiter.jpg", 10);
  planet_jupiter.name = "jupiter";
  planets.push(planet_jupiter);

  planet_saturn = loadPlanet("../assets/planets/saturn.jpg", 8);
  planet_saturn.name = "saturn";
  planets.push(planet_saturn);

  planet_uranus = loadPlanet("../assets/planets/uranus.jpg", 6);
  planet_uranus.name = "uranus";
  planets.push(planet_uranus);

  planet_neptune = loadPlanet("../assets/planets/neptune.jpg", 5);
  planet_neptune.name = "neptune";
  planets.push(planet_neptune);

  planet_mercury.userData.isPlanet = true;
  planet_venus.userData.isPlanet = true;
  planet_earth.userData.isPlanet = true;
  planet_mars.userData.isPlanet = true;
  planet_jupiter.userData.isPlanet = true;
  planet_saturn.userData.isPlanet = true;
  planet_uranus.userData.isPlanet = true;
  planet_neptune.userData.isPlanet = true;


  scene.add(
    planet_sun,
    planet_mercury,
    planet_venus,
    planet_earth,
    planet_mars,
    planet_jupiter,
    planet_saturn,
    planet_uranus,
    planet_neptune
  );

  // Moons
  function addMoon(parent, radius, distance, inclinationDeg) {
    const moon = loadPlanet("../assets/planets/moon.jpg", radius);
    const pivot = new THREE.Object3D();
    parent.add(pivot);
    pivot.rotation.z = THREE.MathUtils.degToRad(inclinationDeg);
    moon.position.x = distance;
    pivot.add(moon);
    return pivot;
  }

  moonPivot = addMoon(planet_earth, 1, 8, 5);
  phobosPivot = addMoon(planet_mars, 0.5, 6, 1);
  ganymedePivot = addMoon(planet_jupiter, 1.5, 15, 15);
  titanPivot = addMoon(planet_saturn, 1.3, 13, 27);
  titaniaPivot = addMoon(planet_uranus, 1, 11, 10);
  tritonPivot = addMoon(planet_neptune, 1, 10, 25);

  // Saturn rings
  const ringGeo = new THREE.RingGeometry(9, 16, 64);
  const ringTex = new THREE.TextureLoader().load(
    "../assets/planets/saturn_ring_alpha.png"
  );
  const ringMat = new THREE.MeshBasicMaterial({
    map: ringTex,
    side: THREE.DoubleSide,
    transparent: true,
  });
  const saturnRing = new THREE.Mesh(ringGeo, ringMat);
  saturnRing.rotation.x = Math.PI / 2;
  planet_saturn.add(saturnRing);

  // Asteroid belt
  asteroidBeltGroup = createAsteroidBelt(90, 125, 300);

  // Lights
  const light = new THREE.PointLight(0xffffff, 5, 1000, 10);
  light.position.set(0, 0, 0);
  scene.add(light);

  Object.values(orbitRadii).forEach(createOrbitRing);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 50;
  controls.maxDistance = 2000;

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  let orbitsVisible = false;
  const toggleOrbitBtn = document.getElementById("toggleOrbitBtn");

  toggleOrbitBtn.addEventListener("click", () => {
    orbitsVisible = !orbitsVisible;
    scene.traverse((child) => {
      if (child.isMesh && child.geometry.type === "RingGeometry") {
        child.visible = orbitsVisible;
      }
    });
    toggleOrbitBtn.textContent = orbitsVisible ? "Hide Orbits" : "Show Orbits";
  });


  const listener = new THREE.AudioListener();
  camera.add(listener);
  sound = new THREE.Audio(listener);
  const audioLoader = new THREE.AudioLoader();
  audioLoader.load("../assets/sounds/space_ambient.mp3", function (buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(0.4);
  });

  setupPlanetInfoPopup(planets, camera, renderer.domElement);
  window.addEventListener("click", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planets);

    if (intersects.length > 0) {
      const selected = intersects[0].object;
      if (selected.userData.isPlanet) {
        focusOnPlanet(selected);
      }
    }
  });

}
function focusOnPlanet(planet) {
  isFollowingPlanet = true;
  targetPlanet = planet;

  const offset = new THREE.Vector3(0, 10, 20); // Adjust for view angle
  const worldOffset = planet.localToWorld(offset.clone());

  camera.position.copy(worldOffset);
  camera.lookAt(planet.position);
}


function animate(currentTime) {
  requestAnimationFrame(animate);

  const deltaTime = (currentTime - lastTime) * 0.001; // seconds
  lastTime = currentTime;

  if (isPlaying) {
    // Rotate moons and asteroid belt
    moonPivot.rotation.y += 0.01;
    phobosPivot.rotation.y += 0.02;
    ganymedePivot.rotation.y += 0.005;
    titanPivot.rotation.y += 0.007;
    titaniaPivot.rotation.y += 0.01;
    tritonPivot.rotation.y += 0.008;
    asteroidBeltGroup.rotation.y += 0.002;

    // Rotate planets on their axes
    planet_sun.rotation.y += 0.001;
    planet_mercury.rotation.y += 0.01;
    planet_venus.rotation.y -= 0.002;
    planet_earth.rotation.y += 0.05;
    planet_mars.rotation.y += 0.05;
    planet_jupiter.rotation.y += 0.3;
    planet_saturn.rotation.y += 0.15;
    planet_uranus.rotation.y -= 0.2;
    planet_neptune.rotation.y += 0.15;

    // Update revolution angles
    revolutionAngles.mercury += deltaTime * 4.15 * speed_index;
    revolutionAngles.venus += deltaTime * 1.62 * speed_index;
    revolutionAngles.earth += deltaTime * 1.0 * speed_index;
    revolutionAngles.mars += deltaTime * 0.53 * speed_index;
    revolutionAngles.jupiter += deltaTime * 0.084 * speed_index;
    revolutionAngles.saturn += deltaTime * 0.034 * speed_index;
    revolutionAngles.uranus += deltaTime * 0.0119 * speed_index;
    revolutionAngles.neptune += deltaTime * 0.0061 * speed_index;


    // Update planet positions using stored angles
    planet_mercury.position.x =
      orbitRadii.mercury * Math.cos(revolutionAngles.mercury);
    planet_mercury.position.z =
      orbitRadii.mercury * Math.sin(revolutionAngles.mercury);

    planet_venus.position.x =
      orbitRadii.venus * Math.cos(revolutionAngles.venus);
    planet_venus.position.z =
      orbitRadii.venus * Math.sin(revolutionAngles.venus);

    planet_earth.position.x =
      orbitRadii.earth * Math.cos(revolutionAngles.earth);
    planet_earth.position.z =
      orbitRadii.earth * Math.sin(revolutionAngles.earth);

    planet_mars.position.x = orbitRadii.mars * Math.cos(revolutionAngles.mars);
    planet_mars.position.z = orbitRadii.mars * Math.sin(revolutionAngles.mars);

    planet_jupiter.position.x =
      orbitRadii.jupiter * Math.cos(revolutionAngles.jupiter);
    planet_jupiter.position.z =
      orbitRadii.jupiter * Math.sin(revolutionAngles.jupiter);

    planet_saturn.position.x =
      orbitRadii.saturn * Math.cos(revolutionAngles.saturn);
    planet_saturn.position.z =
      orbitRadii.saturn * Math.sin(revolutionAngles.saturn);

    planet_uranus.position.x =
      orbitRadii.uranus * Math.cos(revolutionAngles.uranus);
    planet_uranus.position.z =
      orbitRadii.uranus * Math.sin(revolutionAngles.uranus);

    planet_neptune.position.x =
      orbitRadii.neptune * Math.cos(revolutionAngles.neptune);
    planet_neptune.position.z =
      orbitRadii.neptune * Math.sin(revolutionAngles.neptune);
  }
  if (isFollowingPlanet && targetPlanet) {
    // Offset vector in world space (e.g., 20 units in front of the planet)
    const directionToPlanet = targetPlanet.position
      .clone()
      .normalize()
      .negate(); // opposite direction from center
    const offset = directionToPlanet.multiplyScalar(20); // distance from planet

    // Desired camera position
    const desiredPosition = targetPlanet.position.clone().add(offset);

    // Smooth transition
    camera.position.lerp(desiredPosition, 0.1);

    // Always look at the planet's world position (not affected by its rotation)
    camera.lookAt(targetPlanet.position);
  }




  if (earthMaterial) {
    earthMaterial.uniforms.lightDirection.value.copy(
      planet_sun.position.clone().sub(planet_earth.position).normalize()
    );
  }

  controls.update();
  renderer.render(scene, camera);
}


init();
animate(lastTime);

const playButton = document.getElementById("playButton");
if (playButton) {
  playButton.addEventListener("click", () => {
    isPlaying = !isPlaying;
    playButton.textContent = isPlaying ? "⏸️ Pause" : "▶️ Play";
    if (sound && sound.buffer) {
      if (isPlaying && !sound.isPlaying) sound.play();
      else if (!isPlaying && sound.isPlaying) sound.pause();
    }
  });
} else {
  console.warn("Play button not found!");
}

const resetViewBtn = document.getElementById("resetView");
if (resetViewBtn) {
  resetViewBtn.addEventListener("click", () => {
    isFollowingPlanet = false;
    targetPlanet = null;

    // Move camera back to default position
    camera.position.set(0, 50, 250);
    camera.lookAt(scene.position);

    // Optional: reset OrbitControls as well
    controls.target.set(0, 0, 0);
    controls.update();
  });
} else {
  console.warn("Reset View button not found!");
}




