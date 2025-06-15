
import { Shuffle, Repeat, Repeat1, SkipBack, Play, Pause, SkipForward, Volume2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { usePlayerModes } from '@/hooks/usePlayerModes';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { VideoData } from '@/types/playlist';

interface EnhancedPlayerControlsProps {
  currentVideo: VideoData | null;
  isPlaying: boolean;
  volume: number[];
  playlist: VideoData[];
  onTogglePlayPause: () => void;
  onPlayNext: () => void;
  onPlayPrevious: () => void;
  onVolumeChange: (volume: number[]) => void;
  onPlaylistUpdate: (newPlaylist: VideoData[]) => void;
}

export const EnhancedPlayerControls = ({
  currentVideo,
  isPlaying,
  volume,
  playlist,
  onTogglePlayPause,
  onPlayNext,
  onPlayPrevious,
  onVolumeChange,
  onPlaylistUpdate
}: EnhancedPlayerControlsProps) => {
  const { user } = useAuth();
  const { isShuffled, repeatMode, toggleShuffle, cycleRepeatMode } = usePlayerModes(user?.id);
  const { isFavorite, toggleFavorite } = useFavorites(user?.id);

  const handleShuffleToggle = () => {
    const newPlaylist = toggleShuffle(playlist);
    onPlaylistUpdate(newPlaylist);
  };

  const getRepeatIcon = () => {
    switch (repeatMode) {
      case 'one':
        return <Repeat1 className="w-5 h-5" />;
      case 'all':
        return <Repeat className="w-5 h-5" />;
      default:
        return <Repeat className="w-5 h-5" />;
    }
  };

  const getRepeatColor = () => {
    return repeatMode !== 'off' 
      ? 'btn-success' 
      : 'btn-glass';
  };

  return (
    <div className="flex items-center justify-center space-x-6">
      {/* Shuffle Button */}
      <Button
        onClick={handleShuffleToggle}
        size="sm"
        className={`rounded-full w-12 h-12 p-0 ${
          isShuffled 
            ? 'btn-success' 
            : 'btn-glass'
        }`}
      >
        <Shuffle className="w-5 h-5" />
      </Button>

      {/* Previous Button */}
      <Button
        onClick={onPlayPrevious}
        size="lg"
        disabled={playlist.length === 0}
        className="rounded-full btn-glass w-14 h-14 p-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <SkipBack className="w-6 h-6" />
      </Button>

      {/* Play/Pause Button */}
      <Button
        onClick={onTogglePlayPause}
        size="lg"
        className={`rounded-full btn-primary w-16 h-16 p-0 ${isPlaying ? 'playing-glow' : ''} relative overflow-hidden`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-purple-600/20 animate-pulse"></div>
        {isPlaying ? <Pause className="w-7 h-7 relative z-10" /> : <Play className="w-7 h-7 ml-0.5 relative z-10" />}
      </Button>

      {/* Next Button */}
      <Button
        onClick={onPlayNext}
        size="lg"
        disabled={playlist.length === 0}
        className="rounded-full btn-glass w-14 h-14 p-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <SkipForward className="w-6 h-6" />
      </Button>

      {/* Repeat Button */}
      <Button
        onClick={cycleRepeatMode}
        size="sm"
        className={`rounded-full w-12 h-12 p-0 ${getRepeatColor()}`}
      >
        {getRepeatIcon()}
      </Button>

      {/* Favorite Button */}
      {currentVideo && (
        <Button
          onClick={() => toggleFavorite(currentVideo)}
          size="sm"
          className={`rounded-full w-12 h-12 p-0 ${
            isFavorite(currentVideo.id)
              ? 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105'
              : 'btn-glass'
          }`}
        >
          <Heart className={`w-5 h-5 ${isFavorite(currentVideo.id) ? 'fill-current' : ''}`} />
        </Button>
      )}

      {/* Volume Control */}
      <div className="flex items-center space-x-3 ml-8">
        <div className="p-2 rounded-full glass-button">
          <Volume2 className="w-5 h-5 text-gray-300" />
        </div>
        <Slider
          value={volume}
          onValueChange={onVolumeChange}
          max={100}
          step={1}
          className="w-28"
        />
        <span className="text-sm text-gray-300 w-10 font-medium">{volume[0]}</span>
      </div>
    </div>
  );
};
