
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePlaylist } from '@/hooks/usePlaylist';
import { useListeningHistory } from '@/hooks/useListeningHistory';
import { LoginForm } from '@/components/LoginForm';
import { UserProfile } from '@/components/UserProfile';
import { EnhancedSearch } from '@/components/EnhancedSearch';
import { EnhancedPlayerControls } from '@/components/EnhancedPlayerControls';
import { PlaylistManager } from '@/components/PlaylistManager';
import { StatsAndHistory } from '@/components/StatsAndHistory';
import { PlaylistDialog } from '@/components/PlaylistDialog';
import { MobilePlayer } from '@/components/MobilePlayer';
import { BackgroundMusicNotification } from '@/components/BackgroundMusicNotification';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { VideoData } from '@/types/playlist';
import { Music, Plus, Heart, PlayCircle } from 'lucide-react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const Index = () => {
  const { user, isAuthenticated, isLoading: authLoading, login, logout } = useAuth();
  const { playlists, addSongToPlaylist } = usePlaylist(user?.id);
  const { addToHistory } = useListeningHistory(user?.id);
  const { toast } = useToast();

  // Player state
  const [currentVideo, setCurrentVideo] = useState<VideoData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([70]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playlist, setPlaylist] = useState<VideoData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<VideoData[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Background music notification state
  const [isMinimized, setIsMinimized] = useState(false);

  // YouTube player
  const playerRef = useRef<any>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // Initialize YouTube API
  useEffect(() => {
    if (!window.YT) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(script);
      
      window.onYouTubeIframeAPIReady = () => {
        console.log('YouTube API Ready');
        setIsPlayerReady(true);
      };
    } else {
      setIsPlayerReady(true);
    }
  }, []);

  useEffect(() => {
    if (isPlayerReady && !playerRef.current) {
      playerRef.current = new window.YT.Player('youtube-player', {
        height: '0',
        width: '0',
        playerVars: {
          playsinline: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
        },
        events: {
          onReady: () => {
            console.log('Player ready');
            playerRef.current.setVolume(volume[0]);
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              handleNext();
            } else if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              if (currentVideo) {
                addToHistory(currentVideo);
              }
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            }
          },
        },
      });
    }
  }, [isPlayerReady]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && playerRef.current) {
      interval = setInterval(() => {
        const current = playerRef.current?.getCurrentTime() || 0;
        const total = playerRef.current?.getDuration() || 0;
        setCurrentTime(current);
        setDuration(total);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const searchVideos = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // Mock YouTube search - replace with actual API
      const mockResults: VideoData[] = [
        {
          id: 'dQw4w9WgXcQ',
          title: 'Rick Astley - Never Gonna Give You Up',
          channel: 'Rick Astley',
          duration: '3:33',
          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
          views: '1.4B views'
        },
        {
          id: 'kJQP7kiw5Fk',
          title: 'Despacito - Luis Fonsi ft. Daddy Yankee',
          channel: 'Luis Fonsi',
          duration: '4:42',
          thumbnail: 'https://img.youtube.com/vi/kJQP7kiw5Fk/mqdefault.jpg',
          views: '8.3B views'
        }
      ];
      
      setSearchResults(mockResults);
    } catch (error) {
      toast({
        title: "Search Error",
        description: "Failed to search for videos",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const playVideo = (video: VideoData, newPlaylist?: VideoData[], startIndex?: number) => {
    if (playerRef.current) {
      setCurrentVideo(video);
      playerRef.current.loadVideoById(video.id);
      
      if (newPlaylist) {
        setPlaylist(newPlaylist);
        setCurrentIndex(startIndex || 0);
      }
    }
  };

  const togglePlayPause = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }
  };

  const handleNext = () => {
    if (playlist.length > 0) {
      const nextIndex = (currentIndex + 1) % playlist.length;
      setCurrentIndex(nextIndex);
      playVideo(playlist[nextIndex]);
    }
  };

  const handlePrevious = () => {
    if (playlist.length > 0) {
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : playlist.length - 1;
      setCurrentIndex(prevIndex);
      playVideo(playlist[prevIndex]);
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume);
    if (playerRef.current) {
      playerRef.current.setVolume(newVolume[0]);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Music className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              RhythTrack
            </h1>
          </div>
          <UserProfile user={user!} onLogout={logout} />
        </header>

        {/* Search */}
        <div className="mb-8">
          <EnhancedSearch
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSearch={searchVideos}
            isLoading={isSearching}
          />
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Search Results</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((video) => (
                <Card key={video.id} className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/20 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-32 object-cover rounded mb-3"
                    />
                    <h3 className="font-semibold text-white mb-1 line-clamp-2">{video.title}</h3>
                    <p className="text-gray-300 text-sm mb-2">{video.channel}</p>
                    <p className="text-gray-400 text-xs mb-3">{video.duration}</p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => playVideo(video, [video])}
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                      >
                        <PlayCircle className="w-4 h-4 mr-1" />
                        Play
                      </Button>
                      <PlaylistDialog song={video}>
                        <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </PlaylistDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="playlists" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white/10 border-white/20">
            <TabsTrigger value="playlists" className="data-[state=active]:bg-white/20">
              Playlists
            </TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-white/20">
              Stats & History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="playlists">
            <PlaylistManager onPlayPlaylist={(songs, startIndex) => {
              if (songs.length > 0) {
                playVideo(songs[startIndex || 0], songs, startIndex);
              }
            }} />
          </TabsContent>

          <TabsContent value="stats">
            <StatsAndHistory onPlaySong={(song) => playVideo(song, [song])} />
          </TabsContent>
        </Tabs>

        {/* Player Controls */}
        {currentVideo && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 p-4">
            <div className="container mx-auto max-w-7xl">
              <div className="mb-4">
                <Progress
                  value={duration > 0 ? (currentTime / duration) * 100 : 0}
                  className="w-full h-2"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span>
                  <span>{Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <img
                    src={currentVideo.thumbnail}
                    alt={currentVideo.title}
                    className="w-12 h-9 object-cover rounded"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-white text-sm truncate">{currentVideo.title}</h4>
                    <p className="text-gray-300 text-xs">{currentVideo.channel}</p>
                  </div>
                </div>

                <div className="flex-1 flex justify-center">
                  <EnhancedPlayerControls
                    currentVideo={currentVideo}
                    isPlaying={isPlaying}
                    volume={volume}
                    playlist={playlist}
                    onTogglePlayPause={togglePlayPause}
                    onPlayNext={handleNext}
                    onPlayPrevious={handlePrevious}
                    onVolumeChange={handleVolumeChange}
                    onPlaylistUpdate={setPlaylist}
                  />
                </div>

                <div className="flex-1"></div>
              </div>
            </div>
          </div>
        )}

        {/* Hidden YouTube Player */}
        <div id="youtube-player" style={{ display: 'none' }}></div>

        {/* Mobile Player */}
        {currentVideo && (
          <MobilePlayer 
            currentVideo={currentVideo}
            isPlaying={isPlaying}
            onTogglePlayPause={togglePlayPause}
            onPlayNext={handleNext}
            onPlayPrevious={handlePrevious}
          />
        )}
        
        {/* Background Music Notification */}
        <BackgroundMusicNotification 
          currentVideo={currentVideo}
          isPlaying={isPlaying}
          isMinimized={isMinimized}
          onTogglePlayPause={togglePlayPause}
          onPlayNext={handleNext}
          onPlayPrevious={handlePrevious}
          onClose={() => setCurrentVideo(null)}
          onToggleMinimize={() => setIsMinimized(!isMinimized)}
        />
      </div>
    </div>
  );
};

export default Index;
