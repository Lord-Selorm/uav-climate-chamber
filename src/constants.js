export const SECTION_W = 7;
export const HEIGHT = 6;
export const DEPTH = 10;
export const WALL_T = 0.2;
export const _totalW = SECTION_W * 4;
export const centers = [
  -_totalW / 2 + SECTION_W / 2,
  -_totalW / 2 + SECTION_W * 1.5,
  -_totalW / 2 + SECTION_W * 2.5,
  -_totalW / 2 + SECTION_W * 3.5,
];
export const names = ['HOT ZONE', 'COLD ZONE', 'WINDY ZONE', 'RAINY ZONE'];
export const equipLabels = ['Industrial Heater', 'AC Cooling Unit', 'High-Velocity Fan', 'Ceiling Sprinklers'];
export const colors = [0xff6b35, 0x00b4d8, 0x00f5d4, 0x4a6fa5];
export const floorColors = [0x4a2810, 0x1a3040, 0x1a3a35, 0x2a3050];
export const _hw = _totalW / 2;
export const _wallOff = _hw + 0.6;
export const _bwW = _totalW + 1.2;
export const droneNames = ['UAV-01', 'UAV-02', 'UAV-03', 'UAV-04'];
