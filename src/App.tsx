import { useEffect, useCallback, useState } from 'react';
import { useAudioEngine } from './hooks/useAudioEngine';
import { useMotionSensor } from './hooks/useMotionSensor';
import { useRecorder } from './hooks/useRecorder';
import { Visualizer } from './components/Visualizer';
import { Controls } from './components/Controls';
import { DebugPanel, DebugData } from './components/DebugPanel';
import './App.css';

/**
 * Main Theremin App Component
 * 
 * Controls pitch and volume using phone accelerometer:
 * - Y-axis (up/down movement): Controls pitch
 * - X-axis (left/right movement): Controls volume
 */
function App() {
  const [needsPermission, setNeedsPermission] = useState(false);
  const [normalizedPitch, setNormalizedPitch] = useState(0.5);
  const [normalizedVolume, setNormalizedVolume] = useState(0.5);
  
  // Audio engine hook
  const audioEngine = useAudioEngine();

  // Recorder hook - for playback we update audio parameters
  const recorder = useRecorder((pitch, volume) => {
    const frequency = mapPitchToFrequency(pitch);
    audioEngine.setPitch(frequency);
    audioEngine.setVolume(volume);
    setNormalizedPitch(pitch);
    setNormalizedVolume(volume);
  });

  /**
   * Map normalized pitch (0-1) to frequency (Hz)
   * Default range: 200Hz - 2000Hz (adjustable)
   * 
   * To change pitch range, modify MIN_FREQ and MAX_FREQ
   */
  const mapPitchToFrequency = (pitch: number): number => {
    const MIN_FREQ = 200;  // Low frequency (left tilt)
    const MAX_FREQ = 2000; // High frequency (right tilt)
    
    // Logarithmic scale feels more natural for pitch
    const logMin = Math.log(MIN_FREQ);
    const logMax = Math.log(MAX_FREQ);
    const logFreq = logMin + pitch * (logMax - logMin);
    
    return Math.exp(logFreq);
  };

  /**
   * Handle motion sensor updates
   */
  const handleMotionUpdate = useCallback((data: { pitch: number; volume: number }) => {
    const frequency = mapPitchToFrequency(data.pitch);
    
    // Update audio engine
    audioEngine.setPitch(frequency);
    audioEngine.setVolume(data.volume);
    
    // Update state for visualization
    setNormalizedPitch(data.pitch);
    setNormalizedVolume(data.volume);
    
    // Record if recording is active
    if (recorder.isRecording) {
      recorder.recordFrame(data.pitch, data.volume);
    }
  }, [audioEngine, recorder]);

  // Motion sensor hook
  const motionSensor = useMotionSensor(handleMotionUpdate);

  // Combine debug data from motion sensor and audio engine
  const debugData: DebugData = {
    ...motionSensor.debugData,
    frequency: audioEngine.pitch,
    volume: audioEngine.volume
  };

  /**
   * Start theremin (request permissions and start audio)
   */
  const handleStart = async () => {
    // First, start audio (required for iOS)
    await audioEngine.start();
    
    // Then request motion permission
    if (!motionSensor.permissionGranted) {
      await motionSensor.requestPermission();
    }
    
    // Check if we need to show permission instructions
    if (motionSensor.permissionState === 'denied') {
      setNeedsPermission(true);
    }
  };

  /**
   * Handle recording playback
   */
  const handlePlayRecording = async () => {
    // Stop current theremin
    audioEngine.stop();
    
    // Start audio context
    await audioEngine.start();
    
    // Play the recording
    recorder.playRecording();
  };

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      audioEngine.cleanup();
      recorder.stopPlayback();
    };
  }, []);

  return (
    <div className="app">
      <div className="app-container">
        {/* Header */}
        <header className="app-header">
          <h1 className="app-title">🎵 Web Theremin</h1>
          <p className="app-subtitle">
            Control sound with your phone's motion
          </p>
        </header>

        {/* Instructions */}
        {!audioEngine.isPlaying && !needsPermission && (
          <div className="instructions">
            <div className="instruction-item">
              <span className="instruction-icon">📱</span>
              <span className="instruction-text">
                Move phone <strong>up/down</strong> to change pitch
              </span>
            </div>
            <div className="instruction-item">
              <span className="instruction-icon">🔊</span>
              <span className="instruction-text">
                Move phone <strong>left/right</strong> to change volume
              </span>
            </div>
            <div className="instruction-item">
              <span className="instruction-icon">🎼</span>
              <span className="instruction-text">
                Press <strong>Start</strong> to begin
              </span>
            </div>
          </div>
        )}

        {/* Permission denied message */}
        {needsPermission && (
          <div className="permission-message">
            <h3>Motion Permission Required</h3>
            <p>
              To use the theremin, you need to allow motion sensor access.
            </p>
            <p className="permission-instructions">
              <strong>On iOS:</strong> Go to Settings → Safari → Motion & Orientation Access
            </p>
            <p className="permission-instructions">
              <strong>On Android:</strong> Make sure location services are enabled
            </p>
          </div>
        )}

        {/* Visualizer */}
        <div className="visualizer-section">
          <Visualizer
            pitch={normalizedPitch}
            volume={normalizedVolume}
            frequency={audioEngine.pitch}
            isPlaying={audioEngine.isPlaying || recorder.isPlayingBack}
          />
        </div>

        {/* Controls */}
        <div className="controls-section">
          <Controls
            isPlaying={audioEngine.isPlaying}
            isMuted={audioEngine.isMuted}
            waveform={audioEngine.waveform}
            isRecording={recorder.isRecording}
            hasRecording={recorder.hasRecording}
            onStart={handleStart}
            onStop={audioEngine.stop}
            onToggleMute={audioEngine.toggleMute}
            onWaveformChange={audioEngine.setWaveform}
            onStartRecording={recorder.startRecording}
            onStopRecording={recorder.stopRecording}
            onPlayRecording={handlePlayRecording}
          />
        </div>

        {/* Footer info */}
        <footer className="app-footer">
          <p>
            {motionSensor.isSupported
              ? motionSensor.permissionGranted
                ? '✅ Motion sensors active'
                : '⚠️ Motion permission needed'
              : '❌ Motion sensors not supported'}
          </p>
          {recorder.isRecording && (
            <p className="recording-indicator">🔴 Recording...</p>
          )}
          {recorder.isPlayingBack && (
            <p className="recording-indicator">▶️ Playing back...</p>
          )}
        </footer>
      </div>

      {/* Debug Panel */}
      <DebugPanel data={debugData} />
    </div>
  );
}

export default App;

