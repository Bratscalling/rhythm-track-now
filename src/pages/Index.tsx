import { useState, useRef, useEffect } from 'react';
import { Search, Play, Pause, Volume2, SkipForward, SkipBack, Heart, Plus, Shuffle, ListMusic, BarChart3, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { PlaylistDialog } from '@/components/PlaylistDialog';
import { PlaylistManager } from '@/components/PlaylistManager';
import { LoginForm } from '@/components/LoginForm';
import { UserProfile } from '@/components/UserProfile';
import { EnhancedSearch } from '@/components/EnhancedSearch';
import { EnhancedPlayerControls } from '@/components/EnhancedPlayerControls';
import { StatsAndHistory } from '@/components/StatsAndHistory';
import { MobilePlayer } from '@/components/MobilePlayer';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { useListeningHistory } from '@/hooks/useListeningHistory';
import { useBackgroundPlayback } from '@/hooks/useBackgroundPlayback';
import { VideoData } from '@/types/playlist';

// Import BackgroundMode with error handling for web environment
let BackgroundMode: any = null;
try {
  BackgroundMode = require('@capacitor/background-mode').BackgroundMode;
} catch (error) {
  console.log('Background mode not available in web environment');
}

// YouTube API type declarations
declare global {
  interface Window {
    YT?: {
      Player: new (elementId: string, config: any) => any;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
    globalPlayer?: any;
    globalPlayerState?: {
      currentVideo: VideoData | null;
      isPlaying: boolean;
      volume: number;
      playlist: VideoData[];
      currentIndex: number;
    };
  }
}

const Index = () => {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites(user?.id);
  const { addToHistory: addToListeningHistory } = useListeningHistory(user?.id);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<VideoData[]>([]);
  const [randomSongs, setRandomSongs] = useState<VideoData[]>([]);
  const [currentVideo, setCurrentVideo] = useState<VideoData | null>(
    window.globalPlayerState?.currentVideo || null
  );
  const [isPlaying, setIsPlaying] = useState(
    window.globalPlayerState?.isPlaying || false
  );
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isLoadingRandom, setIsLoadingRandom] = useState(false);
  const [volume, setVolume] = useState([window.globalPlayerState?.volume || 80]);
  const [playlist, setPlaylist] = useState<VideoData[]>(
    window.globalPlayerState?.playlist || []
  );
  const [currentIndex, setCurrentIndex] = useState(
    window.globalPlayerState?.currentIndex || 0
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const playerRef = useRef<any>(null);
  const { toast } = useToast();
  const { showMediaNotification, setupMediaSession, requestNotificationPermission } = useBackgroundPlayback();
  const [showBackgroundPlayer, setShowBackgroundPlayer] = useState(false);
  const [backgroundPlayerMinimized, setBackgroundPlayerMinimized] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Initialize global player state if it doesn't exist
    if (!window.globalPlayerState) {
      window.globalPlayerState = {
        currentVideo: null,
        isPlaying: false,
        volume: 80,
        playlist: [],
        currentIndex: 0,
      };
    }

    // Load YouTube IFrame API if not already loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        console.log('YouTube API Ready');
        initializeGlobalPlayer();
      };
    } else {
      initializeGlobalPlayer();
    }

    // Setup media session handlers for background playback
    setupMediaSession();

    // Enable background mode for mobile
    if (BackgroundMode) {
      BackgroundMode.enable();
    }

    // Load random songs on startup
    discoverRandomSongs();

    return () => {
      // Don't destroy the player on component unmount to keep background playback
    };
  }, [isAuthenticated]);

  const setupMediaSession = () => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => {
        if (playerRef.current || window.globalPlayer) {
          const player = playerRef.current || window.globalPlayer;
          player.playVideo();
          setIsPlaying(true);
          if (window.globalPlayerState) {
            window.globalPlayerState.isPlaying = true;
          }
        }
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        if (playerRef.current || window.globalPlayer) {
          const player = playerRef.current || window.globalPlayer;
          player.pauseVideo();
          setIsPlaying(false);
          if (window.globalPlayerState) {
            window.globalPlayerState.isPlaying = false;
          }
        }
      });

      navigator.mediaSession.setActionHandler('stop', () => {
        if (playerRef.current || window.globalPlayer) {
          const player = playerRef.current || window.globalPlayer;
          player.pauseVideo();
          setIsPlaying(false);
          if (window.globalPlayerState) {
            window.globalPlayerState.isPlaying = false;
          }
        }
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        playNext();
      });
      
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        playPrevious();
      });
    }
  };

  const initializeGlobalPlayer = () => {
    // Use existing global player or create new one
    if (window.globalPlayer) {
      playerRef.current = window.globalPlayer;
      // Sync local state with global state
      setCurrentVideo(window.globalPlayerState?.currentVideo || null);
      setIsPlaying(window.globalPlayerState?.isPlaying || false);
      setVolume([window.globalPlayerState?.volume || 80]);
      setPlaylist(window.globalPlayerState?.playlist || []);
      setCurrentIndex(window.globalPlayerState?.currentIndex || 0);
    } else if (window.YT && window.YT.Player) {
      // Create persistent global player
      const playerContainer = document.getElementById('global-youtube-player');
      if (!playerContainer) {
        const container = document.createElement('div');
        container.id = 'global-youtube-player';
        container.style.position = 'fixed';
        container.style.top = '-1000px';
        container.style.left = '-1000px';
        container.style.width = '1px';
        container.style.height = '1px';
        document.body.appendChild(container);
      }

      window.globalPlayer = new window.YT.Player('global-youtube-player', {
        height: '1',
        width: '1',
        playerVars: {
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          autoplay: 1,
        },
        events: {
          onReady: (event: any) => {
            console.log('Global player ready');
            playerRef.current = window.globalPlayer;
          },
          onStateChange: (event: any) => {
            console.log('Global player state changed:', event.data);
            const isCurrentlyPlaying = event.data === window.YT?.PlayerState.PLAYING;
            const isEnded = event.data === window.YT?.PlayerState.ENDED;
            const isPaused = event.data === window.YT?.PlayerState.PAUSED;

            if (isCurrentlyPlaying || isPaused) {
              const newPlayingState = isCurrentlyPlaying;
              setIsPlaying(newPlayingState);
              if (window.globalPlayerState) {
                window.globalPlayerState.isPlaying = newPlayingState;
              }
              
              // Update media session playback state
              if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = newPlayingState ? 'playing' : 'paused';
              }
            }

            // Auto-play next song when current song ends
            if (isEnded) {
              playNext();
            }
          },
        },
      });
      playerRef.current = window.globalPlayer;
    }
  };

  const updateMediaSession = (video: VideoData) => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: video.title,
        artist: video.channel,
        album: "RhythmTrack",
        artwork: [
          { src: video.thumbnail, sizes: "96x96", type: "image/jpeg" },
          { src: video.thumbnail, sizes: "128x128", type: "image/jpeg" },
          { src: video.thumbnail, sizes: "192x192", type: "image/jpeg" },
          { src: video.thumbnail, sizes: "256x256", type: "image/jpeg" },
          { src: video.thumbnail, sizes: "384x384", type: "image/jpeg" },
          { src: video.thumbnail, sizes: "512x512", type: "image/jpeg" }
        ]
      });
      
      // Set playback state
      navigator.mediaSession.playbackState = 'playing';
    }
  };

  const playVideo = (video: VideoData, index?: number) => {
    setCurrentVideo(video);
    
    if (index !== undefined) {
      setCurrentIndex(index);
      if (window.globalPlayerState) {
        window.globalPlayerState.currentIndex = index;
      }
    }
    
    // Add to listening history
    addToListeningHistory(video);
    
    if (window.globalPlayerState) {
      window.globalPlayerState.currentVideo = video;
    }

    if (!playerRef.current && window.globalPlayer) {
      playerRef.current = window.globalPlayer;
    }

    if (!playerRef.current) {
      toast({
        title: "Player Not Ready",
        description: "Please wait a moment and try again.",
        variant: "destructive",
      });
      return;
    }

    // Load and play the video
    playerRef.current.loadVideoById({
      videoId: video.id,
      startSeconds: 0,
    });
    
    playerRef.current.setVolume(volume[0]);
    
    setTimeout(() => {
      playerRef.current.playVideo();
      setIsPlaying(true);
      if (window.globalPlayerState) {
        window.globalPlayerState.isPlaying = true;
      }
      
      // Setup background playback
      setupMediaSession(video);
      showMediaNotification(video, true);
      setShowBackgroundPlayer(true);
      
      // Request notification permission on first play
      requestNotificationPermission();
    }, 500);

    toast({
      title: "Now Playing",
      description: video.title,
    });
  };

  const playNext = () => {
    if (playlist.length === 0) return;
    
    const nextIndex = (currentIndex + 1) % playlist.length;
    const nextVideo = playlist[nextIndex];
    
    if (nextVideo) {
      playVideo(nextVideo, nextIndex);
    }
  };

  const playPrevious = () => {
    if (playlist.length === 0) return;
    
    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    const prevVideo = playlist[prevIndex];
    
    if (prevVideo) {
      playVideo(prevVideo, prevIndex);
    }
  };

  const addToPlaylist = (video: VideoData) => {
    const newPlaylist = [...playlist, video];
    setPlaylist(newPlaylist);
    
    if (window.globalPlayerState) {
      window.globalPlayerState.playlist = newPlaylist;
    }
    
    toast({
      title: "Added to Playlist",
      description: video.title,
    });
  };

  const playAllFromSearch = () => {
    if (searchResults.length === 0) return;
    
    setPlaylist(searchResults);
    if (window.globalPlayerState) {
      window.globalPlayerState.playlist = searchResults;
    }
    
    playVideo(searchResults[0], 0);
    
    toast({
      title: "Playing All",
      description: `${searchResults.length} songs added to playlist`,
    });
  };

  const togglePlayPause = () => {
    if (!playerRef.current) {
      if (window.globalPlayer) {
        playerRef.current = window.globalPlayer;
      } else {
        return;
      }
    }

    if (isPlaying) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
      if (window.globalPlayerState) {
        window.globalPlayerState.isPlaying = false;
      }
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
      if (currentVideo) {
        showMediaNotification(currentVideo, false);
      }
    } else {
      playerRef.current.playVideo();
      setIsPlaying(true);
      if (window.globalPlayerState) {
        window.globalPlayerState.isPlaying = true;
      }
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
      if (currentVideo) {
        showMediaNotification(currentVideo, true);
      }
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume);
    if (window.globalPlayerState) {
      window.globalPlayerState.volume = newVolume[0];
    }
    if (playerRef.current) {
      playerRef.current.setVolume(newVolume[0]);
    }
  };

  const handlePlaylistUpdate = (newPlaylist: VideoData[]) => {
    setPlaylist(newPlaylist);
    if (window.globalPlayerState) {
      window.globalPlayerState.playlist = newPlaylist;
    }
  };

  const discoverRandomSongs = async () => {
    setIsLoadingRandom(true);
    try {
      // List of trending/popular song keywords to get variety
      const trendingKeywords = [
        'trending music 2024',
        'viral songs',
        'top hits',
        'popular music',
        'chart toppers',
        'new music',
        'best songs',
        'hit songs',
        'music hits',
        'latest songs',
        'top 40',
        'Billboard hits',
        'Grammy winners',
        'viral tiktok songs',
        'dance music',
        'pop hits',
        'rock classics',
        'indie music',
        'hip hop hits',
        'country hits'
      ];

      const results: VideoData[] = [];
      const maxResults = 30;

      // Randomly select 6-8 keywords for variety
      const selectedKeywords = trendingKeywords
        .sort(() => Math.random() - 0.5)
        .slice(0, 8);

      const searchPromises = selectedKeywords.map(async (keyword) => {
        try {
          const response = await fetch(
            `https://kaiz-apis.gleeze.com/api/yt-metadata?title=${encodeURIComponent(keyword)}&apikey=7a194df7-7109-4bfb-9560-ef474230053f`
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.videoId && data.title) {
              return {
                id: data.videoId,
                title: data.title,
                thumbnail: data.thumbnail || `https://i.ytimg.com/vi/${data.videoId}/hq720.jpg`,
                duration: data.duration || '0:00',
                channel: data.author || 'Unknown',
                views: (data.views ? data.views + ' views' : 'Unknown views')
              };
            }
          }
        } catch (error) {
          console.error(`Error fetching random songs for "${keyword}":`, error);
        }
        return null;
      });

      const randomResults = await Promise.all(searchPromises);
      
      // Filter out null results and duplicates
      const uniqueResults = new Map();
      randomResults.forEach(result => {
        if (result && !uniqueResults.has(result.id)) {
          uniqueResults.set(result.id, result);
        }
      });

      const finalResults = Array.from(uniqueResults.values())
        .sort(() => Math.random() - 0.5) // Shuffle the results
        .slice(0, maxResults);

      setRandomSongs(finalResults);
      
      if (finalResults.length > 0) {
        toast({
          title: "Discover Mode",
          description: `Found ${finalResults.length} random songs for you to explore!`,
        });
      }
    } catch (error) {
      console.error('Random songs fetch error:', error);
      toast({
        title: "Discovery Error",
        description: "Failed to load random songs. Try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRandom(false);
    }
  };

  const playAllRandom = () => {
    if (randomSongs.length === 0) return;
    
    // Shuffle the random songs
    const shuffledSongs = [...randomSongs].sort(() => Math.random() - 0.5);
    setPlaylist(shuffledSongs);
    if (window.globalPlayerState) {
      window.globalPlayerState.playlist = shuffledSongs;
    }
    
    playVideo(shuffledSongs[0], 0);
    
    toast({
      title: "Random Playlist",
      description: `Playing ${shuffledSongs.length} random songs!`,
    });
  };

  const handlePlayAllFromPlaylist = (songs: VideoData[], startIndex = 0) => {
    if (songs.length === 0) return;
    
    setPlaylist(songs);
    if (window.globalPlayerState) {
      window.globalPlayerState.playlist = songs;
    }
    
    playVideo(songs[startIndex], startIndex);
  };

  async function searchSongs() {
    if (!searchQuery.trim()) return;

    setIsLoadingSearch(true);
    try {
      console.log('Searching for:', searchQuery);
      
      // Optimized search with only 3-4 strategic variations for faster results
      const searchVariations = [
        searchQuery,
        `${searchQuery} official`,
        `${searchQuery} music`,
        `${searchQuery} song`
      ];

      const results: VideoData[] = [];
      const maxResults = 25;

      // Use Promise.all for parallel requests instead of sequential
      const searchPromises = searchVariations.map(async (variation) => {
        try {
          const response = await fetch(
            `https://kaiz-apis.gleeze.com/api/yt-metadata?title=${encodeURIComponent(variation)}&apikey=7a194df7-7109-4bfb-9560-ef474230053f`
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.videoId && data.title) {
              return {
                id: data.videoId,
                title: data.title,
                thumbnail: data.thumbnail || `https://i.ytimg.com/vi/${data.videoId}/hq720.jpg`,
                duration: data.duration || '0:00',
                channel: data.author || 'Unknown',
                views: (data.views ? data.views + ' views' : 'Unknown views')
              };
            }
          }
        } catch (error) {
          console.error(`Error fetching for "${variation}":`, error);
        }
        return null;
      });

      // Wait for all requests to complete
      const searchResults = await Promise.all(searchPromises);
      
      // Filter out null results and duplicates
      const uniqueResults = new Map();
      searchResults.forEach(result => {
        if (result && !uniqueResults.has(result.id)) {
          uniqueResults.set(result.id, result);
        }
      });

      const finalResults = Array.from(uniqueResults.values()).slice(0, maxResults);

      if (finalResults.length === 0) {
        toast({
          title: "No Results Found",
          description: `No songs found for "${searchQuery}". Try a different search term.`,
          variant: "destructive",
        });
        setSearchResults([]);
        return;
      }

      setSearchResults(finalResults);
      
      toast({
        title: "Search Complete",
        description: `Found ${finalResults.length} result(s) for "${searchQuery}"`,
      });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to search for songs. Please try again.",
        variant: "destructive",
      });
      setSearchResults([]);
    } finally {
      setIsLoadingSearch(false);
    }
  }

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse">
            <div className="text-2xl">🎵</div>
          </div>
          <p className="text-white text-lg">Loading RhythmTrack...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />
      
      <div className="relative z-10">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="text-white">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-gray-900 border-gray-700 text-white w-80">
              <div className="py-4">
                <h2 className="text-xl font-bold mb-4 text-center bg-gradient-to-r from-pink-400 to-purple-600 bg-clip-text text-transparent">
                  🎵 RhythmTrack
                </h2>
                <UserProfile user={user!} onLogout={logout} />
              </div>
            </SheetContent>
          </Sheet>
          
          <h1 className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-600 bg-clip-text text-transparent">
            🎵 RhythmTrack
          </h1>
          
          <div className="w-8"></div> {/* Spacer for centering */}
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="text-center flex-1">
              <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-pink-400 to-purple-600 bg-clip-text text-transparent mb-4">
                🎵 RhythmTrack
              </h1>
              <p className="text-lg lg:text-xl text-gray-300">Your Personal Music Streaming Experience</p>
            </div>
            <div className="absolute top-0 right-0">
              <UserProfile user={user!} onLogout={logout} />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-2 md:px-4 pb-24 md:pb-8">
          <Tabs defaultValue="search" className="max-w-6xl mx-auto">
            {/* Mobile Tab Navigation */}
            <div className="md:hidden mb-4">
              <TabsList className="grid w-full grid-cols-4 bg-white/10 border-white/20 h-12">
                <TabsTrigger value="search" className="data-[state=active]:bg-white/20 text-xs">
                  <Search className="w-3 h-3" />
                </TabsTrigger>
                <TabsTrigger value="playlists" className="data-[state=active]:bg-white/20 text-xs">
                  <ListMusic className="w-3 h-3" />
                </TabsTrigger>
                <TabsTrigger value="playing" className="data-[state=active]:bg-white/20 text-xs">
                  <Play className="w-3 h-3" />
                </TabsTrigger>
                <TabsTrigger value="stats" className="data-[state=active]:bg-white/20 text-xs">
                  <BarChart3 className="w-3 h-3" />
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Desktop Tab Navigation */}
            <div className="hidden md:block">
              <TabsList className="grid w-full grid-cols-4 mb-8 bg-white/10 border-white/20">
                <TabsTrigger value="search" className="data-[state=active]:bg-white/20">
                  <Search className="w-4 h-4 mr-2" />
                  Discover
                </TabsTrigger>
                <TabsTrigger value="playlists" className="data-[state=active]:bg-white/20">
                  <ListMusic className="w-4 h-4 mr-2" />
                  Playlists
                </TabsTrigger>
                <TabsTrigger value="playing" className="data-[state=active]:bg-white/20">
                  <Play className="w-4 h-4 mr-2" />
                  Now Playing
                </TabsTrigger>
                <TabsTrigger value="stats" className="data-[state=active]:bg-white/20">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Stats & History
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="search" className="space-y-4 md:space-y-8">
              {/* Enhanced Search Section */}
              <EnhancedSearch
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onSearch={searchSongs}
                isLoading={isLoadingSearch}
              />

              {/* Discover Button */}
              <div className="text-center">
                <Button
                  onClick={discoverRandomSongs}
                  disabled={isLoadingRandom}
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 rounded-full px-6 md:px-8"
                  size={window.innerWidth < 768 ? 'sm' : 'default'}
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  {isLoadingRandom ? 'Discovering...' : 'Discover Random Songs'}
                </Button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h2 className="text-lg md:text-2xl font-bold">Search Results ({searchResults.length} songs)</h2>
                    <Button
                      onClick={playAllFromSearch}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                      size={window.innerWidth < 768 ? 'sm' : 'default'}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Play All
                    </Button>
                  </div>
                  
                  <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {searchResults.map((video, index) => (
                      <Card 
                        key={video.id}
                        className="group cursor-pointer bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
                      >
                        <CardContent className="p-2 md:p-4">
                          <div className="relative mb-2 md:mb-4">
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="w-full h-20 md:h-32 object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center space-x-1 md:space-x-2">
                              <Button
                                onClick={() => playVideo(video, index)}
                                size="sm"
                                className="rounded-full bg-white/20 hover:bg-white/30 p-1 md:p-2"
                              >
                                <Play className="w-3 h-3 md:w-4 md:h-4" />
                              </Button>
                              <Button
                                onClick={() => toggleFavorite(video)}
                                size="sm"
                                className={`rounded-full p-1 md:p-2 ${
                                  isFavorite(video.id)
                                    ? 'bg-red-500 hover:bg-red-600'
                                    : 'bg-white/20 hover:bg-white/30'
                                }`}
                              >
                                <Heart className={`w-3 h-3 md:w-4 md:h-4 ${isFavorite(video.id) ? 'fill-current' : ''}`} />
                              </Button>
                              <PlaylistDialog song={video}>
                                <Button
                                  size="sm"
                                  className="rounded-full bg-white/20 hover:bg-white/30 p-1 md:p-2"
                                >
                                  <Plus className="w-3 h-3 md:w-4 md:h-4" />
                                </Button>
                              </PlaylistDialog>
                            </div>
                            <span className="absolute bottom-1 right-1 md:bottom-2 md:right-2 bg-black/70 text-white text-xs px-1 md:px-2 py-1 rounded">
                              {video.duration}
                            </span>
                          </div>
                          <h3 className="font-semibold text-white mb-1 md:mb-2 line-clamp-2 text-xs md:text-sm">{video.title}</h3>
                          <p className="text-gray-300 text-xs mb-1">{video.channel}</p>
                          <p className="text-gray-400 text-xs hidden md:block">{video.views}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Random Songs Section */}
              {randomSongs.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h2 className="text-lg md:text-2xl font-bold">🎲 Discover Music ({randomSongs.length} songs)</h2>
                    <Button
                      onClick={playAllRandom}
                      className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                      size={window.innerWidth < 768 ? 'sm' : 'default'}
                    >
                      <Shuffle className="w-4 h-4 mr-2" />
                      <span className="hidden md:inline">Shuffle & Play All</span>
                      <span className="md:hidden">Shuffle</span>
                    </Button>
                  </div>
                  
                  <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {randomSongs.map((video, index) => (
                      <Card 
                        key={`random-${video.id}`}
                        className="group cursor-pointer bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
                      >
                        <CardContent className="p-2 md:p-4">
                          <div className="relative mb-2 md:mb-4">
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="w-full h-20 md:h-32 object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center space-x-1 md:space-x-2">
                              <Button
                                onClick={() => playVideo(video, index)}
                                size="sm"
                                className="rounded-full bg-white/20 hover:bg-white/30 p-1 md:p-2"
                              >
                                <Play className="w-3 h-3 md:w-4 md:h-4" />
                              </Button>
                              <Button
                                onClick={() => toggleFavorite(video)}
                                size="sm"
                                className={`rounded-full p-1 md:p-2 ${
                                  isFavorite(video.id)
                                    ? 'bg-red-500 hover:bg-red-600'
                                    : 'bg-white/20 hover:bg-white/30'
                                }`}
                              >
                                <Heart className={`w-3 h-3 md:w-4 md:h-4 ${isFavorite(video.id) ? 'fill-current' : ''}`} />
                              </Button>
                              <PlaylistDialog song={video}>
                                <Button
                                  size="sm"
                                  className="rounded-full bg-white/20 hover:bg-white/30 p-1 md:p-2"
                                >
                                  <Plus className="w-3 h-3 md:w-4 md:h-4" />
                                </Button>
                              </PlaylistDialog>
                            </div>
                            <span className="absolute bottom-1 right-1 md:bottom-2 md:right-2 bg-black/70 text-white text-xs px-1 md:px-2 py-1 rounded">
                              {video.duration}
                            </span>
                          </div>
                          <h3 className="font-semibold text-white mb-1 md:mb-2 line-clamp-2 text-xs md:text-sm">{video.title}</h3>
                          <p className="text-gray-300 text-xs mb-1">{video.channel}</p>
                          <p className="text-gray-400 text-xs hidden md:block">{video.views}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {searchResults.length === 0 && !isLoadingSearch && (
                <div className="text-center py-8 md:py-12">
                  <div className="text-4xl md:text-6xl mb-4">🎼</div>
                  <h3 className="text-xl md:text-2xl font-semibold mb-2">Start Your Musical Journey</h3>
                  <p className="text-gray-400">Search for your favorite songs and discover new music</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="playlists">
              <PlaylistManager onPlayPlaylist={handlePlayAllFromPlaylist} />
            </TabsContent>

            <TabsContent value="playing" className="space-y-4 md:space-y-8">
              {/* Enhanced Current Playing Section */}
              {currentVideo && (
                <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 mb-4 md:mb-6">
                      <img
                        src={currentVideo.thumbnail}
                        alt={currentVideo.title}
                        className="w-24 h-18 md:w-32 md:h-24 object-cover rounded-lg shadow-lg"
                      />
                      <div className="flex-1 text-center md:text-left">
                        <h3 className="text-lg md:text-xl font-semibold text-white mb-2">{currentVideo.title}</h3>
                        <p className="text-gray-300 mb-4">{currentVideo.channel}</p>
                      </div>
                    </div>
                    
                    {/* Enhanced Player Controls */}
                    <EnhancedPlayerControls
                      currentVideo={currentVideo}
                      isPlaying={isPlaying}
                      volume={volume}
                      playlist={playlist}
                      onTogglePlayPause={togglePlayPause}
                      onPlayNext={playNext}
                      onPlayPrevious={playPrevious}
                      onVolumeChange={handleVolumeChange}
                      onPlaylistUpdate={handlePlaylistUpdate}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Current Playlist */}
              {playlist.length > 0 && (
                <div>
                  <h2 className="text-lg md:text-2xl font-bold mb-4 md:mb-6">Current Playlist ({playlist.length} songs)</h2>
                  <div className="space-y-2">
                    {playlist.slice(0, 10).map((video, index) => (
                      <Card 
                        key={`playlist-${index}`}
                        className={`cursor-pointer bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 ${
                          index === currentIndex ? 'bg-gradient-to-r from-pink-500/20 to-purple-600/20 border-pink-500/50' : ''
                        }`}
                        onClick={() => playVideo(video, index)}
                      >
                        <CardContent className="p-2 md:p-3">
                          <div className="flex items-center space-x-3 md:space-x-4">
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="w-12 h-9 md:w-16 md:h-12 object-cover rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-white text-sm line-clamp-1">{video.title}</h4>
                              <p className="text-gray-300 text-xs">{video.channel}</p>
                            </div>
                            <span className="text-gray-400 text-xs">{video.duration}</span>
                            {index === currentIndex && isPlaying && (
                              <div className="w-3 h-3 md:w-4 md:h-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full animate-pulse" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {playlist.length > 10 && (
                      <p className="text-center text-gray-400 text-sm mt-4">
                        ...and {playlist.length - 10} more songs
                      </p>
                    )}
                  </div>
                </div>
              )}

              {!currentVideo && (
                <div className="text-center py-8 md:py-12">
                  <div className="text-4xl md:text-6xl mb-4">🎵</div>
                  <h3 className="text-xl md:text-2xl font-semibold mb-2">No Music Playing</h3>
                  <p className="text-gray-400">Start playing some music to see it here</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="stats">
              <StatsAndHistory onPlaySong={(song) => playVideo(song)} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Mobile Player at Bottom */}
        {currentVideo && (
          <MobilePlayer
            currentVideo={currentVideo}
            isPlaying={isPlaying}
            onTogglePlayPause={togglePlayPause}
            onPlayNext={playNext}
            onPlayPrevious={playPrevious}
          />
        )}

        {/* Background Music Notification */}
        {currentVideo && showBackgroundPlayer && (
          <BackgroundMusicNotification
            currentVideo={currentVideo}
            isPlaying={isPlaying}
            isMinimized={backgroundPlayerMinimized}
            onTogglePlayPause={togglePlayPause}
            onPlayNext={playNext}
            onPlayPrevious={playPrevious}
            onClose={() => setShowBackgroundPlayer(false)}
            onToggleMinimize={() => setBackgroundPlayerMinimized(!backgroundPlayerMinimized)}
          />
        )}

        {/* Local YouTube Player (fallback) */}
        <div id="youtube-player" className="hidden"></div>
      </div>
    </div>
  );
};

export default Index;
