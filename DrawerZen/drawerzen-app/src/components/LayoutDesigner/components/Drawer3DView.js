import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Drawer3DView
 * Props:
 * - drawerDimensions: { width, length, height }
 * - bins: array of { id, x, y, width, length, height, color, shadowBoard }
 * - selectedBinId: id of selected bin
 */
export default function Drawer3DView({ drawerDimensions, bins, selectedBinId, waveAnimation = false }) {
  // Memoize drawer size for scaling
  const drawerSize = useMemo(() => ({
    width: drawerDimensions?.width || 300,
    length: drawerDimensions?.length || 400,
    height: drawerDimensions?.height || 100,
  }), [drawerDimensions]);

  const defaultColorway = { bin: '#F5E6C8', bed: '#4A4A58' };
  // Colorways: [binColor, bedColor]
  const colorways = [
    { bin: '#F5E6C8', bed: '#4A4A58', id: 'cream' }, // Cream/tan bin, slate grey bed
    { bin: '#1A237E', bed: '#90CAF9', id: 'blue' }, // Dark blue bin, sky blue bed
    { bin: '#222', bed: '#B2FF59', id: 'black' }     // Black bin, lime green bed
  ];

  const Scene = () => {
    const liftRefs = useRef({});
    const groupRef = useRef();
    const waveRef = useRef({ x: 0, dir: 1, wait: 0 });
    const initializedRef = useRef(false);

    useFrame((_, delta) => {
      if (waveAnimation) {
        // Initialize wave start at left edge once
        if (!initializedRef.current) {
          waveRef.current.x = -drawerSize.width / 2;
          waveRef.current.dir = 1; // moving right
          waveRef.current.wait = 0;
          initializedRef.current = true;
        }
        const wave = waveRef.current;
        // Handle endpoint wait
        if (wave.wait > 0) {
          wave.wait -= delta * 1000; // wait in ms
          if (wave.wait < 0) wave.wait = 0;
        } else {
            const speedX = 100; // mm per second (additional 2x increase)
            wave.x += wave.dir * speedX * delta;
            const leftEdge = -drawerSize.width / 2;
            const rightEdge = drawerSize.width / 2;
            if (wave.x >= rightEdge) {
              wave.x = rightEdge;
              wave.dir = -1;
              wave.wait = 500; // ms
            } else if (wave.x <= leftEdge) {
              wave.x = leftEdge;
              wave.dir = 1;
              wave.wait = 500; // ms
            }
         }
         // Update each bin lift based on intersection
         bins.forEach(bin => {
           const ref = liftRefs.current[bin.id];
           if (!ref) return;
           const binMinX = bin.x - drawerSize.width / 2; // bin.x relative to drawer left edge
           const binMaxX = binMinX + bin.width;
           const intersects = waveRef.current.x >= binMinX && waveRef.current.x <= binMaxX;
           ref.userData.waveLift = ref.userData.waveLift ?? 0;
          const liftSpeed = 30; // mm per second (15x increase)
           if (intersects) {
             ref.userData.waveLift += liftSpeed * delta; // rise
           } else {
             ref.userData.waveLift -= liftSpeed * delta; // fall
           }
           if (ref.userData.waveLift < 0) ref.userData.waveLift = 0;
           ref.position.y = (bin.height / 2) + ref.userData.waveLift;
           ref.scale.set(1,1,1); // keep scale stable in wave mode
         });
      } else {
        // Original selection lift animation
        bins.forEach(bin => {
          const ref = liftRefs.current[bin.id];
          if (!ref) return;
          const isSelected = bin.id === selectedBinId;
          const target = isSelected ? 1 : 0;
          ref.userData.anim = ref.userData.anim ?? 0;
          ref.userData.anim += (target - ref.userData.anim) * 0.12;
          const animVal = ref.userData.anim;
          const liftAmount = bin.height * 4 * animVal + (animVal > 0 ? 20 * animVal : 0);
          ref.position.y = (bin.height / 2) + liftAmount;
          const s = 1 + 0.3 * animVal;
          ref.scale.set(s, s, s);
        });
        if (groupRef.current) {
          const anySelected = !!selectedBinId;
          groupRef.current.userData.anim = groupRef.current.userData.anim ?? 0;
          const target = anySelected ? 1 : 0;
          groupRef.current.userData.anim += (target - groupRef.current.userData.anim) * 0.12;
          const gAnim = groupRef.current.userData.anim;
          groupRef.current.position.y = -drawerSize.height * 0.15 * gAnim;
        }
      }
    });

    // Helper to render bins with matte-plastic look and colored bed
    const renderBins = () => bins.map(bin => {
      const colorway = bin.colorway ? (colorways.find(c => c.id === bin.colorway) || defaultColorway) : defaultColorway;
      const binMaterialProps = {
        color: colorway.bin,
        roughness: 0.8,
        clearcoat: 0.2,
        clearcoatRoughness: 0.7,
        metalness: 0.1,
        reflectivity: 0.2,
        opacity: bin.shadowBoard ? 0.85 : 1,
        transparent: !!bin.shadowBoard,
        sheen: 0.5,
        sheenColor: colorway.bin
      };
      const bedPosition = [
        bin.x + bin.width / 2 - drawerSize.width / 2,
        0.5,
        bin.y + bin.length / 2 - drawerSize.length / 2
      ];
      const wrapperX = bin.x + bin.width / 2 - drawerSize.width / 2;
      const wrapperZ = bin.y + bin.length / 2 - drawerSize.length / 2;
      return (
        <group key={bin.id}>
          {/* Bed */}
          <mesh position={bedPosition} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[bin.width, bin.length]} />
            <meshPhysicalMaterial color={colorway.bed} roughness={0.9} metalness={0.2} />
          </mesh>
          {/* Static position wrapper for X/Z so animation doesn't reset each render */}
          <group position={[wrapperX, 0, wrapperZ]}>
            <group ref={el => { if (el) liftRefs.current[bin.id] = el; }} position={[0, bin.height / 2, 0]}>
              {/* Outer shell */}
              <mesh castShadow receiveShadow>
                <boxGeometry args={[bin.width, bin.height, bin.length]} />
                <meshPhysicalMaterial {...binMaterialProps} />
              </mesh>
              {/* Inner cavity (slightly inset) */}
              <mesh position={[0, bin.height * 0.05, 0]}> {/* raise slightly inside */}
                <boxGeometry args={[bin.width - 4, bin.height * 0.6, bin.length - 4]} />
                <meshPhysicalMaterial color={colorway.bed} roughness={0.95} metalness={0} />
              </mesh>
            </group>
          </group>
        </group>
      );
    });

    return (
      <group ref={groupRef} position={[0, 0, 0]}>
        <mesh position={[0, drawerSize.height / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[drawerSize.width, drawerSize.height, drawerSize.length]} />
          <meshPhysicalMaterial color="#e0e0e0" opacity={0.14} transparent roughness={0.9} metalness={0.05} />
        </mesh>
        {renderBins()}
      </group>
    );
  };

  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #f5f5f5 70%, #e3f2fd 100%)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
        {/* Camera: further out for full drawer visibility */}
        <PerspectiveCamera makeDefault position={[drawerSize.width * 0.9, drawerSize.height * 2.4, drawerSize.length * 1.15]} fov={50} />
        <ambientLight intensity={0.85} />
        <directionalLight position={[120, 240, 160]} intensity={0.75} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        {/* Ground plane */}
        <mesh receiveShadow position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[drawerSize.width * 2, drawerSize.length * 2]} />
          <shadowMaterial opacity={0.15} />
        </mesh>
        <Scene />
        <OrbitControls enablePan={false} enableZoom={false} target={[0, drawerSize.height / 2, 0]} />
      </Canvas>
    </div>
  );
}
