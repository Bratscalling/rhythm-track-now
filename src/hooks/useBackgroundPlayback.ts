
import { useEffect, useCallback } from 'react';
import { VideoData } from '@/types/playlist';

export const useBackgroundPlayback = () => {
  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered:', registration);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  // Listen for messages from service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { action } = event.data;
        
        // Dispatch custom events that components can listen to
        switch (action) {
          case 'play':
            window.dispatchEvent(new CustomEvent('background-play'));
            break;
          case 'pause':
            window.dispatchEvent(new CustomEvent('background-pause'));
            break;
          case 'next':
            window.dispatchEvent(new CustomEvent('background-next'));
            break;
        }
      });
    }
  }, []);

  const showMediaNotification = useCallback((video: VideoData, isPlaying: boolean) => {
    if ('Notification' in window) {
      // Request permission if not granted
      if (Notification.permission === 'default') {
        Notification.requestPermission();
        return;
      }
      
      if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(`🎵 ${video.title}`, {
            body: `by ${video.channel}`,
            icon: video.thumbnail,
            badge: '/favicon.ico',
            tag: 'music-player',
            requireInteraction: true,
            actions: [
              {
                action: 'play',
                title: isPlaying ? '⏸️ Pause' : '▶️ Play',
                icon: '/favicon.ico'
              },
              {
                action: 'next',
                title: '⏭️ Next',
                icon: '/favicon.ico'
              }
            ],
            data: {
              videoId: video.id,
              action: 'music-control'
            }
          });
        });
      }
    }
  }, []);

  const setupMediaSession = useCallback((video: VideoData) => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: video.title,
        artist: video.channel,
        album: 'RhythmTrack',
        artwork: [
          { src: video.thumbnail, sizes: '96x96', type: 'image/jpeg' },
          { src: video.thumbnail, sizes: '128x128', type: 'image/jpeg' },
          { src: video.thumbnail, sizes: '192x192', type: 'image/jpeg' },
          { src: video.thumbnail, sizes: '256x256', type: 'image/jpeg' },
          { src: video.thumbnail, sizes: '384x384', type: 'image/jpeg' },
          { src: video.thumbnail, sizes: '512x512', type: 'image/jpeg' }
        ]
      });
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  return {
    showMediaNotification,
    setupMediaSession,
    requestNotificationPermission
  };
};
