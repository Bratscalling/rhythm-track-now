
import { useState, useEffect } from 'react';
import { VideoData } from '@/types/playlist';

interface ListeningHistoryItem extends VideoData {
  playedAt: Date;
  playCount: number;
}

export const useListeningHistory = (userId?: string) => {
  const [listeningHistory, setListeningHistory] = useState<ListeningHistoryItem[]>([]);

  // Load listening history
  useEffect(() => {
    if (!userId) return;
    
    const userHistoryKey = `user_listening_history_${userId}`;
    const savedHistory = localStorage.getItem(userHistoryKey);
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setListeningHistory(parsed.map((item: any) => ({
          ...item,
          playedAt: new Date(item.playedAt)
        })));
      } catch (error) {
        console.error('Error loading listening history:', error);
      }
    }
  }, [userId]);

  // Save listening history
  useEffect(() => {
    if (!userId) return;
    
    const userHistoryKey = `user_listening_history_${userId}`;
    localStorage.setItem(userHistoryKey, JSON.stringify(listeningHistory));
  }, [listeningHistory, userId]);

  const addToHistory = (song: VideoData) => {
    setListeningHistory(prev => {
      const existingIndex = prev.findIndex(item => item.id === song.id);
      
      if (existingIndex >= 0) {
        // Update existing item
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          playedAt: new Date(),
          playCount: updated[existingIndex].playCount + 1
        };
        return updated;
      } else {
        // Add new item
        const newItem: ListeningHistoryItem = {
          ...song,
          playedAt: new Date(),
          playCount: 1
        };
        return [newItem, ...prev].slice(0, 100); // Keep last 100 songs
      }
    });
  };

  const getMostPlayed = (limit = 10) => {
    return [...listeningHistory]
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, limit);
  };

  const getRecentlyPlayed = (limit = 20) => {
    return [...listeningHistory]
      .sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime())
      .slice(0, limit);
  };

  const clearHistory = () => {
    setListeningHistory([]);
  };

  return {
    listeningHistory,
    addToHistory,
    getMostPlayed,
    getRecentlyPlayed,
    clearHistory
  };
};
