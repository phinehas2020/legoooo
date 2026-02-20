
import { BrickType, BrickDims } from './types';

// 1 unit = 1 stud width
export const STUD_SIZE = 1;
export const BRICK_HEIGHT = 1.2; // Standard brick height
export const PLATE_HEIGHT = 0.4; // Plate is 1/3 of a brick
export const STUD_HEIGHT = 0.2;
export const STUD_RADIUS = 0.35;

export const DEFAULT_BRICK_DEFINITIONS: Record<string, BrickDims> = {
  // Standard Bricks
  [BrickType.ONE_BY_ONE]: { width: 1, depth: 1, height: BRICK_HEIGHT, label: 'Brick 1 x 1' },
  [BrickType.ONE_BY_TWO]: { width: 1, depth: 2, height: BRICK_HEIGHT, label: 'Brick 1 x 2' },
  [BrickType.ONE_BY_THREE]: { width: 1, depth: 3, height: BRICK_HEIGHT, label: 'Brick 1 x 3' },
  [BrickType.ONE_BY_FOUR]: { width: 1, depth: 4, height: BRICK_HEIGHT, label: 'Brick 1 x 4' },
  [BrickType.ONE_BY_SIX]: { width: 1, depth: 6, height: BRICK_HEIGHT, label: 'Brick 1 x 6' },
  [BrickType.ONE_BY_EIGHT]: { width: 1, depth: 8, height: BRICK_HEIGHT, label: 'Brick 1 x 8' },
  [BrickType.ONE_BY_TEN]: { width: 1, depth: 10, height: BRICK_HEIGHT, label: 'Brick 1 x 10' },
  [BrickType.ONE_BY_TWELVE]: { width: 1, depth: 12, height: BRICK_HEIGHT, label: 'Brick 1 x 12' },
  [BrickType.ONE_BY_SIXTEEN]: { width: 1, depth: 16, height: BRICK_HEIGHT, label: 'Brick 1 x 16' },
  [BrickType.TWO_BY_TWO]: { width: 2, depth: 2, height: BRICK_HEIGHT, label: 'Brick 2 x 2' },
  [BrickType.TWO_BY_THREE]: { width: 2, depth: 3, height: BRICK_HEIGHT, label: 'Brick 2 x 3' },
  [BrickType.TWO_BY_FOUR]: { width: 2, depth: 4, height: BRICK_HEIGHT, label: 'Brick 2 x 4' },
  [BrickType.TWO_BY_SIX]: { width: 2, depth: 6, height: BRICK_HEIGHT, label: 'Brick 2 x 6' },
  [BrickType.TWO_BY_EIGHT]: { width: 2, depth: 8, height: BRICK_HEIGHT, label: 'Brick 2 x 8' },
  [BrickType.TWO_BY_TEN]: { width: 2, depth: 10, height: BRICK_HEIGHT, label: 'Brick 2 x 10' },
  [BrickType.TWO_BY_TWELVE]: { width: 2, depth: 12, height: BRICK_HEIGHT, label: 'Brick 2 x 12' },
  [BrickType.TWO_BY_SIXTEEN]: { width: 2, depth: 16, height: BRICK_HEIGHT, label: 'Brick 2 x 16' },
  [BrickType.FOUR_BY_FOUR]: { width: 4, depth: 4, height: BRICK_HEIGHT, label: 'Brick 4 x 4' },
  [BrickType.FOUR_BY_SIX]: { width: 4, depth: 6, height: BRICK_HEIGHT, label: 'Brick 4 x 6' },
  [BrickType.FOUR_BY_EIGHT]: { width: 4, depth: 8, height: BRICK_HEIGHT, label: 'Brick 4 x 8' },

  // Round Bricks
  [BrickType.ROUND_BRICK_1x1]: { width: 1, depth: 1, height: BRICK_HEIGHT, label: 'Round 1 x 1', shape: 'cylinder' },
  [BrickType.ROUND_BRICK_2x2]: { width: 2, depth: 2, height: BRICK_HEIGHT, label: 'Round 2 x 2', shape: 'cylinder' },

  // Windows
  [BrickType.WINDOW_1x2x2]: { width: 2, depth: 1, height: BRICK_HEIGHT * 2, label: 'Window 1 x 2 x 2', shape: 'window' },
  [BrickType.WINDOW_1x2x3]: { width: 2, depth: 1, height: BRICK_HEIGHT * 3, label: 'Window 1 x 2 x 3', shape: 'window' },
  [BrickType.WINDOW_1x4x3]: { width: 4, depth: 1, height: BRICK_HEIGHT * 3, label: 'Window 1 x 4 x 3', shape: 'window' },
  [BrickType.WINDOW_1x4x6]: { width: 4, depth: 1, height: BRICK_HEIGHT * 6, label: 'Window 1 x 4 x 6', shape: 'window' },
  [BrickType.WINDOW_1x6x5]: { width: 6, depth: 1, height: BRICK_HEIGHT * 5, label: 'Window 1 x 6 x 5', shape: 'window' },

  // Doors
  [BrickType.DOOR_1x4x6]: { width: 4, depth: 1, height: BRICK_HEIGHT * 5, label: 'Door 1 x 4 x 6', shape: 'door' },
  [BrickType.DOOR_DOUBLE_1x8x6]: { width: 8, depth: 1, height: BRICK_HEIGHT * 5, label: 'Dbl Door 1 x 8 x 6', shape: 'door' },

  // Plates
  [BrickType.PLATE_1x1]: { width: 1, depth: 1, height: PLATE_HEIGHT, label: 'Plate 1 x 1' },
  [BrickType.PLATE_1x2]: { width: 1, depth: 2, height: PLATE_HEIGHT, label: 'Plate 1 x 2' },
  [BrickType.PLATE_1x3]: { width: 1, depth: 3, height: PLATE_HEIGHT, label: 'Plate 1 x 3' },
  [BrickType.PLATE_1x4]: { width: 1, depth: 4, height: PLATE_HEIGHT, label: 'Plate 1 x 4' },
  [BrickType.PLATE_1x6]: { width: 1, depth: 6, height: PLATE_HEIGHT, label: 'Plate 1 x 6' },
  [BrickType.PLATE_1x8]: { width: 1, depth: 8, height: PLATE_HEIGHT, label: 'Plate 1 x 8' },
  [BrickType.PLATE_1x10]: { width: 1, depth: 10, height: PLATE_HEIGHT, label: 'Plate 1 x 10' },
  [BrickType.PLATE_1x12]: { width: 1, depth: 12, height: PLATE_HEIGHT, label: 'Plate 1 x 12' },
  [BrickType.PLATE_2x2]: { width: 2, depth: 2, height: PLATE_HEIGHT, label: 'Plate 2 x 2' },
  [BrickType.PLATE_2x3]: { width: 2, depth: 3, height: PLATE_HEIGHT, label: 'Plate 2 x 3' },
  [BrickType.PLATE_2x4]: { width: 2, depth: 4, height: PLATE_HEIGHT, label: 'Plate 2 x 4' },
  [BrickType.PLATE_2x6]: { width: 2, depth: 6, height: PLATE_HEIGHT, label: 'Plate 2 x 6' },
  [BrickType.PLATE_2x8]: { width: 2, depth: 8, height: PLATE_HEIGHT, label: 'Plate 2 x 8' },
  [BrickType.PLATE_2x10]: { width: 2, depth: 10, height: PLATE_HEIGHT, label: 'Plate 2 x 10' },
  [BrickType.PLATE_2x12]: { width: 2, depth: 12, height: PLATE_HEIGHT, label: 'Plate 2 x 12' },
  [BrickType.PLATE_4x4]: { width: 4, depth: 4, height: PLATE_HEIGHT, label: 'Plate 4 x 4' },
  [BrickType.PLATE_4x6]: { width: 4, depth: 6, height: PLATE_HEIGHT, label: 'Plate 4 x 6' },
  [BrickType.PLATE_4x8]: { width: 4, depth: 8, height: PLATE_HEIGHT, label: 'Plate 4 x 8' },
  [BrickType.PLATE_4x10]: { width: 4, depth: 10, height: PLATE_HEIGHT, label: 'Plate 4 x 10' },
  [BrickType.PLATE_4x12]: { width: 4, depth: 12, height: PLATE_HEIGHT, label: 'Plate 4 x 12' },
  [BrickType.PLATE_6x6]: { width: 6, depth: 6, height: PLATE_HEIGHT, label: 'Plate 6 x 6' },
  [BrickType.PLATE_6x8]: { width: 6, depth: 8, height: PLATE_HEIGHT, label: 'Plate 6 x 8' },
  [BrickType.PLATE_8x8]: { width: 8, depth: 8, height: PLATE_HEIGHT, label: 'Plate 8 x 8' },
  [BrickType.PLATE_10x10]: { width: 10, depth: 10, height: PLATE_HEIGHT, label: 'Plate 10 x 10' },
  [BrickType.PLATE_16x16]: { width: 16, depth: 16, height: PLATE_HEIGHT, label: 'Plate 16 x 16' },

  // Round Plates
  [BrickType.ROUND_PLATE_1x1]: { width: 1, depth: 1, height: PLATE_HEIGHT, label: 'Rd Plate 1 x 1', shape: 'cylinder' },
  [BrickType.ROUND_PLATE_2x2]: { width: 2, depth: 2, height: PLATE_HEIGHT, label: 'Rd Plate 2 x 2', shape: 'cylinder' },

  // Baseplates
  [BrickType.BASEPLATE_16x16]: { width: 16, depth: 16, height: PLATE_HEIGHT, label: 'Base 16 x 16' },
  [BrickType.BASEPLATE_32x32]: { width: 32, depth: 32, height: PLATE_HEIGHT, label: 'Base 32 x 32' },
  [BrickType.BASEPLATE_48x48]: { width: 48, depth: 48, height: PLATE_HEIGHT, label: 'Base 48 x 48' },

  // Tiles (Smooth Top)
  [BrickType.TILE_1x1]: { width: 1, depth: 1, height: PLATE_HEIGHT, label: 'Tile 1 x 1', hasStuds: false },
  [BrickType.TILE_1x2]: { width: 1, depth: 2, height: PLATE_HEIGHT, label: 'Tile 1 x 2', hasStuds: false },
  [BrickType.TILE_1x3]: { width: 1, depth: 3, height: PLATE_HEIGHT, label: 'Tile 1 x 3', hasStuds: false },
  [BrickType.TILE_1x4]: { width: 1, depth: 4, height: PLATE_HEIGHT, label: 'Tile 1 x 4', hasStuds: false },
  [BrickType.TILE_1x6]: { width: 1, depth: 6, height: PLATE_HEIGHT, label: 'Tile 1 x 6', hasStuds: false },
  [BrickType.TILE_1x8]: { width: 1, depth: 8, height: PLATE_HEIGHT, label: 'Tile 1 x 8', hasStuds: false },
  [BrickType.TILE_2x2]: { width: 2, depth: 2, height: PLATE_HEIGHT, label: 'Tile 2 x 2', hasStuds: false },
  [BrickType.TILE_2x4]: { width: 2, depth: 4, height: PLATE_HEIGHT, label: 'Tile 2 x 4', hasStuds: false },
  [BrickType.TILE_2x6]: { width: 2, depth: 6, height: PLATE_HEIGHT, label: 'Tile 2 x 6', hasStuds: false },
  [BrickType.TILE_2x8]: { width: 2, depth: 8, height: PLATE_HEIGHT, label: 'Tile 2 x 8', hasStuds: false },

  // Round Tiles
  [BrickType.ROUND_TILE_1x1]: { width: 1, depth: 1, height: PLATE_HEIGHT, label: 'Rd Tile 1 x 1', hasStuds: false, shape: 'cylinder' },
  [BrickType.ROUND_TILE_2x2]: { width: 2, depth: 2, height: PLATE_HEIGHT, label: 'Rd Tile 2 x 2', hasStuds: false, shape: 'cylinder' },
};

export const LEGO_COLORS = [
  { name: 'Classic Red', hex: '#ef4444' },
  { name: 'Royal Blue', hex: '#3b82f6' },
  { name: 'Sunny Yellow', hex: '#eab308' },
  { name: 'Forest Green', hex: '#22c55e' },
  { name: 'Pitch Black', hex: '#171717' },
  { name: 'Cloud White', hex: '#f3f4f6' },
  { name: 'Retro Grey', hex: '#9ca3af' },
  { name: 'Neon Pink', hex: '#ec4899' },
  { name: 'Space Orange', hex: '#f97316' },
  { name: 'Ice Cyan', hex: '#06b6d4' },
  { name: 'Trans Blue', hex: '#60a5fa99' }, // Semi-transparent example
  { name: 'Trans Red', hex: '#ef444499' },
  { name: 'Gold', hex: '#e6b800' },
  { name: 'Silver', hex: '#C0C0C0' },
  { name: 'Brown', hex: '#8B4513' },
];

export const INITIAL_CAMERA_POS = [10, 10, 10] as const;