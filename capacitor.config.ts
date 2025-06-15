
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.520a64c5fc6140a7ac447a1146f1c5af',
  appName: 'rhythm-track-now',
  webDir: 'dist',
  server: {
    url: 'https://520a64c5-fc61-40a7-ac44-7a1146f1c5af.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    BackgroundMode: {
      enabled: true,
      title: 'RhythmTrack is playing music',
      text: 'Background music playback active',
      silent: false
    }
  }
};

export default config;
