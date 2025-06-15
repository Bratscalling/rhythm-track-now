
import { useState, useEffect } from 'react';
import { VideoData } from '@/types/playlist';

export const useFavorites = (userId?: string) => {
  const [favorites, setFavorites] = useState<VideoData[]>([]);

  // Load user-specific favorites from localStorage
  useEffect(() => {
    if (!userId) return;
    
    const userFavoritesKey = `user_favorites_${userId}`;
    const savedFavorites = localStorage.getItem(userFavoritesKey);
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    }
  }, [userId]);

  // Save favorites to localStorage
  useEffect(() => {
    if (!userId) return;
    
    const userFavoritesKey = `user_favorites_${userId}`;
    localStorage.setItem(userFavoritesKey, JSON.stringify(favorites));
  }, [favorites, userId]);

  const addToFavorites = (song: VideoData) => {
    setFavorites(prev => {
      const exists = prev.some(s => s.id === song.id);
      if (exists) return prev;
      return [...prev, song];
    });
  };

  const removeFromFavorites = (songId: string) => {
    setFavorites(prev => prev.filter(s => s.id !== songId));
  };

  const isFavorite = (songId: string) => {
    return favorites.some(s => s.id === songId);
  };

  const toggleFavorite = (song: VideoData) => {
    if (isFavorite(song.id)) {
      removeFromFavorites(song.id);
    } else {
      addToFavorites(song);
    }
  };

  return {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    toggleFavorite
  };
};
