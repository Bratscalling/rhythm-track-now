
import { useState, useEffect } from 'react';

export type RepeatMode = 'off' | 'one' | 'all';

export const usePlayerModes = (userId?: string) => {
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [originalPlaylist, setOriginalPlaylist] = useState<any[]>([]);

  // Load user preferences
  useEffect(() => {
    if (!userId) return;
    
    const userModesKey = `user_player_modes_${userId}`;
    const savedModes = localStorage.getItem(userModesKey);
    if (savedModes) {
      try {
        const parsed = JSON.parse(savedModes);
        setIsShuffled(parsed.isShuffled || false);
        setRepeatMode(parsed.repeatMode || 'off');
      } catch (error) {
        console.error('Error loading player modes:', error);
      }
    }
  }, [userId]);

  // Save preferences
  useEffect(() => {
    if (!userId) return;
    
    const userModesKey = `user_player_modes_${userId}`;
    localStorage.setItem(userModesKey, JSON.stringify({
      isShuffled,
      repeatMode
    }));
  }, [isShuffled, repeatMode, userId]);

  const toggleShuffle = (playlist: any[]) => {
    if (!isShuffled) {
      setOriginalPlaylist([...playlist]);
      setIsShuffled(true);
      return [...playlist].sort(() => Math.random() - 0.5);
    } else {
      setIsShuffled(false);
      return originalPlaylist.length > 0 ? originalPlaylist : playlist;
    }
  };

  const cycleRepeatMode = () => {
    const modes: RepeatMode[] = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setRepeatMode(modes[nextIndex]);
  };

  return {
    isShuffled,
    repeatMode,
    toggleShuffle,
    cycleRepeatMode,
    setOriginalPlaylist
  };
};
