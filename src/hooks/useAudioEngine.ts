import { useRef, useCallback, useState } from 'react';

export type WaveformType = 'sine' | 'square' | 'triangle' | 'sawtooth';

interface AudioEngineState {
  isPlaying: boolean;
  isMuted: boolean;
  pitch: number;
  volume: number;
  waveform: WaveformType;
}

/**
 * Custom hook to manage Web Audio API for theremin sound generation
 * 
 * Pitch mapping: Typically 200Hz - 2000Hz (adjustable)
 * Volume mapping: 0.0 - 1.0
 */
export const useAudioEngine = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const reverbNodeRef = useRef<ConvolverNode | null>(null);
  const delayNodeRef = useRef<DelayNode | null>(null);
  const delayFeedbackRef = useRef<GainNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  
  const [state, setState] = useState<AudioEngineState>({
    isPlaying: false,
    isMuted: false,
    pitch: 440,
    volume: 0.5,
    waveform: 'sine'
  });

  /**
   * Initialize the audio context and nodes
   * Must be called after user interaction (iOS/Android requirement)
   */
  const initAudio = useCallback(async () => {
    if (audioContextRef.current) return;

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;

    // Create oscillator (sound source)
    const oscillator = audioContext.createOscillator();
    oscillator.type = state.waveform;
    oscillator.frequency.value = state.pitch;
    oscillatorRef.current = oscillator;

    // Create gain node (volume control)
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0; // Start muted
    gainNodeRef.current = gainNode;

    // Create delay effect (echo)
    const delayNode = audioContext.createDelay();
    delayNode.delayTime.value = 0.3; // 300ms delay
    delayNodeRef.current = delayNode;

    const delayFeedback = audioContext.createGain();
    delayFeedback.gain.value = 0.3; // Feedback amount
    delayFeedbackRef.current = delayFeedback;

    // Create reverb (convolver)
    const reverbNode = audioContext.createConvolver();
    reverbNodeRef.current = reverbNode;
    
    // Generate impulse response for reverb
    await generateReverb(audioContext, reverbNode);

    // Create master gain (for mute functionality)
    const masterGain = audioContext.createGain();
    masterGain.gain.value = 1.0;
    masterGainRef.current = masterGain;

    // Create wet/dry mix for effects
    const dryGain = audioContext.createGain();
    dryGain.gain.value = 0.7; // 70% dry signal
    const wetGain = audioContext.createGain();
    wetGain.gain.value = 0.3; // 30% wet signal

    // Audio routing:
    // oscillator -> gainNode -> [dry path -> masterGain]
    //                        -> [delay feedback loop]
    //                        -> [reverb -> wetGain -> masterGain]
    //                        -> destination
    oscillator.connect(gainNode);
    
    // Dry path
    gainNode.connect(dryGain);
    dryGain.connect(masterGain);
    
    // Delay path with feedback
    gainNode.connect(delayNode);
    delayNode.connect(delayFeedback);
    delayFeedback.connect(delayNode); // Feedback loop
    delayNode.connect(wetGain);
    
    // Reverb path
    gainNode.connect(reverbNode);
    reverbNode.connect(wetGain);
    
    wetGain.connect(masterGain);
    masterGain.connect(audioContext.destination);

    // Start the oscillator (it runs continuously, volume controls on/off)
    oscillator.start();

    return audioContext;
  }, [state.waveform, state.pitch]);

  /**
   * Generate impulse response for reverb effect
   */
  const generateReverb = async (
    audioContext: AudioContext,
    reverbNode: ConvolverNode
  ) => {
    const sampleRate = audioContext.sampleRate;
    const length = sampleRate * 2; // 2 second reverb
    const impulse = audioContext.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        // Exponential decay for natural reverb sound
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }
    
    reverbNode.buffer = impulse;
  };

  /**
   * Start playing the theremin
   */
  const start = useCallback(async () => {
    await initAudio();
    
    if (gainNodeRef.current && !state.isMuted) {
      // Smooth ramp to avoid clicking
      gainNodeRef.current.gain.setTargetAtTime(
        state.volume,
        audioContextRef.current!.currentTime,
        0.01
      );
    }
    
    setState(prev => ({ ...prev, isPlaying: true }));
  }, [initAudio, state.volume, state.isMuted]);

  /**
   * Stop playing the theremin
   */
  const stop = useCallback(() => {
    if (gainNodeRef.current) {
      // Smooth ramp to avoid clicking
      gainNodeRef.current.gain.setTargetAtTime(
        0,
        audioContextRef.current!.currentTime,
        0.01
      );
    }
    
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  /**
   * Toggle mute state
   */
  const toggleMute = useCallback(() => {
    const newMuted = !state.isMuted;
    
    if (masterGainRef.current) {
      masterGainRef.current.gain.setTargetAtTime(
        newMuted ? 0 : 1,
        audioContextRef.current!.currentTime,
        0.01
      );
    }
    
    setState(prev => ({ ...prev, isMuted: newMuted }));
  }, [state.isMuted]);

  /**
   * Update pitch (frequency in Hz)
   * Typical range: 200Hz - 2000Hz
   * Middle A4 = 440Hz
   */
  const setPitch = useCallback((frequency: number) => {
    if (oscillatorRef.current) {
      // Smooth frequency change to avoid glitches
      oscillatorRef.current.frequency.setTargetAtTime(
        frequency,
        audioContextRef.current!.currentTime,
        0.005
      );
    }
    
    setState(prev => ({ ...prev, pitch: frequency }));
  }, []);

  /**
   * Update volume (0.0 - 1.0)
   */
  const setVolume = useCallback((vol: number) => {
    const clampedVol = Math.max(0, Math.min(1, vol));
    
    if (gainNodeRef.current && state.isPlaying) {
      gainNodeRef.current.gain.setTargetAtTime(
        clampedVol,
        audioContextRef.current!.currentTime,
        0.01
      );
    }
    
    setState(prev => ({ ...prev, volume: clampedVol }));
  }, [state.isPlaying]);

  /**
   * Change waveform type
   */
  const setWaveform = useCallback((type: WaveformType) => {
    if (oscillatorRef.current) {
      oscillatorRef.current.type = type;
    }
    
    setState(prev => ({ ...prev, waveform: type }));
  }, []);

  /**
   * Cleanup on unmount
   */
  const cleanup = useCallback(() => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  }, []);

  return {
    ...state,
    start,
    stop,
    toggleMute,
    setPitch,
    setVolume,
    setWaveform,
    cleanup
  };
};

