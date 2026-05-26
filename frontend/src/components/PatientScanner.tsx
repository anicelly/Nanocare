import { useEffect, useRef } from "react";
import * as THREE from "three";

type BodyKind = "female" | "male";

const bodyConfigs: Record<
  BodyKind,
  {
    label: string;
    x: number;
    shoulder: number;
    waist: number;
    hip: number;
    height: number;
    color: number;
    heartX: number;
    chestY: number;
  }
> = {
  female: {
    label: "Feminino",
    x: -1.55,
    shoulder: 0.48,
    waist: 0.34,
    hip: 0.62,
    height: 1.04,
    color: 0x9ef7ff,
    heartX: -0.16,
    chestY: 1.18,
  },
  male: {
    label: "Masculino",
    x: 1.55,
    shoulder: 0.58,
    waist: 0.48,
    hip: 0.5,
    height: 1.08,
    color: 0x75eaff,
    heartX: -0.18,
    chestY: 1.2,
  },
};

export function PatientScanner() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0.35, 8.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const disposableMeshes: THREE.Object3D[] = [];
    const disposableMaterials: THREE.Material[] = [];

    const glass = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
    });
    disposableMaterials.push(glass);

    const red = new THREE.MeshBasicMaterial({
      color: 0xff315e,
      wireframe: true,
      transparent: true,
      opacity: 0.78,
    });
    disposableMaterials.push(red);

    const bodies = (Object.keys(bodyConfigs) as BodyKind[]).map((kind) =>
      createHumanBody(kind, red, disposableMeshes, disposableMaterials),
    );
    bodies.forEach((body) => scene.add(body.group));

    const scannerRing = new THREE.Mesh(new THREE.TorusGeometry(2.85, 0.012, 14, 150), glass);
    scannerRing.rotation.x = Math.PI / 2;
    scene.add(scannerRing);
    disposableMeshes.push(scannerRing);

    const scanPlane = new THREE.Mesh(new THREE.PlaneGeometry(5.7, 0.055), glass);
    scene.add(scanPlane);
    disposableMeshes.push(scanPlane);

    const frame = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(6.5, 5.4, 1.8)),
      new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.24 }),
    );
    scene.add(frame);
    disposableMeshes.push(frame);

    const divider = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -2.6, 0), new THREE.Vector3(0, 2.6, 0)]),
      new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.18 }),
    );
    scene.add(divider);
    disposableMeshes.push(divider);

    const resize = () => {
      const rect = mount.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / Math.max(rect.height, 1);
      camera.updateProjectionMatrix();
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const time = performance.now() / 1000;

      bodies.forEach((body, index) => {
        body.group.rotation.y = Math.sin(time * 0.65 + index) * 0.16;
        body.heart.scale.setScalar(1 + Math.sin(time * 5 + index) * 0.14);
      });

      scannerRing.position.y = Math.sin(time * 1.35) * 1.75;
      scannerRing.rotation.z += 0.025;
      scanPlane.position.y = Math.sin(time * 1.85) * 2.15;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      renderer.dispose();
      disposableMeshes.forEach((object) => {
        if ("geometry" in object && object.geometry instanceof THREE.BufferGeometry) {
          object.geometry.dispose();
        }
      });
      disposableMaterials.forEach((material) => material.dispose());
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="relative h-full min-h-[460px] overflow-hidden rounded-lg border border-cyan-200/15 bg-black/35">
      <div ref={mountRef} className="absolute inset-0" aria-label="Scanner 3D de pacientes feminino e masculino" />
      <div className="pointer-events-none absolute inset-x-4 top-4 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
        <span>AI Body Scanner</span>
        <span>Scan duplo ativo</span>
      </div>
      <div className="pointer-events-none absolute inset-x-5 top-12 grid grid-cols-2 gap-4 text-xs font-black uppercase tracking-[0.16em] text-cyan-50">
        <span>Paciente feminino</span>
        <span className="text-right">Paciente masculino</span>
      </div>
      <div className="pointer-events-none absolute inset-x-4 bottom-4 grid gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-200 sm:grid-cols-4">
        <span className="rounded-md border border-cyan-200/15 bg-black/45 px-2 py-2">F: cardio alerta</span>
        <span className="rounded-md border border-cyan-200/15 bg-black/45 px-2 py-2">F: SpO2 82%</span>
        <span className="rounded-md border border-cyan-200/15 bg-black/45 px-2 py-2">M: pulmao ok</span>
        <span className="rounded-md border border-cyan-200/15 bg-black/45 px-2 py-2">M: risco 37%</span>
      </div>
    </div>
  );
}

