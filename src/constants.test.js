import { describe, it, expect } from 'vitest';
import { SECTION_W, HEIGHT, DEPTH, WALL_T, centers, names, colors, floorColors, droneNames } from './constants.js';

describe('Dimensions', () => {
  it('should have correct chamber dimensions', () => {
    expect(SECTION_W).toBe(7);
    expect(HEIGHT).toBe(6);
    expect(DEPTH).toBe(10);
    expect(WALL_T).toBe(0.2);
  });

  it('should compute 4 center positions', () => {
    expect(centers).toHaveLength(4);
    expect(centers[0]).toBe(-10.5);
    expect(centers[1]).toBe(-3.5);
    expect(centers[2]).toBe(3.5);
    expect(centers[3]).toBe(10.5);
  });
});

describe('Labels', () => {
  it('should have 4 zone names', () => {
    expect(names).toHaveLength(4);
    expect(names[0]).toBe('HOT ZONE');
    expect(names[1]).toBe('COLD ZONE');
    expect(names[2]).toBe('WINDY ZONE');
    expect(names[3]).toBe('RAINY ZONE');
  });

  it('should have 4 colors', () => {
    expect(colors).toHaveLength(4);
    expect(floorColors).toHaveLength(4);
  });

  it('should have 4 drone names', () => {
    expect(droneNames).toHaveLength(4);
    expect(droneNames[0]).toBe('UAV-01');
    expect(droneNames[3]).toBe('UAV-04');
  });
});
