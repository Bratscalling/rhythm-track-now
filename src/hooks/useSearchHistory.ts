
import { useState, useEffect } from 'react';

export const useSearchHistory = (userId?: string) => {
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Load search history
  useEffect(() => {
    if (!userId) return;
    
    const userHistoryKey = `user_search_history_${userId}`;
    const savedHistory = localStorage.getItem(userHistoryKey);
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error loading search history:', error);
      }
    }
  }, [userId]);

  // Save search history
  useEffect(() => {
    if (!userId) return;
    
    const userHistoryKey = `user_search_history_${userId}`;
    localStorage.setItem(userHistoryKey, JSON.stringify(searchHistory));
  }, [searchHistory, userId]);

  const addToHistory = (query: string) => {
    if (!query.trim()) return;
    
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item !== query);
      return [query, ...filtered].slice(0, 10); // Keep only last 10 searches
    });
  };

  const clearHistory = () => {
    setSearchHistory([]);
  };

  const removeFromHistory = (query: string) => {
    setSearchHistory(prev => prev.filter(item => item !== query));
  };

  return {
    searchHistory,
    addToHistory,
    clearHistory,
    removeFromHistory
  };
};
