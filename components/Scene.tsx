
import React, { useState, useRef, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Canvas, ThreeEvent, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';

import { BrickData, BrickType, ToolMode, BrickDims } from '../types';
import { PLATE_HEIGHT, STUD_SIZE, STUD_HEIGHT } from '../constants';
import Brick3D from './Brick3D';
import { playSound } from '../utils/audio';

// Helper component to access the GL context for screenshots
const ScreenshotHandler = forwardRef((props, ref) => {
  const { gl, scene, camera } = useThree();
  
  useImperativeHandle(ref, () => ({
    capture: () => {
      gl.render(scene, camera);
      return gl.domElement.toDataURL('image/png');
    }
  }));
  return null;
});

interface SceneProps {
  bricks: BrickData[];
  setBricks: React.Dispatch<React.SetStateAction<BrickData[]>>;
  selectedColor: string;
  selectedBrickType: BrickType;
  toolMode: ToolMode;
  lockedLayer: number | null;
  setLockedLayer: React.Dispatch<React.SetStateAction<number | null>>;
  definitions: Record<string, BrickDims>;
  sceneActionRef: React.MutableRefObject<any>;
  isExploding: boolean;
}

const Scene: React.FC<SceneProps> = ({ 
  bricks, 
  setBricks, 
  selectedColor, 
  selectedBrickType, 
  toolMode,
  lockedLayer,
  setLockedLayer,
  definitions,
  sceneActionRef,
  isExploding
}) => {
  const [hoverPos, setHoverPos] = useState<[number, number, number] | null>(null);
  const [rotationIndex, setRotationIndex] = useState(0); // 0: 0deg, 1: 90deg
  const [manualOffset, setManualOffset] = useState<{x: number, z: number}>({x: 0, z: 0});
  
  // Store the last raycast hit to re-calculate position when keys are pressed
  const lastHitRef = useRef<{ point: THREE.Vector3, normal: THREE.Vector3, objectName: string } | null>(null);
  // Keep track of the ghost's Y so we can start a lock from current position
  const currentGhostY = useRef<number>(0);

  // Ref for OrbitControls
  const controlsRef = useRef<any>(null);

  // Extrapolation state
  const lastValidBrickHit = useRef<{ point: THREE.Vector3, ghostY: number } | null>(null);

  // Ref to hold current state for event listeners so we don't need to re-bind them
  const stateRef = useRef({
    toolMode,
    hoverPos,
    selectedBrickType,
    rotationIndex,
    selectedColor,
    isExploding
  });

  useEffect(() => {
    stateRef.current = {
      toolMode,
      hoverPos,
      selectedBrickType,
      rotationIndex,
      selectedColor,
      isExploding
    };
  }, [toolMode, hoverPos, selectedBrickType, rotationIndex, selectedColor, isExploding]);

  // Reset offset when tool changes
  useEffect(() => {
    setManualOffset({x: 0, z: 0});
  }, [toolMode]);

  // Handle key press for rotation, height offset, position nudge, and placement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // --- BRICK ROTATION ---
      if (e.key === 'r' || e.key === 'R') {
        setRotationIndex(prev => (prev + 1) % 2);
        playSound('click');
      }
      
      const STEP = PLATE_HEIGHT;
      const shift = e.shiftKey;

      // --- MOVEMENT & HEIGHT CONTROL ---
      
      // W Key
      if (e.key === 'w' || e.key === 'W') {
        if (shift) {
          // Shift + W: Move Layer UP
          setLockedLayer(prev => {
            if (prev === null) {
              return currentGhostY.current + STEP;
            }
            return prev + STEP;
          });
          playSound('click');
        } else {
          // W: Move Piece Forward (-Z)
          setManualOffset(prev => ({ ...prev, z: prev.z - 1 }));
          playSound('click');
        }
      }

      // S Key
      if (e.key === 's' || e.key === 'S') {
        if (shift) {
           // Shift + S: Move Layer DOWN
           setLockedLayer(prev => {
            if (prev === null) {
              return currentGhostY.current - STEP;
            }
            return prev - STEP;
          });
          playSound('click');
        } else {
           // S: Move Piece Backward (+Z)
           setManualOffset(prev => ({ ...prev, z: prev.z + 1 }));
           playSound('click');
        }
      }

      // A Key: Move Left (-X)
      if (e.key === 'a' || e.key === 'A') {
        setManualOffset(prev => ({ ...prev, x: prev.x - 1 }));
        playSound('click');
      }

      // D Key: Move Right (+X)
      if (e.key === 'd' || e.key === 'D') {
        setManualOffset(prev => ({ ...prev, x: prev.x + 1 }));
        playSound('click');
      }

      // ENTER Key: Place Brick
      if (e.key === 'Enter') {
        const { toolMode, hoverPos, selectedBrickType, rotationIndex, selectedColor, isExploding } = stateRef.current;
        
        if (!isExploding && toolMode === ToolMode.BUILD && hoverPos) {
          playSound('place');
          const newBrick: BrickData = {
            id: uuidv4(),
            type: selectedBrickType,
            position: hoverPos,
            rotation: rotationIndex,
            color: selectedColor
          };
          setBricks(prev => [...prev, newBrick]);
          
          // Reset offsets after placement
          setLockedLayer(null);
          setManualOffset({x: 0, z: 0});
        }
      }

      if (e.key === 'Escape') {
        setLockedLayer(null);
        setManualOffset({x: 0, z: 0});
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setLockedLayer, setBricks]);

  // Core logic to calculate where the brick should go based on RAYCAST
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
    if (!def) return [x, y, z]; 

    const brickHeight = def.height;
    const isRotated = rot === 1;
    const effectiveW = isRotated ? def.depth : def.width;
    const effectiveD = isRotated ? def.width : def.depth;

    // Initial snapping
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
          const nearestFlat = Math.round(y / PLATE_HEIGHT) * PLATE_HEIGHT;
          const nearestStud = (Math.round((y - STUD_HEIGHT) / PLATE_HEIGHT) * PLATE_HEIGHT) + STUD_HEIGHT;
          
          if (Math.abs(y - nearestStud) < Math.abs(y - nearestFlat)) {
            finalY = (y - STUD_HEIGHT) + brickHeight / 2;
          } else {
            finalY = y + brickHeight / 2;
          }

        } else if (normal.y < -0.9) {
          // Stacking BELOW
          finalY = y - brickHeight / 2;
        } else {
          // Side placement
          const snapY = PLATE_HEIGHT;
          finalY = (Math.floor(y / snapY) * snapY) + brickHeight / 2;
        }
      }
    }

    // Adjust centering
    if (effectiveW % 2 === 0) {
      if (Math.floor(finalX) === finalX) finalX += 0.5;
    }
    if (effectiveD % 2 === 0) {
      if (Math.floor(finalZ) === finalZ) finalZ += 0.5;
    }

    return [finalX, finalY, finalZ];
  };

  // Effect to update ghost when state changes
  useEffect(() => {
    if (lastHitRef.current && toolMode === ToolMode.BUILD && !isExploding) {
      const { point, normal, objectName } = lastHitRef.current;
      const basePos = calculateGhostPosition(point, normal, objectName, selectedBrickType, rotationIndex, lockedLayer);
      
      // Apply Manual Offset
      const finalPos: [number, number, number] = [
        basePos[0] + manualOffset.x * STUD_SIZE,
        basePos[1],
        basePos[2] + manualOffset.z * STUD_SIZE
      ];

      setHoverPos(finalPos);
      currentGhostY.current = finalPos[1];
    } else {
      // Only clear if we really don't have a hit, but sometimes we want to keep last valid pos?
      // For now, standard behavior:
      setHoverPos(null);
    }
  }, [rotationIndex, lockedLayer, selectedBrickType, toolMode, definitions, isExploding, manualOffset]);

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    
    if (toolMode !== ToolMode.BUILD || isExploding) {
      setHoverPos(null);
      lastHitRef.current = null;
      return;
    }

    let hitPoint = e.point.clone();
    let hitNormal = e.face?.normal?.clone() || new THREE.Vector3(0, 1, 0);
    let hitObject = e.object.name;
    let overrideY: number | null = null;

    // --- Extrapolation Logic ---
    if (hitObject === 'ground' && lastValidBrickHit.current) {
      const lastHit = lastValidBrickHit.current;
      const ray = e.ray;
      
      const planeY = lastHit.ghostY;
      const t = (planeY - ray.origin.y) / ray.direction.y;

      if (t > 0) {
        const intersectPoint = new THREE.Vector3().copy(ray.origin).add(ray.direction.clone().multiplyScalar(t));
        const dist = new THREE.Vector2(intersectPoint.x - lastHit.point.x, intersectPoint.z - lastHit.point.z).length();

        if (dist < 3.0) {
          hitPoint = intersectPoint;
          hitNormal = new THREE.Vector3(0, 1, 0); 
          overrideY = planeY; 
          hitObject = 'extrapolated_plane'; 
        }
      }
    }

    // Update ref
    lastHitRef.current = { 
      point: hitPoint, 
      normal: hitNormal, 
      objectName: hitObject 
    };

    const basePos = calculateGhostPosition(
      hitPoint, 
      hitNormal, 
      hitObject, 
      selectedBrickType, 
      rotationIndex, 
      lockedLayer ?? overrideY 
    );

    // Apply Manual Offset
    const finalPos: [number, number, number] = [
      basePos[0] + manualOffset.x * STUD_SIZE,
      basePos[1],
      basePos[2] + manualOffset.z * STUD_SIZE
    ];

    setHoverPos(finalPos);
    currentGhostY.current = finalPos[1];

    // Update the validity cache
    if (e.object.name !== 'ground') {
       lastValidBrickHit.current = {
         point: e.point.clone(),
         ghostY: finalPos[1]
       };
    } else if (hitObject === 'extrapolated_plane') {
       // Keep current validity
    } else {
      lastValidBrickHit.current = null;
    }

  }, [toolMode, selectedBrickType, rotationIndex, lockedLayer, definitions, isExploding, manualOffset]);

  const handleClick = (e: ThreeEvent<MouseEvent>, brickId?: string) => {
    if (isExploding) return;
    if (e.delta > 10) return;

    e.stopPropagation();

    if (toolMode === ToolMode.DELETE && brickId) {
      playSound('delete');
      setBricks(prev => prev.filter(b => b.id !== brickId));
      return;
    }

    if (toolMode === ToolMode.PAINT && brickId) {
      playSound('click');
      setBricks(prev => prev.map(b => b.id === brickId ? { ...b, color: selectedColor } : b));
      return;
    }

    if (toolMode === ToolMode.BUILD && hoverPos) {
      playSound('place');
      const newBrick: BrickData = {
        id: uuidv4(),
        type: selectedBrickType,
        position: hoverPos,
        rotation: rotationIndex,
        color: selectedColor
      };
      setBricks(prev => [...prev, newBrick]);
      
      setLockedLayer(null);
      setManualOffset({x: 0, z: 0}); // Reset offset after placement
    }
  };

  const ghost = toolMode === ToolMode.BUILD && hoverPos && !isExploding ? {
    id: 'ghost',
    type: selectedBrickType,
    position: hoverPos,
    rotation: rotationIndex,
    color: selectedColor,
  } : null;

  return (
    <div className="w-full h-full cursor-crosshair">
      {/* preserveDrawingBuffer required for screenshot capture */}
      <Canvas shadows gl={{ preserveDrawingBuffer: true }} camera={{ position: [10, 8, 10], fov: 45 }}>
        <ScreenshotHandler ref={sceneActionRef} />
        <color attach="background" args={['#1a1a2e']} />
        
        <ambientLight intensity={0.7} />
        <pointLight position={[20, 30, 20]} intensity={1} castShadow />
        <pointLight position={[-10, 10, -10]} intensity={0.5} color="#00fff5" />
        
        <Environment preset="city" />

        <OrbitControls 
          ref={controlsRef}
          makeDefault 
          minPolarAngle={0} 
          maxPolarAngle={Math.PI / 2 - 0.1} 
          enableDamping={true}
          dampingFactor={0.1}
        />

        <mesh 
          name="ground" 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, 0, 0]} 
          receiveShadow
          onPointerMove={handlePointerMove}
          onClick={(e) => handleClick(e)}
        >
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#16213e" roughness={0.8} />
        </mesh>
        <Grid position={[0, 0.01, 0]} args={[100, 100]} cellSize={1} cellThickness={0.6} cellColor="#e94560" sectionSize={5} sectionThickness={1.2} sectionColor="#00fff5" fadeDistance={90} />

        {bricks.map(brick => (
          <Brick3D 
            key={brick.id} 
            data={brick} 
            definitions={definitions}
            onClick={handleClick}
            onPointerMove={handlePointerMove}
            onPointerOver={(e) => {
              if(toolMode !== ToolMode.BUILD && !isExploding) document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => document.body.style.cursor = 'auto'}
            isExploding={isExploding}
          />
        ))}

        {ghost && <Brick3D data={ghost} definitions={definitions} isGhost />}
        
        <ContactShadows position={[0, 0.01, 0]} opacity={0.4} scale={40} blur={2} far={4} />
      </Canvas>
    </div>
  );
};

export default Scene;
