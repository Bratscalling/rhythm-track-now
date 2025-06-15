
// Service Worker for background audio control
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Handle background sync for audio
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-audio') {
    event.waitUntil(handleBackgroundAudio());
  }
});

async function handleBackgroundAudio() {
  // Maintain audio state in background
  console.log('Handling background audio sync');
}

// Handle notification actions
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'play') {
    // Send message to client to play
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({ action: 'play' });
      });
    });
  } else if (event.action === 'pause') {
    // Send message to client to pause
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({ action: 'pause' });
      });
    });
  } else if (event.action === 'next') {
    // Send message to client to skip next
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({ action: 'next' });
      });
    });
  } else {
    // Default action - open the app
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});
