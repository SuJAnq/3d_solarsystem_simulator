import * as THREE from "https://cdn.skypack.dev/three@0.129.0";

const planetInfo = {
  mercury: {
    name: "Mercury",
    diameter: "4,879 km",
    distance: "57.9 million km",
    rotationTime: "58.6 Earth days",
    revolutionTime: "88 Earth days",
  },
  venus: {
    name: "Venus",
    diameter: "12,104 km",
    distance: "108.2 million km",
    rotationTime: "243 Earth days (retrograde)",
    revolutionTime: "225 Earth days",
  },
  earth: {
    name: "Earth",
    diameter: "12,742 km",
    distance: "149.6 million km",
    rotationTime: "24 hours",
    revolutionTime: "365.25 days",
  },
  mars: {
    name: "Mars",
    diameter: "6,779 km",
    distance: "227.9 million km",
    rotationTime: "24.6 hours",
    revolutionTime: "687 Earth days",
  },
  jupiter: {
    name: "Jupiter",
    diameter: "139,820 km",
    distance: "778.5 million km",
    rotationTime: "9.9 hours",
    revolutionTime: "11.86 Earth years",
  },
  saturn: {
    name: "Saturn",
    diameter: "116,460 km",
    distance: "1.43 billion km",
    rotationTime: "10.7 hours",
    revolutionTime: "29.45 Earth years",
  },
  uranus: {
    name: "Uranus",
    diameter: "50,724 km",
    distance: "2.87 billion km",
    rotationTime: "17.2 hours (retrograde)",
    revolutionTime: "84 Earth years",
  },
  neptune: {
    name: "Neptune",
    diameter: "49,244 km",
    distance: "4.5 billion km",
    rotationTime: "16.1 hours",
    revolutionTime: "165 Earth years",
  },
  sun: {
    name: "Sun",
    diameter: "1.39 million km",
    distance: "0",
    rotationTime: "25 days (at equator)",
    revolutionTime: "-",
  },
};

export function setupPlanetInfoPopup(planets, camera, rendererDomElement) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const infoPopup = document.getElementById("infoPopup");

  function onClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planets);

    if (intersects.length > 0) {
      const clickedPlanet = intersects[0].object;
      const key = clickedPlanet.name?.toLowerCase();
      const info = planetInfo[key] || {
        name: "Unknown",
        diameter: "-",
        distance: "-",
        rotationTime: "-",
        revolutionTime: "-",
      };

      infoPopup.innerHTML = `
        <button style="position:absolute;top:5px;right:8px;background:none;border:none;font-size:16px;cursor:pointer;"
                onclick="document.getElementById('infoPopup').style.display='none'">✖</button>
        <h3>${info.name}</h3>
        <p><strong>Diameter:</strong> ${info.diameter}</p>
        <p><strong>Distance from Sun:</strong> ${info.distance}</p>
        <p><strong>Rotation Time:</strong> ${info.rotationTime}</p>
        <p><strong>Revolution Time:</strong> ${info.revolutionTime}</p>
      `;
      infoPopup.style.display = "block";
    } else {
      infoPopup.style.display = "none";
    }
  }

  rendererDomElement.addEventListener("click", onClick, false);
}

