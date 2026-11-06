import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const FACE_VALUES = [3, 4, 1, 6, 2, 5];
const FACE_NORMALS = [
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(-1, 0, 0),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, -1, 0),
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(0, 0, -1)
];
function createFaceTexture(value, color, pipColor) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;

  const context = canvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, 256, 256);
  gradient.addColorStop(0, color.highlight);
  gradient.addColorStop(1, color.base);
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = color.edge;
  context.lineWidth = 8;
  context.strokeRect(12, 12, 232, 232);
  context.strokeStyle = 'rgba(255,255,255,.16)';
  context.lineWidth = 2;
  context.strokeRect(23, 23, 210, 210);

  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '900 156px Arial, sans-serif';
  context.lineJoin = 'round';
  context.lineWidth = 12;
  context.strokeStyle = 'rgba(10,18,24,.75)';
  context.strokeText(String(value), 128, 128);
  context.fillStyle = pipColor;
  context.shadowColor = 'rgba(0,0,0,.55)';
  context.shadowBlur = 8;
  context.shadowOffsetY = 5;
  context.fillText(String(value), 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function createDiceMaterials(isAttacker) {
  const color = isAttacker
    ? { base: '#a82f23', highlight: '#ed6844', edge: '#ffb36b', trim: '#e8a34c' }
    : { base: '#075887', highlight: '#29b8e4', edge: '#8de8ff', trim: '#9acbd7' };
  const pipColor = isAttacker ? '#fff1cf' : '#e5faff';

  return FACE_VALUES.map(value => new THREE.MeshPhysicalMaterial({
    map: createFaceTexture(value, color, pipColor),
    roughness: 0.24,
    metalness: 0.2,
    clearcoat: 0.85,
    clearcoatRoughness: 0.16,
    envMapIntensity: 1.1
  }));
}

export default function Dice3DCanvas({ rolls, isAttacker, onSettled }) {
  const mountRef = useRef(null);
  const onSettledRef = useRef(onSettled);

  useEffect(() => {
    onSettledRef.current = onSettled;
  }, [onSettled]);

  useEffect(() => {
    const container = mountRef.current;
    if (!rolls?.length || !container) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 100);
    camera.position.set(0, 0.1, 7.5);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.domElement.className = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.replaceChildren(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 2.2));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(-3, 5, 7);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(isAttacker ? 0xff8a4c : 0x43d7ff, 30, 18);
    rimLight.position.set(2, 2, 4);
    scene.add(rimLight);

    const trimGeometry = new RoundedBoxGeometry(1.45, 1.45, 1.45, 5, 0.16);
    const faceGeometry = new RoundedBoxGeometry(1.35, 1.35, 1.35, 5, 0.14);
    const color = isAttacker ? '#e8a34c' : '#9acbd7';
    const trimMaterial = new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.24,
      metalness: 0.82,
      clearcoat: 0.8
    });
    const materials = createDiceMaterials(isAttacker);
    const dice = rolls.map((value, index) => {
      const mesh = new THREE.Group();
      const trim = new THREE.Mesh(trimGeometry, trimMaterial);
      const faces = new THREE.Mesh(faceGeometry, materials);
      trim.castShadow = true;
      faces.castShadow = true;
      mesh.add(trim, faces);
      const spacing = rolls.length > 6 ? 1.3 : rolls.length > 2 ? 1.85 : 2.05;
      mesh.position.set((index - (rolls.length - 1) / 2) * spacing, 0.74, 0);
      mesh.rotation.set(
        (Math.random() - 0.5) * Math.PI * 2,
        (Math.random() - 0.5) * Math.PI * 2,
        (Math.random() - 0.5) * Math.PI * 2
      );

      const faceIndex = FACE_VALUES.indexOf(value);
      const targetRotation = new THREE.Quaternion().setFromUnitVectors(
        FACE_NORMALS[faceIndex],
        new THREE.Vector3(0, 0, 1)
      );
      scene.add(mesh);

      return {
        mesh,
        targetRotation,
        angularVelocity: new THREE.Vector3(
          (Math.random() * 2 + 5) * (Math.random() < 0.5 ? -1 : 1),
          (Math.random() * 2 + 5) * (Math.random() < 0.5 ? -1 : 1),
          (Math.random() * 2 + 3) * (Math.random() < 0.5 ? -1 : 1)
        ),
        verticalVelocity: 2.8 + Math.random() * 0.8
      };
    });

    let animationFrame;
    let previousTime = 0;
    let startedAt;
    let settled = false;
    const spinDuration = 820;
    const settleDuration = 360;

    const resizeRenderer = () => {
      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);
      camera.aspect = width / height;
      const diceSpacing = rolls.length > 6 ? 1.3 : rolls.length > 2 ? 1.85 : 2.05;
      const diceWidth = rolls.length * 1.45 + Math.max(0, rolls.length - 1) * (diceSpacing - 1.45);
      camera.position.z = Math.max(
        7.8,
        (diceWidth + 0.8) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * Math.max(camera.aspect, 0.7))
      );
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const resizeObserver = new ResizeObserver(resizeRenderer);
    resizeObserver.observe(container);
    resizeRenderer();

    const animate = now => {
      if (startedAt === undefined) startedAt = now;
      const delta = previousTime ? Math.min((now - previousTime) / 1000, 0.04) : 0;
      const elapsed = now - startedAt;
      previousTime = now;

      dice.forEach(die => {
        const { mesh, targetRotation, angularVelocity } = die;
        if (elapsed < spinDuration) {
          mesh.rotation.x += angularVelocity.x * delta;
          mesh.rotation.y += angularVelocity.y * delta;
          mesh.rotation.z += angularVelocity.z * delta;

          angularVelocity.multiplyScalar(Math.exp(-0.9 * delta));
          die.verticalVelocity -= 9.5 * delta;
          mesh.position.y += die.verticalVelocity * delta;
          if (mesh.position.y < 0.74) {
            mesh.position.y = 0.74;
            die.verticalVelocity *= -0.5;
          }
        } else {
          const progress = Math.min((elapsed - spinDuration) / settleDuration, 1);
          const eased = 1 - (1 - progress) ** 3;
          mesh.quaternion.slerp(targetRotation, eased);
          mesh.position.y += (0.74 - mesh.position.y) * eased;
        }
      });

      renderer.render(scene, camera);

      if (elapsed < spinDuration + settleDuration) {
        animationFrame = requestAnimationFrame(animate);
      } else if (!settled) {
        settled = true;
        onSettledRef.current?.();
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      trimGeometry.dispose();
      faceGeometry.dispose();
      trimMaterial.dispose();
      materials.forEach(material => {
        material.map.dispose();
        material.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [rolls, isAttacker]);

  return (
    <div
      ref={mountRef}
      className="my-0 h-24 w-full sm:h-28"
      role="img"
      aria-label={`${isAttacker ? 'Attacker' : 'Defender'} dice showing ${rolls?.join(', ')}`}
    />
  );
}
