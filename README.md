# UAV Climate Test Chamber

An interactive 3D UAV climate test chamber simulation built with Three.js and Vite.

## Features

- **4 Climate Zones**: Hot, Cold, Windy, and Rainy — each with real-time particle effects
- **Equipment Control**: Click 3D equipment to toggle on/off (heater, AC unit, fan, sprinklers) with damage/failure simulation
- **4 UAV Drones**: SurveyorQuad, FreightHex, RacerX with flight physics, altitude control, battery telemetry, and follow-cam
- **Real-time Instruments**: Thermometer bars, anemometer (spinning cups), rain gauge (rising water level)
- **Particle Systems**: Heat ripple, cold fog, snow, wind streaks, rain, mist, splash effects
- **Web Audio Engine**: Per-drone harmonic synthesis, fan whoosh, rain hiss with spatialization
- **Camera Controls**: Orbit, zone presets, follow-cam, picture-in-picture drone view
- **Test Sequences**: Heat stress, cold start, crosswind landing, water resistance, full climate sweep
- **Data Export**: CSV logging of zone conditions over time
- **State Persistence**: Slider values saved across sessions
- **Responsive UI**: Adapts to desktop, tablet, and mobile screens

## Quick Start

```bash
npm install
npm run dev
```

Open **http://localhost:8000** in your browser.

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm test` | Run vitest unit tests |

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `1-4` | Camera zone presets |
| `0` | Reset camera |
| `D` | Toggle sliding doors |
| `T` | Thermal overlay |
| `M` | Mute audio |
| `P` | Follow-cam |
| `F` | Formation flying |
| `Space` | Pause/resume |
| `+ / -` | Speed up/slow down |
| `?` | Help overlay |

## Tech Stack

- **Three.js** (v0.160.0) — 3D rendering
- **Vite** (v5.x) — Build tool with HMR
- **Vitest** — Unit testing
- **Web Audio API** — Audio synthesis

## Project Structure

```
├── index.html          # Shell with inline CSS
├── vite.config.js      # Vite build config
├── src/
│   ├── main.js         # Entry point, orchestration, UI bindings
│   ├── constants.js    # Dimensions, colors, names
│   ├── state.js        # Shared mutable state
│   ├── utils.js        # makeBox, materials, textures
│   ├── chamber.js      # Chamber structure, doors, vents
│   ├── environment.js  # Outdoor environment (grass, trees, walkway)
│   ├── lights.js       # All lighting (ambient, LED strips, beacons)
│   ├── equipment.js    # Equipment models, damage FX
│   ├── drones.js       # Drone models, propellers, shadows
│   ├── particles.js    # 8 particle systems
│   ├── audio.js        # Web Audio engine
│   ├── camera.js       # Camera presets, follow-cam, PIP
│   ├── instruments.js  # Thermometers, anemometer, rain gauge
│   ├── labels.js       # CSS2D labels (zones, equipment, telemetry)
│   └── *.test.js       # Unit tests
└── package.json
```