function createHumanBody(
  kind: BodyKind,
  alertMaterial: THREE.Material,
  disposableMeshes: THREE.Object3D[],
  disposableMaterials: THREE.Material[],
) {
  const config = bodyConfigs[kind];
  const body = new THREE.Group();
  body.position.x = config.x;
  body.scale.setScalar(config.height);

  const material = new THREE.MeshBasicMaterial({
    color: config.color,
    wireframe: false,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  disposableMaterials.push(material);
  const lineMaterial = new THREE.LineBasicMaterial({
    color: config.color,
    transparent: true,
    opacity: 0.92,
  });
  disposableMaterials.push(lineMaterial);

  const addMesh = (mesh: THREE.Mesh) => {
    body.add(mesh);
    disposableMeshes.push(mesh);
    return mesh;
  };

  const head = addMesh(new THREE.Mesh(new THREE.SphereGeometry(0.31, 22, 16), material));
  head.position.y = 2.18;
  addHeadDetails(body, lineMaterial, disposableMeshes);

  const neck = addMesh(new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.22, 6, 10), material));
  neck.position.y = 1.78;

  const chest = addMesh(new THREE.Mesh(new THREE.CapsuleGeometry(config.shoulder, 0.76, 8, 18), material));
  chest.position.y = config.chestY;
  chest.scale.set(kind === "female" ? 0.74 : 1.02, 0.88, 0.5);

  const abdomen = addMesh(new THREE.Mesh(new THREE.CapsuleGeometry(config.waist, 0.72, 8, 16), material));
  abdomen.position.y = 0.52;
  abdomen.scale.set(0.76, 0.9, 0.5);

  const pelvis = addMesh(new THREE.Mesh(new THREE.CapsuleGeometry(config.hip, 0.28, 8, 16), material));
  pelvis.position.y = -0.1;
  pelvis.rotation.z = Math.PI / 2;
  pelvis.scale.z = 0.55;

  const heart = addMesh(new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), alertMaterial));
  heart.position.set(config.heartX, 1.28, 0.43);

  const shoulderY = 1.46;
  addArmOpen(body, material, lineMaterial, disposableMeshes, -1, config.shoulder, shoulderY);
  addArmOpen(body, material, lineMaterial, disposableMeshes, 1, config.shoulder, shoulderY);
  addLimb(body, material, disposableMeshes, -0.22, -0.94, 0.05, "leg");
  addLimb(body, material, disposableMeshes, 0.22, -0.94, -0.05, "leg");

  addLine(body, lineMaterial, disposableMeshes, [
    [-config.shoulder, 1.48, 0.18],
    [-config.waist, 0.46, 0.2],
    [-config.hip, -0.2, 0.18],
    [-0.24, -0.45, 0.16],
    [-0.18, -1.68, 0.12],
    [-0.1, -2.05, 0.1],
  ]);
  addLine(body, lineMaterial, disposableMeshes, [
    [config.shoulder, 1.48, 0.18],
    [config.waist, 0.46, 0.2],
    [config.hip, -0.2, 0.18],
    [0.24, -0.45, 0.16],
    [0.18, -1.68, 0.12],
    [0.1, -2.05, 0.1],
  ]);
  addRibCage(body, lineMaterial, disposableMeshes, config.shoulder, config.waist);
  addPelvisLines(body, lineMaterial, disposableMeshes, config.hip);

  const spine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 1.68, 0.18),
      new THREE.Vector3(0, 0.86, 0.18),
      new THREE.Vector3(0, 0.03, 0.18),
    ]),
    lineMaterial,
  );
  body.add(spine);
  disposableMeshes.push(spine);

  return { group: body, heart };
}

function addLine(
  body: THREE.Group,
  material: THREE.Material,
  disposableMeshes: THREE.Object3D[],
  points: Array<[number, number, number]>,
) {
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points.map(([x, y, z]) => new THREE.Vector3(x, y, z))),
    material,
  );
  body.add(line);
  disposableMeshes.push(line);
}

