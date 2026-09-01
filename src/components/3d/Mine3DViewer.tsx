import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Equipment, RiskLevel } from '../../types/mining';
import { 
  Eye, 
  Layers, 
  Compass, 
  Maximize2, 
  RotateCcw, 
  Radio, 
  ShieldAlert, 
  Crosshair,
  CloudSun,
  Video,
  Navigation
} from 'lucide-react';

interface Mine3DViewerProps {
  equipments: Equipment[];
  selectedEquipmentId: string | null;
  onSelectEquipment: (id: string) => void;
  weatherCondition?: string;
  isSimulating?: boolean;
}

export const Mine3DViewer: React.FC<Mine3DViewerProps> = ({
  equipments,
  selectedEquipmentId,
  onSelectEquipment,
  weatherCondition = 'CLEAR',
  isSimulating = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Vehicle meshes mapping
  const vehicleMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const haloMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const lidarConesRef = useRef<Map<string, THREE.Group>>(new Map());
  const dustParticlesRef = useRef<THREE.Points | null>(null);

  // Camera control state
  const [cameraMode, setCameraMode] = useState<'ORBIT' | 'TOP_DOWN' | 'FOLLOW' | 'HOTSPOT'>('ORBIT');
  const [showLidarCones, setShowLidarCones] = useState(true);
  const [showSafetyHalos, setShowSafetyHalos] = useState(true);
  const [showBenches, setShowBenches] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [isDusty, setIsDusty] = useState(weatherCondition === 'DUST_STORM' || weatherCondition === 'HEAVY_FOG');

  // Mouse drag tracking for orbit camera
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const sphericalCoordsRef = useRef({ radius: 380, theta: Math.PI / 4, phi: Math.PI / 3.2 });
  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(50, 0, 0));

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1120); // Dark slate mine sky
    scene.fog = new THREE.FogExp2(0x0f172a, 0.0018);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(48, width / height, 1, 3000);
    updateCameraPosition(camera, sphericalCoordsRef.current, cameraTargetRef.current);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 0.75); // Warm desert sunlight ambient
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffedd5, 1.6);
    sunLight.position.set(400, 600, 300);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 100;
    sunLight.shadow.camera.far = 1500;
    sunLight.shadow.camera.left = -500;
    sunLight.shadow.camera.right = 500;
    sunLight.shadow.camera.top = 500;
    sunLight.shadow.camera.bottom = -500;
    scene.add(sunLight);

    const blueHemisphere = new THREE.HemisphereLight(0x38bdf8, 0x78350f, 0.4);
    scene.add(blueHemisphere);

    // Build Open-Pit Terraced Benches (Geometría del Tajo de Explotación)
    buildTerracedOpenPit(scene);

    // Build Dust Particle System
    buildDustParticles(scene);

    // Raycaster for clicking vehicles
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isDraggingRef.current = true;
        previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handlePointerMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      sphericalCoordsRef.current.theta -= deltaX * 0.005;
      sphericalCoordsRef.current.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, sphericalCoordsRef.current.phi - deltaY * 0.005));

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: MouseEvent) => {
      isDraggingRef.current = false;

      // Click detection for vehicle selection
      if (!containerRef.current || !cameraRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current);
      const interactiveObjects: THREE.Object3D[] = [];
      vehicleMeshesRef.current.forEach((group) => {
        group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            interactiveObjects.push(child);
          }
        });
      });

      const intersects = raycaster.intersectObjects(interactiveObjects);
      if (intersects.length > 0) {
        let current: THREE.Object3D | null = intersects[0].object;
        while (current && !current.userData.equipmentId && current.parent) {
          current = current.parent;
        }
        if (current?.userData?.equipmentId) {
          onSelectEquipment(current.userData.equipmentId);
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      sphericalCoordsRef.current.radius = Math.max(80, Math.min(1100, sphericalCoordsRef.current.radius + e.deltaY * 0.4));
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    domElement.addEventListener('wheel', handleWheel, { passive: false });

    // Resize handler with ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0 && rendererRef.current && cameraRef.current) {
          cameraRef.current.aspect = newW / newH;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(containerRef.current);

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Camera update based on mode
      if (cameraRef.current) {
        if (cameraMode === 'FOLLOW' && selectedEquipmentId) {
          const selectedMesh = vehicleMeshesRef.current.get(selectedEquipmentId);
          if (selectedMesh) {
            cameraTargetRef.current.lerp(selectedMesh.position, 0.05);
          }
        }
        updateCameraPosition(cameraRef.current, sphericalCoordsRef.current, cameraTargetRef.current);
      }

      // Rotate/pulse LiDAR scanning cones & halos
      lidarConesRef.current.forEach((coneGroup) => {
        coneGroup.rotation.y = Math.sin(elapsedTime * 4) * 0.45;
      });

      haloMeshesRef.current.forEach((halo, eqId) => {
        const eq = equipments.find(e => e.id === eqId);
        if (eq && (eq.currentPrediction.riskLevel === 'CRITICAL' || eq.currentPrediction.riskLevel === 'HIGH')) {
          const pulse = 1.0 + Math.sin(elapsedTime * 7) * 0.18;
          halo.scale.set(pulse, 1, pulse);
        }
      });

      // Animate dust particles
      if (dustParticlesRef.current) {
        const positions = (dustParticlesRef.current.geometry as THREE.BufferGeometry).attributes.position;
        for (let i = 0; i < positions.count; i++) {
          let y = positions.getY(i);
          let x = positions.getX(i);
          y -= 0.15;
          x += Math.sin(elapsedTime + i) * 0.08;
          if (y < -80) y = 140;
          positions.setY(i, y);
          positions.setX(i, x);
        }
        positions.needsUpdate = true;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      domElement.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      domElement.removeEventListener('wheel', handleWheel);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, []);

  // Update camera coordinates
  function updateCameraPosition(
    camera: THREE.PerspectiveCamera, 
    spherical: { radius: number; theta: number; phi: number }, 
    target: THREE.Vector3
  ) {
    camera.position.x = target.x + spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
    camera.position.y = target.y + spherical.radius * Math.cos(spherical.phi);
    camera.position.z = target.z + spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
    camera.lookAt(target);
  }

  // Create Terraced Open Pit Mine Model
  function buildTerracedOpenPit(scene: THREE.Scene) {
    const pitGroup = new THREE.Group();
    pitGroup.name = 'OpenPitTerrain';

    // Concentric Benches (Bancos de explotación)
    const benchLevels = [
      { radiusTop: 520, radiusBottom: 460, height: 28, yPos: 90, color: 0xb45309 }, // Banco 3600 (Top)
      { radiusTop: 450, radiusBottom: 390, height: 28, yPos: 62, color: 0x92400e }, // Banco 3500
      { radiusTop: 380, radiusBottom: 310, height: 28, yPos: 34, color: 0x78350f }, // Banco 3400 (Pala)
      { radiusTop: 300, radiusBottom: 220, height: 28, yPos: 6, color: 0x854d0e },  // Banco 3300 (Hilux)
      { radiusTop: 210, radiusBottom: 120, height: 28, yPos: -22, color: 0x713f12 }, // Banco 3200 (Curva Ciega HT-104)
      { radiusTop: 110, radiusBottom: 30, height: 28, yPos: -50, color: 0x451a03 },  // Fondo de Tajo 3100
    ];

    benchLevels.forEach((bench, index) => {
      // Sloped bench wall
      const wallGeom = new THREE.CylinderGeometry(bench.radiusTop, bench.radiusBottom, bench.height, 64, 2, true);
      const wallMat = new THREE.MeshStandardMaterial({
        color: bench.color,
        roughness: 0.92,
        metalness: 0.08,
        flatShading: true,
      });
      const wallMesh = new THREE.Mesh(wallGeom, wallMat);
      wallMesh.position.y = bench.yPos;
      wallMesh.receiveShadow = true;
      pitGroup.add(wallMesh);

      // Flat bench roadway (berma de transporte)
      const roadInner = bench.radiusBottom - 4;
      const roadOuter = bench.radiusTop + 8;
      const ringGeom = new THREE.RingGeometry(roadInner, roadOuter, 64);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0x475569, // Asfalto compactado de acarreo
        roughness: 0.85,
        metalness: 0.1,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = bench.yPos - bench.height / 2;
      ringMesh.receiveShadow = true;
      pitGroup.add(ringMesh);

      // Safety Berms (Bermas de seguridad de 2.5m)
      const bermGeom = new THREE.TorusGeometry((roadInner + roadOuter) / 2 + 18, 1.4, 8, 48);
      const bermMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.9 });
      const bermMesh = new THREE.Mesh(bermGeom, bermMat);
      bermMesh.rotation.x = Math.PI / 2;
      bermMesh.position.y = bench.yPos - bench.height / 2 + 1.2;
      pitGroup.add(bermMesh);
    });

    // Haulage Spiral Ramp connecting benches
    const rampCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(420, 85, 120),
      new THREE.Vector3(340, 55, 260),
      new THREE.Vector3(120, 25, 340),
      new THREE.Vector3(-220, -5, 240),
      new THREE.Vector3(-180, -35, -120),
      new THREE.Vector3(50, -50, -50),
    ]);
    const rampGeom = new THREE.TubeGeometry(rampCurve, 80, 8, 12, false);
    const rampMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const rampMesh = new THREE.Mesh(rampGeom, rampMat);
    rampMesh.position.y = 1;
    rampMesh.receiveShadow = true;
    pitGroup.add(rampMesh);

    // Primary Crusher Plant Structure (Chancador Primario en Banco Superior)
    const crusherGroup = new THREE.Group();
    crusherGroup.position.set(-380, 105, -280);
    const crusherBuilding = new THREE.Mesh(
      new THREE.BoxGeometry(45, 35, 60),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.4 })
    );
    crusherBuilding.position.y = 17.5;
    crusherGroup.add(crusherBuilding);

    const hopper = new THREE.Mesh(
      new THREE.ConeGeometry(18, 16, 8),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4, metalness: 0.3 })
    );
    hopper.rotation.x = Math.PI;
    hopper.position.set(0, 38, 0);
    crusherGroup.add(hopper);

    pitGroup.add(crusherGroup);

    // Grid helper on bottom
    const grid = new THREE.GridHelper(1200, 40, 0xd97706, 0x1e293b);
    grid.position.y = -65;
    pitGroup.add(grid);

    scene.add(pitGroup);
  }

  // Dust particles for adverse weather simulation
  function buildDustParticles(scene: THREE.Scene) {
    const particleCount = 1200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 900;
      positions[i + 1] = Math.random() * 180 - 60;
      positions[i + 2] = (Math.random() - 0.5) * 900;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xd97706,
      size: 3.5,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    dustParticlesRef.current = particles;
    scene.add(particles);
  }

  // Synchronize 3D Vehicle Models with Live Equipment State
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    equipments.forEach((eq) => {
      let vehicleGroup = vehicleMeshesRef.current.get(eq.id);

      if (!vehicleGroup) {
        vehicleGroup = createVehicle3DModel(eq);
        vehicleGroup.userData = { equipmentId: eq.id };
        scene.add(vehicleGroup);
        vehicleMeshesRef.current.set(eq.id, vehicleGroup);

        // Safety Dynamic Halo
        const haloGeom = new THREE.RingGeometry(16, 20, 36);
        const haloMat = new THREE.MeshBasicMaterial({
          color: getRiskColorHex(eq.currentPrediction.riskLevel),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.75,
        });
        const haloMesh = new THREE.Mesh(haloGeom, haloMat);
        haloMesh.rotation.x = Math.PI / 2;
        haloMesh.position.y = 0.5;
        vehicleGroup.add(haloMesh);
        haloMeshesRef.current.set(eq.id, haloMesh);

        // LiDAR Scanning Cone
        const lidarGroup = createLidarScanningCone(eq);
        vehicleGroup.add(lidarGroup);
        lidarConesRef.current.set(eq.id, lidarGroup);
      }

      // Smoothly update 3D position
      const targetX = eq.position.easting;
      const targetZ = eq.position.northing;
      const targetY = (eq.position.elevation ? (eq.position.elevation - 3200) * 0.4 : 0) + 2;

      vehicleGroup.position.set(targetX, targetY, targetZ);
      vehicleGroup.rotation.y = (-eq.position.headingDeg * Math.PI) / 180;

      // Update Halo Color & Visibility
      const halo = haloMeshesRef.current.get(eq.id);
      if (halo) {
        (halo.material as THREE.MeshBasicMaterial).color.setHex(getRiskColorHex(eq.currentPrediction.riskLevel));
        halo.visible = showSafetyHalos;
      }

      // Update LiDAR Visibility
      const lidarCone = lidarConesRef.current.get(eq.id);
      if (lidarCone) {
        lidarCone.visible = showLidarCones;
      }
    });
  }, [equipments, showSafetyHalos, showLidarCones]);

  // Create Vehicle 3D Model Geometry
  function createVehicle3DModel(eq: Equipment): THREE.Group {
    const group = new THREE.Group();

    if (eq.type === 'HAUL_TRUCK_MANUAL' || eq.type === 'HAUL_TRUCK_AHS') {
      // Massive CAT 797F / Komatsu 930E
      // Main Chassis
      const chassis = new THREE.Mesh(
        new THREE.BoxGeometry(14, 6, 22),
        new THREE.MeshStandardMaterial({ color: eq.isAutonomous ? 0x2563eb : 0xca8a04, roughness: 0.4, metalness: 0.5 })
      );
      chassis.position.y = 6;
      chassis.castShadow = true;
      group.add(chassis);

      // Dump Bed (Tolva)
      const dumpBed = new THREE.Mesh(
        new THREE.BoxGeometry(15, 7, 20),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8, metalness: 0.3 })
      );
      dumpBed.position.set(0, 11, -2);
      dumpBed.castShadow = true;
      group.add(dumpBed);

      // Operator Cabin / Autonomous Dome
      if (eq.isAutonomous) {
        // Autonomous AHS Sensor Dome
        const dome = new THREE.Mesh(
          new THREE.SphereGeometry(2.2, 16, 16),
          new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, metalness: 0.8, emissive: 0x0284c7, emissiveIntensity: 0.5 })
        );
        dome.position.set(0, 12, 7);
        group.add(dome);

        // Antenna
        const antenna = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.2, 5),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        antenna.position.set(0, 15, 7);
        group.add(antenna);
      } else {
        // Manual Operator Cabin (Side cab)
        const cab = new THREE.Mesh(
          new THREE.BoxGeometry(4.5, 4.5, 5.5),
          new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.1 })
        );
        cab.position.set(-4.5, 11, 6.5);
        cab.castShadow = true;
        group.add(cab);
      }

      // 6 Massive 4-Meter Mining Tires
      const tireGeom = new THREE.CylinderGeometry(4.2, 4.2, 3.2, 24);
      const tireMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.95 });
      const tirePositions = [
        [-6.8, 4.2, 7], [6.8, 4.2, 7],
        [-7.2, 4.2, -4], [7.2, 4.2, -4],
        [-7.2, 4.2, -8], [7.2, 4.2, -8],
      ];

      tirePositions.forEach(([x, y, z]) => {
        const tire = new THREE.Mesh(tireGeom, tireMat);
        tire.rotation.z = Math.PI / 2;
        tire.position.set(x, y, z);
        tire.castShadow = true;
        group.add(tire);
      });
    } else if (eq.type === 'SHOVEL') {
      // P&H 4100XPC Electric Rope Shovel
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(24, 16, 26),
        new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4, metalness: 0.4 })
      );
      body.position.y = 12;
      body.castShadow = true;
      group.add(body);

      // Boom & Bucket arm
      const boom = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 2.2, 32),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6 })
      );
      boom.rotation.x = -Math.PI / 3.2;
      boom.position.set(0, 22, 14);
      group.add(boom);

      // Crawler Tracks
      const trackL = new THREE.Mesh(new THREE.BoxGeometry(6, 6, 30), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
      trackL.position.set(-11, 3, 0);
      const trackR = trackL.clone();
      trackR.position.set(11, 3, 0);
      group.add(trackL, trackR);
    } else {
      // Light Pickup Truck (Hilux)
      const truckBody = new THREE.Mesh(
        new THREE.BoxGeometry(5.5, 3.2, 11),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
      );
      truckBody.position.y = 2.4;
      truckBody.castShadow = true;
      group.add(truckBody);

      // 4.2m Mining Safety Pole with Flashing Amber LED
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 8.5),
        new THREE.MeshBasicMaterial({ color: 0x94a3b8 })
      );
      pole.position.set(2, 7, -3);
      group.add(pole);

      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xf59e0b })
      );
      beacon.position.set(2, 11.2, -3);
      group.add(beacon);
    }

    return group;
  }

  // Create LiDAR Visual Scanning Fan Cone
  function createLidarScanningCone(eq: Equipment): THREE.Group {
    const group = new THREE.Group();
    const coneGeom = new THREE.ConeGeometry(24, 48, 16, 1, true, -Math.PI / 3, (2 * Math.PI) / 3);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      wireframe: true,
    });
    const coneMesh = new THREE.Mesh(coneGeom, coneMat);
    coneMesh.rotation.x = Math.PI / 2;
    coneMesh.position.set(0, 6, 26);
    group.add(coneMesh);

    return group;
  }

  function getRiskColorHex(level: RiskLevel): number {
    switch (level) {
      case 'CRITICAL': return 0xef4444; // Red
      case 'HIGH': return 0xf97316;     // Orange
      case 'MEDIUM': return 0xeab308;   // Yellow
      case 'LOW': return 0x10b981;      // Emerald
    }
  }

  // Camera presets
  const handleResetCamera = () => {
    sphericalCoordsRef.current = { radius: 380, theta: Math.PI / 4, phi: Math.PI / 3.2 };
    cameraTargetRef.current.set(50, 0, 0);
    setCameraMode('ORBIT');
  };

  const handleTopDownCamera = () => {
    sphericalCoordsRef.current = { radius: 520, theta: 0, phi: 0.05 };
    cameraTargetRef.current.set(50, 0, 0);
    setCameraMode('TOP_DOWN');
  };

  const handleFocusHotspot = () => {
    const criticalEq = equipments.find(e => e.currentPrediction.riskLevel === 'CRITICAL') || equipments[0];
    if (criticalEq) {
      onSelectEquipment(criticalEq.id);
      cameraTargetRef.current.set(criticalEq.position.easting, 0, criticalEq.position.northing);
      sphericalCoordsRef.current = { radius: 140, theta: Math.PI / 3, phi: Math.PI / 3.5 };
      setCameraMode('HOTSPOT');
    }
  };

  return (
    <div className="relative w-full h-full min-h-[500px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full flex-1 cursor-grab active:cursor-grabbing" />

      {/* Top Floating Controls Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        {/* Status Pill */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3.5 py-1.5 rounded-full flex items-center gap-2.5 shadow-lg pointer-events-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-semibold text-slate-200 tracking-wide">
            GEMELO DIGITAL 3D EN VIVO (1 Hz GNSS + LiDAR)
          </span>
          <span className="text-[11px] font-mono bg-slate-800 text-amber-400 px-2 py-0.5 rounded-full font-medium">
            {equipments.length} EQUIPOS
          </span>
        </div>

        {/* Camera Views Quick Switch */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-1.5 rounded-xl shadow-lg pointer-events-auto">
          <button
            id="btn-cam-orbit"
            onClick={handleResetCamera}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              cameraMode === 'ORBIT' ? 'bg-amber-500 text-slate-950 font-semibold shadow' : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Vista Libre Orbital 3D"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Órbita</span>
          </button>

          <button
            id="btn-cam-topdown"
            onClick={handleTopDownCamera}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              cameraMode === 'TOP_DOWN' ? 'bg-amber-500 text-slate-950 font-semibold shadow' : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Vista Cenital 2D GIS"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Cenital 2D</span>
          </button>

          <button
            id="btn-cam-hotspot"
            onClick={handleFocusHotspot}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              cameraMode === 'HOTSPOT' ? 'bg-rose-500 text-white font-semibold shadow animate-pulse' : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Enfocar Zona de Riesgo Crítico"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
            <span>Foco Riesgo</span>
          </button>
        </div>
      </div>

      {/* Bottom Layer Toggles & Legend */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none z-10">
        {/* Layer Toggles */}
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-1.5 rounded-xl shadow-lg pointer-events-auto">
          <button
            id="btn-toggle-lidar"
            onClick={() => setShowLidarCones(!showLidarCones)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              showLidarCones ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Haz LiDAR</span>
          </button>

          <button
            id="btn-toggle-halos"
            onClick={() => setShowSafetyHalos(!showSafetyHalos)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              showSafetyHalos ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Halos de Seguridad</span>
          </button>
        </div>

        {/* Risk Color Legend */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3.5 py-2 rounded-xl flex items-center gap-3 text-xs shadow-lg pointer-events-auto">
          <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">Nivel de Riesgo:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-300">Bajo (&lt;0.3)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span className="text-slate-300">Medio</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span className="text-slate-300">Alto</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-rose-400 font-bold">Crítico (≥0.8)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
