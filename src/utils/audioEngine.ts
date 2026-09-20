// Singleton Audio Context manager to prevent multiple contexts
class AudioEngine {
  private static instance: AudioEngine;
  public ctx: AudioContext | null = null;
  public masterGain: GainNode | null = null;
  public analyser: AnalyserNode | null = null;
  
  // Audio Elements and their Gains
  private trackElements: Map<string, HTMLAudioElement> = new Map();
  private trackSources: Map<string, MediaElementAudioSourceNode> = new Map();
  private trackGains: Map<string, GainNode> = new Map();

  private constructor() {}

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public init() {
    if (this.ctx) return; // Already initialized

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.analyser = this.ctx.createAnalyser();
    
    // Configure analyser for waveform
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  }

  public registerTrack(id: string, element: HTMLAudioElement) {
    if (!this.ctx) this.init();
    if (this.trackElements.has(id)) return;

    this.trackElements.set(id, element);
    
    const source = this.ctx!.createMediaElementSource(element);
    this.trackSources.set(id, source);

    const gain = this.ctx!.createGain();
    gain.gain.value = 0;
    source.connect(gain);
    gain.connect(this.masterGain!);

    this.trackGains.set(id, gain);
  }

  public setVolume(id: string, volume: number) {
    if (!this.ctx) return;
    
    const gainNode = this.trackGains.get(id);
    const element = this.trackElements.get(id);

    if (gainNode && element) {
      const now = this.ctx.currentTime;
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.linearRampToValueAtTime(volume / 100, now + 0.5);

      if (volume > 0 && element.paused) {
        element.play().catch(console.error);
      } else if (volume === 0 && !element.paused) {
        setTimeout(() => {
          if (gainNode.gain.value === 0) element.pause();
        }, 500); 
      }
    }
  }

  // Noise Sources
  private noiseSources: Map<string, AudioBufferSourceNode> = new Map();
  private noiseGains: Map<string, GainNode> = new Map();

  public registerNoise(id: 'white' | 'brown' | 'pink') {
    if (!this.ctx) this.init();
    if (this.noiseSources.has(id)) return;

    const bufferSize = this.ctx!.sampleRate * 2;
    const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
    const output = buffer.getChannelData(0);

    let lastOut = 0;
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      
      if (id === 'white') {
        output[i] = white * 0.1; 
      } else if (id === 'brown') {
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      } else if (id === 'pink') {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11;
        b6 = white * 0.115926;
      }
    }

    const source = this.ctx!.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = this.ctx!.createGain();
    gain.gain.value = 0;
    
    source.connect(gain);
    gain.connect(this.masterGain!);
    
    source.start();

    this.noiseSources.set(id, source);
    this.noiseGains.set(id, gain);
  }

  public setNoiseVolume(id: string, volume: number) {
    if (!this.ctx) return;
    const gainNode = this.noiseGains.get(id);
    if (gainNode) {
      const now = this.ctx.currentTime;
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.linearRampToValueAtTime(volume / 100, now + 0.5);
    }
  }

  // Synthetic Ambient Generators
  private ambientSources: Map<string, AudioNode[]> = new Map();
  private ambientGains: Map<string, GainNode> = new Map();

  public registerSyntheticAmbient(id: string) {
    if (!this.ctx) this.init();
    if (this.ambientGains.has(id)) return;

    const gain = this.ctx!.createGain();
    gain.gain.value = 0;
    gain.connect(this.masterGain!);
    this.ambientGains.set(id, gain);
    
    // We'll use a 4-second buffer to allow for interesting rhythms
    const bufferSize = this.ctx!.sampleRate * 4;
    const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
    const output = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    let lastOut = 0;
    
    // For envelopes
    let envelope = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Pink noise base
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;

      // Brown noise base
      const brown = (lastOut + (0.02 * white)) / 1.02;
      lastOut = brown;

      if (id === 'rain') {
        // Softer rain using a mix of brown and pink
        output[i] = (pink * 0.8) + (brown * 1.2);
      } else if (id === 'ocean') {
        output[i] = brown * 5.0;
      } else if (id === 'wind') {
        output[i] = pink * 1.5;
      } else if (id === 'fireplace') {
        // Brown noise + random crackles with sharp envelope
        if (Math.random() > 0.9995) {
          envelope = 1.0; // Trigger crackle
        }
        envelope *= 0.995; // Decay
        output[i] = (brown * 2.0) + (white * envelope * 0.5);
      } else if (id === 'keyboard' || id === 'coffee') {
        // Simulating clicks/clatter with high-passed sparse noise
        const isClick = Math.random() > (id === 'keyboard' ? 0.999 : 0.998);
        if (isClick) {
          envelope = 1.0;
        }
        envelope *= (id === 'keyboard' ? 0.99 : 0.995); // Faster decay for keyboard
        output[i] = (white * envelope * 0.4) + (pink * 0.1); // Add slight background hum
      }
    }

    const source = this.ctx!.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Apply filters based on type
    const filter = this.ctx!.createBiquadFilter();
    let nodes: AudioNode[] = [source, filter];

    if (id === 'rain') {
      filter.type = 'bandpass';
      filter.frequency.value = 800;
      filter.Q.value = 0.3; // Wide band
    } else if (id === 'ocean') {
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      
      // LFO for waves
      const lfo = this.ctx!.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.08; // 12.5s per wave
      const lfoGain = this.ctx!.createGain();
      lfoGain.gain.value = 300;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      nodes.push(lfo, lfoGain);
    } else if (id === 'wind') {
      filter.type = 'bandpass';
      filter.frequency.value = 800;
      filter.Q.value = 0.8;
      
      // LFO for howling wind
      const lfo = this.ctx!.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.15; 
      const lfoGain = this.ctx!.createGain();
      lfoGain.gain.value = 500;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      nodes.push(lfo, lfoGain);
    } else if (id === 'fireplace') {
      filter.type = 'lowpass';
      filter.frequency.value = 1500;
    } else if (id === 'keyboard' || id === 'coffee') {
      filter.type = 'highpass';
      filter.frequency.value = 2000; // Keep it clicky
    } else {
      filter.type = 'allpass';
    }

    source.connect(filter);
    filter.connect(gain);
    source.start();
    
    this.ambientSources.set(id, nodes);
  }

  public setSyntheticVolume(id: string, volume: number) {
    if (!this.ctx) return;
    const gainNode = this.ambientGains.get(id);
    if (gainNode) {
      const now = this.ctx.currentTime;
      gainNode.gain.cancelScheduledValues(now);
      // Smooth 2 second fade for ambience
      gainNode.gain.linearRampToValueAtTime(volume / 100, now + 2.0);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
}

export const audioEngine = AudioEngine.getInstance();
