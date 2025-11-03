import React from 'react';
import { WaveformType } from '../hooks/useAudioEngine';
import './Controls.css';

interface ControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  waveform: WaveformType;
  isRecording: boolean;
  hasRecording: boolean;
  onStart: () => void;
  onStop: () => void;
  onToggleMute: () => void;
  onWaveformChange: (waveform: WaveformType) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPlayRecording: () => void;
}

/**
 * Control panel component with buttons for theremin control
 */
export const Controls: React.FC<ControlsProps> = ({
  isPlaying,
  isMuted,
  waveform,
  isRecording,
  hasRecording,
  onStart,
  onStop,
  onToggleMute,
  onWaveformChange,
  onStartRecording,
  onStopRecording,
  onPlayRecording
}) => {
  const waveforms: WaveformType[] = ['sine', 'square', 'triangle', 'sawtooth'];

  return (
    <div className="controls-container">
      {/* Main control buttons */}
      <div className="main-controls">
        {!isPlaying ? (
          <button className="btn btn-primary btn-large" onClick={onStart}>
            🎵 Start Theremin
          </button>
        ) : (
          <button className="btn btn-danger btn-large" onClick={onStop}>
            ⏹️ Stop
          </button>
        )}

        <button
          className={`btn btn-secondary ${isMuted ? 'active' : ''}`}
          onClick={onToggleMute}
          disabled={!isPlaying}
        >
          {isMuted ? '🔇 Unmute' : '🔊 Mute'}
        </button>
      </div>

      {/* Waveform selector */}
      <div className="waveform-selector">
        <label className="selector-label">Waveform:</label>
        <div className="waveform-buttons">
          {waveforms.map((type) => (
            <button
              key={type}
              className={`btn btn-waveform ${waveform === type ? 'active' : ''}`}
              onClick={() => onWaveformChange(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Recording controls */}
      <div className="recording-controls">
        <label className="selector-label">Recording:</label>
        <div className="recording-buttons">
          {!isRecording ? (
            <button
              className="btn btn-record"
              onClick={onStartRecording}
              disabled={!isPlaying}
            >
              ⏺️ Record
            </button>
          ) : (
            <button className="btn btn-record-stop" onClick={onStopRecording}>
              ⏹️ Stop Recording
            </button>
          )}
          
          <button
            className="btn btn-play"
            onClick={onPlayRecording}
            disabled={!hasRecording || isRecording}
          >
            ▶️ Playback
          </button>
        </div>
      </div>
    </div>
  );
};

