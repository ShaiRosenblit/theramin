import { useEffect, useCallback, useRef, useState } from 'react';

interface MotionData {
  pitch: number;  // 0-1 normalized value for pitch control
  volume: number; // 0-1 normalized value for volume control
  rawGamma: number; // Left-right tilt (-90 to 90)
  rawBeta: number;  // Forward-back tilt (-180 to 180)
}

interface SmoothingFilter {
  alpha: number; // Smoothing factor (0-1), lower = more smoothing
  prevValue: number;
}

/**
 * Custom hook to handle device motion/orientation sensors
 * 
 * Mappings:
 * - Gamma (left-right tilt): Controls pitch
 *   Left tilt (-90°) = low pitch, Right tilt (90°) = high pitch
 * 
 * - Beta (forward-back tilt): Controls volume
 *   Forward tilt (negative) = low volume, Back tilt (positive) = high volume
 */
export const useMotionSensor = (onMotionUpdate: (data: MotionData) => void) => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionState, setPermissionState] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [isSupported, setIsSupported] = useState(true);
  
  // Smoothing filters for each axis
  const pitchFilterRef = useRef<SmoothingFilter>({ alpha: 0.2, prevValue: 0.5 });
  const volumeFilterRef = useRef<SmoothingFilter>({ alpha: 0.2, prevValue: 0.5 });

  /**
   * Apply low-pass filter for smooth motion data
   * Formula: output = alpha * input + (1 - alpha) * previousOutput
   */
  const applySmoothing = (filter: SmoothingFilter, newValue: number): number => {
    const smoothed = filter.alpha * newValue + (1 - filter.alpha) * filter.prevValue;
    filter.prevValue = smoothed;
    return smoothed;
  };

  /**
   * Normalize gamma (left-right tilt) to 0-1 range for pitch
   * Gamma ranges from -90 (left) to +90 (right)
   * We map -45 to +45 degrees for better control
   */
  const normalizeGamma = (gamma: number): number => {
    const clampedGamma = Math.max(-45, Math.min(45, gamma));
    return (clampedGamma + 45) / 90; // Maps -45..45 to 0..1
  };

  /**
   * Normalize beta (forward-back tilt) to 0-1 range for volume
   * Beta ranges from -180 to +180
   * We use 0 to 60 degrees (natural holding position to back tilt)
   */
  const normalizeBeta = (beta: number): number => {
    // Adjust for natural phone holding position (around 30-45 degrees)
    const adjustedBeta = beta - 30;
    const clampedBeta = Math.max(-30, Math.min(60, adjustedBeta));
    return (clampedBeta + 30) / 90; // Maps -30..60 to 0..1
  };

  /**
   * Handle device orientation events
   */
  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    const { beta, gamma } = event;
    
    if (beta === null || gamma === null) return;

    // Normalize values
    const normalizedPitch = normalizeGamma(gamma);
    const normalizedVolume = normalizeBeta(beta);

    // Apply smoothing filter
    const smoothedPitch = applySmoothing(pitchFilterRef.current, normalizedPitch);
    const smoothedVolume = applySmoothing(volumeFilterRef.current, normalizedVolume);

    onMotionUpdate({
      pitch: smoothedPitch,
      volume: smoothedVolume,
      rawGamma: gamma,
      rawBeta: beta
    });
  }, [onMotionUpdate]);

  /**
   * Request permission for device motion (iOS 13+)
   */
  const requestPermission = useCallback(async () => {
    // Check if permission API exists (iOS 13+)
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        
        if (permission === 'granted') {
          setPermissionGranted(true);
          setPermissionState('granted');
          window.addEventListener('deviceorientation', handleOrientation);
        } else {
          setPermissionState('denied');
        }
      } catch (error) {
        console.error('Error requesting device orientation permission:', error);
        setPermissionState('denied');
      }
    } else {
      // Non-iOS or older iOS, check if DeviceOrientationEvent is supported
      if ('DeviceOrientationEvent' in window) {
        setPermissionGranted(true);
        setPermissionState('granted');
        window.addEventListener('deviceorientation', handleOrientation);
      } else {
        setIsSupported(false);
        setPermissionState('denied');
      }
    }
  }, [handleOrientation]);

  /**
   * Cleanup event listeners
   */
  useEffect(() => {
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [handleOrientation]);

  return {
    permissionGranted,
    permissionState,
    isSupported,
    requestPermission
  };
};

