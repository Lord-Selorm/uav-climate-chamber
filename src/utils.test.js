import { describe, it, expect } from 'vitest';
import { makeBox, steel, darkSteel, frameMat, floorTextures } from './utils.js';

describe('Materials', () => {
  it('should export steel materials', () => {
    expect(steel).toBeDefined();
    expect(darkSteel).toBeDefined();
    expect(frameMat).toBeDefined();
  });

  it('should have 4 floor textures', () => {
    expect(floorTextures).toHaveLength(4);
  });
});

describe('makeBox', () => {
  it('should create a Mesh', () => {
    const box = makeBox(1, 2, 3, steel);
    expect(box).toBeDefined();
    expect(box.isMesh).toBe(true);
    expect(box.castShadow).toBe(true);
    expect(box.receiveShadow).toBe(true);
  });

  it('should create box with correct geometry dimensions', () => {
    const box = makeBox(7, 6, 10, steel);
    const geo = box.geometry;
    // BoxGeometry stores half-extents in parameters
    // width=7 -> parameters[0]=3.5, height=6 -> parameters[1]=3, depth=10 -> parameters[2]=5
    expect(geo.parameters.width).toBe(7);
    expect(geo.parameters.height).toBe(6);
    expect(geo.parameters.depth).toBe(10);
  });
});
