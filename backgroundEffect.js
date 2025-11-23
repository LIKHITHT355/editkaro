// backgroundEffect.js - 3D white bubbles background disturbed on scrolling

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';

class ScrollDisturbedBubbles {
  constructor() {
    this.init();
    this.animate = this.animate.bind(this);
    this.scrollY = 0;
    this.animate();
  }

  init() {
    this.container = document.body;

    this.scene = new THREE.Scene();

    const fov = 75;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 1000;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.z = 80;

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0); // transparent bg

    this.container.appendChild(this.renderer.domElement);
    // Make sure the canvas covers entire viewport and is positioned behind other content
    this.renderer.domElement.style.position = 'fixed';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.width = '100vw';
    this.renderer.domElement.style.height = '100vh';
    this.renderer.domElement.style.zIndex = '-1';
    this.renderer.domElement.style.pointerEvents = 'none';

    // Create white bubble spheres particles
    this.bubbles = [];

    this.bubbleCount = 120;
    const geometry = new THREE.SphereGeometry(0.6, 16, 16);
    const material = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.15,
      shininess: 80,
      specular: 0xffffff,
    });

    for (let i = 0; i < this.bubbleCount; i++) {
      const bubble = new THREE.Mesh(geometry, material);
      bubble.position.x = (Math.random() - 0.5) * 400;
      bubble.position.y = (Math.random() - 0.5) * 300;
      bubble.position.z = (Math.random() - 0.5) * 200;
      bubble.userData.basePosition = bubble.position.clone();
      this.bubbles.push(bubble);
      this.scene.add(bubble);
    }

    // Add gentle directional light for specular highlights
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(0, 50, 100);
    this.scene.add(directionalLight);

    // Ambient light for subtle base illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    window.addEventListener('resize', this.onWindowResize.bind(this));
    window.addEventListener('scroll', this.onScroll.bind(this));
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onScroll() {
    this.scrollY = window.scrollY || 0;
  }

  animate() {
    requestAnimationFrame(this.animate);

    // Simulate bubbles disturbed by scroll by oscillating around base positions
    const time = performance.now() * 0.001;

    this.bubbles.forEach((bubble, idx) => {
      const base = bubble.userData.basePosition;
      // Disturbance parameters based on scrollY, sine waves with phase offset for natural motion
      const disturbanceAmplitude = 10 + Math.sin(this.scrollY * 0.02) * 5;
      const disturbanceX = Math.sin(time + idx) * disturbanceAmplitude * 0.1;
      const disturbanceY = Math.cos(time * 1.3 + idx) * disturbanceAmplitude * 0.1;

      bubble.position.x = base.x + disturbanceX;
      bubble.position.y = base.y + disturbanceY;
    });

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new ScrollDisturbedBubbles();
});
