# 🎵 Web Theremin

A web-based theremin app that uses your phone's accelerometer and gyroscope to control sound. Tilt your device to create music!

![Web Theremin Demo](https://img.shields.io/badge/status-ready-brightgreen) ![React](https://img.shields.io/badge/react-18.2.0-blue) ![TypeScript](https://img.shields.io/badge/typescript-5.2.2-blue)

## Features

### Core Features ✅
- **Web Audio API**: Continuous sound generation using oscillators
- **Motion Control**: Use your phone's accelerometer/gyroscope to control:
  - **Pitch**: Tilt left/right (gamma axis)
  - **Volume**: Tilt forward/back (beta axis)
- **Visual Feedback**: Real-time visualization of pitch and volume
- **Mute Control**: Quickly mute/unmute the sound
- **Mobile-First**: Optimized for iOS Safari and Android Chrome

### Stretch Features ✅
- **Waveform Selector**: Choose between sine, square, triangle, and sawtooth waves
- **Audio Effects**: Built-in reverb and delay effects
- **Recording**: Record and play back your performances
- **Motion Smoothing**: Low-pass filter for stable, smooth control

## How to Use

### Running Locally

1. **Install dependencies**:
```bash
npm install
```

2. **Start the development server**:
```bash
npm run dev
```

3. **Access from your phone**:
   - The server will display a network URL (e.g., `http://192.168.1.x:3000`)
   - Open this URL on your phone's browser
   - Make sure your phone and computer are on the same WiFi network

4. **Build for production**:
```bash
npm run build
npm run preview
```

### Enabling Motion Sensors on iPhone

**iOS 13+ requires explicit permission for motion sensors:**

1. Open **Settings** on your iPhone
2. Scroll down and tap **Safari**
3. Under "Settings for Websites", find **Motion & Orientation Access**
4. Toggle it **ON**

Alternatively, when you press "Start Theremin", Safari may prompt you to allow motion access - tap **Allow**.

### Using on Android

Android browsers typically allow motion sensors by default. If not working:

1. Make sure **Location Services** are enabled
2. Grant location permission to your browser when prompted
3. Use Chrome or Firefox for best compatibility

## How to Play

1. **Press "Start Theremin"** - This initializes the audio context (required by browsers)
2. **Allow motion access** when prompted
3. **Tilt your phone**:
   - **Left/Right**: Changes pitch (frequency)
   - **Forward/Back**: Changes volume (loudness)
4. **Experiment with waveforms**: Try different sound types (sine, square, triangle, sawtooth)
5. **Record your performance**: Hit the Record button to save your motions, then play them back!

## Adjusting Parameters

### Pitch Range

Edit `src/App.tsx`, function `mapPitchToFrequency()`:

```typescript
const MIN_FREQ = 200;  // Change this for lower starting pitch
const MAX_FREQ = 2000; // Change this for higher ending pitch
```

### Volume Sensitivity

Edit `src/hooks/useMotionSensor.ts`, function `normalizeBeta()`:

```typescript
// Adjust these values to change volume range
const adjustedBeta = beta - 30;  // Offset for natural holding position
const clampedBeta = Math.max(-30, Math.min(60, adjustedBeta));
```

### Motion Smoothing

Edit `src/hooks/useMotionSensor.ts`, smoothing filter alpha values:

```typescript
const pitchFilterRef = useRef<SmoothingFilter>({ alpha: 0.2, prevValue: 0.5 });
const volumeFilterRef = useRef<SmoothingFilter>({ alpha: 0.2, prevValue: 0.5 });
```

- Lower `alpha` (e.g., 0.1) = More smoothing, less responsive
- Higher `alpha` (e.g., 0.5) = Less smoothing, more responsive

### Effect Levels

Edit `src/hooks/useAudioEngine.ts`, in `initAudio()`:

```typescript
// Delay settings
delayNode.delayTime.value = 0.3; // Delay time in seconds
delayFeedback.gain.value = 0.3;  // Feedback amount (0-1)

// Wet/Dry mix
dryGain.gain.value = 0.7; // Dry signal (0-1)
wetGain.gain.value = 0.3; // Wet signal (0-1)
```

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Web Audio API** - Sound generation
- **DeviceOrientation API** - Motion sensing

## Browser Compatibility

| Browser | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| Chrome | ✅ | ✅ | Full support |
| Safari | ✅ | ✅ | Requires motion permission (iOS 13+) |
| Firefox | ✅ | ✅ | Full support |
| Edge | ✅ | ✅ | Full support |

## Architecture

### Hooks

- `useAudioEngine.ts` - Manages Web Audio API (oscillator, gain, effects)
- `useMotionSensor.ts` - Handles DeviceOrientation events with smoothing
- `useRecorder.ts` - Records and plays back performances

### Components

- `App.tsx` - Main application orchestrator
- `Visualizer.tsx` - Visual feedback for pitch/volume
- `Controls.tsx` - UI controls (start, stop, mute, waveform, recording)

## Troubleshooting

### No sound on mobile?
- Tap the "Start Theremin" button (required for audio context)
- Check that your phone is not on silent mode
- Try increasing volume

### Motion sensors not working?
- **iOS**: Check Settings → Safari → Motion & Orientation Access
- **Android**: Enable location services
- Try refreshing the page
- Some browsers may require HTTPS (use ngrok or similar for testing)

### Choppy/glitchy sound?
- Reduce the smoothing alpha value for more stable motion
- Close other apps to free up resources
- Try a different waveform (sine is most CPU-efficient)

## Live Coding Tips

This app is designed for easy experimentation:

1. **Change pitch mapping**: Modify `mapPitchToFrequency()` for different scales
2. **Add new waveforms**: Extend the `WaveformType` type
3. **Adjust effects**: Tweak reverb/delay parameters in `useAudioEngine.ts`
4. **Change motion axes**: Swap beta/gamma mappings in `useMotionSensor.ts`
5. **Customize UI**: Edit CSS files for different visual styles

## License

MIT - Feel free to use this for any purpose!

## Credits

Built with ❤️ using Web Audio API and device motion sensors.

---

**Enjoy making music with motion!** 🎶📱

