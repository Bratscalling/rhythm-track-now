
import { useState, useEffect } from 'react';
import { Playlist, VideoData } from '@/types/playlist';

export const usePlaylist = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);

  // Load playlists from localStorage on mount
  useEffect(() => {
    const savedPlaylists = localStorage.getItem('user_playlists');
    if (savedPlaylists) {
      try {
        const parsed = JSON.parse(savedPlaylists);
        setPlaylists(parsed.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt)
        })));
      } catch (error) {
        console.error('Error loading playlists:', error);
      }
    }
  }, []);

  // Save playlists to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('user_playlists', JSON.stringify(playlists));
  }, [playlists]);

  const createPlaylist = (name: string, description?: string): Playlist => {
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name,
      description,
      songs: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setPlaylists(prev => [...prev, newPlaylist]);
    return newPlaylist;
  };

  const deletePlaylist = (playlistId: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== playlistId));
    if (currentPlaylist?.id === playlistId) {
      setCurrentPlaylist(null);
    }
  };

  const addSongToPlaylist = (playlistId: string, song: VideoData) => {
    setPlaylists(prev => prev.map(playlist => {
      if (playlist.id === playlistId) {
        // Check if song already exists
        const songExists = playlist.songs.some(s => s.id === song.id);
        if (songExists) {
          return playlist;
        }
        
        return {
          ...playlist,
          songs: [...playlist.songs, song],
          updatedAt: new Date()
        };
      }
      return playlist;
    }));
  };

  const removeSongFromPlaylist = (playlistId: string, songId: string) => {
    setPlaylists(prev => prev.map(playlist => {
      if (playlist.id === playlistId) {
        return {
          ...playlist,
          songs: playlist.songs.filter(s => s.id !== songId),
          updatedAt: new Date()
        };
      }
      return playlist;
    }));
  };

  const updatePlaylist = (playlistId: string, updates: Partial<Pick<Playlist, 'name' | 'description'>>) => {
    setPlaylists(prev => prev.map(playlist => {
      if (playlist.id === playlistId) {
        return {
          ...playlist,
          ...updates,
          updatedAt: new Date()
        };
      }
      return playlist;
    }));
  };

  return {
    playlists,
    currentPlaylist,
    setCurrentPlaylist,
    createPlaylist,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    updatePlaylist
  };
};
