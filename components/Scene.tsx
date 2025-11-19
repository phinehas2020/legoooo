
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Canvas, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';

import { BrickData, BrickType, ToolMode, BrickDims } from '../types';
import { PLATE_HEIGHT, STUD_SIZE, STUD_HEIGHT } from '../constants';
import Brick3D from './Brick3D';

interface SceneProps {
  bricks: BrickData[];
  setBricks: React.Dispatch<React.SetStateAction<BrickData[]>>;
  selectedColor: string;
  selectedBrickType: BrickType;
  toolMode: ToolMode;
  lockedLayer: number | null;
  setLockedLayer: React.Dispatch<React.SetStateAction<number | null>>;
  definitions: Record<string, BrickDims>;
}

const Scene: React.FC<SceneProps> = ({ 
  bricks, 
  setBricks, 
  selectedColor, 
  selectedBrickType, 
  toolMode,
  lockedLayer,
  setLockedLayer,
  definitions
}) => {
  const [hoverPos, setHoverPos] = useState<[number, number, number] | null>(null);
  const [rotationIndex, setRotationIndex] = useState(0); // 0: 0deg, 1: 90deg
  
  // Store the last raycast hit to re-calculate position when keys are pressed
  const lastHitRef = useRef<{ point: THREE.Vector3, normal: THREE.Vector3, objectName: string } | null>(null);
  // Keep track of the ghost's Y so we can start a lock from current position
  const currentGhostY = useRef<number>(0);

  // Extrapolation state: remember the last valid "brick" interaction to extend its plane
  const lastValidBrickHit = useRef<{ point: THREE.Vector3, ghostY: number } | null>(null);

  // Handle key press for rotation and height offset
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        setRotationIndex(prev => (prev + 1) % 2);
      }
      
      const STEP = PLATE_HEIGHT;

      if (e.key === 'w' || e.key === 'W') {
        setLockedLayer(prev => {
          if (prev === null) {
            // Start lock from current ghost position + 1 step
            return currentGhostY.current + STEP;
          }
          return prev + STEP;
        });
      }
      if (e.key === 's' || e.key === 'S') {
         setLockedLayer(prev => {
          if (prev === null) {
            // Start lock from current ghost position - 1 step
            return currentGhostY.current - STEP;
          }
          return prev - STEP;
        });
      }
      if (e.key === 'Escape') {
        setLockedLayer(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setLockedLayer]);

  // Core logic to calculate where the brick should go
  const calculateGhostPosition = (
    point: THREE.Vector3, 
    normal: THREE.Vector3, 
    objectName: string,
    bType: BrickType,
    rot: number,
    forcedY: number | null
  ): [number, number, number] => {
    const x = point.x;
    const y = point.y;
    const z = point.z;

    const def = definitions[bType];
    if (!def) return [x, y, z]; // Should not happen

    const brickHeight = def.height;
    const isRotated = rot === 1;
    const effectiveW = isRotated ? def.depth : def.width;
    const effectiveD = isRotated ? def.width : def.depth;

    // Initial snapping for X/Z based on cursor and normal
    const nextX = x + normal.x * (STUD_SIZE / 2);
    const nextZ = z + normal.z * (STUD_SIZE / 2);
    
    let finalX = Math.round(nextX);
    let finalZ = Math.round(nextZ);
    let finalY = y;

    // Determine Y position (Height)
    if (forcedY !== null) {
      // Absolute override
      finalY = forcedY;
    } else {
      // Auto-snap logic
      if (objectName === 'ground') {
        finalY = brickHeight / 2;
        finalX = Math.round(x);
        finalZ = Math.round(z);
      } else {
        // Hit another brick
        if (normal.y > 0.9) {
          // Stacking ON TOP
          
          // Determine if we hit a stud (raised) or the flat surface
          // Studs are STUD_HEIGHT higher than the plate grid.
          const nearestFlat = Math.round(y / PLATE_HEIGHT) * PLATE_HEIGHT;
          const nearestStud = (Math.round((y - STUD_HEIGHT) / PLATE_HEIGHT) * PLATE_HEIGHT) + STUD_HEIGHT;
          
          // If the cursor Y is closer to a theoretical stud top than a flat surface,
          // we assume we are resting on a stud. We subtract STUD_HEIGHT to snap to the body.
          if (Math.abs(y - nearestStud) < Math.abs(y - nearestFlat)) {
            finalY = (y - STUD_HEIGHT) + brickHeight / 2;
          } else {
             // Resting on a flat surface (e.g. tile or brick edge)
            finalY = y + brickHeight / 2;
          }

        } else if (normal.y < -0.9) {
          // Stacking BELOW
          finalY = y - brickHeight / 2;
        } else {
          // Side placement - align to plate grid
          const snapY = PLATE_HEIGHT;
          finalY = (Math.floor(y / snapY) * snapY) + brickHeight / 2;
        }
      }
    }

    // Adjust centering for even-sized bricks so they snap between studs
    if (effectiveW % 2 === 0) {
      if (Math.floor(finalX) === finalX) finalX += 0.5;
    }
    if (effectiveD % 2 === 0) {
      if (Math.floor(finalZ) === finalZ) finalZ += 0.5;
    }

    return [finalX, finalY, finalZ];
  };

  // Effect to update ghost immediately when Rotation or Locked Layer changes
  useEffect(() => {
    if (lastHitRef.current && toolMode === ToolMode.BUILD) {
      const { point, normal, objectName } = lastHitRef.current;
      const newPos = calculateGhostPosition(point, normal, objectName, selectedBrickType, rotationIndex, lockedLayer);
      setHoverPos(newPos);
      currentGhostY.current = newPos[1];
    }
  }, [rotationIndex, lockedLayer, selectedBrickType, toolMode, definitions]);

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    
    if (toolMode !== ToolMode.BUILD) {
      setHoverPos(null);
      lastHitRef.current = null;
      return;
    }

    let hitPoint = e.point.clone();
    let hitNormal = e.face?.normal?.clone() || new THREE.Vector3(0, 1, 0);
    let hitObject = e.object.name;
    let overrideY: number | null = null;

    // --- Extrapolation Logic ---
    // If we slip off a brick onto the ground, check if we should maintain the previous brick's level
    if (hitObject === 'ground' && lastValidBrickHit.current) {
      const lastHit = lastValidBrickHit.current;
      const ray = e.ray;
      
      // Intersect ray with a horizontal plane at the ghost's center height
      // We assume the "plane of interest" is at the height of the last successful ghost position
      const planeY = lastHit.ghostY;
      
      // Basic ray-plane intersection: P = O + t*D
      // P.y = planeY => planeY = O.y + t*D.y => t = (planeY - O.y) / D.y
      const t = (planeY - ray.origin.y) / ray.direction.y;

      if (t > 0) {
        const intersectPoint = new THREE.Vector3().copy(ray.origin).add(ray.direction.clone().multiplyScalar(t));
        
        // Check distance to the point on the brick we were just hovering
        const dist = new THREE.Vector2(intersectPoint.x - lastHit.point.x, intersectPoint.z - lastHit.point.z).length();

        // Threshold: 3 studs radius allows for comfortable edge placement without jumping to floor too easily
        if (dist < 3.0) {
          hitPoint = intersectPoint;
          hitNormal = new THREE.Vector3(0, 1, 0); // Treat as flat top surface
          overrideY = planeY; // We will force this height
          
          // Visually we are hitting the "ground" object, but logically we are extending the previous brick
          // So we pass a dummy object name to avoid the specific 'ground' snapping logic in calculateGhostPosition
          hitObject = 'extrapolated_plane'; 
        }
      }
    }

    // Update ref for rotation updates
    lastHitRef.current = { 
      point: hitPoint, 
      normal: hitNormal, 
      objectName: hitObject 
    };

    const pos = calculateGhostPosition(
      hitPoint, 
      hitNormal, 
      hitObject, 
      selectedBrickType, 
      rotationIndex, 
      lockedLayer ?? overrideY // Use overrideY if lockedLayer is null
    );

    setHoverPos(pos);
    currentGhostY.current = pos[1];

    // Update the validity cache
    // If we are hovering a real brick (not ground, not extrapolated), save state
    if (e.object.name !== 'ground') {
       lastValidBrickHit.current = {
         point: e.point.clone(),
         ghostY: pos[1]
       };
    } else if (hitObject === 'extrapolated_plane') {
       // If we are extrapolating, keep updating the point so we can chain along the edge?
       // Or keep the anchor at the original brick?
       // It feels better to keep the anchor at the original brick to prevent drifting too far into void.
       // So we DO NOT update lastValidBrickHit here.
    } else {
      // We hit actual ground far away
      lastValidBrickHit.current = null;
    }

  }, [toolMode, selectedBrickType, rotationIndex, lockedLayer, definitions]);

  const handleClick = (e: ThreeEvent<MouseEvent>, brickId?: string) => {
    // Prevent accidental placement when dragging (rotating camera)
    if (e.delta > 10) return;

    e.stopPropagation();

    if (toolMode === ToolMode.DELETE && brickId) {
      setBricks(prev => prev.filter(b => b.id !== brickId));
      return;
    }

    if (toolMode === ToolMode.PAINT && brickId) {
      setBricks(prev => prev.map(b => b.id === brickId ? { ...b, color: selectedColor } : b));
      return;
    }

    if (toolMode === ToolMode.BUILD && hoverPos) {
      const newBrick: BrickData = {
        id: uuidv4(),
        type: selectedBrickType,
        position: hoverPos,
        rotation: rotationIndex,
        color: selectedColor
      };
      setBricks(prev => [...prev, newBrick]);
      
      // Reset the plane lock after placing
      setLockedLayer(null);
    }
  };

  const ghost = toolMode === ToolMode.BUILD && hoverPos ? {
    id: 'ghost',
    type: selectedBrickType,
    position: hoverPos,
    rotation: rotationIndex,
    color: selectedColor,
  } : null;

  return (
    <div className="w-full h-full cursor-crosshair">
      <Canvas shadows camera={{ position: [10, 8, 10], fov: 45 }}>
        <color attach="background" args={['#1a1a2e']} />
        
        {/* Lighting */}
        <ambientLight intensity={0.7} />
        <pointLight position={[20, 30, 20]} intensity={1} castShadow />
        <pointLight position={[-10, 10, -10]} intensity={0.5} color="#00fff5" />
        
        {/* Environment for reflections */}
        <Environment preset="city" />

        {/* Controls */}
        <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2 - 0.1} />

        {/* Ground */}
        <mesh 
          name="ground" 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, 0, 0]} 
          receiveShadow
          onPointerMove={handlePointerMove}
          onClick={(e) => handleClick(e)}
        >
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#16213e" roughness={0.8} />
        </mesh>
        <Grid position={[0, 0.01, 0]} args={[50, 50]} cellSize={1} cellThickness={0.6} cellColor="#e94560" sectionSize={5} sectionThickness={1.2} sectionColor="#00fff5" fadeDistance={25} />

        {/* Bricks */}
        {bricks.map(brick => (
          <Brick3D 
            key={brick.id} 
            data={brick} 
            definitions={definitions}
            onClick={handleClick}
            onPointerMove={handlePointerMove}
            onPointerOver={(e) => {
              if(toolMode !== ToolMode.BUILD) document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => document.body.style.cursor = 'auto'}
          />
        ))}

        {/* Ghost Brick */}
        {ghost && <Brick3D data={ghost} definitions={definitions} isGhost />}
        
        <ContactShadows position={[0, 0.01, 0]} opacity={0.4} scale={40} blur={2} far={4} />
      </Canvas>
    </div>
  );
};

export default Scene;
