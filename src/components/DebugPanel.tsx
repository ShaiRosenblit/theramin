import { useState } from 'react';
import './DebugPanel.css';

export interface DebugData {
  // State
  calibrationStatus: 'pending' | 'calibrating' | 'complete';
  calibrationProgress: number; // 0-100
  
  // Position estimates (0-1 normalized)
  pitchPosition: number;
  volumePosition: number;
  
  // Velocity
  pitchVelocity: number;
  volumeVelocity: number;
  
  // Raw acceleration (with gravity removed)
  accelX: number;
  accelY: number;
  accelZ: number;
  
  // Raw acceleration (including gravity)
  rawAccelX: number;
  rawAccelY: number;
  rawAccelZ: number;
  
  // Calibration baseline (gravity vector)
  calibrationX: number;
  calibrationY: number;
  calibrationZ: number;
  
  // Smoothed acceleration
  smoothedX: number;
  smoothedY: number;
  
  // Rotation (if available)
  rotationAlpha: number | null;
  rotationBeta: number | null;
  rotationGamma: number | null;
  
  // Audio
  frequency: number;
  volume: number;
  
  // Performance
  updateRate: number; // Hz
  lastUpdateTime: number;
}

interface DebugPanelProps {
  data: DebugData;
}

export const DebugPanel = ({ data }: DebugPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatNumber = (num: number | null, decimals: number = 2): string => {
    if (num === null) return 'N/A';
    return num.toFixed(decimals);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'complete': return '#4ade80';
      case 'calibrating': return '#fbbf24';
      case 'pending': return '#94a3b8';
      default: return '#94a3b8';
    }
  };

  return (
    <div className={`debug-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <button 
        className="debug-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label={isExpanded ? 'Hide debug panel' : 'Show debug panel'}
      >
        {isExpanded ? '▼' : '▲'} Debug Info
      </button>
      
      {isExpanded && (
        <div className="debug-content">
          {/* Calibration Status */}
          <section className="debug-section">
            <h3 className="debug-section-title">Status</h3>
            <div className="debug-grid">
              <div className="debug-item">
                <span className="debug-label">Calibration:</span>
                <span 
                  className="debug-value"
                  style={{ color: getStatusColor(data.calibrationStatus) }}
                >
                  {data.calibrationStatus.toUpperCase()}
                </span>
              </div>
              <div className="debug-item">
                <span className="debug-label">Progress:</span>
                <span className="debug-value">{data.calibrationProgress}%</span>
              </div>
              <div className="debug-item">
                <span className="debug-label">Update Rate:</span>
                <span className="debug-value">{formatNumber(data.updateRate, 1)} Hz</span>
              </div>
            </div>
          </section>

          {/* Position & Velocity */}
          <section className="debug-section">
            <h3 className="debug-section-title">Position & Velocity</h3>
            <div className="debug-grid">
              <div className="debug-item">
                <span className="debug-label">Pitch Position:</span>
                <span className="debug-value">{formatNumber(data.pitchPosition, 3)}</span>
                <div className="debug-bar">
                  <div 
                    className="debug-bar-fill" 
                    style={{ width: `${data.pitchPosition * 100}%` }}
                  />
                </div>
              </div>
              <div className="debug-item">
                <span className="debug-label">Pitch Velocity:</span>
                <span className="debug-value">{formatNumber(data.pitchVelocity, 4)}</span>
              </div>
              <div className="debug-item">
                <span className="debug-label">Volume Position:</span>
                <span className="debug-value">{formatNumber(data.volumePosition, 3)}</span>
                <div className="debug-bar">
                  <div 
                    className="debug-bar-fill" 
                    style={{ width: `${data.volumePosition * 100}%` }}
                  />
                </div>
              </div>
              <div className="debug-item">
                <span className="debug-label">Volume Velocity:</span>
                <span className="debug-value">{formatNumber(data.volumeVelocity, 4)}</span>
              </div>
            </div>
          </section>

          {/* Raw Acceleration (with gravity) */}
          <section className="debug-section">
            <h3 className="debug-section-title">Raw Acceleration (with gravity)</h3>
            <div className="debug-grid">
              <div className="debug-item">
                <span className="debug-label">X:</span>
                <span className="debug-value">{formatNumber(data.rawAccelX, 3)} m/s²</span>
              </div>
              <div className="debug-item">
                <span className="debug-label">Y:</span>
                <span className="debug-value">{formatNumber(data.rawAccelY, 3)} m/s²</span>
              </div>
              <div className="debug-item">
                <span className="debug-label">Z:</span>
                <span className="debug-value">{formatNumber(data.rawAccelZ, 3)} m/s²</span>
              </div>
              <div className="debug-item">
                <span className="debug-label">Magnitude:</span>
                <span className="debug-value">
                  {formatNumber(Math.sqrt(
                    data.rawAccelX ** 2 + 
                    data.rawAccelY ** 2 + 
                    data.rawAccelZ ** 2
                  ), 3)} m/s²
                </span>
              </div>
            </div>
          </section>

          {/* Calibration Baseline (Gravity) */}
          <section className="debug-section">
            <h3 className="debug-section-title">Calibration Baseline (Gravity)</h3>
            <div className="debug-grid">
              <div className="debug-item">
                <span className="debug-label">X:</span>
                <span className="debug-value">{formatNumber(data.calibrationX, 3)} m/s²</span>
              </div>
              <div className="debug-item">
                <span className="debug-label">Y:</span>
                <span className="debug-value">{formatNumber(data.calibrationY, 3)} m/s²</span>
              </div>
              <div className="debug-item">
                <span className="debug-label">Z:</span>
                <span className="debug-value">{formatNumber(data.calibrationZ, 3)} m/s²</span>
              </div>
            </div>
          </section>

          {/* Motion Acceleration (gravity removed) */}
          <section className="debug-section">
            <h3 className="debug-section-title">Motion Acceleration (gravity removed)</h3>
            <div className="debug-grid">
              <div className="debug-item">
                <span className="debug-label">X (L/R):</span>
                <span className="debug-value">{formatNumber(data.accelX, 3)} m/s²</span>
              </div>
              <div className="debug-item">
                <span className="debug-label">Y (U/D):</span>
                <span className="debug-value">{formatNumber(data.accelY, 3)} m/s²</span>
              </div>
              <div className="debug-item">
                <span className="debug-label">Z (F/B):</span>
                <span className="debug-value">{formatNumber(data.accelZ, 3)} m/s²</span>
              </div>
            </div>
          </section>

          {/* Smoothed Acceleration */}
          <section className="debug-section">
            <h3 className="debug-section-title">Smoothed Acceleration</h3>
            <div className="debug-grid">
              <div className="debug-item">
                <span className="debug-label">X (Volume):</span>
                <span className="debug-value">{formatNumber(data.smoothedX, 3)} m/s²</span>
              </div>
              <div className="debug-item">
                <span className="debug-label">Y (Pitch):</span>
                <span className="debug-value">{formatNumber(data.smoothedY, 3)} m/s²</span>
              </div>
            </div>
          </section>

          {/* Device Orientation */}
          <section className="debug-section">
            <h3 className="debug-section-title">Device Orientation</h3>
            <div className="debug-grid">
              <div className="debug-item">
                <span className="debug-label">Alpha (Z-axis):</span>
                <span className="debug-value">{formatNumber(data.rotationAlpha, 1)}°</span>
              </div>
              <div className="debug-item">
                <span className="debug-label">Beta (X-axis):</span>
                <span className="debug-value">{formatNumber(data.rotationBeta, 1)}°</span>
              </div>
              <div className="debug-item">
                <span className="debug-label">Gamma (Y-axis):</span>
                <span className="debug-value">{formatNumber(data.rotationGamma, 1)}°</span>
              </div>
            </div>
          </section>

          {/* Audio Output */}
          <section className="debug-section">
            <h3 className="debug-section-title">Audio Output</h3>
            <div className="debug-grid">
              <div className="debug-item">
                <span className="debug-label">Frequency:</span>
                <span className="debug-value">{formatNumber(data.frequency, 1)} Hz</span>
              </div>
              <div className="debug-item">
                <span className="debug-label">Volume:</span>
                <span className="debug-value">{formatNumber(data.volume, 3)}</span>
              </div>
            </div>
          </section>

          {/* Timestamp */}
          <div className="debug-timestamp">
            Last update: {new Date(data.lastUpdateTime).toLocaleTimeString()}.{(data.lastUpdateTime % 1000).toString().padStart(3, '0')}
          </div>
        </div>
      )}
    </div>
  );
};

