
export const BrickType = {
  ONE_BY_ONE: '1x1',
  ONE_BY_TWO: '1x2',
  ONE_BY_THREE: '1x3',
  ONE_BY_FOUR: '1x4',
  ONE_BY_SIX: '1x6',
  ONE_BY_EIGHT: '1x8',
  TWO_BY_TWO: '2x2',
  TWO_BY_THREE: '2x3',
  TWO_BY_FOUR: '2x4',
  TWO_BY_SIX: '2x6',
  TWO_BY_EIGHT: '2x8',
  // Round Bricks
  ROUND_BRICK_1x1: 'round_brick_1x1',
  
  // Plates
  PLATE_1x1: 'plate_1x1',
  PLATE_1x2: 'plate_1x2',
  PLATE_1x4: 'plate_1x4',
  PLATE_2x2: 'plate_2x2',
  PLATE_2x3: 'plate_2x3',
  PLATE_2x4: 'plate_2x4',
  PLATE_2x6: 'plate_2x6',
  PLATE_4x4: 'plate_4x4',
  PLATE_6x6: 'plate_6x6',
  // Round Plates
  ROUND_PLATE_1x1: 'round_plate_1x1',

  // Tiles
  TILE_1x1: 'tile_1x1',
  TILE_1x2: 'tile_1x2',
  TILE_1x4: 'tile_1x4',
  TILE_2x2: 'tile_2x2',
  TILE_2x4: 'tile_2x4',
  // Round Tiles
  ROUND_TILE_1x1: 'round_tile_1x1',

  // Windows & Doors
  WINDOW_1x2x2: 'window_1x2x2',
  WINDOW_1x2x3: 'window_1x2x3',
  WINDOW_1x4x3: 'window_1x4x3',
  DOOR_1x4x6: 'door_1x4x6',

  // Baseplates
  BASEPLATE_16x16: 'baseplate_16x16',
  BASEPLATE_32x32: 'baseplate_32x32',
} as const;

// Allow BrickType to be one of the known values OR any string (for custom pieces)
export type BrickType = typeof BrickType[keyof typeof BrickType] | string;

export interface BrickDims {
  width: number; // in studs
  depth: number; // in studs
  height: number; // in units
  label: string;
  hasStuds?: boolean; // defaults to true
  shape?: 'box' | 'cylinder' | 'window' | 'door'; // defaults to box
}

export interface BrickData {
  id: string;
  type: BrickType;
  position: [number, number, number]; // x, y, z world coordinates
  rotation: number; // 0 or 1 (0 degrees or 90 degrees for simplicity on grid)
  color: string;
}

export enum ToolMode {
  BUILD = 'BUILD',
  DELETE = 'DELETE',
  PAINT = 'PAINT',
}

export interface Challenge {
  title: string;
  description: string;
  steps: string[];
}