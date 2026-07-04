import { describe, it, expect } from 'vitest';
import { flags, drones, doorPanels, equipmentState, exportSamples, telemetryData } from './state.js';

describe('State flags', () => {
  it('should start with defaults', () => {
    expect(flags.paused).toBe(false);
    expect(flags.speedMul).toBe(1);
    expect(flags.isolatedZone).toBe(-1);
    expect(flags.sirenActive).toBe(false);
    expect(flags.followCam).toBe(false);
    expect(flags.formationMode).toBe(false);
    expect(flags.audioMuted).toBe(false);
    expect(flags.pipActive).toBe(false);
    expect(flags.fanSpeedTarget).toBe(3.0);
    expect(flags.fanCurrentSpeed).toBe(3.0);
    expect(flags.pathProgress).toBe(0);
  });
});

describe('State arrays', () => {
  it('should start empty', () => {
    expect(drones).toHaveLength(0);
    expect(doorPanels).toHaveLength(0);
    expect(exportSamples).toHaveLength(0);
  });
});

describe('Equipment state', () => {
  it('should start with all equipment on', () => {
    expect(equipmentState.heater).toBe(true);
    expect(equipmentState.ac).toBe(true);
    expect(equipmentState.fan).toBe(true);
    expect(equipmentState.sprinklers).toBe(true);
  });
});

describe('Telemetry data', () => {
  it('should have 4 drones with initial values', () => {
    expect(telemetryData).toHaveLength(4);
    telemetryData.forEach(d => {
      expect(d.batt).toBeGreaterThan(0);
      expect(d.rpm).toBeGreaterThan(0);
      expect(d.status).toBeDefined();
    });
  });
});
