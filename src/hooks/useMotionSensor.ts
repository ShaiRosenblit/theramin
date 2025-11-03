import { useEffect, useCallback, useRef, useState } from 'react';

interface MotionData {
  pitch: number;  // 0-1 normalized value for pitch control
  volume: number; // 0-1 normalized value for volume control
  rawY: number;   // Raw Y acceleration (up/down)
  rawX: number;   // Raw X acceleration (left/right)
}

interface SmoothingFilter {
  alpha: number; // Smoothing factor (0-1), lower = more smoothing
  prevValue: number;
}

interface PositionTracker {
  position: number;    // Integrated position estimate
  velocity: number;    // Current velocity
  centeringForce: number; // Force pulling back to center
}

/**
 * Custom hook to handle device motion sensors
 * 
 * Mappings (Real Theremin-like):
 * - Y-axis acceleration (up/down movement): Controls pitch
 *   Lower = low pitch, Higher = high pitch
 * 
 * - X-axis acceleration (left/right movement): Controls volume
 *   Left = low volume, Right = high volume
 * 
 * Uses acceleration data to track physical position in space
 */
export const useMotionSensor = (onMotionUpdate: (data: MotionData) => void) => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionState, setPermissionState] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [isSupported, setIsSupported] = useState(true);
  
  // Position trackers for pitch (Y-axis) and volume (X-axis)
  const pitchTrackerRef = useRef<PositionTracker>({ 
    position: 0.5, 
    velocity: 0,
    centeringForce: 0.02 
  });
  const volumeTrackerRef = useRef<PositionTracker>({ 
    position: 0.5, 
    velocity: 0,
    centeringForce: 0.02 
  });
  
  // Smoothing filters for acceleration
  const accelYFilterRef = useRef<SmoothingFilter>({ alpha: 0.3, prevValue: 0 });
  const accelXFilterRef = useRef<SmoothingFilter>({ alpha: 0.3, prevValue: 0 });

  // Calibration - store initial gravity vector to remove it
  const calibrationRef = useRef<{ x: number; y: number; z: number } | null>(null);
  const calibrationSamplesRef = useRef<Array<{ x: number; y: number; z: number }>>([]);

  /**
   * Apply low-pass filter for smooth acceleration data
   */
  const applySmoothing = (filter: SmoothingFilter, newValue: number): number => {
    const smoothed = filter.alpha * newValue + (1 - filter.alpha) * filter.prevValue;
    filter.prevValue = smoothed;
    return smoothed;
  };

  /**
   * Update position based on acceleration
   * Uses physics integration with damping and centering force
   */
  const updatePosition = (
    tracker: PositionTracker, 
    acceleration: number, 
    dt: number = 1/60  // Assume ~60Hz update rate
  ): number => {
    // Sensitivity multiplier - adjust how responsive the theremin is
    const sensitivity = 0.08;
    
    // Apply acceleration to velocity
    tracker.velocity += acceleration * sensitivity * dt;
    
    // Apply damping (friction) to velocity
    const damping = 0.85;
    tracker.velocity *= damping;
    
    // Apply centering force (pulls position back to 0.5)
    const centeringAccel = (0.5 - tracker.position) * tracker.centeringForce;
    tracker.velocity += centeringAccel;
    
    // Update position
    tracker.position += tracker.velocity;
    
    // Clamp position to 0-1 range with soft boundaries
    if (tracker.position > 1.0) {
      tracker.position = 1.0;
      tracker.velocity *= -0.5; // Bounce back
    } else if (tracker.position < 0.0) {
      tracker.position = 0.0;
      tracker.velocity *= -0.5; // Bounce back
    }
    
    return tracker.position;
  };

  /**
   * Calibrate by averaging initial acceleration samples to find gravity vector
   */
  const calibrate = (x: number, y: number, z: number) => {
    calibrationSamplesRef.current.push({ x, y, z });
    
    // Take 30 samples for calibration (~0.5 seconds)
    if (calibrationSamplesRef.current.length >= 30) {
      const samples = calibrationSamplesRef.current;
      const avgX = samples.reduce((sum, s) => sum + s.x, 0) / samples.length;
      const avgY = samples.reduce((sum, s) => sum + s.y, 0) / samples.length;
      const avgZ = samples.reduce((sum, s) => sum + s.z, 0) / samples.length;
      
      calibrationRef.current = { x: avgX, y: avgY, z: avgZ };
      console.log('Calibration complete:', calibrationRef.current);
    }
  };

  /**
   * Handle device motion events
   */
  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    const accel = event.accelerationIncludingGravity;
    
    if (!accel || accel.x === null || accel.y === null || accel.z === null) return;

    // Calibrate if needed
    if (!calibrationRef.current) {
      calibrate(accel.x, accel.y, accel.z);
      return;
    }

    // Remove gravity from acceleration
    const x = accel.x - calibrationRef.current.x;
    const y = accel.y - calibrationRef.current.y;
    
    // Apply smoothing to reduce noise
    const smoothedY = applySmoothing(accelYFilterRef.current, y);
    const smoothedX = applySmoothing(accelXFilterRef.current, x);

    // Update positions based on acceleration
    // Y-axis: up/down movement controls pitch
    const pitch = updatePosition(pitchTrackerRef.current, smoothedY);
    
    // X-axis: left/right movement controls volume
    const volume = updatePosition(volumeTrackerRef.current, smoothedX);

    onMotionUpdate({
      pitch,
      volume,
      rawY: y,
      rawX: x
    });
  }, [onMotionUpdate]);

  /**
   * Request permission for device motion (iOS 13+)
   */
  const requestPermission = useCallback(async () => {
    // Reset calibration
    calibrationRef.current = null;
    calibrationSamplesRef.current = [];
    
    // Check if permission API exists (iOS 13+)
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        
        if (permission === 'granted') {
          setPermissionGranted(true);
          setPermissionState('granted');
          window.addEventListener('devicemotion', handleMotion);
        } else {
          setPermissionState('denied');
        }
      } catch (error) {
        console.error('Error requesting device motion permission:', error);
        setPermissionState('denied');
      }
    } else {
      // Non-iOS or older iOS, check if DeviceMotionEvent is supported
      if ('DeviceMotionEvent' in window) {
        setPermissionGranted(true);
        setPermissionState('granted');
        window.addEventListener('devicemotion', handleMotion);
      } else {
        setIsSupported(false);
        setPermissionState('denied');
      }
    }
  }, [handleMotion]);

  /**
   * Cleanup event listeners
   */
  useEffect(() => {
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [handleMotion]);

  return {
    permissionGranted,
    permissionState,
    isSupported,
    requestPermission
  };
};

