import { useState, useRef, useCallback } from 'react';

interface RecordedFrame {
  timestamp: number;
  pitch: number;
  volume: number;
}

/**
 * Custom hook to record and playback theremin performances
 * Records pitch and volume values over time
 */
export const useRecorder = (
  onPlaybackFrame: (pitch: number, volume: number) => void
) => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [isPlayingBack, setIsPlayingBack] = useState(false);
  
  const recordingRef = useRef<RecordedFrame[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const playbackIntervalRef = useRef<number | null>(null);

  /**
   * Start recording pitch and volume values
   */
  const startRecording = useCallback(() => {
    recordingRef.current = [];
    recordingStartTimeRef.current = Date.now();
    setIsRecording(true);
    setHasRecording(false);
  }, []);

  /**
   * Record a frame (called continuously during recording)
   */
  const recordFrame = useCallback((pitch: number, volume: number) => {
    if (!isRecording) return;

    const timestamp = Date.now() - recordingStartTimeRef.current;
    recordingRef.current.push({ timestamp, pitch, volume });
  }, [isRecording]);

  /**
   * Stop recording
   */
  const stopRecording = useCallback(() => {
    setIsRecording(false);
    if (recordingRef.current.length > 0) {
      setHasRecording(true);
    }
  }, []);

  /**
   * Play back the recorded performance
   */
  const playRecording = useCallback(() => {
    if (recordingRef.current.length === 0) return;

    setIsPlayingBack(true);
    let frameIndex = 0;
    const startTime = Date.now();

    // Clear any existing playback
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
    }

    // Play back frames at recorded intervals
    playbackIntervalRef.current = window.setInterval(() => {
      const currentTime = Date.now() - startTime;
      
      // Find the frame that should be playing now
      while (
        frameIndex < recordingRef.current.length &&
        recordingRef.current[frameIndex].timestamp <= currentTime
      ) {
        const frame = recordingRef.current[frameIndex];
        onPlaybackFrame(frame.pitch, frame.volume);
        frameIndex++;
      }

      // Stop when all frames have been played
      if (frameIndex >= recordingRef.current.length) {
        if (playbackIntervalRef.current) {
          clearInterval(playbackIntervalRef.current);
          playbackIntervalRef.current = null;
        }
        setIsPlayingBack(false);
      }
    }, 16); // ~60fps
  }, [onPlaybackFrame]);

  /**
   * Stop playback
   */
  const stopPlayback = useCallback(() => {
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
    setIsPlayingBack(false);
  }, []);

  /**
   * Clear recorded data
   */
  const clearRecording = useCallback(() => {
    recordingRef.current = [];
    setHasRecording(false);
    stopPlayback();
  }, [stopPlayback]);

  return {
    isRecording,
    hasRecording,
    isPlayingBack,
    startRecording,
    recordFrame,
    stopRecording,
    playRecording,
    stopPlayback,
    clearRecording
  };
};

