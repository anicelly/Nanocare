import { useEffect, useRef } from "react";
import * as THREE from "three";

export function AiCore() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    camera.position.z = 4.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1, 2),
      new THREE.MeshBasicMaterial({
        color: 0x9eeeff,
        wireframe: true,
        transparent: true,
        opacity: 0.9,
      }),
    );
    scene.add(core);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(1.55, 0.01, 16, 120),
      new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.7 }),
    );
    scene.add(halo);

    const alertRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.02, 0.012, 16, 120),
      new THREE.MeshBasicMaterial({ color: 0xff315e, transparent: true, opacity: 0.5 }),
    );
    alertRing.rotation.x = Math.PI / 2.6;
    scene.add(alertRing);

    const resize = () => {
      const rect = mount.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / Math.max(rect.height, 1);
      camera.updateProjectionMatrix();
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      core.rotation.x += 0.006;
      core.rotation.y += 0.01;
      halo.rotation.z += 0.008;
      alertRing.rotation.z -= 0.006;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.dispose();
      core.geometry.dispose();
      halo.geometry.dispose();
      alertRing.geometry.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />;
}
