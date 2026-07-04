import { audioState, audioNodes } from './state.js';

export function initAudio() {
  if (window.__audioCtx) return;
  window.__audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const audioCtx = window.__audioCtx;
  const master = audioCtx.createGain();
  master.gain.value = 0.15;
  master.connect(audioCtx.destination);

  for (let i = 0; i < 4; i++) {
    const baseFreq = 100 + i * 20;
    const harmonics = [
      { mult: 1.0, gain: 0.22 },
      { mult: 2.0, gain: 0.10 },
      { mult: 3.0, gain: 0.05 },
      { mult: 4.0, gain: 0.025 },
    ];
    const sumGain = audioCtx.createGain();
    sumGain.gain.value = 0;
    const freqParams = [];
    harmonics.forEach((h) => {
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = baseFreq * h.mult;
      const g = audioCtx.createGain();
      g.gain.value = h.gain;
      osc.connect(g);
      g.connect(sumGain);
      osc.start();
      freqParams.push(osc.frequency);
    });
    const tremolo = audioCtx.createGain();
    tremolo.gain.value = 0.5;
    const lfo = audioCtx.createOscillator();
    lfo.frequency.value = 40 + i * 6;
    const lfoG = audioCtx.createGain();
    lfoG.gain.value = 0.35;
    lfo.connect(lfoG);
    lfoG.connect(tremolo.gain);
    lfo.start();
    const noiseLen = audioCtx.sampleRate * 0.1;
    const noiseBuf = audioCtx.createBuffer(1, noiseLen, audioCtx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let j = 0; j < noiseLen; j++) nd[j] = (Math.random() - 0.5) * 2;
    const noiseSrc = audioCtx.createBufferSource();
    noiseSrc.buffer = noiseBuf;
    noiseSrc.loop = true;
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.value = 0;
    const noiseBP = audioCtx.createBiquadFilter();
    noiseBP.type = 'bandpass';
    noiseBP.frequency.value = baseFreq * 5;
    noiseBP.Q.value = 0.6;
    noiseSrc.connect(noiseBP);
    noiseBP.connect(noiseGain);
    noiseGain.connect(sumGain);
    noiseSrc.start();
    const lp = audioCtx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = baseFreq * 12;
    sumGain.connect(tremolo);
    tremolo.connect(lp);
    lp.connect(master);
    audioNodes[`droneGain${i}`] = sumGain;
    audioNodes[`droneFreqs${i}`] = freqParams;
    audioNodes[`droneNoiseGain${i}`] = noiseGain;
  }

  // Fan whoosh
  const whooshSize = 4096;
  const whooshBuffer = audioCtx.createBuffer(1, whooshSize, audioCtx.sampleRate);
  const whooshData = whooshBuffer.getChannelData(0);
  for (let i = 0; i < whooshSize; i++) whooshData[i] = Math.random() * 2 - 1;
  const whooshSrc = audioCtx.createBufferSource();
  whooshSrc.buffer = whooshBuffer;
  whooshSrc.loop = true;
  const whooshGain = audioCtx.createGain();
  whooshGain.gain.value = 0;
  whooshSrc.connect(whooshGain);
  const whooshFilter = audioCtx.createBiquadFilter();
  whooshFilter.type = 'bandpass';
  whooshFilter.frequency.value = 800;
  whooshFilter.Q.value = 0.5;
  whooshGain.connect(whooshFilter);
  whooshFilter.connect(master);
  whooshSrc.start();
  audioNodes.whooshGain = whooshGain;
  audioNodes.whooshFilter = whooshFilter;

  // Rain hiss
  const hissBuf = audioCtx.createBuffer(1, 4096, audioCtx.sampleRate);
  const hissData = hissBuf.getChannelData(0);
  for (let i = 0; i < 4096; i++) hissData[i] = Math.random() * 2 - 1;
  const hissSrc = audioCtx.createBufferSource();
  hissSrc.buffer = hissBuf;
  hissSrc.loop = true;
  const hissGain = audioCtx.createGain();
  hissGain.gain.value = 0;
  hissSrc.connect(hissGain);
  const hissFilter = audioCtx.createBiquadFilter();
  hissFilter.type = 'highpass';
  hissFilter.frequency.value = 3000;
  hissGain.connect(hissFilter);
  hissFilter.connect(master);
  hissSrc.start();
  audioNodes.hissGain = hissGain;
  const lfo2 = audioCtx.createOscillator();
  lfo2.frequency.value = 4;
  const lfoGain2 = audioCtx.createGain();
  lfoGain2.gain.value = 0.05;
  lfo2.connect(lfoGain2);
  lfoGain2.connect(hissGain.gain);
  lfo2.start();
}

export function updateAudio() {
  const audioCtx = window.__audioCtx;
  if (!audioCtx || audioCtx.state === 'closed') return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  if (audioNodes.whooshGain) {
    audioNodes.whooshGain.gain.value = audioState.whoosh * 0.3;
    audioNodes.whooshFilter.frequency.value = 400 + audioState.whoosh * 1200;
  }
  if (audioNodes.hissGain) audioNodes.hissGain.gain.value = audioState.hiss * 0.15;
  for (let i = 0; i < 4; i++) {
    const intensity = audioState.drones[i];
    if (audioNodes[`droneGain${i}`]) {
      audioNodes[`droneGain${i}`].gain.value = intensity * 0.25;
      if (audioNodes[`droneNoiseGain${i}`]) {
        audioNodes[`droneNoiseGain${i}`].gain.value = intensity * 0.08;
      }
      const freqs = audioNodes[`droneFreqs${i}`];
      if (freqs) {
        const base = 100 + intensity * 200;
        freqs.forEach((f, idx) => f.value = base * (idx + 1));
      }
    }
  }
}
