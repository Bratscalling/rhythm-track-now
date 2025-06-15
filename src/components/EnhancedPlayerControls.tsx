
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
      ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' 
      : 'bg-white/10 hover:bg-white/20';
  };

  return (
    <div className="flex items-center justify-center space-x-4">
      {/* Shuffle Button */}
      <Button
        onClick={handleShuffleToggle}
        size="sm"
        className={`rounded-full w-10 h-10 p-0 ${
          isShuffled 
            ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' 
            : 'bg-white/10 hover:bg-white/20'
        }`}
      >
        <Shuffle className="w-4 h-4" />
      </Button>

      {/* Previous Button */}
      <Button
        onClick={onPlayPrevious}
        size="lg"
        disabled={playlist.length === 0}
        className="rounded-full bg-white/10 hover:bg-white/20 w-12 h-12 p-0"
      >
        <SkipBack className="w-5 h-5" />
      </Button>

      {/* Play/Pause Button */}
      <Button
        onClick={onTogglePlayPause}
        size="lg"
        className="rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 w-14 h-14 p-0"
      >
        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
      </Button>

      {/* Next Button */}
      <Button
        onClick={onPlayNext}
        size="lg"
        disabled={playlist.length === 0}
        className="rounded-full bg-white/10 hover:bg-white/20 w-12 h-12 p-0"
      >
        <SkipForward className="w-5 h-5" />
      </Button>

      {/* Repeat Button */}
      <Button
        onClick={cycleRepeatMode}
        size="sm"
        className={`rounded-full w-10 h-10 p-0 ${getRepeatColor()}`}
      >
        {getRepeatIcon()}
      </Button>

      {/* Favorite Button */}
      {currentVideo && (
        <Button
          onClick={() => toggleFavorite(currentVideo)}
          size="sm"
          className={`rounded-full w-10 h-10 p-0 ${
            isFavorite(currentVideo.id)
              ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
              : 'bg-white/10 hover:bg-white/20'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorite(currentVideo.id) ? 'fill-current' : ''}`} />
        </Button>
      )}

      {/* Volume Control */}
      <div className="flex items-center space-x-2 ml-6">
        <Volume2 className="w-4 h-4 text-gray-300" />
        <Slider
          value={volume}
          onValueChange={onVolumeChange}
          max={100}
          step={1}
          className="w-24"
        />
        <span className="text-sm text-gray-300 w-8">{volume[0]}</span>
      </div>
    </div>
  );
};
