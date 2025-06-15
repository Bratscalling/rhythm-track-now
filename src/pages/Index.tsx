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
import { BackgroundMusicNotification } from '@/components/BackgroundMusicNotification';
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
    setupMediaSessionHandlers();

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

  const setupMediaSessionHandlers = () => {
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
      <div className="min-h-screen bg-music-wave flex items-center justify-center bg-pattern-premium-waves relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern-premium-dots opacity-30"></div>
        <div className="text-center relative z-10">
          <div className="w-20 h-20 bg-premium-primary rounded-full flex items-center justify-center mb-6 mx-auto playing-luxury shadow-neon">
            <div className="text-3xl">🎵</div>
          </div>
          <p className="text-white text-xl font-bold text-glow">Loading RhythmTrack Premium...</p>
          <div className="mt-4 w-48 h-1 bg-white/20 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-premium-primary rounded-full shimmer-luxury"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-music-wave text-white relative overflow-hidden">
      {/* Premium Background Effects */}
      <div className="absolute inset-0 bg-pattern-premium-waves opacity-20"></div>
      <div className="absolute inset-0 bg-pattern-premium-dots opacity-10"></div>
      
      {/* Animated Background Orbs */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full blur-3xl float-premium"></div>
      <div className="absolute top-1/2 right-10 w-40 h-40 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl float-premium" style={{animationDelay: '2s'}}></div>
      <div className="absolute bottom-10 left-1/3 w-24 h-24 bg-gradient-to-r from-yellow-500/25 to-orange-500/25 rounded-full blur-3xl float-premium" style={{animationDelay: '4s'}}></div>
      
      <div className="relative z-10">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 glass-premium-dark">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="text-white btn-glass-luxury">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="glass-premium-dark border-white/10 text-white w-80">
              <div className="py-4">
                <h2 className="text-xl font-bold mb-4 text-center text-premium-gradient text-glow">
                  🎵 RhythmTrack Premium
                </h2>
                <UserProfile user={user!} onLogout={logout} />
              </div>
            </SheetContent>
          </Sheet>
          
          <h1 className="text-xl font-bold text-premium-gradient text-glow">
            🎵 RhythmTrack Premium
          </h1>
          
          <div className="w-8"></div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="text-center flex-1">
              <h1 className="text-6xl lg:text-8xl font-bold text-premium-gradient text-glow mb-4 pulse-luxury">
                🎵 RhythmTrack Premium
              </h1>
              <p className="text-xl lg:text-2xl text-white/90 font-medium">Your Elite Music Streaming Experience</p>
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
              <TabsList className="grid w-full grid-cols-4 glass-premium border-white/20 h-14">
                <TabsTrigger value="search" className="data-[state=active]:glass-premium text-xs premium-hover-lift">
                  <Search className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="playlists" className="data-[state=active]:glass-premium text-xs premium-hover-lift">
                  <ListMusic className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="playing" className="data-[state=active]:glass-premium text-xs premium-hover-lift">
                  <Play className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="stats" className="data-[state=active]:glass-premium text-xs premium-hover-lift">
                  <BarChart3 className="w-4 h-4" />
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Desktop Tab Navigation */}
            <div className="hidden md:block">
              <TabsList className="grid w-full grid-cols-4 mb-8 glass-premium border-white/20 h-16">
                <TabsTrigger value="search" className="data-[state=active]:glass-premium premium-hover-lift text-lg font-semibold">
                  <Search className="w-5 h-5 mr-2" />
                  Discover Premium
                </TabsTrigger>
                <TabsTrigger value="playlists" className="data-[state=active]:glass-premium premium-hover-lift text-lg font-semibold">
                  <ListMusic className="w-5 h-5 mr-2" />
                  Elite Playlists
                </TabsTrigger>
                <TabsTrigger value="playing" className="data-[state=active]:glass-premium premium-hover-lift text-lg font-semibold">
                  <Play className="w-5 h-5 mr-2" />
                  Now Playing
                </TabsTrigger>
                <TabsTrigger value="stats" className="data-[state=active]:glass-premium premium-hover-lift text-lg font-semibold">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Premium Stats
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

              {/* Premium Discover Button */}
              <div className="text-center">
                <Button
                  onClick={discoverRandomSongs}
                  disabled={isLoadingRandom}
                  className="btn-premium-warning rounded-full px-8 md:px-12 py-4 text-lg font-bold shadow-neon"
                  size={window.innerWidth < 768 ? 'sm' : 'lg'}
                >
                  <Shuffle className="w-5 h-5 mr-3" />
                  {isLoadingRandom ? 'Discovering Premium Music...' : '✨ Discover Premium Songs ✨'}
                </Button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-6 md:mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-premium-gradient text-glow">Premium Search Results ({searchResults.length} songs)</h2>
                    <Button
                      onClick={playAllFromSearch}
                      className="btn-premium-success rounded-full shadow-neon premium-hover-lift"
                      size={window.innerWidth < 768 ? 'sm' : 'default'}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Play All Premium
                    </Button>
                  </div>
                  
                  <div className="grid gap-4 md:gap-6 mobile-grid-premium lg:grid-cols-3 xl:grid-cols-4">
                    {searchResults.map((video, index) => (
                      <Card 
                        key={video.id}
                        className="group cursor-pointer card-luxury card-premium-hover"
                      >
                        <CardContent className="p-3 md:p-4">
                          <div className="relative mb-3 md:mb-4">
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="w-full h-24 md:h-36 object-cover rounded-xl shadow-luxury"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-xl flex items-center justify-center space-x-2 md:space-x-3">
                              <Button
                                onClick={() => playVideo(video, index)}
                                size="sm"
                                className="btn-glass-luxury rounded-full p-2 md:p-3 premium-hover-glow"
                              >
                                <Play className="w-4 h-4 md:w-5 md:h-5" />
                              </Button>
                              <Button
                                onClick={() => toggleFavorite(video)}
                                size="sm"
                                className={`rounded-full p-2 md:p-3 premium-hover-glow ${
                                  isFavorite(video.id)
                                    ? 'btn-premium-warning'
                                    : 'btn-glass-luxury'
                                }`}
                              >
                                <Heart className={`w-4 h-4 md:w-5 md:h-5 ${isFavorite(video.id) ? 'fill-current' : ''}`} />
                              </Button>
                              <PlaylistDialog song={video}>
                                <Button
                                  size="sm"
                                  className="btn-glass-luxury rounded-full p-2 md:p-3 premium-hover-glow"
                                >
                                  <Plus className="w-4 h-4 md:w-5 md:h-5" />
                                </Button>
                              </PlaylistDialog>
                            </div>
                            <span className="absolute bottom-2 right-2 md:bottom-3 md:right-3 glass-premium-dark text-white text-xs px-2 md:px-3 py-1 rounded-full font-semibold">
                              {video.duration}
                            </span>
                          </div>
                          <h3 className="font-bold text-white mb-2 line-clamp-2 text-sm md:text-base text-glow">{video.title}</h3>
                          <p className="text-gray-300 text-xs md:text-sm mb-1 font-medium">{video.channel}</p>
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
                  <div className="flex items-center justify-between mb-6 md:mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-premium-gradient text-glow">🎲 Premium Discovery ({randomSongs.length} songs)</h2>
                    <Button
                      onClick={playAllRandom}
                      className="btn-premium-secondary rounded-full shadow-neon premium-hover-lift"
                      size={window.innerWidth < 768 ? 'sm' : 'default'}
                    >
                      <Shuffle className="w-4 h-4 mr-2" />
                      <span className="hidden md:inline">Premium Shuffle & Play</span>
                      <span className="md:hidden">Shuffle</span>
                    </Button>
                  </div>
                  
                  <div className="grid gap-4 md:gap-6 mobile-grid-premium lg:grid-cols-3 xl:grid-cols-4">
                    {randomSongs.map((video, index) => (
                      <Card 
                        key={`random-${video.id}`}
                        className="group cursor-pointer card-luxury card-premium-hover"
                      >
                        <CardContent className="p-3 md:p-4">
                          <div className="relative mb-3 md:mb-4">
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="w-full h-24 md:h-36 object-cover rounded-xl shadow-luxury"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-xl flex items-center justify-center space-x-2 md:space-x-3">
                              <Button
                                onClick={() => playVideo(video, index)}
                                size="sm"
                                className="btn-glass-luxury rounded-full p-2 md:p-3 premium-hover-glow"
                              >
                                <Play className="w-4 h-4 md:w-5 md:h-5" />
                              </Button>
                              <Button
                                onClick={() => toggleFavorite(video)}
                                size="sm"
                                className={`rounded-full p-2 md:p-3 premium-hover-glow ${
                                  isFavorite(video.id)
                                    ? 'btn-premium-warning'
                                    : 'btn-glass-luxury'
                                }`}
                              >
                                <Heart className={`w-4 h-4 md:w-5 md:h-5 ${isFavorite(video.id) ? 'fill-current' : ''}`} />
                              </Button>
                              <PlaylistDialog song={video}>
                                <Button
                                  size="sm"
                                  className="btn-glass-luxury rounded-full p-2 md:p-3 premium-hover-glow"
                                >
                                  <Plus className="w-4 h-4 md:w-5 md:h-5" />
                                </Button>
                              </PlaylistDialog>
                            </div>
                            <span className="absolute bottom-2 right-2 md:bottom-3 md:right-3 glass-premium-dark text-white text-xs px-2 md:px-3 py-1 rounded-full font-semibold">
                              {video.duration}
                            </span>
                          </div>
                          <h3 className="font-bold text-white mb-2 line-clamp-2 text-sm md:text-base text-glow">{video.title}</h3>
                          <p className="text-gray-300 text-xs md:text-sm mb-1 font-medium">{video.channel}</p>
                          <p className="text-gray-400 text-xs hidden md:block">{video.views}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Premium Empty State */}
              {searchResults.length === 0 && !isLoadingSearch && (
                <div className="text-center py-12 md:py-16">
                  <div className="text-6xl md:text-8xl mb-6 float-premium">🎼</div>
                  <h3 className="text-2xl md:text-4xl font-bold mb-4 text-premium-gradient text-glow">Start Your Premium Musical Journey</h3>
                  <p className="text-gray-300 text-lg">Search for your favorite songs and discover premium music experiences</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="playlists">
              <PlaylistManager onPlayPlaylist={handlePlayAllFromPlaylist} />
            </TabsContent>

            <TabsContent value="playing" className="space-y-4 md:space-y-8">
              {/* Premium Current Playing Section */}
              {currentVideo && (
                <Card className="card-luxury">
                  <CardContent className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8 mb-6 md:mb-8">
                      <div className="relative">
                        <img
                          src={currentVideo.thumbnail}
                          alt={currentVideo.title}
                          className="w-32 h-24 md:w-40 md:h-30 object-cover rounded-2xl shadow-luxury"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent rounded-2xl"></div>
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-3 text-glow">{currentVideo.title}</h3>
                        <p className="text-gray-300 mb-4 text-lg font-medium">{currentVideo.channel}</p>
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

              {/* Premium Current Playlist */}
              {playlist.length > 0 && (
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-premium-gradient text-glow">Premium Playlist ({playlist.length} songs)</h2>
                  <div className="space-y-3">
                    {playlist.slice(0, 10).map((video, index) => (
                      <Card 
                        key={`playlist-${index}`}
                        className={`cursor-pointer card-luxury premium-hover-lift ${
                          index === currentIndex ? 'ring-2 ring-purple-500 shadow-neon' : ''
                        }`}
                        onClick={() => playVideo(video, index)}
                      >
                        <CardContent className="p-3 md:p-4">
                          <div className="flex items-center space-x-4 md:space-x-6">
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="w-16 h-12 md:w-20 md:h-15 object-cover rounded-lg shadow-luxury"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-white text-sm md:text-base line-clamp-1 text-glow">{video.title}</h4>
                              <p className="text-gray-300 text-xs md:text-sm font-medium">{video.channel}</p>
                            </div>
                            <span className="text-gray-400 text-xs md:text-sm font-medium">{video.duration}</span>
                            {index === currentIndex && isPlaying && (
                              <div className="w-4 h-4 md:w-5 md:h-5 bg-premium-primary rounded-full playing-luxury shadow-neon" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {playlist.length > 10 && (
                      <p className="text-center text-gray-400 text-sm mt-6 font-medium">
                        ...and {playlist.length - 10} more premium songs
                      </p>
                    )}
                  </div>
                </div>
              )}

              {!currentVideo && (
                <div className="text-center py-12 md:py-16">
                  <div className="text-6xl md:text-8xl mb-6 float-premium">🎵</div>
                  <h3 className="text-2xl md:text-4xl font-bold mb-4 text-premium-gradient text-glow">No Premium Music Playing</h3>
                  <p className="text-gray-300 text-lg">Start playing some premium music to see it here</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="stats">
              <StatsAndHistory onPlaySong={(song) => playVideo(song)} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Premium Mobile Player */}
        {currentVideo && (
          <MobilePlayer
            currentVideo={currentVideo}
            isPlaying={isPlaying}
            onTogglePlayPause={togglePlayPause}
            onPlayNext={playNext}
            onPlayPrevious={playPrevious}
          />
        )}

        {/* Premium Background Music Notification */}
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
