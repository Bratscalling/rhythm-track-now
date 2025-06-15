
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VideoData } from '@/types/playlist';

interface MobilePlayerProps {
  currentVideo: VideoData;
  isPlaying: boolean;
  onTogglePlayPause: () => void;
  onPlayNext: () => void;
  onPlayPrevious: () => void;
}

export const MobilePlayer = ({
  currentVideo,
  isPlaying,
  onTogglePlayPause,
  onPlayNext,
  onPlayPrevious,
}: MobilePlayerProps) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-r from-gray-900/98 via-purple-900/95 to-gray-900/98 backdrop-blur-xl border-t border-white/20 p-4 z-50 shadow-2xl">
      <div className="flex items-center space-x-4">
        {/* Song Info */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="relative">
            <img
              src={currentVideo.thumbnail}
              alt={currentVideo.title}
              className="w-12 h-9 object-cover rounded-lg shadow-lg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-lg"></div>
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-white text-sm line-clamp-1 mb-0.5">
              {currentVideo.title}
            </h4>
            <p className="text-gray-300 text-xs line-clamp-1">
              {currentVideo.channel}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          <Button
            onClick={onPlayPrevious}
            size="sm"
            className="rounded-full p-2 btn-glass w-10 h-10"
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={onTogglePlayPause}
            size="sm"
            className={`rounded-full btn-primary p-2 w-12 h-12 ${isPlaying ? 'playing-glow' : ''} relative overflow-hidden`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
            {isPlaying ? (
              <Pause className="w-5 h-5 relative z-10" />
            ) : (
              <Play className="w-5 h-5 relative z-10" />
            )}
          </Button>
          
          <Button
            onClick={onPlayNext}
            size="sm"
            className="rounded-full p-2 btn-glass w-10 h-10"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
