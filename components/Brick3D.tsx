
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { BrickData, BrickDims } from '../types';
import { STUD_HEIGHT, STUD_RADIUS, STUD_SIZE } from '../constants';

interface Brick3DProps {
  data: BrickData;
  definitions: Record<string, BrickDims>;
  onClick?: (e: THREE.ThreeEvent<MouseEvent>, brickId: string) => void;
  onPointerOver?: (e: THREE.ThreeEvent<MouseEvent>) => void;
  onPointerOut?: (e: THREE.ThreeEvent<MouseEvent>) => void;
  onPointerMove?: (e: THREE.ThreeEvent<PointerEvent>) => void;
  isGhost?: boolean;
  isExploding?: boolean;
}

const Brick3D: React.FC<Brick3DProps> = ({ 
  data, 
  definitions, 
  onClick, 
  onPointerOver, 
  onPointerOut, 
  onPointerMove, 
  isGhost,
  isExploding 
}) => {
  const groupRef = useRef<THREE.Group>(null);
  // Random explosion velocity vector calculated once per brick
  const velocity = useMemo(() => {
    if (!isExploding) return new THREE.Vector3(0,0,0);
    return new THREE.Vector3(
      (Math.random() - 0.5) * 1, 
      Math.random() * 1, 
      (Math.random() - 0.5) * 1
    );
  }, [isExploding]);

  const rotationVelocity = useMemo(() => {
    if (!isExploding) return new THREE.Vector3(0,0,0);
    return new THREE.Vector3(
      Math.random() * 0.2,
      Math.random() * 0.2,
      Math.random() * 0.2
    );
  }, [isExploding]);

  useFrame(() => {
    if (isExploding && groupRef.current) {
      groupRef.current.position.add(velocity);
      groupRef.current.rotation.x += rotationVelocity.x;
      groupRef.current.rotation.y += rotationVelocity.y;
      groupRef.current.rotation.z += rotationVelocity.z;
      // Add gravity effect
      velocity.y -= 0.02; 
    }
  });

  const def = definitions[data.type];
  
  // Fallback if definition is missing (e.g. if custom type was deleted but brick remains)
  if (!def) return null;

  const width = def.width * STUD_SIZE;
  const depth = def.depth * STUD_SIZE;
  const height = def.height;
  const hasStuds = def.hasStuds !== false; // Default to true if undefined
  const isCylinder = def.shape === 'cylinder';

  // Generate Stud Positions
  const studs = useMemo(() => {
    if (!hasStuds) return [];

    const positions: [number, number, number][] = [];
    
    const startX = -width / 2 + STUD_SIZE / 2;
    const startZ = -depth / 2 + STUD_SIZE / 2;

    for (let x = 0; x < def.width; x++) {
      for (let z = 0; z < def.depth; z++) {
        positions.push([
          startX + x * STUD_SIZE,
          height / 2 + STUD_HEIGHT / 2,
          startZ + z * STUD_SIZE
        ]);
      }
    }
    return positions;
  }, [def.width, def.depth, width, depth, height, hasStuds]);

  const meshColor = isGhost ? (data.color === '#ef4444' ? '#ffaaaa' : data.color) : data.color;
  const opacity = isGhost ? 0.6 : 1;
  const transparent = isGhost || data.color.length > 7; // Simple check for hex alpha or isGhost

  // High-quality plastic material
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: meshColor,
      roughness: hasStuds ? 0.15 : 0.1, // Tiles are often shinier
      metalness: 0.05,
      transparent,
      opacity,
      emissive: isGhost ? meshColor : '#000000',
      emissiveIntensity: isGhost ? 0.5 : 0,
    });
  }, [meshColor, transparent, opacity, isGhost, hasStuds]);

  // Helper to ignore raycast if ghost
  const raycastProps = isGhost ? { raycast: () => null } : {};

  return (
    <group
      ref={groupRef}
      position={data.position}
      rotation={[0, data.rotation * (Math.PI / 2), 0]}
      onClick={(e) => {
        // Only stop propagation if we are not a ghost (ghosts shouldn't receive clicks anyway due to raycast null)
        if (!isGhost && !isExploding) {
          e.stopPropagation();
          onClick && onClick(e, data.id);
        }
      }}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onPointerMove={onPointerMove}
    >
      {/* Main Block */}
      {isCylinder ? (
        <mesh 
          castShadow={!isGhost} 
          receiveShadow 
          material={material}
          {...raycastProps}
        >
          {/* Cylinder: Radius is half of width. Segments 32 for smoothness */}
          <cylinderGeometry args={[width / 2 - 0.02, width / 2 - 0.02, height, 32]} />
        </mesh>
      ) : (
        <RoundedBox 
          args={[width - 0.02, height, depth - 0.02]} // Slightly smaller to see seams
          radius={0.05} // Rounded edges for realism
          smoothness={4}
          castShadow={!isGhost} 
          receiveShadow 
          material={material}
          {...raycastProps}
        />
      )}

      {/* Studs */}
      {studs.map((pos, idx) => (
        <mesh 
          key={idx} 
          position={pos} 
          castShadow={!isGhost} 
          receiveShadow 
          material={material}
          {...raycastProps}
        >
          <cylinderGeometry args={[STUD_RADIUS, STUD_RADIUS, STUD_HEIGHT, 16]} />
        </mesh>
      ))}
    </group>
  );
};

export default Brick3D;