function addHeadDetails(body: THREE.Group, material: THREE.Material, disposableMeshes: THREE.Object3D[]) {
  addLine(body, material, disposableMeshes, [
    [-0.13, 2.2, 0.32],
    [-0.05, 2.18, 0.35],
    [-0.13, 2.16, 0.32],
  ]);
  addLine(body, material, disposableMeshes, [
    [0.13, 2.2, 0.32],
    [0.05, 2.18, 0.35],
    [0.13, 2.16, 0.32],
  ]);
  addLine(body, material, disposableMeshes, [
    [-0.1, 2.03, 0.34],
    [0, 1.98, 0.36],
    [0.1, 2.03, 0.34],
  ]);
}

function addRibCage(
  body: THREE.Group,
  material: THREE.Material,
  disposableMeshes: THREE.Object3D[],
  shoulder: number,
  waist: number,
) {
  [1.28, 1.14, 1.0, 0.86, 0.72].forEach((y, index) => {
    const width = shoulder * (0.74 - index * 0.055);
    const drop = 0.08 + index * 0.025;
    addLine(body, material, disposableMeshes, [
      [0, y, 0.3],
      [-width, y - drop, 0.25],
      [-waist * 0.48, y - drop * 1.8, 0.22],
    ]);
    addLine(body, material, disposableMeshes, [
      [0, y, 0.3],
      [width, y - drop, 0.25],
      [waist * 0.48, y - drop * 1.8, 0.22],
    ]);
  });
  addLine(body, material, disposableMeshes, [
    [-shoulder * 0.85, 1.48, 0.24],
    [shoulder * 0.85, 1.48, 0.24],
  ]);
}

function addPelvisLines(
  body: THREE.Group,
  material: THREE.Material,
  disposableMeshes: THREE.Object3D[],
  hip: number,
) {
  addLine(body, material, disposableMeshes, [
    [-hip * 0.7, -0.12, 0.24],
    [0, -0.34, 0.28],
    [hip * 0.7, -0.12, 0.24],
  ]);
  addLine(body, material, disposableMeshes, [
    [-hip * 0.48, -0.28, 0.24],
    [hip * 0.48, -0.28, 0.24],
  ]);
}

function addArmOpen(
  body: THREE.Group,
  material: THREE.Material,
  lineMaterial: THREE.Material,
  disposableMeshes: THREE.Object3D[],
  side: -1 | 1,
  shoulder: number,
  shoulderY: number,
) {
  const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.8, 6, 12), material);
  upperArm.position.set(side * (shoulder + 0.42), shoulderY - 0.04, 0.08);
  upperArm.rotation.z = Math.PI / 2 + side * 0.08;
  body.add(upperArm);
  disposableMeshes.push(upperArm);

  const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.78, 6, 12), material);
  forearm.position.set(side * (shoulder + 1.18), shoulderY - 0.16, 0.08);
  forearm.rotation.z = Math.PI / 2 + side * 0.2;
  body.add(forearm);
  disposableMeshes.push(forearm);

  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.105, 12, 8), material);
  hand.position.set(side * (shoulder + 1.62), shoulderY - 0.29, 0.09);
  hand.scale.set(1.25, 0.72, 0.5);
  body.add(hand);
  disposableMeshes.push(hand);

  addLine(body, lineMaterial, disposableMeshes, [
    [side * shoulder, shoulderY + 0.02, 0.22],
    [side * (shoulder + 0.78), shoulderY - 0.06, 0.24],
    [side * (shoulder + 1.46), shoulderY - 0.23, 0.22],
  ]);
}

function addLimb(
  body: THREE.Group,
  material: THREE.Material,
  disposableMeshes: THREE.Object3D[],
  x: number,
  y: number,
  zRotation: number,
  type: "arm" | "leg",
) {
  const length = type === "arm" ? 1.15 : 1.42;
  const radius = type === "arm" ? 0.085 : 0.12;
  const limb = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 6, 12), material);
  limb.position.set(x, y, 0.1);
  limb.rotation.z = zRotation;
  limb.rotation.x = type === "arm" ? 0.08 : 0;
  body.add(limb);
  disposableMeshes.push(limb);
}
