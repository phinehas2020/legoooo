
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
  const isWindow = def.shape === 'window';
  const isDoor = def.shape === 'door';

  // Generate Stud Positions
  const studs = useMemo(() => {
    if (!hasStuds) return [];

    const positions: [number, number, number][] = [];
    
    const startX = -width / 2 + STUD_SIZE / 2;
    const startZ = -depth / 2 + STUD_SIZE / 2;

    // Only place studs on the "frame" parts if it's a window/door
    // For simplicity, we put studs on all top positions for now, 
    // or we could skip the middle ones for large windows if we wanted to be super precise.
    // But LEGO windows often have studs on top of the frame.

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

  // Glass material for windows
  const glassMaterial = useMemo(() => {
     return new THREE.MeshStandardMaterial({
       color: '#a5f3fc',
       transparent: true,
       opacity: isGhost ? 0.3 : 0.5,
       roughness: 0.0,
       metalness: 0.8,
       emissive: '#a5f3fc',
       emissiveIntensity: 0.1
     });
  }, [isGhost]);

  // Helper to ignore raycast if ghost
  const raycastProps = isGhost ? { raycast: () => null } : {};

  // Geometry logic for special shapes
  const renderShape = () => {
    if (isCylinder) {
      return (
        <mesh 
          castShadow={!isGhost} 
          receiveShadow 
          material={material}
          {...raycastProps}
        >
          <cylinderGeometry args={[width / 2 - 0.02, width / 2 - 0.02, height, 32]} />
        </mesh>
      );
    }
    
    if (isWindow) {
      const frameThickness = 0.2;
      return (
        <group>
          {/* Top Bar */}
          <mesh position={[0, height/2 - frameThickness/2, 0]} castShadow receiveShadow material={material} {...raycastProps}>
             <boxGeometry args={[width - 0.02, frameThickness, depth - 0.02]} />
          </mesh>
          {/* Bottom Bar */}
          <mesh position={[0, -height/2 + frameThickness/2, 0]} castShadow receiveShadow material={material} {...raycastProps}>
             <boxGeometry args={[width - 0.02, frameThickness, depth - 0.02]} />
          </mesh>
          {/* Left Pillar */}
          <mesh position={[-width/2 + frameThickness/2, 0, 0]} castShadow receiveShadow material={material} {...raycastProps}>
             <boxGeometry args={[frameThickness, height - 0.02, depth - 0.02]} />
          </mesh>
          {/* Right Pillar */}
          <mesh position={[width/2 - frameThickness/2, 0, 0]} castShadow receiveShadow material={material} {...raycastProps}>
             <boxGeometry args={[frameThickness, height - 0.02, depth - 0.02]} />
          </mesh>
          {/* Glass Pane */}
          <mesh position={[0, 0, 0]} material={glassMaterial} {...raycastProps}>
             <boxGeometry args={[width - frameThickness*2, height - frameThickness*2, 0.1]} />
          </mesh>
        </group>
      );
    }

    if (isDoor) {
      const frameThickness = 0.3;
      return (
        <group>
          {/* Top Bar */}
          <mesh position={[0, height/2 - frameThickness/2, 0]} castShadow receiveShadow material={material} {...raycastProps}>
             <boxGeometry args={[width - 0.02, frameThickness, depth - 0.02]} />
          </mesh>
          {/* Left Pillar */}
          <mesh position={[-width/2 + frameThickness/2, 0, 0]} castShadow receiveShadow material={material} {...raycastProps}>
             <boxGeometry args={[frameThickness, height - 0.02, depth - 0.02]} />
          </mesh>
          {/* Right Pillar */}
          <mesh position={[width/2 - frameThickness/2, 0, 0]} castShadow receiveShadow material={material} {...raycastProps}>
             <boxGeometry args={[frameThickness, height - 0.02, depth - 0.02]} />
          </mesh>
          {/* Door Panel (Glass Style) */}
          <mesh position={[0, -frameThickness/2, 0]} material={glassMaterial} {...raycastProps}>
             <boxGeometry args={[width - frameThickness*2, height - frameThickness, 0.1]} />
          </mesh>
        </group>
      );
    }

    // Standard Box
    return (
      <RoundedBox 
        args={[width - 0.02, height, depth - 0.02]} // Slightly smaller to see seams
        radius={0.05} // Rounded edges for realism
        smoothness={4}
        castShadow={!isGhost} 
        receiveShadow 
        material={material}
        {...raycastProps}
      />
    );
  };

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
      {renderShape()}

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