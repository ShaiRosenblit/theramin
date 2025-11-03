import React from 'react';
import './Visualizer.css';

interface VisualizerProps {
  pitch: number;    // 0-1 normalized
  volume: number;   // 0-1 normalized
  frequency: number; // Actual frequency in Hz
  isPlaying: boolean;
}

/**
 * Visual indicator component showing current pitch and volume
 * Displays a moving dot on a 2D plane where:
 * - X-axis represents pitch (left = low, right = high)
 * - Y-axis represents volume (bottom = quiet, top = loud)
 */
export const Visualizer: React.FC<VisualizerProps> = ({
  pitch,
  volume,
  frequency,
  isPlaying
}) => {
  // Calculate dot position (0-1 range to percentage)
  const xPos = pitch * 100;
  const yPos = (1 - volume) * 100; // Invert Y so high volume is at top

  return (
    <div className="visualizer-container">
      <div className="visualizer-info">
        <div className="info-item">
          <span className="info-label">Frequency:</span>
          <span className="info-value">{frequency.toFixed(1)} Hz</span>
        </div>
        <div className="info-item">
          <span className="info-label">Volume:</span>
          <span className="info-value">{(volume * 100).toFixed(0)}%</span>
        </div>
      </div>

      <div className="visualizer-grid">
        {/* Grid lines */}
        <div className="grid-lines">
          <div className="grid-line horizontal" style={{ top: '25%' }}></div>
          <div className="grid-line horizontal" style={{ top: '50%' }}></div>
          <div className="grid-line horizontal" style={{ top: '75%' }}></div>
          <div className="grid-line vertical" style={{ left: '25%' }}></div>
          <div className="grid-line vertical" style={{ left: '50%' }}></div>
          <div className="grid-line vertical" style={{ left: '75%' }}></div>
        </div>

        {/* Axis labels */}
        <div className="axis-label axis-x-left">Low Pitch</div>
        <div className="axis-label axis-x-right">High Pitch</div>
        <div className="axis-label axis-y-top">Loud</div>
        <div className="axis-label axis-y-bottom">Quiet</div>

        {/* Moving dot indicator */}
        <div
          className={`visualizer-dot ${isPlaying ? 'active' : ''}`}
          style={{
            left: `${xPos}%`,
            top: `${yPos}%`
          }}
        >
          <div className="dot-ripple"></div>
        </div>
      </div>
    </div>
  );
};

