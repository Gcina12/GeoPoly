import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const MAX_VISIBLE_SOLDIERS = 12;

function createSoldier(color, facing, position) {
  const soldier = new THREE.Group();
  soldier.position.copy(position);
  soldier.rotation.y = facing > 0 ? Math.PI / 2 : -Math.PI / 2;
  soldier.userData.idleOffset = Math.random() * Math.PI * 2;

  const uniform = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
  const webbing = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.72), roughness: 0.95 });
  const armor = new THREE.MeshStandardMaterial({ color: '#4b5143', roughness: 0.84 });
  const skin = new THREE.MeshStandardMaterial({ color: ['#75452f', '#996044', '#b87955', '#c98c68'][Math.floor(Math.random() * 4)], roughness: 0.85 });
  const weapon = new THREE.MeshStandardMaterial({ color: '#252a28', metalness: 0.48, roughness: 0.54 });
  const helmet = new THREE.MeshStandardMaterial({ color: '#85856b', roughness: 0.8 });
  const boot = new THREE.MeshStandardMaterial({ color: '#282723', roughness: 0.95 });

  const addMesh = (geometry, material, x, y, z, rotation = null) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    if (rotation) mesh.rotation.set(...rotation);
    mesh.castShadow = true;
    soldier.add(mesh);
    return mesh;
  };
  const addLimb = (start, end, radius, material) => {
    const from = new THREE.Vector3(...start);
    const to = new THREE.Vector3(...end);
    const direction = to.clone().sub(from);
    const limb = addMesh(
      new THREE.CapsuleGeometry(radius, Math.max(0.04, direction.length() - radius * 2), 3, 6),
      material,
      ...from.clone().add(to).multiplyScalar(0.5).toArray()
    );
    limb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    addMesh(new THREE.SphereGeometry(radius * 1.03, 7, 5), material, ...to.toArray());
  };

  addMesh(new THREE.CapsuleGeometry(0.16, 0.37, 4, 8), uniform, 0, 0.91, 0);
  addMesh(new THREE.SphereGeometry(0.105, 10, 8), skin, 0, 1.22, 0.015);
  addMesh(new THREE.SphereGeometry(0.13, 10, 7, 0, Math.PI * 2, 0, Math.PI * 0.59), helmet, 0, 1.28, 0);
  addMesh(new THREE.CylinderGeometry(0.14, 0.16, 0.035, 10), helmet, 0, 1.235, 0.015);
  addMesh(new THREE.BoxGeometry(0.12, 0.035, 0.012), weapon, 0, 1.22, 0.11);

  addMesh(new THREE.BoxGeometry(0.29, 0.32, 0.2), armor, 0, 0.91, 0.13);
  addMesh(new THREE.BoxGeometry(0.31, 0.09, 0.19), webbing, 0, 0.73, 0.12);
  for (const pouchX of [-0.105, 0, 0.105]) {
    addMesh(new THREE.BoxGeometry(0.075, 0.1, 0.065), webbing, pouchX, 0.84, 0.24);
  }
  addMesh(new THREE.BoxGeometry(0.22, 0.28, 0.16), webbing, 0, 0.94, -0.15);
  addMesh(new THREE.BoxGeometry(0.08, 0.28, 0.045), armor, -0.19, 0.94, 0.08);
  addMesh(new THREE.BoxGeometry(0.08, 0.28, 0.045), armor, 0.19, 0.94, 0.08);

  for (const side of [-1, 1]) {
    addLimb([side * 0.085, 0.47, 0], [side * 0.09, 0.18, 0.015], 0.065, uniform);
    addMesh(new THREE.BoxGeometry(0.1, 0.09, 0.2), boot, side * 0.09, 0.09, 0.075);
    addMesh(new THREE.BoxGeometry(0.09, 0.14, 0.09), webbing, side * 0.16, 0.71, 0.07);
  }
  addMesh(new THREE.BoxGeometry(0.32, 0.08, 0.12), uniform, 0, 0.49, 0);

  addLimb([-0.16, 1.03, 0.035], [-0.11, 0.79, 0.2], 0.055, uniform);
  addLimb([0.16, 1.03, 0.035], [0.105, 0.79, 0.2], 0.055, uniform);
  addMesh(new THREE.SphereGeometry(0.055, 7, 5), skin, -0.11, 0.79, 0.22);
  addMesh(new THREE.SphereGeometry(0.055, 7, 5), skin, 0.105, 0.79, 0.22);

  addMesh(new THREE.BoxGeometry(0.055, 0.055, 0.42), weapon, 0, 0.79, 0.39);
  addMesh(new THREE.BoxGeometry(0.075, 0.09, 0.14), weapon, 0, 0.75, 0.18);
  addMesh(new THREE.BoxGeometry(0.065, 0.13, 0.07), boot, 0, 0.69, 0.37);
  addMesh(new THREE.BoxGeometry(0.09, 0.035, 0.11), armor, 0, 0.84, 0.4);

  return soldier;
}

function createGroundTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  context.fillStyle = '#655b48';
  context.fillRect(0, 0, 512, 512);

  for (let index = 0; index < 2800; index += 1) {
    const shade = Math.random() > 0.5 ? 105 : 35;
    context.fillStyle = `rgba(${shade + 40}, ${shade + 32}, ${shade + 18}, ${Math.random() * 0.18})`;
    const size = 1 + Math.random() * 5;
    context.fillRect(Math.random() * 512, Math.random() * 512, size, size * 0.65);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 2);
  return texture;
}

function createTracer(scene, start, end, color) {
  const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 1 });
  const line = new THREE.Line(geometry, material);
  line.userData.startedAt = performance.now();
  scene.add(line);
  return line;
}

export default function Battlefield3D({
  attacker,
  defender,
  attackerCount,
  defenderCount,
  casualtyEvent
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const unitsRef = useRef({ attacker: [], defender: [] });
  const activeUnitsRef = useRef({ attacker: 0, defender: 0 });
  const tracersRef = useRef([]);
  const casualtyEventRef = useRef(casualtyEvent?.id);
  const initialCountsRef = useRef({ attackerCount, defenderCount });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 4.1, 10.8);
    camera.lookAt(0, 0.78, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.domElement.className = 'block h-full w-full';
    container.replaceChildren(renderer.domElement);

    scene.add(new THREE.HemisphereLight('#e5efff', '#24241d', 2.2));
    const keyLight = new THREE.DirectionalLight('#ffe3b2', 3.4);
    keyLight.position.set(-4, 8, 6);
    keyLight.castShadow = true;
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight('#83d7ff', 1.8);
    rimLight.position.set(5, 4, -5);
    scene.add(rimLight);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 16),
      new THREE.MeshStandardMaterial({ map: createGroundTexture(), color: '#c2b49a', roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.03;
    ground.receiveShadow = true;
    scene.add(ground);

    const rocksMaterial = new THREE.MeshStandardMaterial({ color: '#504b3f', roughness: 1 });
    for (let index = 0; index < 20; index += 1) {
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.08 + Math.random() * 0.16, 0),
        rocksMaterial
      );
      rock.position.set(
        (Math.random() - 0.5) * 18,
        0.025,
        (Math.random() - 0.5) * 9 + 3
      );
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.scale.y = 0.45 + Math.random() * 0.5;
      rock.castShadow = true;
      scene.add(rock);
    }

    const attackerUnits = [];
    const defenderUnits = [];
    const makeFormation = (side, color, facing) => {
      const units = [];
      for (let index = 0; index < MAX_VISIBLE_SOLDIERS; index += 1) {
        const row = Math.floor(index / 6);
        const column = index % 6;
        const x = side === 'attacker' ? -4.1 + row * 0.68 : 4.1 - row * 0.68;
        const z = (column - 2.5) * 0.65;
        const unit = createSoldier(color, facing, new THREE.Vector3(x, 0, z));
        unit.visible = false;
        scene.add(unit);
        units.push(unit);
      }
      return units;
    };

    attackerUnits.push(...makeFormation('attacker', '#228c74', 1));
    defenderUnits.push(...makeFormation('defender', '#a84943', -1));

    const separator = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.03, 9),
      new THREE.MeshBasicMaterial({ color: '#efb177', transparent: true, opacity: 0.4 })
    );
    separator.position.set(0, 0, 0);
    scene.add(separator);

    sceneRef.current = scene;
    unitsRef.current = { attacker: attackerUnits, defender: defenderUnits };
    activeUnitsRef.current = {
      attacker: Math.min(initialCountsRef.current.attackerCount, MAX_VISIBLE_SOLDIERS),
      defender: Math.min(initialCountsRef.current.defenderCount, MAX_VISIBLE_SOLDIERS)
    };

    const resize = () => {
      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);
      camera.aspect = width / height;
      camera.position.z = width < 600 ? 13.5 : 10.8;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    let frameId;
    const animate = now => {
      const elapsed = now * 0.001;
      for (const [side, units] of Object.entries(unitsRef.current)) {
        units.forEach((unit, index) => {
          unit.visible = index < activeUnitsRef.current[side] || Boolean(unit.userData.falling);
          if (unit.userData.falling) {
            unit.rotation.z += unit.userData.fallDirection * 0.11;
            unit.position.y = Math.max(-0.15, unit.position.y - 0.055);
            unit.traverse(child => {
              if (child.isMesh) child.material.transparent = true;
              if (child.isMesh && child.material.opacity > 0.08) child.material.opacity -= 0.035;
            });
            if (unit.position.y <= -0.14) {
              unit.userData.falling = false;
              unit.visible = false;
            }
          } else if (unit.visible) {
            unit.position.y = Math.sin(elapsed * 2 + unit.userData.idleOffset) * 0.025;
          }
        });
      }

      tracersRef.current = tracersRef.current.filter(tracer => {
        const progress = (now - tracer.userData.startedAt) / 260;
        if (progress >= 1) {
          scene.remove(tracer);
          tracer.geometry.dispose();
          tracer.material.dispose();
          return false;
        }
        tracer.material.opacity = 1 - progress;
        return true;
      });
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      renderer.dispose();
      renderer.domElement.remove();
      scene.traverse(object => {
        object.geometry?.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach(material => {
            material.map?.dispose();
            material.dispose();
          });
        } else {
          object.material?.map?.dispose();
          object.material?.dispose();
        }
      });
      sceneRef.current = null;
      unitsRef.current = { attacker: [], defender: [] };
      tracersRef.current = [];
    };
  }, [attacker.id, defender.id]);

  useEffect(() => {
    if (!casualtyEvent || casualtyEvent.id === casualtyEventRef.current) return;
    casualtyEventRef.current = casualtyEvent.id;

    const scene = sceneRef.current;
    if (!scene) return;

    const attackerLost = Math.min(casualtyEvent.attackerLosses, activeUnitsRef.current.attacker);
    const defenderLost = Math.min(casualtyEvent.defenderLosses, activeUnitsRef.current.defender);
    const attackerUnits = unitsRef.current.attacker;
    const defenderUnits = unitsRef.current.defender;
    const now = performance.now();

    const fireAt = (targets, lossCount, shooter, color) => {
      for (let index = 0; index < lossCount; index += 1) {
        const target = targets[Math.max(0, activeUnitsRef.current[shooter === 'attacker' ? 'defender' : 'attacker'] - 1 - index)];
        const source = shooter === 'attacker' ? attackerUnits[0] : defenderUnits[0];
        if (!target || !source) continue;

        const start = source.position.clone().add(new THREE.Vector3(shooter === 'attacker' ? 0.55 : -0.55, 0.8, 0));
        const end = target.position.clone().add(new THREE.Vector3(0, 0.8, 0));
        const tracer = createTracer(scene, start, end, color);
        tracer.userData.startedAt = now + index * 24;
        tracersRef.current.push(tracer);
        target.userData.falling = true;
        target.userData.fallDirection = shooter === 'attacker' ? 1 : -1;
      }
    };

    fireAt(attackerUnits, attackerLost, 'defender', '#ff7b61');
    fireAt(defenderUnits, defenderLost, 'attacker', '#f9d66b');

    activeUnitsRef.current.attacker -= attackerLost;
    activeUnitsRef.current.defender -= defenderLost;
  }, [casualtyEvent]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-transparent">
      <div ref={mountRef} role="img" aria-label={`3D battlefield: ${attacker.name} (${attackerCount} troops) and ${defender.name} (${defenderCount} troops) facing off`} className="h-full min-h-[260px] w-full" />
    </div>
  );
}
