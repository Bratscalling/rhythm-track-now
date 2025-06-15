import { useState, useRef, useEffect } from 'react';
import { Search, Play, Pause, Volume2, SkipForward, SkipBack } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface VideoData {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  channel: string;
  views: string;
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
    };
  }
}

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<VideoData[]>([]);
  const [currentVideo, setCurrentVideo] = useState<VideoData | null>(
    window.globalPlayerState?.currentVideo || null
  );
  const [isPlaying, setIsPlaying] = useState(
    window.globalPlayerState?.isPlaying || false
  );
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState([window.globalPlayerState?.volume || 80]);
  const playerRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize global player state if it doesn't exist
    if (!window.globalPlayerState) {
      window.globalPlayerState = {
        currentVideo: null,
        isPlaying: false,
        volume: 80,
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

    // Setup media session handlers
    setupMediaSession();

    return () => {
      // Don't destroy the player on component unmount to keep background playback
    };
  }, []);

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

            if (isCurrentlyPlaying || isPaused || isEnded) {
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
    }
  };

  const playVideo = (video: VideoData) => {
    setCurrentVideo(video);
    
    // Update global state
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
      updateMediaSession(video);
    }, 500);

    toast({
      title: "Now Playing",
      description: video.title,
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
    } else {
      playerRef.current.playVideo();
      setIsPlaying(true);
      if (window.globalPlayerState) {
        window.globalPlayerState.isPlaying = true;
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

  async function searchSongs() {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      console.log('Searching for:', searchQuery);
      
      // Try multiple search variations to get more results
      const searchVariations = [
        searchQuery,
        `${searchQuery} official`,
        `${searchQuery} music video`,
        `${searchQuery} audio`,
        `${searchQuery} song`
      ];

      const results: VideoData[] = [];

      // Try to get results for each variation
      for (let i = 0; i < Math.min(3, searchVariations.length); i++) {
        try {
          const response = await fetch(
            `https://kaiz-apis.gleeze.com/api/yt-metadata?title=${encodeURIComponent(searchVariations[i])}&apikey=7a194df7-7109-4bfb-9560-ef474230053f`
          );
          
          if (response.ok) {
            const data = await response.json();
            console.log(`API Response for "${searchVariations[i]}":`, data);
            
            if (data.videoId && data.title) {
              results.push({
                id: data.videoId,
                title: data.title,
                thumbnail: data.thumbnail || `https://i.ytimg.com/vi/${data.videoId}/hq720.jpg`,
                duration: data.duration || '0:00',
                channel: data.author || 'Unknown',
                views: (data.views ? data.views + ' views' : 'Unknown views')
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching for "${searchVariations[i]}":`, error);
        }
      }

      if (results.length === 0) {
        toast({
          title: "No Results Found",
          description: `No songs found for "${searchQuery}". Try a different search term.`,
          variant: "destructive",
        });
        setSearchResults([]);
        return;
      }

      // Remove duplicates based on video ID
      const uniqueResults = results.filter((result, index, self) => 
        index === self.findIndex(r => r.id === result.id)
      );

      setSearchResults(uniqueResults);
      
      toast({
        title: "Search Complete",
        description: `Found ${uniqueResults.length} result(s) for "${searchQuery}"`,
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
      setIsLoading(false);
    }
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
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-pink-400 to-purple-600 bg-clip-text text-transparent mb-4">
            🎵 RhythmTrack
          </h1>
          <p className="text-xl text-gray-300">Discover and play your favorite YouTube songs</p>
        </div>

        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search for songs, artists, or albums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchSongs()}
              className="pl-12 pr-24 py-4 text-lg bg-white/10 border-white/20 text-white placeholder-gray-400 rounded-full backdrop-blur-sm focus:bg-white/20 transition-all duration-300"
            />
            <Button
              onClick={searchSongs}
              disabled={isLoading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 px-6"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </div>

        {/* Current Playing Section */}
        {currentVideo && (
          <Card className="max-w-4xl mx-auto mb-8 bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-6">
                <img
                  src={currentVideo.thumbnail}
                  alt={currentVideo.title}
                  className="w-32 h-24 object-cover rounded-lg shadow-lg"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">{currentVideo.title}</h3>
                  <p className="text-gray-300 mb-4">{currentVideo.channel}</p>
                  
                  {/* Player Controls */}
                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={togglePlayPause}
                      size="lg"
                      className="rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 w-12 h-12 p-0"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </Button>
                    
                    <div className="flex items-center space-x-2 flex-1 max-w-xs">
                      <Volume2 className="w-4 h-4 text-gray-300" />
                      <Slider
                        value={volume}
                        onValueChange={handleVolumeChange}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-300 w-8">{volume[0]}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Search Results</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((video) => (
                <Card 
                  key={video.id}
                  className="group cursor-pointer bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
                  onClick={() => playVideo(video)}
                >
                  <CardContent className="p-4">
                    <div className="relative mb-4">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                      <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {video.duration}
                      </span>
                    </div>
                    <h3 className="font-semibold text-white mb-2 line-clamp-2">{video.title}</h3>
                    <p className="text-gray-300 text-sm mb-1">{video.channel}</p>
                    <p className="text-gray-400 text-xs">{video.views}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {searchResults.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎼</div>
            <h3 className="text-2xl font-semibold mb-2">Start Your Musical Journey</h3>
            <p className="text-gray-400">Search for your favorite songs to get started</p>
          </div>
        )}

        {/* Local YouTube Player (fallback) */}
        <div id="youtube-player" className="hidden"></div>
      </div>
    </div>
  );
};

export default Index;
