
export const BrickType = {
  // Standard Bricks
  ONE_BY_ONE: '1x1',
  ONE_BY_TWO: '1x2',
  ONE_BY_THREE: '1x3',
  ONE_BY_FOUR: '1x4',
  ONE_BY_SIX: '1x6',
  ONE_BY_EIGHT: '1x8',
  ONE_BY_TEN: '1x10',
  ONE_BY_TWELVE: '1x12',
  ONE_BY_SIXTEEN: '1x16',
  TWO_BY_TWO: '2x2',
  TWO_BY_THREE: '2x3',
  TWO_BY_FOUR: '2x4',
  TWO_BY_SIX: '2x6',
  TWO_BY_EIGHT: '2x8',
  TWO_BY_TEN: '2x10',
  TWO_BY_TWELVE: '2x12',
  TWO_BY_SIXTEEN: '2x16',
  FOUR_BY_FOUR: '4x4',
  FOUR_BY_SIX: '4x6',
  FOUR_BY_EIGHT: '4x8',

  // Round Bricks
  ROUND_BRICK_1x1: 'round_brick_1x1',
  ROUND_BRICK_2x2: 'round_brick_2x2',

  // Plates
  PLATE_1x1: 'plate_1x1',
  PLATE_1x2: 'plate_1x2',
  PLATE_1x3: 'plate_1x3',
  PLATE_1x4: 'plate_1x4',
  PLATE_1x6: 'plate_1x6',
  PLATE_1x8: 'plate_1x8',
  PLATE_1x10: 'plate_1x10',
  PLATE_1x12: 'plate_1x12',
  PLATE_2x2: 'plate_2x2',
  PLATE_2x3: 'plate_2x3',
  PLATE_2x4: 'plate_2x4',
  PLATE_2x6: 'plate_2x6',
  PLATE_2x8: 'plate_2x8',
  PLATE_2x10: 'plate_2x10',
  PLATE_2x12: 'plate_2x12',
  PLATE_4x4: 'plate_4x4',
  PLATE_4x6: 'plate_4x6',
  PLATE_4x8: 'plate_4x8',
  PLATE_4x10: 'plate_4x10',
  PLATE_4x12: 'plate_4x12',
  PLATE_6x6: 'plate_6x6',
  PLATE_6x8: 'plate_6x8',
  PLATE_8x8: 'plate_8x8',
  PLATE_10x10: 'plate_10x10',
  PLATE_16x16: 'plate_16x16',

  // Round Plates
  ROUND_PLATE_1x1: 'round_plate_1x1',
  ROUND_PLATE_2x2: 'round_plate_2x2',

  // Tiles
  TILE_1x1: 'tile_1x1',
  TILE_1x2: 'tile_1x2',
  TILE_1x3: 'tile_1x3',
  TILE_1x4: 'tile_1x4',
  TILE_1x6: 'tile_1x6',
  TILE_1x8: 'tile_1x8',
  TILE_2x2: 'tile_2x2',
  TILE_2x4: 'tile_2x4',
  TILE_2x6: 'tile_2x6',
  TILE_2x8: 'tile_2x8',

  // Round Tiles
  ROUND_TILE_1x1: 'round_tile_1x1',
  ROUND_TILE_2x2: 'round_tile_2x2',

  // Windows & Doors
  WINDOW_1x2x2: 'window_1x2x2',
  WINDOW_1x2x3: 'window_1x2x3',
  WINDOW_1x4x3: 'window_1x4x3',
  WINDOW_1x4x6: 'window_1x4x6',
  WINDOW_1x6x5: 'window_1x6x5',
  DOOR_1x4x6: 'door_1x4x6',
  DOOR_DOUBLE_1x8x6: 'door_double_1x8x6',

  // Baseplates
  BASEPLATE_16x16: 'baseplate_16x16',
  BASEPLATE_32x32: 'baseplate_32x32',
  BASEPLATE_48x48: 'baseplate_48x48',
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